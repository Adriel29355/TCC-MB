import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  pharmaStyles,
} from "@/components/pharma-layout";
import { addMedication } from "@/lib/pharmalife";

export default function AdicionarScreen() {
  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [horario, setHorario] = useState("");
  const [frequencia, setFrequencia] = useState("Diario");
  const [observacao, setObservacao] = useState("");

  const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

async function handleSave() {
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
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Nao foi possivel salvar."
    );
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
          style={pharmaStyles.input}
          placeholder="Nome do remedio"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Dosagem (ex: 500mg)"
          value={dosagem}
          onChangeText={setDosagem}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Horario (ex: 08:00)"
          value={horario}
          onChangeText={setHorario}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Frequencia (Diario, 12h, 8h, Semanal)"
          value={frequencia}
          onChangeText={setFrequencia}
        />
        <TextInput
          style={pharmaStyles.input}
          placeholder="Observacao"
          value={observacao}
          onChangeText={setObservacao}
          multiline
        />

        {message ? <Text style={{ color: "#C2410C", fontWeight: "700" }}>{message}</Text> : null}

<Pressable style={pharmaStyles.primaryButton} onPress={handleSave} disabled={loading}>
  <Text style={pharmaStyles.primaryButtonText}>
    {loading ? "Salvando..." : "Salvar medicamento"}
  </Text>
</Pressable>
      </Card>
    </PharmaScreen>
  );
}
