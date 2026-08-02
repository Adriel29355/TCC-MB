import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import {
  fetchMedications,
  Medication,
} from "@/lib/pharmalife";

export default function AgendaScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState("");
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  useFocusEffect(useCallback(() => {
    let active = true;
    setError("");
    fetchMedications()
      .then((items) => {
        if (active) setMedications(items);
      })
      .catch((err) => {
        if (active) setError(
          err instanceof Error
            ? err.message
            : "Nao foi possivel buscar a agenda.",
        );
      });
    return () => {
      active = false;
    };
  }, []));

  const timeBoxBg = darkMode ? "#0D2238" : "#EAF6FF";
  const lineBg = darkMode ? "#1E3448" : "#D8ECFF";
  const now = new Date();
  const completedMedications = medications.filter((medication) => {
    if (!medication.agenda?.dataFim) return false;
    const endDate = new Date(medication.agenda.dataFim);
    return !Number.isNaN(endDate.getTime()) && endDate < now;
  });
  const activeMedications = medications.filter(
    (medication) =>
      medication.statusMedicamento !== "INATIVO" &&
      !completedMedications.some((completed) => completed.id === medication.id),
  );

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Agenda"
        title="Horarios do tratamento"
        subtitle="Veja os medicamentos e os horarios programados."
      />

      <Card>
        <View style={ps.row}>
          <Text style={ps.cardTitle}>Tratamentos ativos</Text>
          <Pressable onPress={() => router.push("/adicionar")}>
            <Text style={styles.link}>Novo</Text>
          </Pressable>
        </View>

        {activeMedications.map((medication) => (
          <View key={medication.id} style={styles.timelineItem}>
            <View style={[styles.line, { backgroundColor: lineBg }]} />
            <View style={[styles.timeBox, { backgroundColor: timeBoxBg }]}>
              <Text style={styles.timeText}>
                {medication.agenda?.horario ?? "--:--"}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={ps.cardTitle}>{medication.nome}</Text>
              <Text style={ps.body}>
                {medication.descricao} • {medication.tipo}
              </Text>
              {medication.complemento ? (
                <Text style={ps.small}>{medication.complemento}</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel={`Editar ${medication.nome}`}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/adicionar",
                  params: { id: String(medication.id) },
                })
              }
              style={({ pressed }) => [
                styles.editButton,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Ionicons name="create-outline" size={20} color="#2F80ED" />
            </Pressable>
          </View>
        ))}

        {activeMedications.length === 0 && (
          <Text style={ps.body}>
            {error || "Nenhum tratamento ativo."}
          </Text>
        )}
      </Card>

      {completedMedications.length > 0 ? (
        <Card>
          <Text style={ps.cardTitle}>Tratamentos concluidos</Text>
          <Text style={ps.small}>
            O historico foi preservado. Edite um medicamento se precisar
            prolongar o tratamento.
          </Text>
          {completedMedications.map((medication) => (
            <View key={medication.id} style={styles.completedItem}>
              <View style={styles.info}>
                <Text style={ps.cardTitle}>{medication.nome}</Text>
                <Text style={ps.small}>
                  Encerrado em{" "}
                  {medication.agenda?.dataFim
                    ?.slice(0, 10)
                    .split("-")
                    .reverse()
                    .join("/")}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Editar duracao de ${medication.nome}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/adicionar",
                    params: { id: String(medication.id) },
                  })
                }
                style={styles.editButton}
              >
                <Ionicons name="calendar-outline" size={20} color="#2F80ED" />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    textDecorationLine: "none",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    position: "relative",
    paddingVertical: 4,
  },
  line: {
    position: "absolute",
    top: 0,
    bottom: -10,
    left: 28,
    width: 2,
    backgroundColor: "#D8ECFF",
  },
  timeBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#EAF6FF",
  },
  timeText: {
    color: "#2F80ED",
    fontWeight: "900",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  editButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#EAF6FF",
  },
  completedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#D8ECFF",
    paddingTop: 10,
  },
});
