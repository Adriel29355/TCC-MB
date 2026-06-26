import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Card,
  PharmaScreen,
  SectionHeader,
  usePharmaStyles,
} from "@/components/pharma-layout";
import { useAppContext } from "@/contexts/AppContext";
import {
  fetchMedications,
  getStoredReminders,
  Medication,
} from "@/lib/pharmalife";

export default function AgendaScreen() {
<<<<<<< HEAD
  const [medications, setMedications] = useState<Medication[]>([]);
  const reminders = getStoredReminders();
  const ps = usePharmaStyles();
  const { darkMode } = useAppContext();

  useEffect(() => {
    fetchMedications().then(setMedications);
  }, []);

  const timeBoxBg = darkMode ? "#0D2238" : "#EAF6FF";
  const lineBg = darkMode ? "#1E3448" : "#D8ECFF";
  const reminderBorder = darkMode ? "#1E3448" : "#EDF7FF";
  const reminderTitle = darkMode ? "#C8E0F4" : "#14324A";
=======
const [medications, setMedications] = useState<any[]>([]);
const reminders = getStoredReminders();

useEffect(() => {
  loadMedications();
}, []);

async function loadMedications() {
  try {
    const meds = await getStoredMedications();
    setMedications(meds);
  } catch (error) {
    console.error("Erro ao carregar medicamentos:", error);
  }
}
>>>>>>> 1b729ffb9fb37415fe9da23c44b02689415d86ed

  return (
    <PharmaScreen>
      <SectionHeader
        eyebrow="Agenda"
        title="Horarios do tratamento"
        subtitle="Veja o que precisa ser tomado e quais lembretes estao marcados."
      />

      <Card>
        <View style={ps.row}>
          <Text style={ps.cardTitle}>Medicamentos de hoje</Text>
          <Pressable onPress={() => router.push("/adicionar")}>
            <Text style={styles.link}>Novo</Text>
          </Pressable>
        </View>

        {medications.map((medication) => (
          <View key={medication.id} style={styles.timelineItem}>
            <View style={[styles.line, { backgroundColor: lineBg }]} />
            <View style={[styles.timeBox, { backgroundColor: timeBoxBg }]}>
              <Text style={styles.timeText}>
                {medication.agenda?.horario ?? "--:--"}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={ps.cardTitle}>{medication.nome}</Text>
              <Text style={ps.body}>
                {medication.descricao} • {medication.tipo}
              </Text>
              {medication.complemento ? (
                <Text style={ps.small}>{medication.complemento}</Text>
              ) : null}
            </View>
          </View>
        ))}

        {medications.length === 0 && (
          <Text style={ps.body}>Nenhum medicamento cadastrado.</Text>
        )}
      </Card>

      <Card>
        <Text style={ps.cardTitle}>Lembretes importantes</Text>
        {reminders.map((reminder) => (
          <View
            key={reminder.id}
            style={[styles.reminder, { borderTopColor: reminderBorder }]}
          >
            <Text style={styles.timeText}>{reminder.horario}</Text>
            <View style={styles.info}>
              <Text style={[styles.reminderTitle, { color: reminderTitle }]}>
                {reminder.titulo}
              </Text>
              <Text style={ps.small}>
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
    color: "#2F80ED",
    fontWeight: "800",
    textDecorationLine: "none",
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    position: "relative",
    paddingVertical: 4,
  },
  line: {
    position: "absolute",
    top: 0,
    bottom: -10,
    left: 28,
    width: 2,
    backgroundColor: "#D8ECFF",
  },
  timeBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#EAF6FF",
  },
  timeText: {
    color: "#2F80ED",
    fontWeight: "900",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  reminder: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF7FF",
    paddingTop: 12,
  },
  reminderTitle: {
    color: "#14324A",
    fontWeight: "800",
  },
});
