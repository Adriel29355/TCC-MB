import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { getStoredMedications, getStoredReminders } from '@/lib/pharmalife';

export default function AgendaScreen() {
  const medications = getStoredMedications();
  const reminders = getStoredReminders();

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Agenda"
        title="Horarios do tratamento"
        subtitle="Veja o que precisa ser tomado e quais lembretes estao marcados."
      />

      <Card>
        <View style={pharmaStyles.row}>
          <Text style={pharmaStyles.cardTitle}>Medicamentos de hoje</Text>
          <Pressable onPress={() => router.push('/adicionar')}>
            <Text style={styles.link}>Novo</Text>
          </Pressable>
        </View>

        {medications.map((medication) => (
          <View key={medication.id} style={styles.timelineItem}>
            <View style={styles.line} />
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>{medication.agenda?.horario ?? '--:--'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={pharmaStyles.cardTitle}>{medication.nome}</Text>
              <Text style={pharmaStyles.body}>
                {medication.descricao} • {medication.tipo}
              </Text>
              {medication.complemento ? <Text style={pharmaStyles.small}>{medication.complemento}</Text> : null}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={pharmaStyles.cardTitle}>Lembretes importantes</Text>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminder}>
            <Text style={styles.timeText}>{reminder.horario}</Text>
            <View style={styles.info}>
              <Text style={styles.reminderTitle}>{reminder.titulo}</Text>
              <Text style={pharmaStyles.small}>
                {reminder.data} • {reminder.descricao}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    color: '#2F80ED',
    fontWeight: '800',
    textDecorationLine: 'none',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    paddingVertical: 4,
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: -10,
    left: 28,
    width: 2,
    backgroundColor: '#D8ECFF',
  },
  timeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EAF6FF',
  },
  timeText: {
    color: '#2F80ED',
    fontWeight: '900',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  reminder: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF7FF',
    paddingTop: 12,
  },
  reminderTitle: {
    color: '#14324A',
    fontWeight: '800',
  },
});
