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
  usePharmaStyles,
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
  const ps = usePharmaStyles();

  const optionTitleColor = darkMode ? "#C8E0F4" : "#14324A";
  const messageColor = darkMode ? "#34D399" : "#12805C";

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
        <Text style={ps.cardTitle}>Editar nome e senha</Text>
        <TextInput
          style={ps.input}
          placeholder="Nome"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={ps.input}
          placeholder="Senha atual"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          secureTextEntry
          value={senhaAtual}
          onChangeText={setSenhaAtual}
        />
        <TextInput
          style={ps.input}
          placeholder="Nova senha"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          secureTextEntry
          value={novaSenha}
          onChangeText={setNovaSenha}
        />
        {message ? (
          <Text style={[styles.message, { color: messageColor }]}>
            {message}
          </Text>
        ) : null}
        <Pressable style={ps.primaryButton} onPress={handleSave}>
          <Text style={ps.primaryButtonText}>Atualizar perfil</Text>
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
        <Text style={ps.cardTitle}>Conta</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.link}>Sair da conta</Text>
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  message: {
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
    fontWeight: "800",
    marginBottom: 2,
  },
  link: {
    color: "#2F80ED",
    fontWeight: "800",
  },
});
