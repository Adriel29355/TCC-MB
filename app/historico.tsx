import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { IgnoreMedicationModal } from "@/components/ignore-medication-modal";
import { useAppContext } from "@/contexts/AppContext";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  confirmHistoryItem,
  fetchHistory,
  fetchMedications,
  getStoredHistory,
  HistoryItem,
  ignoreHistoryItem,
  markMedicationAsIgnored,
  markMedicationAsTaken,
  medicationOccurrencesForDay,
  Medication,
  setStoredHistory,
} from "@/lib/pharmalife";

type DisplayHistoryItem = HistoryItem & {
  virtualPending?: boolean;
  medication?: Medication;
};

type HistoryFilter = "TODOS" | HistoryItem["status"];

function historyEventDate(item: HistoryItem) {
  const value =
    item.status === "IGNORADO"
      ? item.dataHoraIgnorado ?? item.dataConfirmacao
      : item.dataConfirmacao;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function occurrenceTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export default function HistoricoScreen() {
  const [history, setHistory] = useState(() => getStoredHistory());
  const [medications, setMedications] = useState<Medication[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [ignoreTarget, setIgnoreTarget] = useState<DisplayHistoryItem | null>(null);
  const [savingIgnore, setSavingIgnore] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>("TODOS");
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  const pendenteBg = darkMode ? "#2D1F00" : "#FEF3C7";
  const pendenteColor = darkMode ? "#F5A623" : "#B45309";
  const confirmadoBg = darkMode ? "#0A2A1A" : "#DDF8EA";
  const confirmadoColor = darkMode ? "#34D399" : "#12805C";
  const ignoradoBg = darkMode ? "#2A0A0A" : "#FEE2E2";
  const ignoradoColor = darkMode ? "#F87171" : "#B91C1C";

  useFocusEffect(useCallback(() => {
    let active = true;
    setInitialLoading(true);

    fetchHistory()
      .then((items) => {
        if (active) setHistory(items);
      })
      .catch((error) => {
        confirmDialog(
          "Erro",
          error instanceof Error
            ? error.message
            : "Nao foi possivel buscar o historico.",
          () => {},
        );
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    fetchMedications()
      .then((items) => {
        if (active) setMedications(items);
      })
      .catch(() => {
        if (active) setMedications([]);
      });

    return () => {
      active = false;
    };
  }, []));

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  function statusStyle(status: HistoryItem["status"]) {
    if (status === "PENDENTE")
      return { backgroundColor: pendenteBg, color: pendenteColor };
    if (status === "CONFIRMADO")
      return { backgroundColor: confirmadoBg, color: confirmadoColor };
    return { backgroundColor: ignoradoBg, color: ignoradoColor };
  }

  function replaceHistoryItem(id: number, syncedItem: HistoryItem) {
    const updated: HistoryItem[] = history.map((item) =>
      item.id === id
        ? {
            ...item,
            ...syncedItem,
            medicationId: syncedItem.medicationId ?? item.medicationId,
          }
        : item,
    );
    setStoredHistory(updated);
    setHistory(updated);
  }

  const virtualPending: DisplayHistoryItem[] = medications.flatMap((medication) =>
    medicationOccurrencesForDay(medication, now)
      .filter((scheduled) => {
        if (scheduled > now) return false;
        const horario = occurrenceTime(scheduled);
      const normalizedName = medication.nome.trim().toLocaleLowerCase();
      return !history.some((item) => {
        const sameMedication = item.medicationId
          ? item.medicationId === medication.id
          : item.nome.trim().toLocaleLowerCase() === normalizedName;
        if (!sameMedication) return false;
        if (item.horario !== horario) return false;
        if (item.status === "PENDENTE") return true;
        const eventDate = historyEventDate(item);
        return Boolean(eventDate && isToday(eventDate));
      });
      })
      .map((scheduled) => {
        const horario = occurrenceTime(scheduled);
        const minutes = scheduled.getHours() * 60 + scheduled.getMinutes();
        return {
          id: -(medication.id * 10_000 + minutes),
          medicationId: medication.id,
          nome: medication.nome,
          dosagem: medication.descricao,
          observacoes: medication.complemento,
          horario,
          status: "PENDENTE" as const,
          virtualPending: true,
          medication,
        };
      }),
  );
  const displayedHistory: DisplayHistoryItem[] = [
    ...virtualPending,
    ...history,
  ];
  const filteredHistory =
    filter === "TODOS"
      ? displayedHistory
      : displayedHistory.filter((item) => item.status === filter);

  async function confirmPendingItem(item: DisplayHistoryItem) {
    if (item.status !== "PENDENTE") return;

    setLoadingId(item.id);

    try {
      if (item.virtualPending && item.medication) {
        const syncedItem = await markMedicationAsTaken(
          item.medication,
          item.horario,
        );
        setHistory((current) => [syncedItem, ...current]);
      } else {
        const syncedItem = await confirmHistoryItem(item.id);
        replaceHistoryItem(item.id, syncedItem);
      }
    } catch (error) {
      confirmDialog(
        "Erro",
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar o status.",
        () => {},
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function ignorePendingItem(reason: string) {
    const item = ignoreTarget;
    if (!item || item.status !== "PENDENTE") return;

    setSavingIgnore(true);
    try {
      if (item.virtualPending && item.medication) {
        const syncedItem = await markMedicationAsIgnored(
          item.medication,
          reason,
          item.horario,
        );
        setHistory((current) => [syncedItem, ...current]);
      } else {
        const syncedItem = await ignoreHistoryItem(item.id, reason);
        replaceHistoryItem(item.id, syncedItem);
      }
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
      setSavingIgnore(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Historico"
        title="Uso dos medicamentos"
        subtitle="Confirme, ignore ou acompanhe registros pendentes do tratamento."
      />

      <View style={styles.filters}>
        <Text style={ps.pill}>
          Confirmados:{" "}
          {history.filter((item) => item.status === "CONFIRMADO").length}
        </Text>
        <Text style={ps.pill}>
          Pendentes:{" "}
          {displayedHistory.filter((item) => item.status === "PENDENTE").length}
        </Text>
        <Text style={ps.pill}>
          Ignorados:{" "}
          {displayedHistory.filter((item) => item.status === "IGNORADO").length}
        </Text>
      </View>

      <View style={styles.filterButtons}>
        {(
          [
            ["TODOS", "Todos"],
            ["PENDENTE", "Pendentes"],
            ["CONFIRMADO", "Tomados"],
            ["IGNORADO", "Ignorados"],
          ] as const
        ).map(([value, label]) => {
          const active = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.filterButton,
                darkMode && styles.filterButtonDark,
                active && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  darkMode && styles.filterButtonTextDark,
                  active && styles.filterButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {initialLoading ? (
        <Card>
          <ActivityIndicator color="#2F80ED" />
        </Card>
      ) : null}

      {!initialLoading && filteredHistory.map((item) => (
        <Card key={item.id}>
          <View style={ps.row}>
            <View style={{ flex: 1 }}>
              <Text style={ps.cardTitle}>{item.nome}</Text>
              <Text style={ps.body}>
                {item.dosagem} às {item.horario}
              </Text>
            </View>
            <Text style={[styles.status, statusStyle(item.status)]}>
              {item.status}
            </Text>
          </View>

          {item.observacoes ? (
            <Text style={ps.small}>{item.observacoes}</Text>
          ) : null}

          {item.motivoIgnorado ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Motivo para ignorar</Text>
              <Text style={ps.body}>{item.motivoIgnorado}</Text>
            </View>
          ) : null}

          {item.status === "PENDENTE" ? (
            <View style={styles.pendingActions}>
              <Pressable
                style={[ps.primaryButton, styles.actionButton]}
                onPress={() => confirmPendingItem(item)}
                disabled={loadingId === item.id}
              >
                {loadingId === item.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={ps.primaryButtonText}>Marcar como tomado</Text>
                )}
              </Pressable>
              <Pressable
                style={[ps.secondaryButton, styles.actionButton]}
                onPress={() => setIgnoreTarget(item)}
                disabled={loadingId === item.id}
              >
                <Text style={ps.secondaryButtonText}>Ignorar</Text>
              </Pressable>
            </View>
          ) : null}
        </Card>
      ))}

      {!initialLoading && filteredHistory.length === 0 && (
        <Text style={ps.body}>
          {displayedHistory.length === 0
            ? "Nenhum registro no historico."
            : "Nenhum registro encontrado neste filtro."}
        </Text>
      )}

      <IgnoreMedicationModal
        visible={Boolean(ignoreTarget)}
        medicationName={ignoreTarget?.nome}
        loading={savingIgnore}
        onCancel={() => {
          if (!savingIgnore) setIgnoreTarget(null);
        }}
        onConfirm={ignorePendingItem}
      />
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#B8DEFF",
    borderRadius: 999,
    backgroundColor: "#F8FCFF",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterButtonDark: {
    borderColor: "#1E3448",
    backgroundColor: "#0D2238",
  },
  filterButtonActive: {
    borderColor: "#2F80ED",
    backgroundColor: "#2F80ED",
  },
  filterButtonText: {
    color: "#4E7393",
    fontSize: 12,
    fontWeight: "800",
  },
  filterButtonTextDark: {
    color: "#A9C8E1",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  status: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: "hidden",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  reasonBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#B45309",
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
    gap: 3,
    padding: 10,
  },
  reasonLabel: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "900",
  },
});
