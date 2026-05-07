import { StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';

const team = [
  { nome: 'Maycon', papel: 'Programador' },
  { nome: 'Adriel', papel: 'Documentacao' },
  { nome: 'Felipe', papel: 'Design' },
  { nome: 'Caio', papel: 'Documentacao' },
  { nome: 'Murilo', papel: 'Gerente' },
];

export default function SobreScreen() {
  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Sobre"
        title="Sobre o PharmaLife"
        subtitle="Projeto de TCC para ajudar pessoas a controlarem medicamentos e melhorarem a adesao ao tratamento."
      />

      <Card>
        <Text style={pharmaStyles.cardTitle}>Objetivo</Text>
        <Text style={pharmaStyles.body}>
          O PharmaLife organiza agenda, lembretes, historico e informacoes de medicamentos em uma interface leve,
          acessivel e facil de consultar.
        </Text>
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Equipe</Text>
        <View style={styles.teamGrid}>
          {team.map((member) => (
            <View key={member.nome} style={styles.member}>
              <Text style={styles.avatar}>{member.nome.slice(0, 1)}</Text>
              <Text style={styles.memberName}>{member.nome}</Text>
              <Text style={pharmaStyles.small}>{member.papel}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Tecnologias</Text>
        <Text style={pharmaStyles.body}>React Native, Expo Router, Spring Boot, SQL Server e API REST.</Text>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  member: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#D8ECFF',
    borderRadius: 8,
    backgroundColor: '#F8FCFF',
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EAF6FF',
    color: '#2F80ED',
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
  },
  memberName: {
    marginTop: 8,
    color: '#14324A',
    fontWeight: '900',
  },
});

