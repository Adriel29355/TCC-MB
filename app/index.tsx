import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
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
  fetchHistory,
  fetchMedications,
  getStoredHistory,
  getStoredUser,
  isUserAuthenticated,
  markMedicationAsTaken,
  Medication,
} from "@/lib/pharmalife";

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState(() => getStoredHistory());
  const user = getStoredUser();
  const confirmedToday = history.filter(
    (item) => item.status === "CONFIRMADO" && isToday(item.dataConfirmacao),
  );
  const confirmedMedicationIds = new Set(
    confirmedToday
      .map((item) => item.medicationId)
      .filter((id): id is number => id != null),
  );
  const medicationNameCounts = medications.reduce<Record<string, number>>(
    (counts, medication) => {
      const name = medication.nome.trim().toLocaleLowerCase();
      counts[name] = (counts[name] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const unambiguousLegacyNames = new Set(
    confirmedToday
      .filter((item) => item.medicationId == null)
      .map((item) => item.nome.trim().toLocaleLowerCase())
      .filter((name) => medicationNameCounts[name] === 1),
  );
  const confirmed = medications.filter((medication) => {
    if (confirmedMedicationIds.has(medication.id)) return true;
    return unambiguousLegacyNames.has(
      medication.nome.trim().toLocaleLowerCase(),
    );
  }).length;
  const pending = Math.max(0, medications.length - confirmed);
  const adherence = adherencePercent(medications, history);
  const { darkMode, largeText } = useAppContext();
  const ps = usePharmaStyles();

  useEffect(() => {
    let active = true;

    fetchMedications()
      .then((items) => {
        if (active) setMedications(items);
      })
      .catch(() => {
        if (active) setMedications([]);
      });

    fetchHistory()
      .then((items) => {
        if (active) setHistory(items);
      })
      .catch(() => {
        if (active) setHistory([]);
      });

    return () => {
      active = false;
    };
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
    secondaryBg: darkMode ? "#111E2D" : "#FFFFFF",
    secondaryBorder: "#2F80ED",
    checkBg: darkMode ? "#0A2A1A" : "#DDF8EA",
    checkText: darkMode ? "#34D399" : "#12805C",
    editBg: darkMode ? "#0D2238" : "#EAF6FF",
    deleteBg: darkMode ? "#2A0A0A" : "#FFF5F5",
    statusBadgeBg: darkMode ? "#0A2A1A" : "#DDF8EA",
    statusDotColor: darkMode ? "#34D399" : "#12805C",
  };

  async function handleTaken(medication: Medication) {
    try {
      const entry = await markMedicationAsTaken(medication);
      setHistory((current) => [entry, ...current]);
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
          await deleteMedication(medication);
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

      <View style={styles.summarySection}>
        <View style={styles.summaryHeading}>
          <Text style={[styles.summaryTitle, { color: colors.panelTitle }] }>
            Resumo de hoje
          </Text>
          <Text style={[styles.summaryCaption, { color: colors.panelText }] }>
            Acompanhe rapidamente sua rotina
          </Text>
        </View>
        <View style={styles.stats}>
          <StatCard
            label="Tomados hoje"
            value={confirmed}
            icon="checkmark-circle-outline"
            accentColor={darkMode ? "#34D399" : "#12805C"}
            iconBackground={darkMode ? "#0A2A1A" : "#DDF8EA"}
          />
          <StatCard
            label="Pendentes hoje"
            value={pending}
            icon="time-outline"
            accentColor={darkMode ? "#FBBF24" : "#B45309"}
            iconBackground={darkMode ? "#2D1F00" : "#FEF3C7"}
          />
          <StatCard
            label="Adesao nos ultimos 7 dias"
            value={`${adherence}%`}
            icon="analytics-outline"
            accentColor="#2F80ED"
            iconBackground={darkMode ? "#0D2238" : "#EAF6FF"}
          />
        </View>
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
                  numberOfLines={2}
                  style={[
                    styles.itemTitle,
                    { color: colors.itemTitle, fontSize: fs.item },
                  ]}
                >
                  {medication.nome}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[ps.body, largeText && { fontSize: fs.small }]}
                >
                  {medication.descricao} | {medication.tipo}
                </Text>
              </View>
              <View style={styles.medicationActions}>
                <Pressable
                  accessibilityLabel={`Confirmar uso de ${medication.nome}`}
                  style={[
                    styles.checkButton,
                    { backgroundColor: colors.checkBg },
                  ]}
                  onPress={() => handleTaken(medication)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={17}
                    color={colors.checkText}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      { color: colors.checkText },
                      largeText && { fontSize: 15 },
                    ]}
                  >
                    Tomei
                  </Text>
                </Pressable>
                <View style={styles.iconActions}>
                  <Pressable
                    accessibilityLabel={`Editar ${medication.nome}`}
                    style={[
                      styles.editButton,
                      { backgroundColor: colors.editBg },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/adicionar",
                        params: { id: String(medication.id) },
                      })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#2F80ED"
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Excluir ${medication.nome}`}
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
              </View>
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
    paddingBottom: 22,
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
    minHeight: 132,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    padding: 18,
  },
  summarySection: {
    gap: 10,
  },
  summaryHeading: {
    gap: 2,
  },
  summaryTitle: {
    fontSize: 19,
    fontWeight: "900",
  },
  summaryCaption: {
    fontSize: 13,
    lineHeight: 18,
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
    gap: 10,
    minHeight: 82,
    paddingVertical: 5,
  },
  timeBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  timeText: {
    color: "#2F80ED",
    fontWeight: "900",
  },
  medicationInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemTitle: {
    fontWeight: "800",
  },
  checkButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  checkText: {
    fontSize: 12,
    fontWeight: "900",
  },
  medicationActions: {
    width: 82,
    gap: 6,
  },
  iconActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  editButton: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    padding: 7,
  },
  deleteButton: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    padding: 7,
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
});
