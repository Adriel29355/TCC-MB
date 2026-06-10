import { StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';

const steps = [
  {
    title: '1. Cadastre seus remedios',
    text: 'Use a tela Adicionar para informar nome, dosagem, horario e frequencia.',
  },
  {
    title: '2. Acompanhe a agenda',
    text: 'Veja os horarios do dia e mantenha uma rotina simples para o tratamento.',
  },
  {
    title: '3. Marque como tomado',
    text: 'No inicio, toque em OK quando tomar um medicamento. O historico sera salvo automaticamente.',
  },
  {
    title: '4. Use letras grandes',
    text: 'Em Configuracoes, ative o modo de leitura maior quando precisar.',
  },
];

export default function AjudaScreen() {
  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Ajuda"
        title="Como usar melhor"
        subtitle="Guia simples inspirado na versao web, com foco em idosos e rotina diaria."
      />

      {steps.map((step) => (
        <Card key={step.title}>
          <Text style={pharmaStyles.cardTitle}>{step.title}</Text>
          <Text style={pharmaStyles.body}>{step.text}</Text>
        </Card>
      ))}

      <Card>
        <Text style={pharmaStyles.cardTitle}>Em caso de emergencia</Text>
        <Text style={pharmaStyles.body}>
          Se sentir mal apos tomar algum remedio, procure ajuda medica imediatamente.
        </Text>
        <View style={styles.emergencyGrid}>
          <View style={styles.emergencyItem}>
            <Text style={styles.number}>192</Text>
            <Text style={styles.label}>SAMU</Text>
          </View>
        </View>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  emergencyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  emergencyItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#EAF6FF',
    padding: 12,
  },
  number: {
    color: '#2F80ED',
    fontSize: 20,
    fontWeight: '900',
  },
  label: {
    color: '#5F7F9B',
    fontWeight: '800',
  },
});

