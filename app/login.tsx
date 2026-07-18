import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { FieldError, INVALID_INPUT_STYLE } from "@/components/field-error";
import { PasswordInput } from "@/components/password-input";
import { useAppContext } from "@/contexts/AppContext";
import { loginUser } from "@/lib/pharmalife";
import {
  FIELD_LIMITS,
  hasValidationErrors,
  validateEmail,
  validateLoginPassword,
} from "@/lib/validation";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ email: "", senha: "" });
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();
  const placeholderColor = darkMode ? "#7FA8C8" : "#6D8AA4";

  async function handleLogin() {
    setMessage("");
    const nextErrors = {
      email: validateEmail(email),
      senha: validateLoginPassword(senha),
    };
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setLoading(true);
    try {
      await loginUser(email, senha);
      router.replace("/");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel fazer login.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Acesso"
        title="Entrar"
        subtitle="Use sua conta PharmaLife para abrir sua agenda pessoal de medicamentos."
      />

      <Card>
        <View style={styles.brandBox}>
          <Text style={styles.brand}>PharmaLife</Text>
          <Text style={styles.brandText}>
            Seus horarios, remedios e historico protegidos em um so lugar.
          </Text>
        </View>

        <TextInput
          accessibilityLabel="E-mail"
          style={[ps.input, errors.email && INVALID_INPUT_STYLE]}
          placeholder="Digite seu e-mail"
          placeholderTextColor={placeholderColor}
          selectionColor="#2F80ED"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          maxLength={FIELD_LIMITS.email}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) {
              setErrors((current) => ({
                ...current,
                email: validateEmail(value),
              }));
            }
          }}
          onBlur={() =>
            setErrors((current) => ({
              ...current,
              email: validateEmail(email),
            }))
          }
        />
        <FieldError message={errors.email} />
        <PasswordInput
          accessibilityLabel="Senha"
          style={[ps.input, errors.senha && INVALID_INPUT_STYLE]}
          placeholder="Digite sua senha"
          placeholderTextColor={placeholderColor}
          selectionColor="#2F80ED"
          autoComplete="password"
          maxLength={FIELD_LIMITS.password}
          value={senha}
          onChangeText={(value) => {
            setSenha(value);
            if (errors.senha) {
              setErrors((current) => ({
                ...current,
                senha: validateLoginPassword(value),
              }));
            }
          }}
          onBlur={() =>
            setErrors((current) => ({
              ...current,
              senha: validateLoginPassword(senha),
            }))
          }
          onSubmitEditing={handleLogin}
        />
        <FieldError message={errors.senha} />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          style={ps.primaryButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={ps.primaryButtonText}>
            {loading ? "Entrando..." : "Entrar"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/cadastro")}>
          <Text style={styles.link}>Criar uma conta</Text>
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
  link: {
    color: "#2F80ED",
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "none",
  },
});
