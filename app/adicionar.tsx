import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { FieldError, INVALID_INPUT_STYLE } from "@/components/field-error";
import { useAppContext } from "@/contexts/AppContext";
import { alertDialog } from "@/lib/confirm-dialog";
import {
  addMedication,
  fetchMedicationById,
  Medication,
  updateMedication,
} from "@/lib/pharmalife";
import {
  FIELD_LIMITS,
  hasValidationErrors,
  validateDosage,
  validateMedicationName,
  validateOptionalText,
  validateTime,
} from "@/lib/validation";

const FREQUENCIES = [
  {
    value: "Diario",
    label: "Diario",
    description: "Todos os dias",
    icon: "sunny-outline",
  },
  {
    value: "8h",
    label: "A cada 8h",
    description: "3 vezes ao dia",
    icon: "time-outline",
  },
  {
    value: "12h",
    label: "A cada 12h",
    description: "2 vezes ao dia",
    icon: "repeat-outline",
  },
  {
    value: "Semanal",
    label: "Semanal",
    description: "No mesmo dia da semana",
    icon: "calendar-outline",
  },
] as const;

type MedicationFrequency = (typeof FREQUENCIES)[number]["value"];

function medicationFrequency(value: string): MedicationFrequency {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("8")) return "8h";
  if (normalized.includes("12")) return "12h";
  if (normalized.startsWith("seman")) return "Semanal";
  return "Diario";
}

type MedicationErrors = {
  nome: string;
  dosagem: string;
  horario: string;
  observacao: string;
};

export default function AdicionarScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawMedicationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const medicationId = Number(rawMedicationId);
  const editing = rawMedicationId != null;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [initialLoading, setInitialLoading] = useState(editing);
  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [horario, setHorario] = useState("08:00");
  const [frequencia, setFrequencia] =
    useState<MedicationFrequency>("Diario");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<MedicationErrors>({
    nome: "",
    dosagem: "",
    horario: "",
    observacao: "",
  });
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  useEffect(() => {
    if (!editing) {
      setInitialLoading(false);
      return;
    }
    if (!Number.isInteger(medicationId) || medicationId <= 0) {
      setError("Medicamento invalido.");
      setInitialLoading(false);
      return;
    }

    let active = true;
    setInitialLoading(true);
    fetchMedicationById(medicationId)
      .then((item) => {
        if (!active) return;
        setMedication(item);
        setNome(item.nome);
        setDosagem(item.descricao);
        setHorario(item.agenda?.horario ?? "08:00");
        setFrequencia(medicationFrequency(item.tipo));
        setObservacao(item.complemento ?? "");
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nao foi possivel carregar o medicamento.",
          );
        }
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, [editing, medicationId]);

  const colors = {
    title: darkMode ? "#E8F4FF" : "#14324A",
    label: darkMode ? "#C8E0F4" : "#294C68",
    muted: darkMode ? "#7FA8C8" : "#6D8AA4",
    iconBg: darkMode ? "#0D2A45" : "#EAF6FF",
    selectedBg: darkMode ? "#102C46" : "#EDF7FF",
    optionBg: darkMode ? "#111E2D" : "#FFFFFF",
    optionBorder: darkMode ? "#29445C" : "#D8ECFF",
    errorBg: darkMode ? "#321616" : "#FFF3F3",
    errorText: darkMode ? "#FCA5A5" : "#B42318",
  };

  function handleTimeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted =
      digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    setHorario(formatted);
    if (errors.horario) {
      setErrors((current) => ({
        ...current,
        horario: validateTime(formatted),
      }));
    }
  }

  async function handleSave() {
    setError("");
    const nextErrors: MedicationErrors = {
      nome: validateMedicationName(nome),
      dosagem: validateDosage(dosagem),
      horario: validateTime(horario),
      observacao: validateOptionalText(
        observacao,
        "A observacao",
        FIELD_LIMITS.medicationObservation,
      ),
    };
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setLoading(true);
    try {
      const input = {
        nome,
        descricao: dosagem,
        horario,
        tipo: frequencia,
        complemento: observacao,
      };
      if (editing && !medication) {
        setError("Nao foi possivel identificar o medicamento para editar.");
        return;
      }
      const result = editing
        ? await updateMedication(medication!, input)
        : await addMedication(input);
      if (!result.notificationScheduled) {
        alertDialog(
          editing ? "Medicamento atualizado" : "Medicamento salvo",
          `O medicamento foi ${editing ? "atualizado" : "cadastrado"}, mas a notificacao nao pôde ser agendada. Ative as notificacoes e os alarmes exatos nas configuracoes do aparelho.`,
          () => router.replace("/agenda"),
        );
        return;
      }
      router.replace("/agenda");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar medicamento.");
    } finally {
      setLoading(false);
    }
  }

  function FieldLabel({
    icon,
    children,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    children: string;
  }) {
    return (
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={17} color="#2F80ED" />
        <Text style={[styles.fieldLabel, { color: colors.label }] }>
          {children}
        </Text>
      </View>
    );
  }

  if (initialLoading) {
    return (
      <PharmaScreen>
        <Stack.Screen options={{ title: "Editar medicamento" }} />
        <View style={styles.loadingState}>
          <ActivityIndicator color="#2F80ED" size="large" />
          <Text style={ps.body}>Carregando medicamento...</Text>
        </View>
      </PharmaScreen>
    );
  }

  return (
    <PharmaScreen>
      <Stack.Screen
        options={{ title: editing ? "Editar medicamento" : "Adicionar" }}
      />
      <SectionHeader
        eyebrow={editing ? "Editar" : "Adicionar"}
        title={editing ? "Editar medicamento" : "Novo medicamento"}
        subtitle={
          editing
            ? "Atualize os dados, o horario ou a frequencia do tratamento."
            : "Organize os horarios e receba os avisos da sua rotina."
        }
      />

      <Card>
        <View style={styles.cardHeading}>
          <View style={[styles.headingIcon, { backgroundColor: colors.iconBg }] }>
            <Ionicons name="medkit-outline" size={22} color="#2F80ED" />
          </View>
          <View style={styles.headingCopy}>
            <Text style={[styles.cardTitle, { color: colors.title }] }>
              {editing ? "Dados atuais" : "Dados do medicamento"}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }] }>
              Informe o nome e a dosagem indicada.
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel icon="medical-outline">Medicamento</FieldLabel>
          <TextInput
            style={[ps.input, errors.nome && INVALID_INPUT_STYLE]}
            placeholder="Ex.: Losartana"
            placeholderTextColor={darkMode ? "#55758F" : "#9DBDD8"}
            value={nome}
            onChangeText={(value) => {
              setNome(value);
              if (errors.nome) {
                setErrors((current) => ({
                  ...current,
                  nome: validateMedicationName(value),
                }));
              }
            }}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                nome: validateMedicationName(nome),
              }))
            }
            autoCapitalize="words"
            maxLength={FIELD_LIMITS.medicationName}
          />
          <FieldError message={errors.nome} />
        </View>

        <View style={styles.field}>
          <FieldLabel icon="flask-outline">Dosagem</FieldLabel>
          <TextInput
            style={[ps.input, errors.dosagem && INVALID_INPUT_STYLE]}
            placeholder="Ex.: 50 mg ou 1 comprimido"
            placeholderTextColor={darkMode ? "#55758F" : "#9DBDD8"}
            value={dosagem}
            onChangeText={(value) => {
              setDosagem(value);
              if (errors.dosagem) {
                setErrors((current) => ({
                  ...current,
                  dosagem: validateDosage(value),
                }));
              }
            }}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                dosagem: validateDosage(dosagem),
              }))
            }
            maxLength={FIELD_LIMITS.dosage}
          />
          <FieldError message={errors.dosagem} />
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeading}>
          <View style={[styles.headingIcon, { backgroundColor: colors.iconBg }] }>
            <Ionicons name="notifications-outline" size={22} color="#2F80ED" />
          </View>
          <View style={styles.headingCopy}>
            <Text style={[styles.cardTitle, { color: colors.title }] }>
              Rotina de notificacoes
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }] }>
              Escolha o primeiro horario e a frequencia.
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel icon="alarm-outline">Primeiro horario</FieldLabel>
          <TextInput
            style={[
              ps.input,
              styles.timeInput,
              errors.horario && INVALID_INPUT_STYLE,
            ]}
            placeholder="08:00"
            placeholderTextColor={darkMode ? "#55758F" : "#9DBDD8"}
            value={horario}
            onChangeText={handleTimeChange}
            keyboardType="numeric"
            maxLength={5}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                horario: validateTime(horario),
              }))
            }
          />
          <FieldError message={errors.horario} />
        </View>

        <View style={styles.field}>
          <FieldLabel icon="repeat-outline">Frequencia</FieldLabel>
          <View
            accessibilityRole="radiogroup"
            style={styles.frequencyOptions}
          >
            {FREQUENCIES.map((option) => {
              const selected = frequencia === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.frequencyOption,
                    {
                      backgroundColor: selected
                        ? colors.selectedBg
                        : colors.optionBg,
                      borderColor: selected ? "#2F80ED" : colors.optionBorder,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                  onPress={() => setFrequencia(option.value)}
                >
                  <View
                    style={[
                      styles.frequencyIcon,
                      { backgroundColor: selected ? "#2F80ED" : colors.iconBg },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={selected ? "#FFFFFF" : "#2F80ED"}
                    />
                  </View>
                  <View style={styles.frequencyCopy}>
                    <Text
                      style={[
                        styles.frequencyText,
                        { color: colors.title },
                        selected && styles.frequencyTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[styles.frequencyDescription, { color: colors.muted }]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={selected ? "#2F80ED" : colors.optionBorder}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel icon="document-text-outline">Observacao</FieldLabel>
          <TextInput
            style={[
              ps.input,
              styles.observationInput,
              errors.observacao && INVALID_INPUT_STYLE,
            ]}
            placeholder="Ex.: tomar apos o cafe da manha"
            placeholderTextColor={darkMode ? "#55758F" : "#9DBDD8"}
            value={observacao}
            onChangeText={(value) => {
              setObservacao(value);
              if (errors.observacao) {
                setErrors((current) => ({
                  ...current,
                  observacao: validateOptionalText(
                    value,
                    "A observacao",
                    FIELD_LIMITS.medicationObservation,
                  ),
                }));
              }
            }}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                observacao: validateOptionalText(
                  observacao,
                  "A observacao",
                  FIELD_LIMITS.medicationObservation,
                ),
              }))
            }
            maxLength={FIELD_LIMITS.medicationObservation}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: colors.muted }] }>
            {observacao.length}/{FIELD_LIMITS.medicationObservation}
          </Text>
          <FieldError message={errors.observacao} />
        </View>
      </Card>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.errorBg }] }>
          <Ionicons name="alert-circle-outline" size={20} color={colors.errorText} />
          <Text style={[styles.errorText, { color: colors.errorText }] }>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[ps.secondaryButton, styles.actionButton]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={ps.secondaryButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[ps.primaryButton, styles.actionButton, loading && styles.disabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.saveContent}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={ps.primaryButtonText}>
                {editing ? "Salvar alteracoes" : "Salvar medicamento"}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  cardHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headingCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 7,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  timeInput: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  frequencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  frequencyOption: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 145,
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 11,
  },
  frequencyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  frequencyCopy: {
    flex: 1,
    gap: 2,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: "700",
  },
  frequencyTextSelected: {
    fontWeight: "900",
  },
  frequencyDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  observationInput: {
    minHeight: 88,
  },
  characterCount: {
    alignSelf: "flex-end",
    fontSize: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 10,
    padding: 13,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
  },
  saveContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabled: {
    opacity: 0.65,
  },
  loadingState: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
