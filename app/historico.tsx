import { useState } from "react";
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
import { useAppContext } from "@/contexts/AppContext";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  API_BASE_URL,
  getStoredHistory,
  HistoryItem,
  setStoredHistory,
} from "@/lib/pharmalife";

function nextStatus(status: HistoryItem["status"]): HistoryItem["status"] {
  if (status === "PENDENTE") return "CONFIRMADO";
  if (status === "CONFIRMADO") return "IGNORADO";
  return "PENDENTE";
}

async function syncStatusWithApi(id: number, newStatus: HistoryItem["status"]) {
  if (newStatus === "CONFIRMADO") {
    const res = await fetch(`${API_BASE_URL}/api/historico/${id}/confirmar`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Erro ao confirmar no servidor.");
  } else if (newStatus === "IGNORADO") {
    const res = await fetch(`${API_BASE_URL}/api/historico/${id}/ignorar`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Erro ao ignorar no servidor.");
  }
}

export default function HistoricoScreen() {
  const [history, setHistory] = useState(() => getStoredHistory());
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  const pendenteBg = darkMode ? "#2D1F00" : "#FEF3C7";
  const pendenteColor = darkMode ? "#F5A623" : "#B45309";
  const confirmadoBg = darkMode ? "#0A2A1A" : "#DDF8EA";
  const confirmadoColor = darkMode ? "#34D399" : "#12805C";
  const ignoradoBg = darkMode ? "#2A0A0A" : "#FEE2E2";
  const ignoradoColor = darkMode ? "#F87171" : "#B91C1C";

  function statusStyle(status: HistoryItem["status"]) {
    if (status === "PENDENTE")
      return { backgroundColor: pendenteBg, color: pendenteColor };
    if (status === "CONFIRMADO")
      return { backgroundColor: confirmadoBg, color: confirmadoColor };
    return { backgroundColor: ignoradoBg, color: ignoradoColor };
  }

  async function toggleStatus(id: number) {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    const newStatus = nextStatus(item.status);
    setLoadingId(id);

    try {
      await syncStatusWithApi(id, newStatus);
      const updated: HistoryItem[] = history.map((h) =>
        h.id === id ? { ...h, status: newStatus } : h,
      );
      setStoredHistory(updated);
      setHistory(updated);
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
          {history.filter((item) => item.status === "PENDENTE").length}
        </Text>
      </View>

      {history.map((item) => (
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

          <Pressable
            style={ps.secondaryButton}
            onPress={() => toggleStatus(item.id)}
            disabled={loadingId === item.id}
          >
            {loadingId === item.id ? (
              <ActivityIndicator color="#2F80ED" />
            ) : (
              <Text style={ps.secondaryButtonText}>Alterar status</Text>
            )}
          </Pressable>
        </Card>
      ))}

      {history.length === 0 && (
        <Text style={ps.body}>Nenhum registro no historico.</Text>
      )}
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  status: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: "hidden",
  },
});
