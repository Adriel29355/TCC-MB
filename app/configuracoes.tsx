import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Switch,
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
import { PasswordInput } from "@/components/password-input";
import {
  COMORBIDITY_OPTIONS,
  formatComorbidities,
  NO_COMORBIDITIES,
  OTHER_COMORBIDITY,
  parseComorbidities,
} from "@/constants/comorbidities";
import { useAppContext } from "@/contexts/AppContext";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  clearMedicationNotificationsAsync,
  getNotificationPermissionAsync,
  openNotificationSettingsAsync,
} from "@/lib/notifications";
import {
  clearStoredUser,
  deleteAccount,
  getCurrentUser,
  updateHealthProfile,
  updateProfile,
} from "@/lib/pharmalife";
import {
  FIELD_LIMITS,
  birthDateToIso,
  hasValidationErrors,
  validateBirthDate,
  validateHealthCondition,
  validateLoginPassword,
  validateNewPassword,
  validatePersonName,
} from "@/lib/validation";

function formatStoredBirthDate(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export default function ConfiguracoesScreen() {
  const user = getCurrentUser();
  const [nome, setNome] = useState(() => user?.nome ?? "");
  const [dataNascimento, setDataNascimento] = useState(() =>
    formatStoredBirthDate(user?.dataNascimento),
  );
  const [selectedComorbidities, setSelectedComorbidities] = useState<string[]>(
    () => parseComorbidities(user?.comorbidade).selected,
  );
  const [otherComorbidity, setOtherComorbidity] = useState(
    () => parseComorbidities(user?.comorbidade).other,
  );
  const [healthErrors, setHealthErrors] = useState({
    dataNascimento: "",
    comorbidade: "",
  });
  const [healthMessage, setHealthMessage] = useState("");
  const [healthError, setHealthError] = useState("");
  const [healthLoading, setHealthLoading] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    nome: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    "granted" | "denied" | "undetermined" | "unsupported"
  >("undetermined");
  const { darkMode, largeText, toggleDarkMode, toggleLargeText } =
    useAppContext();
  const ps = usePharmaStyles();

  const optionTitleColor = darkMode ? "#C8E0F4" : "#14324A";
  const successColor = darkMode ? "#34D399" : "#12805C";
  const errorColor = darkMode ? "#F87171" : "#DC2626";

  useEffect(() => {
    const refreshPermission = () => {
      getNotificationPermissionAsync().then(setNotificationPermission);
    };
    refreshPermission();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPermission();
    });
    return () => subscription.remove();
  }, []);

  async function handleSave() {
    setMessage("");
    setError("");
    const nextErrors = {
      nome: validatePersonName(nome),
      senhaAtual: validateLoginPassword(senhaAtual),
      novaSenha: novaSenha ? validateNewPassword(novaSenha) : "",
      confirmarNovaSenha: novaSenha
        ? confirmarNovaSenha === novaSenha
          ? ""
          : "As novas senhas precisam ser iguais."
        : confirmarNovaSenha
          ? "Preencha primeiro a nova senha."
          : "",
    };
    setFieldErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    setLoading(true);
    try {
      const msg = await updateProfile(nome, senhaAtual, novaSenha);
      setMessage(msg || "Perfil atualizado com sucesso.");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
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
    setHealthErrors((current) => ({ ...current, comorbidade: "" }));
  }

  async function handleSaveHealthProfile() {
    setHealthMessage("");
    setHealthError("");
    const comorbidade = getComorbidityValue();
    const nextErrors = {
      dataNascimento: validateBirthDate(dataNascimento),
      comorbidade: validateHealthCondition(comorbidade),
    };
    setHealthErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    const isoBirthDate = birthDateToIso(dataNascimento);
    if (!isoBirthDate) return;

    setHealthLoading(true);
    try {
      await updateHealthProfile(isoBirthDate, comorbidade);
      setHealthMessage("Dados de saude atualizados com sucesso.");
    } catch (healthUpdateError) {
      setHealthError(
        healthUpdateError instanceof Error
          ? healthUpdateError.message
          : "Erro ao atualizar os dados de saude.",
      );
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleLogout() {
    setError("");
    try {
      await clearStoredUser();
      await clearMedicationNotificationsAsync();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Nao foi possivel sair da conta.",
      );
    }
  }

  function handleDeleteAccount() {
    setDeleteError("");
    const passwordError = validateLoginPassword(deletePassword);
    if (passwordError) {
      setDeleteError(passwordError);
      return;
    }

    confirmDialog(
      "Excluir conta permanentemente",
      "Esta acao apaga sua conta, agendas, medicamentos e historico. Ela nao pode ser desfeita.",
      async () => {
        setDeletingAccount(true);
        try {
          await deleteAccount(deletePassword);
          await clearMedicationNotificationsAsync();
          await clearStoredUser();
        } catch (deleteErrorValue) {
          setDeleteError(
            deleteErrorValue instanceof Error
              ? deleteErrorValue.message
              : "Nao foi possivel excluir a conta.",
          );
        } finally {
          setDeletingAccount(false);
        }
      },
    );
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Configuracoes"
        title="Perfil e preferencias"
        subtitle="Edite dados da conta e ajuste recursos de acessibilidade."
      />

      <Card>
        <Text style={ps.cardTitle}>Editar nome e senha</Text>
        <TextInput
          style={[ps.input, fieldErrors.nome && INVALID_INPUT_STYLE]}
          placeholder="Nome"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={nome}
          onChangeText={(value) => {
            setNome(value);
            if (fieldErrors.nome) {
              setFieldErrors((current) => ({
                ...current,
                nome: validatePersonName(value),
              }));
            }
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              nome: validatePersonName(nome),
            }))
          }
          maxLength={FIELD_LIMITS.personName}
        />
        <FieldError message={fieldErrors.nome} />
        <PasswordInput
          style={[ps.input, fieldErrors.senhaAtual && INVALID_INPUT_STYLE]}
          placeholder="Senha atual"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          autoComplete="password"
          maxLength={FIELD_LIMITS.password}
          value={senhaAtual}
          onChangeText={(value) => {
            setSenhaAtual(value);
            if (fieldErrors.senhaAtual) {
              setFieldErrors((current) => ({
                ...current,
                senhaAtual: validateLoginPassword(value),
              }));
            }
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              senhaAtual: validateLoginPassword(senhaAtual),
            }))
          }
        />
        <FieldError message={fieldErrors.senhaAtual} />
        <PasswordInput
          style={[ps.input, fieldErrors.novaSenha && INVALID_INPUT_STYLE]}
          placeholder="Nova senha (opcional)"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          autoComplete="password-new"
          maxLength={FIELD_LIMITS.password}
          value={novaSenha}
          onChangeText={(value) => {
            setNovaSenha(value);
            if (fieldErrors.novaSenha) {
              setFieldErrors((current) => ({
                ...current,
                novaSenha: value ? validateNewPassword(value) : "",
              }));
            }
          }}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              novaSenha: novaSenha ? validateNewPassword(novaSenha) : "",
            }))
          }
        />
        <FieldError message={fieldErrors.novaSenha} />
        <PasswordInput
          style={[
            ps.input,
            fieldErrors.confirmarNovaSenha && INVALID_INPUT_STYLE,
          ]}
          placeholder="Confirmar nova senha"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          autoComplete="password-new"
          maxLength={FIELD_LIMITS.password}
          value={confirmarNovaSenha}
          onChangeText={setConfirmarNovaSenha}
          onBlur={() =>
            setFieldErrors((current) => ({
              ...current,
              confirmarNovaSenha: novaSenha
                ? confirmarNovaSenha === novaSenha
                  ? ""
                  : "As novas senhas precisam ser iguais."
                : confirmarNovaSenha
                  ? "Preencha primeiro a nova senha."
                  : "",
            }))
          }
        />
        <FieldError message={fieldErrors.confirmarNovaSenha} />
        <Text style={ps.small}>
          A nova senha e opcional. Se alterar, use de 12 a 72 caracteres, com
          pelo menos uma letra e um numero.
        </Text>

        {message ? (
          <Text style={[styles.feedback, { color: successColor }]}>
            {message}
          </Text>
        ) : null}
        {error ? (
          <Text style={[styles.feedback, { color: errorColor }]}>{error}</Text>
        ) : null}

        <Pressable
          style={ps.primaryButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ps.primaryButtonText}>Atualizar perfil</Text>
          )}
        </Pressable>
      </Card>

      <Card>
        <Text style={ps.cardTitle}>Dados de saude</Text>
        <Text style={ps.small}>
          Atualize sua data de nascimento e as comorbidades do seu perfil.
        </Text>

        <TextInput
          accessibilityLabel="Data de nascimento"
          style={[
            ps.input,
            healthErrors.dataNascimento && INVALID_INPUT_STYLE,
          ]}
          placeholder="Data de nascimento (DD/MM/AAAA)"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
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
            if (healthErrors.dataNascimento) {
              setHealthErrors((current) => ({
                ...current,
                dataNascimento: validateBirthDate(formatted),
              }));
            }
          }}
          onBlur={() =>
            setHealthErrors((current) => ({
              ...current,
              dataNascimento: validateBirthDate(dataNascimento),
            }))
          }
        />
        <FieldError message={healthErrors.dataNascimento} />

        <View style={styles.comorbiditySection}>
          <Text style={[styles.fieldTitle, { color: optionTitleColor }]}>
            Comorbidades
          </Text>
          <Text style={ps.small}>
            Selecione quantas opcoes quiser. Esse dado e opcional.
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
            style={[
              ps.input,
              healthErrors.comorbidade && INVALID_INPUT_STYLE,
            ]}
            placeholder="Ou descreva outra opcao"
            placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
            selectionColor="#2F80ED"
            editable={!selectedComorbidities.includes(NO_COMORBIDITIES)}
            maxLength={FIELD_LIMITS.healthCondition}
            value={otherComorbidity}
            onChangeText={(value) => {
              setOtherComorbidity(value);
              if (
                value &&
                !selectedComorbidities.includes(OTHER_COMORBIDITY)
              ) {
                setSelectedComorbidities((current) => [
                  ...current.filter((item) => item !== NO_COMORBIDITIES),
                  OTHER_COMORBIDITY,
                ]);
              }
              if (healthErrors.comorbidade) {
                const selected = selectedComorbidities.filter(
                  (option) =>
                    option !== OTHER_COMORBIDITY &&
                    option !== NO_COMORBIDITIES,
                );
                setHealthErrors((current) => ({
                  ...current,
                  comorbidade: validateHealthCondition(
                    [...selected, value.trim()].filter(Boolean).join(", "),
                  ),
                }));
              }
            }}
            onBlur={() =>
              setHealthErrors((current) => ({
                ...current,
                comorbidade: validateHealthCondition(getComorbidityValue()),
              }))
            }
          />
        </View>
        <FieldError message={healthErrors.comorbidade} />

        {healthMessage ? (
          <Text style={[styles.feedback, { color: successColor }]}>
            {healthMessage}
          </Text>
        ) : null}
        {healthError ? (
          <Text style={[styles.feedback, { color: errorColor }]}>
            {healthError}
          </Text>
        ) : null}

        <Pressable
          style={ps.primaryButton}
          onPress={handleSaveHealthProfile}
          disabled={healthLoading}
        >
          {healthLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ps.primaryButtonText}>Salvar dados de saude</Text>
          )}
        </Pressable>
      </Card>

      <Card>
        <Text style={ps.cardTitle}>Acessibilidade</Text>

        <View style={styles.optionRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: optionTitleColor }]}>
              Modo escuro
            </Text>
            <Text style={ps.small}>Fundo escuro para melhor leitura</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#D8ECFF", true: "#2F80ED" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: optionTitleColor }]}>
              Letras grandes
            </Text>
            <Text style={ps.small}>Aumenta o tamanho do texto</Text>
          </View>
          <Switch
            value={largeText}
            onValueChange={toggleLargeText}
            trackColor={{ false: "#D8ECFF", true: "#2F80ED" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationCopy}>
            <Text style={ps.cardTitle}>Notificacoes</Text>
            <Text style={ps.small}>Lembretes de medicamentos</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  notificationPermission === "granted"
                    ? darkMode
                      ? "#0A2A1A"
                      : "#DDF8EA"
                    : darkMode
                      ? "#2A0A0A"
                      : "#FEE2E2",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    notificationPermission === "granted"
                      ? successColor
                      : errorColor,
                },
              ]}
            >
              {notificationPermission === "granted" ? "Ativas" : "Desativadas"}
            </Text>
          </View>
        </View>
        <Pressable
          style={ps.secondaryButton}
          onPress={openNotificationSettingsAsync}
        >
          <Text style={ps.secondaryButtonText}>Ajustar no aparelho</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={ps.cardTitle}>Conta</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.link}>Sair da conta</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.dangerHeading}>
          <View style={styles.dangerIcon}>
            <Text style={styles.dangerIconText}>!</Text>
          </View>
          <View style={styles.dangerCopy}>
            <Text style={styles.dangerTitle}>Excluir conta</Text>
            <Text style={ps.small}>
              Remove permanentemente seus medicamentos, agendas e historico.
            </Text>
          </View>
        </View>
        <PasswordInput
          style={[ps.input, deleteError && INVALID_INPUT_STYLE]}
          placeholder="Digite sua senha atual para excluir"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          autoComplete="password"
          maxLength={FIELD_LIMITS.password}
          value={deletePassword}
          onChangeText={(value) => {
            setDeletePassword(value);
            if (deleteError) setDeleteError(validateLoginPassword(value));
          }}
        />
        <FieldError message={deleteError} />
        <Pressable
          accessibilityRole="button"
          style={[
            styles.deleteAccountButton,
            deletingAccount && styles.disabledButton,
          ]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteAccountButtonText}>
              Excluir minha conta
            </Text>
          )}
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  feedback: {
    fontWeight: "700",
    fontSize: 14,
  },
  comorbiditySection: {
    gap: 10,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: "800",
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  optionTitle: {
    fontWeight: "800",
    marginBottom: 2,
  },
  link: {
    color: "#2F80ED",
    fontWeight: "800",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationCopy: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  dangerHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dangerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  dangerIconText: {
    color: "#DC2626",
    fontSize: 20,
    fontWeight: "900",
  },
  dangerCopy: {
    flex: 1,
    gap: 2,
  },
  dangerTitle: {
    color: "#DC2626",
    fontSize: 18,
    fontWeight: "900",
  },
  deleteAccountButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteAccountButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.65,
  },
});
