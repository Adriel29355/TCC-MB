import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { FieldError, INVALID_INPUT_STYLE } from "@/components/field-error";
import { PasswordInput } from "@/components/password-input";
import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import {
  COMORBIDITY_OPTIONS,
  formatComorbidities,
  NO_COMORBIDITIES,
  OTHER_COMORBIDITY,
} from "@/constants/comorbidities";
import { registerUser } from "@/lib/pharmalife";
import {
  FIELD_LIMITS,
  birthDateToIso,
  hasValidationErrors,
  validateBirthDate,
  validateEmail,
  validateHealthCondition,
  validateNewPassword,
  validatePersonName,
} from "@/lib/validation";

type RegistrationStep = "account" | "profile";

type RegistrationErrors = {
  nome: string;
  dataNascimento: string;
  comorbidade: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

const EMPTY_ERRORS: RegistrationErrors = {
  nome: "",
  dataNascimento: "",
  comorbidade: "",
  email: "",
  senha: "",
  confirmarSenha: "",
};

export default function CadastroScreen() {
  const [step, setStep] = useState<RegistrationStep>("account");
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>([]);
  const [otherComorbidity, setOtherComorbidity] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errors, setErrors] = useState<RegistrationErrors>(EMPTY_ERRORS);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();
  const placeholderColor = darkMode ? "#7FA8C8" : "#6D8AA4";
  const isAccountStep = step === "account";

  function updateError(field: keyof RegistrationErrors, error: string) {
    setErrors((current) => ({ ...current, [field]: error }));
  }

  function getComorbidityValue() {
    return formatComorbidities(selectedComorbidities, otherComorbidity);
  }

  function toggleComorbidity(option: string) {
    setSelectedComorbidities((current) => {
      if (option === NO_COMORBIDITIES) {
        setOtherComorbidity("");
        return current.includes(NO_COMORBIDITIES) ? [] : [NO_COMORBIDITIES];
      }

      const withoutNone = current.filter((item) => item !== NO_COMORBIDITIES);
      return withoutNone.includes(option)
        ? withoutNone.filter((item) => item !== option)
        : [...withoutNone, option];
    });
    setErrors((current) => ({ ...current, comorbidade: "" }));
  }

  function handleContinue() {
    setMessage("");
    const accountErrors = {
      email: validateEmail(email),
      senha: validateNewPassword(senha),
      confirmarSenha:
        !confirmarSenha
          ? "Confirme a senha."
          : senha === confirmarSenha
            ? ""
            : "As senhas precisam ser iguais.",
    };

    setErrors((current) => ({ ...current, ...accountErrors }));
    if (hasValidationErrors(accountErrors)) return;

    setStep("profile");
  }

  async function handleRegister() {
    setMessage("");
    setSuccess(false);
    const comorbidade = getComorbidityValue();
    const profileErrors = {
      nome: validatePersonName(nome),
      dataNascimento: validateBirthDate(dataNascimento),
      comorbidade: validateHealthCondition(comorbidade),
    };

    setErrors((current) => ({ ...current, ...profileErrors }));
    if (!acceptedTerms) setTermsError("Aceite os Termos de Uso para continuar.");
    if (hasValidationErrors(profileErrors) || !acceptedTerms) return;

    const isoBirthDate = birthDateToIso(dataNascimento);
    if (!isoBirthDate) return;

    setLoading(true);
    try {
      await registerUser({
        nome,
        email,
        senha,
        dataNascimento: isoBirthDate,
        comorbidade: comorbidade || null,
      });
      setSuccess(true);
      setMessage("Conta e perfil criados com sucesso. Faca login para continuar.");
      setTimeout(() => router.replace("/login"), 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow={`Etapa ${isAccountStep ? "1" : "2"} de 2`}
        title={isAccountStep ? "Criar conta" : "Completar perfil"}
        subtitle={
          isAccountStep
            ? "Defina seus dados de acesso ao PharmaLife."
            : "Conte um pouco sobre voce para personalizar sua experiencia."
        }
      />

      <Card>
        <View
          accessibilityLabel={`Etapa ${isAccountStep ? "1" : "2"} de 2`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 2, now: isAccountStep ? 1 : 2 }}
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              { width: isAccountStep ? "50%" : "100%" },
            ]}
          />
        </View>

        <View style={[styles.introBox, darkMode && styles.introBoxDark]}>
          <View style={styles.introIcon}>
            <Ionicons
              name={isAccountStep ? "shield-checkmark-outline" : "person-outline"}
              size={22}
              color="#2F80ED"
            />
          </View>
          <View style={styles.introText}>
            <Text style={[styles.introTitle, darkMode && styles.introTitleDark]}>
              {isAccountStep ? "Dados da conta" : "Dados do perfil"}
            </Text>
            <Text style={[styles.introDescription, darkMode && styles.introDescriptionDark]}>
              {isAccountStep
                ? "Voce usara o e-mail e a senha para entrar."
                : "Essas informacoes ajudam a organizar sua rotina."}
            </Text>
          </View>
        </View>

        {isAccountStep ? (
          <>
            <TextInput
              accessibilityLabel="E-mail"
              style={[ps.input, errors.email && INVALID_INPUT_STYLE]}
              placeholder="E-mail"
              placeholderTextColor={placeholderColor}
              selectionColor="#2F80ED"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              maxLength={FIELD_LIMITS.email}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) updateError("email", validateEmail(value));
              }}
              onBlur={() => updateError("email", validateEmail(email))}
            />
            <FieldError message={errors.email} />

            <PasswordInput
              accessibilityLabel="Senha"
              style={[ps.input, errors.senha && INVALID_INPUT_STYLE]}
              placeholder="Senha"
              placeholderTextColor={placeholderColor}
              selectionColor="#2F80ED"
              autoComplete="password-new"
              maxLength={FIELD_LIMITS.password}
              value={senha}
              onChangeText={(value) => {
                setSenha(value);
                if (errors.senha) updateError("senha", validateNewPassword(value));
                if (errors.confirmarSenha && confirmarSenha) {
                  updateError(
                    "confirmarSenha",
                    value === confirmarSenha ? "" : "As senhas precisam ser iguais.",
                  );
                }
              }}
              onBlur={() => updateError("senha", validateNewPassword(senha))}
            />
            <Text style={styles.hint}>
              Use de 12 a 72 caracteres, com pelo menos uma letra e um numero.
            </Text>
            <FieldError message={errors.senha} />

            <PasswordInput
              accessibilityLabel="Confirmar senha"
              style={[ps.input, errors.confirmarSenha && INVALID_INPUT_STYLE]}
              placeholder="Confirmar senha"
              placeholderTextColor={placeholderColor}
              selectionColor="#2F80ED"
              autoComplete="password-new"
              maxLength={FIELD_LIMITS.password}
              value={confirmarSenha}
              onChangeText={(value) => {
                setConfirmarSenha(value);
                if (errors.confirmarSenha) {
                  updateError(
                    "confirmarSenha",
                    value === senha ? "" : "As senhas precisam ser iguais.",
                  );
                }
              }}
              onBlur={() =>
                updateError(
                  "confirmarSenha",
                  confirmarSenha
                    ? confirmarSenha === senha
                      ? ""
                      : "As senhas precisam ser iguais."
                    : "Confirme a senha.",
                )
              }
            />
            <FieldError message={errors.confirmarSenha} />

            <Pressable style={ps.primaryButton} onPress={handleContinue}>
              <Text style={ps.primaryButtonText}>Continuar</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.link}>Ja tenho conta</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              accessibilityLabel="Nome"
              style={[ps.input, errors.nome && INVALID_INPUT_STYLE]}
              placeholder="Como voce gostaria de ser chamado?"
              placeholderTextColor={placeholderColor}
              selectionColor="#2F80ED"
              autoComplete="name"
              autoCapitalize="words"
              maxLength={FIELD_LIMITS.personName}
              value={nome}
              onChangeText={(value) => {
                setNome(value);
                if (errors.nome) updateError("nome", validatePersonName(value));
              }}
              onBlur={() => updateError("nome", validatePersonName(nome))}
            />
            <FieldError message={errors.nome} />

            <TextInput
              accessibilityLabel="Data de nascimento"
              style={[ps.input, errors.dataNascimento && INVALID_INPUT_STYLE]}
              placeholder="Data de nascimento (DD/MM/AAAA)"
              placeholderTextColor={placeholderColor}
              selectionColor="#2F80ED"
              keyboardType="number-pad"
              maxLength={FIELD_LIMITS.birthDate}
              value={dataNascimento}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, "").slice(0, 8);
                const formatted = [
                  digits.slice(0, 2),
                  digits.slice(2, 4),
                  digits.slice(4, 8),
                ]
                  .filter(Boolean)
                  .join("/");
                setDataNascimento(formatted);
                if (errors.dataNascimento) {
                  updateError("dataNascimento", validateBirthDate(formatted));
                }
              }}
              onBlur={() =>
                updateError("dataNascimento", validateBirthDate(dataNascimento))
              }
            />
            <FieldError message={errors.dataNascimento} />

            <View style={styles.comorbiditySection}>
              <Text style={[styles.fieldTitle, darkMode && styles.fieldTitleDark]}>
                Voce possui alguma comorbidade?
              </Text>
              <Text style={[styles.fieldHint, darkMode && styles.fieldHintDark]}>
                Selecione quantas opcoes quiser. Essa etapa e opcional.
              </Text>

              <View style={styles.comorbidityOptions}>
                {COMORBIDITY_OPTIONS.map((option) => {
                  const selected = selectedComorbidities.includes(option);
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() => toggleComorbidity(option)}
                      style={[
                        styles.comorbidityOption,
                        darkMode && styles.comorbidityOptionDark,
                        selected && styles.comorbidityOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.comorbidityOptionText,
                          darkMode && styles.comorbidityOptionTextDark,
                          selected && styles.comorbidityOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                accessibilityLabel="Outra comorbidade"
                style={[ps.input, errors.comorbidade && INVALID_INPUT_STYLE]}
                placeholder="Ou descreva outra opcao"
                placeholderTextColor={placeholderColor}
                selectionColor="#2F80ED"
                editable={!selectedComorbidities.includes(NO_COMORBIDITIES)}
                maxLength={FIELD_LIMITS.healthCondition}
                value={otherComorbidity}
                onChangeText={(value) => {
                  setOtherComorbidity(value);
                  if (value && !selectedComorbidities.includes(OTHER_COMORBIDITY)) {
                    setSelectedComorbidities((current) => [
                      ...current.filter((item) => item !== NO_COMORBIDITIES),
                      OTHER_COMORBIDITY,
                    ]);
                  }
                  if (errors.comorbidade) {
                    const selected = selectedComorbidities.filter(
                      (option) =>
                        option !== OTHER_COMORBIDITY &&
                        option !== NO_COMORBIDITIES,
                    );
                    updateError(
                      "comorbidade",
                      validateHealthCondition(
                        [...selected, value.trim()].filter(Boolean).join(", "),
                      ),
                    );
                  }
                }}
                onBlur={() =>
                  updateError(
                    "comorbidade",
                    validateHealthCondition(getComorbidityValue()),
                  )
                }
              />
            </View>
            <FieldError message={errors.comorbidade} />

            <View style={styles.termsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Aceitar os Termos de Uso"
                accessibilityState={{ checked: acceptedTerms }}
                hitSlop={8}
                onPress={() => {
                  setAcceptedTerms((current) => !current);
                  setTermsError("");
                }}
              >
                <Ionicons
                  name={acceptedTerms ? "checkbox" : "square-outline"}
                  size={24}
                  color={acceptedTerms ? "#2F80ED" : placeholderColor}
                />
              </Pressable>
              <Text style={[styles.termsText, darkMode && styles.termsTextDark]}>
                Li e aceito os{" "}
                <Text
                  accessibilityRole="link"
                  style={styles.inlineLink}
                  onPress={() => router.push("/termos-de-uso" as Href)}
                >
                  Termos de Uso
                </Text>
                .
              </Text>
            </View>
            <FieldError message={termsError} />

            {message ? (
              <Text style={[styles.message, success && styles.success]}>{message}</Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[ps.secondaryButton, styles.actionButton]}
                onPress={() => {
                  setMessage("");
                  setStep("account");
                }}
                disabled={loading}
              >
                <Text style={ps.secondaryButtonText}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[ps.primaryButton, styles.actionButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={ps.primaryButtonText}>
                  {loading ? "Finalizando..." : "Finalizar cadastro"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8ECFF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2F80ED",
  },
  introBox: {
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 10,
    backgroundColor: "#F4FAFF",
    gap: 12,
    padding: 14,
  },
  introBoxDark: {
    borderColor: "#1E3448",
    backgroundColor: "#0D2238",
  },
  introIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF6FF",
  },
  introText: {
    flex: 1,
    gap: 3,
  },
  introTitle: {
    color: "#14324A",
    fontSize: 16,
    fontWeight: "800",
  },
  introTitleDark: {
    color: "#C8E0F4",
  },
  introDescription: {
    color: "#5F7F9B",
    fontSize: 13,
    lineHeight: 18,
  },
  introDescriptionDark: {
    color: "#7FA8C8",
  },
  message: {
    color: "#DC2626",
    fontWeight: "700",
  },
  success: {
    color: "#12805C",
  },
  hint: {
    color: "#6D8AA4",
    fontSize: 12,
    lineHeight: 17,
  },
  comorbiditySection: {
    gap: 10,
  },
  fieldTitle: {
    color: "#14324A",
    fontSize: 16,
    fontWeight: "800",
  },
  fieldTitleDark: {
    color: "#C8E0F4",
  },
  fieldHint: {
    color: "#6D8AA4",
    fontSize: 13,
    lineHeight: 18,
  },
  fieldHintDark: {
    color: "#7FA8C8",
  },
  comorbidityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  comorbidityOption: {
    borderWidth: 1,
    borderColor: "#B8DEFF",
    borderRadius: 999,
    backgroundColor: "#F8FCFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  comorbidityOptionDark: {
    borderColor: "#1E3448",
    backgroundColor: "#0D2238",
  },
  comorbidityOptionSelected: {
    borderColor: "#2F80ED",
    backgroundColor: "#2F80ED",
  },
  comorbidityOptionText: {
    color: "#4E7393",
    fontSize: 13,
    fontWeight: "700",
  },
  comorbidityOptionTextDark: {
    color: "#A9C8E1",
  },
  comorbidityOptionTextSelected: {
    color: "#FFFFFF",
  },
  termsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  termsText: {
    color: "#4E7393",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsTextDark: {
    color: "#7FA8C8",
  },
  inlineLink: {
    color: "#2F80ED",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    textAlign: "center",
  },
});
