import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, StatCard, pharmaStyles } from '@/components/pharma-layout';
import {
  adherencePercent,
  getStoredHistory,
  getStoredMedications,
  getStoredReminders,
  getStoredUser,
  isUserAuthenticated,
  markMedicationAsTaken,
  Medication,
} from '@/lib/pharmalife';

export default function HomeScreen() {
  const [medications, setMedications] = useState(() => getStoredMedications());
  const [history, setHistory] = useState(() => getStoredHistory());
  const reminders = useMemo(() => getStoredReminders(), []);
  const user = getStoredUser();
  const confirmed = history.filter((item) => item.status === 'CONFIRMADO').length;
  const pending = Math.max(0, medications.length - confirmed);
  const adherence = adherencePercent(medications, history);

  function handleTaken(medication: Medication) {
    const entry = markMedicationAsTaken(medication);
    setHistory([entry, ...history]);
    setMedications([...medications]);
  }

  if (!isUserAuthenticated()) {
    return <Redirect href="/login" />;
  }

  return (
    <PharmaScreen>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.brandBadge}>PharmaLife</Text>
          <Text style={styles.heroTitle}>Cuidado com seus remedios, sem complicacao.</Text>
          <Text style={styles.heroSubtitle}>
            Agenda, lembretes e historico em uma experiencia leve para acompanhar sua rotina.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={pharmaStyles.primaryButton} onPress={() => router.push('/adicionar')}>
              <Text style={pharmaStyles.primaryButtonText}>Adicionar remedio</Text>
            </Pressable>
            <Pressable style={pharmaStyles.secondaryButton} onPress={() => router.push('/agenda')}>
              <Text style={pharmaStyles.secondaryButtonText}>Ver agenda</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroPanel}>
          <Ionicons name="medical-outline" size={32} color="#2F80ED" />
          <Text style={styles.panelTitle}>Ola, {user.nome}</Text>
          <Text style={styles.panelText}>Proximo horario: {medications[0]?.agenda?.horario ?? '08:00'}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard label="Tomados" value={confirmed} />
        <StatCard label="Pendentes" value={pending} />
        <StatCard label="Adesao" value={`${adherence}%`} />
      </View>

      <Card>
        <View style={pharmaStyles.row}>
          <Text style={pharmaStyles.cardTitle}>Proximos medicamentos</Text>
          <Pressable onPress={() => router.push('/adicionar')}>
            <Text style={styles.link}>Adicionar</Text>
          </Pressable>
        </View>

        <View style={pharmaStyles.list}>
          {medications.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.medicationItem}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{medication.agenda?.horario ?? '--:--'}</Text>
              </View>
              <View style={styles.medicationInfo}>
                <Text style={styles.itemTitle}>{medication.nome}</Text>
                <Text style={pharmaStyles.body}>
                  {medication.descricao} | {medication.tipo}
                </Text>
              </View>
              <Pressable style={styles.checkButton} onPress={() => handleTaken(medication)}>
                <Text style={styles.checkText}>OK</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.twoColumns}>
        <Card>
          <View style={pharmaStyles.row}>
            <Text style={pharmaStyles.cardTitle}>Historico recente</Text>
            <Pressable onPress={() => router.push('/historico')}>
              <Text style={styles.link}>Ver tudo</Text>
            </Pressable>
          </View>
          {history.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.compactItem}>
              <Text style={styles.statusDot}>{item.status === 'CONFIRMADO' ? 'C' : 'P'}</Text>
              <View>
                <Text style={styles.itemTitle}>{item.nome}</Text>
                <Text style={pharmaStyles.small}>
                  {item.dosagem} as {item.horario}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <View style={pharmaStyles.row}>
            <Text style={pharmaStyles.cardTitle}>Lembretes</Text>
            <Pressable onPress={() => router.push('/agenda')}>
              <Text style={styles.link}>Agenda</Text>
            </Pressable>
          </View>
          {reminders.slice(0, 2).map((reminder) => (
            <View key={reminder.id} style={styles.compactItem}>
              <Text style={styles.reminderDate}>{reminder.horario}</Text>
              <View>
                <Text style={styles.itemTitle}>{reminder.titulo}</Text>
                <Text style={pharmaStyles.small}>{reminder.descricao}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderWidth: 1,
    borderColor: '#D8ECFF',
    borderRadius: 8,
    backgroundColor: '#EAF6FF',
    padding: 20,
    marginTop: 18,
  },
  heroCopy: {
    flex: 1,
    minWidth: 260,
    gap: 12,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2F80ED',
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#14324A',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  heroSubtitle: {
    maxWidth: 520,
    color: '#4E7393',
    fontSize: 16,
    lineHeight: 23,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  heroPanel: {
    width: 230,
    minHeight: 150,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8ECFF',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
    padding: 18,
  },
  panelTitle: {
    color: '#14324A',
    fontSize: 20,
    fontWeight: '900',
  },
  panelText: {
    color: '#5F7F9B',
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  link: {
    color: '#2F80ED',
    fontWeight: '800',
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  medicationInfo: {
    flex: 1,
  },
  itemTitle: {
    color: '#14324A',
    fontWeight: '800',
  },
  checkButton: {
    borderRadius: 8,
    backgroundColor: '#DDF8EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkText: {
    color: '#12805C',
    fontWeight: '900',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DDF8EA',
    color: '#12805C',
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
  reminderDate: {
    color: '#2F80ED',
    fontWeight: '900',
  },
});
