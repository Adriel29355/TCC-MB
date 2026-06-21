import { router } from "expo-router";
import { useState } from "react";
import {
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
  pharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/pharmalife";

export default function ConfiguracoesScreen() {
  const user = getStoredUser();
  const [nome, setNome] = useState(user.nome);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [message, setMessage] = useState("");
  const { darkMode, largeText, toggleDarkMode, toggleLargeText } =
    useAppContext();

  function handleSave() {
    setStoredUser({ ...user, nome, senha: novaSenha || user.senha });
    setMessage("Perfil atualizado.");
  }

  function handleLogout() {
    clearStoredUser();
    router.replace("/login");
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Configuracoes"
        title="Perfil e preferencias"
        subtitle="Edite dados da conta e ajuste recursos de acessibilidade."
      />

      <Card>
        <Text style={pharmaStyles.cardTitle}>Editar nome e senha</Text>
        <TextInput
          style={pharmaStyles.input}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Senha atual"
          secureTextEntry
          value={senhaAtual}
          onChangeText={setSenhaAtual}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Nova senha"
          secureTextEntry
          value={novaSenha}
          onChangeText={setNovaSenha}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={pharmaStyles.primaryButton} onPress={handleSave}>
          <Text style={pharmaStyles.primaryButtonText}>Atualizar perfil</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Acessibilidade</Text>

        <View style={styles.optionRow}>
          <View>
            <Text style={styles.optionTitle}>Modo escuro</Text>
            <Text style={pharmaStyles.small}>
              Fundo escuro para melhor leitura
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: "#D8ECFF", true: "#2F80ED" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.optionRow}>
          <View>
            <Text style={styles.optionTitle}>Letras grandes</Text>
            <Text style={pharmaStyles.small}>Aumenta o tamanho do texto</Text>
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
        <Text style={pharmaStyles.cardTitle}>Conta</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.link}>Sair da conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  message: {
    color: "#12805C",
    fontWeight: "800",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  optionTitle: {
    color: "#14324A",
    fontWeight: "800",
    marginBottom: 2,
  },
  link: {
    color: "#2F80ED",
    fontWeight: "800",
  },
});
