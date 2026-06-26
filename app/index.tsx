import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Card,
  PharmaScreen,
  StatCard,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  adherencePercent,
  deleteMedication,
  fetchMedications,
  getStoredHistory,
  getStoredReminders,
  getStoredUser,
  isUserAuthenticated,
  markMedicationAsTaken,
  Medication,
} from "@/lib/pharmalife";

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState(() => getStoredHistory());
  const reminders = useMemo(() => getStoredReminders(), []);
  const user = getStoredUser();
  const confirmed = history.filter(
    (item) => item.status === "CONFIRMADO",
  ).length;
  const pending = Math.max(0, medications.length - confirmed);
  const adherence = adherencePercent(medications, history);
  const { darkMode, largeText } = useAppContext();
  const ps = usePharmaStyles();

  useEffect(() => {
    fetchMedications().then(setMedications);
  }, []);

  const colors = {
    heroBg: darkMode ? "#0D1E2D" : "#EAF6FF",
    heroBorder: darkMode ? "#1E3448" : "#D8ECFF",
    heroTitle: darkMode ? "#E8F4FF" : "#14324A",
    heroSubtitle: darkMode ? "#7FA8C8" : "#4E7393",
    panelBg: darkMode ? "#111E2D" : "#FFFFFF",
    panelBorder: darkMode ? "#1E3448" : "#D8ECFF",
    panelTitle: darkMode ? "#E8F4FF" : "#14324A",
    panelText: darkMode ? "#7FA8C8" : "#5F7F9B",
    brandBg: darkMode ? "#0B1520" : "#FFFFFF",
    timeBoxBg: darkMode ? "#0D2238" : "#EAF6FF",
    itemTitle: darkMode ? "#C8E0F4" : "#14324A",
    reminderBg: darkMode ? "#0D2238" : "#EAF6FF",
    secondaryBg: darkMode ? "#111E2D" : "#FFFFFF",
    secondaryBorder: "#2F80ED",
    checkBg: darkMode ? "#0A2A1A" : "#DDF8EA",
    checkText: darkMode ? "#34D399" : "#12805C",
    deleteBg: darkMode ? "#2A0A0A" : "#FFF5F5",
    statusBadgeBg: darkMode ? "#0A2A1A" : "#DDF8EA",
    statusDotColor: darkMode ? "#34D399" : "#12805C",
  };

  async function handleTaken(medication: Medication) {
    try {
      const entry = await markMedicationAsTaken(medication);
      setHistory([entry, ...history]);
      setMedications([...medications]);
    } catch (error) {
      confirmDialog(
        "Erro",
        error instanceof Error ? error.message : "Nao foi possivel confirmar.",
        () => {},
      );
    }
  }

  function handleDelete(medication: Medication) {
    confirmDialog(
      "Excluir medicamento",
      `Deseja excluir "${medication.nome}"?`,
      async () => {
        try {
          await deleteMedication(medication.id);
          setMedications((prev) => prev.filter((m) => m.id !== medication.id));
        } catch (error) {
          confirmDialog(
            "Erro",
            error instanceof Error
              ? error.message
              : "Nao foi possivel excluir.",
            () => {},
          );
        }
      },
    );
  }

  if (!isUserAuthenticated()) {
    return <Redirect href="/login" />;
  }

  const fs = largeText
    ? { title: 40, subtitle: 20, item: 17, small: 15, time: 15 }
    : { title: 34, subtitle: 16, item: 14, small: 13, time: 14 };

  return (
    <PharmaScreen>
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.heroBg, borderColor: colors.heroBorder },
        ]}
      >
        <View style={styles.heroCopy}>
          <Text
            style={[styles.brandBadge, { backgroundColor: colors.brandBg }]}
          >
            PharmaLife
          </Text>
          <Text
            style={[
              styles.heroTitle,
              { color: colors.heroTitle, fontSize: fs.title },
            ]}
          >
            Cuidado com seus medicamentos
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              { color: colors.heroSubtitle, fontSize: fs.subtitle },
            ]}
          >
            Agenda, lembretes, histórico — experiência leve para acompanhar sua
            rotina.
          </Text>
          <View style={styles.heroActions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/adicionar")}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  largeText && { fontSize: 18 },
                ]}
              >
                Adicionar remédio
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.secondaryBg,
                  borderColor: colors.secondaryBorder,
                },
              ]}
              onPress={() => router.push("/agenda")}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  largeText && { fontSize: 18 },
                ]}
              >
                Ver agenda
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.heroPanel,
          { backgroundColor: colors.panelBg, borderColor: colors.panelBorder },
        ]}
      >
        <Ionicons name="medical-outline" size={32} color="#2F80ED" />
        <Text
          style={[
            styles.panelTitle,
            { color: colors.panelTitle, fontSize: largeText ? 24 : 20 },
          ]}
        >
          Olá, {user.nome}
        </Text>
        <Text
          style={[
            styles.panelText,
            { color: colors.panelText, fontSize: largeText ? 17 : 14 },
          ]}
        >
          Próximo horário: {medications[0]?.agenda?.horario ?? "08:00"}
        </Text>
      </View>

      <View style={styles.stats}>
        <StatCard label="Tomados" value={confirmed} />
        <StatCard label="Pendentes" value={pending} />
        <StatCard label="Adesão" value={`${adherence}%`} />
      </View>

      <Card>
        <View style={ps.row}>
          <Text
            style={[
              ps.cardTitle,
              styles.rowTitle,
              largeText && { fontSize: 22 },
            ]}
          >
            Próximos medicamentos
          </Text>
          <Pressable onPress={() => router.push("/adicionar")}>
            <Text style={styles.link}>Adicionar</Text>
          </Pressable>
        </View>

        <View style={ps.list}>
          {medications.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.medicationItem}>
              <View
                style={[styles.timeBox, { backgroundColor: colors.timeBoxBg }]}
              >
                <Text style={[styles.timeText, { fontSize: fs.time }]}>
                  {medication.agenda?.horario ?? "--:--"}
                </Text>
              </View>
              <View style={styles.medicationInfo}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: colors.itemTitle, fontSize: fs.item },
                  ]}
                >
                  {medication.nome}
                </Text>
                <Text style={[ps.body, largeText && { fontSize: fs.small }]}>
                  {medication.descricao} | {medication.tipo}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.checkButton,
                  { backgroundColor: colors.checkBg },
                ]}
                onPress={() => handleTaken(medication)}
              >
                <Text
                  style={[
                    styles.checkText,
                    { color: colors.checkText },
                    largeText && { fontSize: 16 },
                  ]}
                >
                  OK
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.deleteButton,
                  { backgroundColor: colors.deleteBg },
                ]}
                onPress={() => handleDelete(medication)}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={darkMode ? "#F87171" : "#E53E3E"}
                />
              </Pressable>
            </View>
          ))}

          {medications.length === 0 && (
            <Text style={ps.body}>Nenhum medicamento cadastrado.</Text>
          )}
        </View>
      </Card>

      <View style={styles.twoColumns}>
        <View style={styles.columnWrapper}>
          <Card>
            <View style={ps.row}>
              <Text
                style={[
                  ps.cardTitle,
                  styles.rowTitle,
                  largeText && { fontSize: 20 },
                ]}
              >
                Histórico recente
              </Text>
              <Pressable onPress={() => router.push("/historico")}>
                <Text style={styles.link}>Ver tudo</Text>
              </Pressable>
            </View>
            {history.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.compactItem}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: colors.statusBadgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusDot,
                      { color: colors.statusDotColor },
                      largeText && { fontSize: 17 },
                    ]}
                  >
                    {item.status === "CONFIRMADO" ? "C" : "P"}
                  </Text>
                </View>
                <View style={styles.compactInfo}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.itemTitle, fontSize: fs.item },
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <Text style={[ps.small, largeText && { fontSize: fs.small }]}>
                    {item.dosagem} às {item.horario}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.columnWrapper}>
          <Card>
            <View style={ps.row}>
              <Text
                style={[
                  ps.cardTitle,
                  styles.rowTitle,
                  largeText && { fontSize: 20 },
                ]}
              >
                Lembretes
              </Text>
              <Pressable onPress={() => router.push("/agenda")}>
                <Text style={styles.link}>Agenda</Text>
              </Pressable>
            </View>
            {reminders.slice(0, 2).map((reminder) => (
              <View key={reminder.id} style={styles.compactItem}>
                <View
                  style={[
                    styles.reminderBadge,
                    { backgroundColor: colors.reminderBg },
                  ]}
                >
                  <Text
                    style={[styles.reminderDate, largeText && { fontSize: 15 }]}
                  >
                    {reminder.horario}
                  </Text>
                </View>
                <View style={styles.compactInfo}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.itemTitle, fontSize: fs.item },
                    ]}
                  >
                    {reminder.titulo}
                  </Text>
                  <Text style={[ps.small, largeText && { fontSize: fs.small }]}>
                    {reminder.descricao}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </View>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "column",
    gap: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    paddingBottom: 80,
    marginTop: 18,
  },
  heroCopy: {
    minWidth: 0,
    gap: 12,
  },
  brandBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    color: "#2F80ED",
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
  },
  heroSubtitle: {
    maxWidth: 520,
    fontSize: 16,
    lineHeight: 23,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#2F80ED",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  secondaryButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#2F80ED",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },
  heroPanel: {
    minWidth: 0,
    minHeight: 150,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    padding: 18,
    marginTop: 10,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  panelText: {
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  twoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  columnWrapper: {
    flex: 1,
    minWidth: 240,
  },
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    flexShrink: 0,
  },
  rowTitle: {
    flex: 1,
    marginRight: 8,
  },
  medicationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 48,
    borderRadius: 8,
  },
  timeText: {
    color: "#2F80ED",
    fontWeight: "900",
  },
  medicationInfo: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "800",
  },
  checkButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkText: {
    fontWeight: "900",
  },
  deleteButton: {
    borderRadius: 8,
    padding: 10,
  },
  compactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  compactInfo: {
    flex: 1,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    fontWeight: "900",
    fontSize: 14,
  },
  reminderBadge: {
    minWidth: 46,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  reminderDate: {
    color: "#2F80ED",
    fontWeight: "900",
    fontSize: 13,
  },
});
