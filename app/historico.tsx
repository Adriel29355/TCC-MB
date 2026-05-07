import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PharmaScreen, SectionHeader, pharmaStyles } from '@/components/pharma-layout';
import { getStoredHistory, HistoryItem, setStoredHistory } from '@/lib/pharmalife';

function nextStatus(status: HistoryItem['status']) {
  if (status === 'PENDENTE') {
    return 'CONFIRMADO';
  }

  if (status === 'CONFIRMADO') {
    return 'IGNORADO';
  }

  return 'PENDENTE';
}

export default function HistoricoScreen() {
  const [history, setHistory] = useState(() => getStoredHistory());

  function toggleStatus(id: number) {
    const updated: HistoryItem[] = history.map((item) =>
      item.id === id ? { ...item, status: nextStatus(item.status) } : item
    );
    setStoredHistory(updated);
    setHistory(updated);
  }

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Historico"
        title="Uso dos medicamentos"
        subtitle="Confirme, ignore ou acompanhe registros pendentes do tratamento."
      />

      <View style={styles.filters}>
        <Text style={pharmaStyles.pill}>Confirmados: {history.filter((item) => item.status === 'CONFIRMADO').length}</Text>
        <Text style={pharmaStyles.pill}>Pendentes: {history.filter((item) => item.status === 'PENDENTE').length}</Text>
      </View>

      {history.map((item) => (
        <Card key={item.id}>
          <View style={pharmaStyles.row}>
            <View>
              <Text style={pharmaStyles.cardTitle}>{item.nome}</Text>
              <Text style={pharmaStyles.body}>
                {item.dosagem} as {item.horario}
              </Text>
            </View>
            <Text style={[styles.status, styles[item.status.toLowerCase() as 'pendente' | 'confirmado' | 'ignorado']]}>
              {item.status}
            </Text>
          </View>

          {item.observacoes ? <Text style={pharmaStyles.small}>{item.observacoes}</Text> : null}

          <Pressable style={pharmaStyles.secondaryButton} onPress={() => toggleStatus(item.id)}>
            <Text style={pharmaStyles.secondaryButtonText}>Alterar status</Text>
          </Pressable>
        </Card>
      ))}
    </PharmaScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  status: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  pendente: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  confirmado: {
    backgroundColor: '#DDF8EA',
    color: '#12805C',
  },
  ignorado: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
});
