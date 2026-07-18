import { router } from "expo-router";
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
  validateAge,
  validateEmail,
  validateHealthCondition,
  validateNewPassword,
  validatePersonName,
} from "@/lib/validation";

type RegistrationErrors = {
  nome: string;
  idade: string;
  comorbidade: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

const EMPTY_ERRORS: RegistrationErrors = {
  nome: "",
  idade: "",
  comorbidade: "",
  email: "",
  senha: "",
  confirmarSenha: "",
};

export default function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [comorbidade, setComorbidade] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errors, setErrors] = useState<RegistrationErrors>(EMPTY_ERRORS);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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
      idade: validateAge(idade),
      comorbidade: validateHealthCondition(comorbidade),
      email: validateEmail(email),
      senha: validateNewPassword(senha),
      confirmarSenha:
        senha === confirmarSenha ? "" : "As senhas precisam ser iguais.",
    };
    if (!confirmarSenha) nextErrors.confirmarSenha = "Confirme a senha.";
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    const parsedAge = Number(idade);

    setLoading(true);
    try {
      await registerUser({
        nome,
        email,
        senha,
        idade: parsedAge,
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
          accessibilityLabel="Idade"
          style={[ps.input, errors.idade && INVALID_INPUT_STYLE]}
          placeholder="Idade"
          placeholderTextColor={placeholderColor}
          selectionColor="#2F80ED"
          keyboardType="number-pad"
          maxLength={FIELD_LIMITS.age}
          value={idade}
          onChangeText={(value) => {
            setIdade(value);
            if (errors.idade) updateError("idade", validateAge(value));
          }}
          onBlur={() => updateError("idade", validateAge(idade))}
        />
        <FieldError message={errors.idade} />
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
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "none",
  },
});
