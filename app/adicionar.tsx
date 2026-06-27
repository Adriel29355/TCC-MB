import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import { addMedication } from "@/lib/pharmalife";

export default function AdicionarScreen() {
  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [horario, setHorario] = useState("");
  const [frequencia, setFrequencia] = useState("Diario");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      await addMedication({
        nome: nome || "Novo medicamento",
        descricao: dosagem || "1 comprimido",
        horario: horario || "08:00",
        tipo: frequencia || "Diario",
        complemento: observacao || "Sem observacao",
      });
      router.replace("/agenda");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar medicamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Adicionar"
        title="Novo medicamento"
        subtitle="Cadastre nome, dosagem, horario, frequencia e observacoes."
      />

      <Card>
        <TextInput
          style={ps.input}
          placeholder="Nome do remedio"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={ps.input}
          placeholder="Dosagem (ex: 500mg)"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={dosagem}
          onChangeText={setDosagem}
        />
        <TextInput
          style={ps.input}
          placeholder="Horario (ex: 08:00)"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={horario}
          onChangeText={setHorario}
        />
        <TextInput
          style={ps.input}
          placeholder="Frequencia (Diario, 12h, 8h, Semanal)"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={frequencia}
          onChangeText={setFrequencia}
        />
        <TextInput
          style={ps.input}
          placeholder="Observacao"
          placeholderTextColor={darkMode ? "#3D6480" : "#9DBDD8"}
          value={observacao}
          onChangeText={setObservacao}
          multiline
        />

        {error ? (
          <Text
            style={{
              color: darkMode ? "#F87171" : "#C2410C",
              fontWeight: "700",
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          style={ps.primaryButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ps.primaryButtonText}>Salvar medicamento</Text>
          )}
        </Pressable>
      </Card>
    </PharmaScreen>
  );
}
