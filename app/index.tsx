import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  PharmaScreen,
  StatCard,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { IgnoreMedicationModal } from "@/components/ignore-medication-modal";
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
  markMedicationAsIgnored,
  markMedicationAsTaken,
  medicationOccurrencesForDay,
  HistoryItem,
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

function historyEventDate(item: HistoryItem) {
  const value =
    item.status === "IGNORADO"
      ? item.dataHoraIgnorado ?? item.dataConfirmacao
      : item.dataConfirmacao;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type MedicationDose = {
  medication: Medication;
  scheduled: Date;
};

function occurrenceTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [history, setHistory] = useState(() => getStoredHistory());
  const [now, setNow] = useState(() => new Date());
  const [ignoreTarget, setIgnoreTarget] = useState<MedicationDose | null>(null);
  const [ignoring, setIgnoring] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const user = getStoredUser();
  const resolvedToday = history.filter(
    (item) =>
      item.status !== "PENDENTE" &&
      isToday(historyEventDate(item)?.toISOString()),
  );
  const medicationNameCounts = medications.reduce<Record<string, number>>(
    (counts, medication) => {
      const name = medication.nome.trim().toLocaleLowerCase();
      counts[name] = (counts[name] ?? 0) + 1;
      return counts;
    },
    {},
  );

  function getDoseStatusToday(dose: MedicationDose) {
    const { medication, scheduled } = dose;
    const normalizedName = medication.nome.trim().toLocaleLowerCase();
    const horario = occurrenceTime(scheduled);
    const matching = resolvedToday
      .filter(
        (item) =>
          item.horario === horario &&
          (item.medicationId === medication.id ||
            (item.medicationId == null &&
              medicationNameCounts[normalizedName] === 1 &&
              item.nome.trim().toLocaleLowerCase() === normalizedName)),
      )
      .sort(
        (left, right) =>
          (historyEventDate(right)?.getTime() ?? 0) -
          (historyEventDate(left)?.getTime() ?? 0),
      );
    return matching[0] ?? null;
  }

  const todayDoses: MedicationDose[] = medications.flatMap((medication) =>
    medicationOccurrencesForDay(medication, now).map((scheduled) => ({
      medication,
      scheduled,
    })),
  );
  const confirmed = todayDoses.filter(
    (dose) => getDoseStatusToday(dose)?.status === "CONFIRMADO",
  ).length;
  const pending = todayDoses.filter(
    (dose) => !getDoseStatusToday(dose) && dose.scheduled <= now,
  ).length;
  const upcomingDoses = todayDoses
    .filter((dose) => !getDoseStatusToday(dose) && dose.scheduled > now)
    .sort((left, right) => left.scheduled.getTime() - right.scheduled.getTime());
  const adherence = adherencePercent(medications, history);
  const { darkMode, largeText } = useAppContext();
  const ps = usePharmaStyles();

  useFocusEffect(useCallback(() => {
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
  }, []));

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
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
    ignoreBg: darkMode ? "#2D1F00" : "#FEF3C7",
    ignoreText: darkMode ? "#FBBF24" : "#B45309",
    pendingBg: darkMode ? "#0D2238" : "#EAF6FF",
    pendingText: darkMode ? "#7FB8E8" : "#2F80ED",
    editBg: darkMode ? "#0D2238" : "#EAF6FF",
    deleteBg: darkMode ? "#2A0A0A" : "#FFF5F5",
    statusBadgeBg: darkMode ? "#0A2A1A" : "#DDF8EA",
    statusDotColor: darkMode ? "#34D399" : "#12805C",
  };

  async function handleTaken(dose: MedicationDose) {
    if (getDoseStatusToday(dose)) return;
    setActionLoadingId(dose.medication.id);
    try {
      const entry = await markMedicationAsTaken(
        dose.medication,
        occurrenceTime(dose.scheduled),
      );
      setHistory((current) => [entry, ...current]);
      setMedications([...medications]);
    } catch (error) {
      confirmDialog(
        "Erro",
        error instanceof Error ? error.message : "Nao foi possivel confirmar.",
        () => {},
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleIgnore(reason: string) {
    const dose = ignoreTarget;
    if (!dose || getDoseStatusToday(dose)) return;

    setIgnoring(true);
    try {
      const entry = await markMedicationAsIgnored(
        dose.medication,
        reason,
        occurrenceTime(dose.scheduled),
      );
      setHistory((current) => [entry, ...current]);
      setIgnoreTarget(null);
    } catch (error) {
      confirmDialog(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel ignorar o medicamento.",
        () => {},
      );
    } finally {
      setIgnoring(false);
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
          {upcomingDoses[0]
            ? `Próximo horário: ${occurrenceTime(upcomingDoses[0].scheduled)}`
            : pending > 0
              ? "Existem doses pendentes no histórico"
              : "Nenhum outro horário programado para hoje"}
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
          {upcomingDoses.slice(0, 3).map((dose) => {
            const { medication, scheduled } = dose;
            const resolvedStatus = getDoseStatusToday(dose);
            const actionLoading = actionLoadingId === medication.id;
            const statusIsConfirmed = resolvedStatus?.status === "CONFIRMADO";
            return (
              <View
                key={`${medication.id}-${occurrenceTime(scheduled)}`}
                style={[
                  styles.medicationItem,
                  { borderColor: colors.panelBorder },
                ]}
              >
                <View style={styles.medicationMain}>
                  <View
                    style={[
                      styles.timeBox,
                      { backgroundColor: colors.timeBoxBg },
                    ]}
                  >
                    <Text style={[styles.timeText, { fontSize: fs.time }]}>
                      {occurrenceTime(scheduled)}
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
                  <View
                    style={[
                      styles.medicationStatus,
                      {
                        backgroundColor: resolvedStatus
                          ? statusIsConfirmed
                            ? colors.checkBg
                            : colors.ignoreBg
                          : colors.pendingBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        resolvedStatus
                          ? statusIsConfirmed
                            ? "checkmark-circle-outline"
                            : "remove-circle-outline"
                          : "time-outline"
                      }
                      size={15}
                      color={
                        resolvedStatus
                          ? statusIsConfirmed
                            ? colors.checkText
                            : colors.ignoreText
                        : colors.pendingText
                      }
                    />
                    <Text
                      style={[
                        styles.medicationStatusText,
                        {
                          color: resolvedStatus
                            ? statusIsConfirmed
                              ? colors.checkText
                              : colors.ignoreText
                            : colors.pendingText,
                        },
                      ]}
                    >
                      {resolvedStatus
                        ? statusIsConfirmed
                          ? "Tomado"
                          : "Ignorado"
                        : "Agendado"}
                    </Text>
                  </View>
                </View>

                {resolvedStatus?.status === "IGNORADO" &&
                resolvedStatus.motivoIgnorado ? (
                  <Text style={[ps.small, styles.ignoreReason]} numberOfLines={2}>
                    Motivo: {resolvedStatus.motivoIgnorado}
                  </Text>
                ) : null}

                <View style={styles.medicationFooter}>
                  {!resolvedStatus ? (
                    <View style={styles.treatmentActions}>
                      <Pressable
                        accessibilityLabel={`Confirmar uso de ${medication.nome}`}
                        style={[
                          styles.checkButton,
                          { backgroundColor: colors.checkBg },
                        ]}
                        onPress={() => handleTaken(dose)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.checkText}
                          />
                        ) : (
                          <>
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
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Ignorar ${medication.nome}`}
                        style={[
                          styles.ignoreButton,
                          { backgroundColor: colors.ignoreBg },
                        ]}
                        onPress={() => setIgnoreTarget(dose)}
                        disabled={actionLoading}
                      >
                        <Ionicons
                          name="remove-circle-outline"
                          size={17}
                          color={colors.ignoreText}
                        />
                        <Text
                          style={[styles.ignoreText, { color: colors.ignoreText }]}
                        >
                          Ignorar
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.finishedHint}>Registro de hoje finalizado</Text>
                  )}

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
                      <Ionicons name="create-outline" size={18} color="#2F80ED" />
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
            );
          })}

          {upcomingDoses.length === 0 && (
            <Text style={ps.body}>
              {medications.length === 0
                ? "Nenhum medicamento cadastrado."
                : "Nenhum proximo horario. Consulte os pendentes no historico."}
            </Text>
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
                    {item.status === "CONFIRMADO"
                      ? "C"
                      : item.status === "IGNORADO"
                        ? "I"
                        : "P"}
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

      <IgnoreMedicationModal
        visible={Boolean(ignoreTarget)}
        medicationName={ignoreTarget?.medication.nome}
        loading={ignoring}
        onCancel={() => {
          if (!ignoring) setIgnoreTarget(null);
        }}
        onConfirm={handleIgnore}
      />
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
    borderWidth: 1,
    borderRadius: 12,
    gap: 10,
    padding: 11,
  },
  medicationMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  medicationStatus: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  medicationStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  medicationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  treatmentActions: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
  },
  checkButton: {
    flex: 1,
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
  ignoreButton: {
    flex: 1,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  ignoreText: {
    fontSize: 12,
    fontWeight: "900",
  },
  ignoreReason: {
    color: "#B45309",
  },
  finishedHint: {
    color: "#6D8AA4",
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  iconActions: {
    width: 86,
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
