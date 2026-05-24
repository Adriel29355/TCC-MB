import { StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, StatCard, pharmaStyles } from '@/components/pharma-layout';
import { getStoredHistory, getStoredMedications, getStoredUser } from '@/lib/pharmalife';

export default function AdminScreen() {
  const user = getStoredUser();
  const medications = getStoredMedications();
  const history = getStoredHistory();

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Admin"
        title="Painel administrativo"
        subtitle="Resumo inspirado na area administrativa da versao web."
      />

      <View style={styles.stats}>
        <StatCard label="Usuarios" value={1} />
        <StatCard label="Medicamentos" value={medications.length} />
        <StatCard label="Registros" value={history.length} />
      </View>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Usuarios cadastrados</Text>
        <View style={styles.userRow}>
          <Text style={styles.userName}>{user.nome}</Text>
          <Text style={pharmaStyles.small}>{user.email}</Text>
        </View>
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  userRow: {
    borderTopWidth: 1,
    borderTopColor: '#EDF7FF',
    paddingTop: 12,
  },
  userName: {
    color: '#14324A',
    fontWeight: '900',
  },
});
