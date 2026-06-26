import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";

const steps = [
  {
    title: "1. Cadastre seus remedios",
    text: "Use a tela Adicionar para informar nome, dosagem, horario e frequencia.",
  },
  {
    title: "2. Acompanhe a agenda",
    text: "Veja os horarios do dia e mantenha uma rotina simples para o tratamento.",
  },
  {
    title: "3. Marque como tomado",
    text: "No inicio, toque em OK quando tomar um medicamento. O historico sera salvo automaticamente.",
  },
  {
    title: "4. Use letras grandes",
    text: "Em Configuracoes, ative o modo de leitura maior quando precisar.",
  },
];

export default function AjudaScreen() {
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  const emergencyBg = darkMode ? "#0D2238" : "#EAF6FF";
  const labelColor = darkMode ? "#7FA8C8" : "#5F7F9B";

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Ajuda"
        title="Como usar melhor"
        subtitle="Guia simples inspirado na versao web, com foco em idosos e rotina diaria."
      />

      {steps.map((step) => (
        <Card key={step.title}>
          <Text style={ps.cardTitle}>{step.title}</Text>
          <Text style={ps.body}>{step.text}</Text>
        </Card>
      ))}

      <Card>
        <Text style={ps.cardTitle}>Em caso de emergencia</Text>
        <Text style={ps.body}>
          Se sentir mal apos tomar algum remedio, procure ajuda medica
          imediatamente.
        </Text>
        <View style={styles.emergencyGrid}>
          <View
            style={[styles.emergencyItem, { backgroundColor: emergencyBg }]}
          >
            <Text style={styles.number}>192</Text>
            <Text style={[styles.label, { color: labelColor }]}>SAMU</Text>
          </View>
        </View>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  emergencyGrid: {
    flexDirection: "row",
    gap: 10,
  },
  emergencyItem: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
  },
  number: {
    color: "#2F80ED",
    fontSize: 20,
    fontWeight: "900",
  },
  label: {
    fontWeight: "800",
  },
});
