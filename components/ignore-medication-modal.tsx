import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppContext } from "@/contexts/AppContext";
import { FIELD_LIMITS } from "@/lib/validation";

const OTHER_REASON = "Outro motivo";
const IGNORE_REASONS = [
  "Medico orientou suspensao",
  "Estou sem o medicamento",
  "Nao preciso tomar hoje",
  "Exame ou procedimento medico",
  OTHER_REASON,
];

export function IgnoreMedicationModal({
  visible,
  medicationName,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  medicationName?: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState(IGNORE_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState("");
  const { darkMode } = useAppContext();

  useEffect(() => {
    if (!visible) return;
    setSelectedReason(IGNORE_REASONS[0]);
    setOtherReason("");
    setError("");
  }, [visible]);

  function handleConfirm() {
    const reason =
      selectedReason === OTHER_REASON ? otherReason.trim() : selectedReason;
    if (!reason) {
      setError("Descreva o motivo para ignorar este medicamento.");
      return;
    }
    onConfirm(reason);
  }

  const colors = {
    overlay: "rgba(5, 15, 25, 0.62)",
    card: darkMode ? "#111E2D" : "#FFFFFF",
    border: darkMode ? "#1E3448" : "#D8ECFF",
    title: darkMode ? "#E8F4FF" : "#14324A",
    body: darkMode ? "#7FA8C8" : "#5F7F9B",
    option: darkMode ? "#0D2238" : "#F8FCFF",
    selected: darkMode ? "#0D2E4D" : "#EAF6FF",
    input: darkMode ? "#0D2238" : "#FFFFFF",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.heading}>
            <View style={styles.iconBox}>
              <Ionicons name="remove-circle-outline" size={24} color="#B45309" />
            </View>
            <View style={styles.headingCopy}>
              <Text style={[styles.title, { color: colors.title }]}>
                Por que deseja ignorar este medicamento?
              </Text>
              {medicationName ? (
                <Text style={[styles.medicationName, { color: colors.body }]}>
                  {medicationName}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={[styles.subtitle, { color: colors.body }]}>
            Medicamentos ignorados nao contam como esquecidos e nao reduzem sua
            taxa de adesao. Depois de confirmar, o status nao podera ser alterado.
          </Text>

          <ScrollView contentContainerStyle={styles.reasons}>
            {IGNORE_REASONS.map((reason) => {
              const selected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setSelectedReason(reason);
                    setError("");
                  }}
                  style={[
                    styles.reason,
                    {
                      backgroundColor: selected ? colors.selected : colors.option,
                      borderColor: selected ? "#2F80ED" : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selected ? "#2F80ED" : colors.body}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      { color: selected ? "#2F80ED" : colors.title },
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedReason === OTHER_REASON ? (
            <TextInput
              accessibilityLabel="Descreva o motivo"
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: error ? "#DC2626" : colors.border,
                  color: colors.title,
                },
              ]}
              placeholder="Ex: tive uma reacao ou orientacao especifica"
              placeholderTextColor={colors.body}
              value={otherReason}
              onChangeText={(value) => {
                setOtherReason(value);
                if (error) setError("");
              }}
              maxLength={FIELD_LIMITS.ignoreReason}
            />
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, loading && styles.disabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>Confirmar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "92%",
    borderWidth: 1,
    borderRadius: 16,
    gap: 14,
    padding: 18,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  headingCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  reasons: {
    gap: 8,
  },
  reason: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 9,
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 9,
  },
  cancelText: {
    color: "#2F80ED",
    fontWeight: "800",
  },
  confirmButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#B45309",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.65,
  },
});
