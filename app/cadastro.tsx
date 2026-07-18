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
import { registerUser } from "@/lib/pharmalife";
import {
  FIELD_LIMITS,
  hasValidationErrors,
  birthDateToIso,
  validateBirthDate,
  validateEmail,
  validateHealthCondition,
  validateNewPassword,
  validatePersonName,
} from "@/lib/validation";

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
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [comorbidade, setComorbidade] = useState("");
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

  function updateError(field: keyof RegistrationErrors, error: string) {
    setErrors((current) => ({ ...current, [field]: error }));
  }

  async function handleRegister() {
    setMessage("");
    setSuccess(false);
    const nextErrors: RegistrationErrors = {
      nome: validatePersonName(nome),
      dataNascimento: validateBirthDate(dataNascimento),
      comorbidade: validateHealthCondition(comorbidade),
      email: validateEmail(email),
      senha: validateNewPassword(senha),
      confirmarSenha:
        senha === confirmarSenha ? "" : "As senhas precisam ser iguais.",
    };
    if (!confirmarSenha) nextErrors.confirmarSenha = "Confirme a senha.";
    setErrors(nextErrors);
    if (!acceptedTerms) setTermsError("Aceite os Termos de Uso para continuar.");
    if (hasValidationErrors(nextErrors) || !acceptedTerms) return;

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
      setMessage("Conta criada com sucesso. Faca login para continuar.");
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
        eyebrow="Cadastro"
        title="Criar conta"
        subtitle="Informe seus dados para organizar lembretes e historico dos seus medicamentos."
      />

      <Card>
        <View style={styles.brandBox}>
          <Text style={styles.brand}>Agenda pessoal</Text>
          <Text style={styles.brandText}>Seu cadastro cria a base para acompanhar horarios, doses e confirmacoes.</Text>
        </View>

        <TextInput
          accessibilityLabel="Nome"
          style={[ps.input, errors.nome && INVALID_INPUT_STYLE]}
          placeholder="Nome de usuario"
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
        <TextInput
          accessibilityLabel="Comorbidade opcional"
          style={[ps.input, errors.comorbidade && INVALID_INPUT_STYLE]}
          placeholder="Comorbidade (opcional)"
          placeholderTextColor={placeholderColor}
          selectionColor="#2F80ED"
          maxLength={FIELD_LIMITS.healthCondition}
          value={comorbidade}
          onChangeText={(value) => {
            setComorbidade(value);
            if (errors.comorbidade) {
              updateError(
                "comorbidade",
                validateHealthCondition(value),
              );
            }
          }}
          onBlur={() =>
            updateError(
              "comorbidade",
              validateHealthCondition(comorbidade),
            )
          }
        />
        <FieldError message={errors.comorbidade} />
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

        {message ? <Text style={[styles.message, success && styles.success]}>{message}</Text> : null}

        <Pressable style={ps.primaryButton} onPress={handleRegister} disabled={loading}>
          <Text style={ps.primaryButtonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.link}>Ja tenho conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  brandBox: {
    borderWidth: 1,
    borderColor: "#D8ECFF",
    borderRadius: 8,
    backgroundColor: "#EAF6FF",
    gap: 6,
    padding: 14,
  },
  brand: {
    color: "#2F80ED",
    fontSize: 22,
    fontWeight: "900",
  },
  brandText: {
    color: "#4E7393",
    fontSize: 14,
    lineHeight: 20,
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
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "none",
  },
});
