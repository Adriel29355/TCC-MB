import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./pharmalife";

// Como mostrar a notificação quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleMedicationNotification(
  medication: Medication,
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const horario = medication.agenda?.horario ?? "08:00";
  const [hour, minute] = horario.split(":").map(Number);

  // Cancela notificação anterior desse medicamento se existir
  await cancelMedicationNotification(medication.id);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Hora do medicamento!",
      body: `${medication.nome} — ${medication.descricao}`,
      sound: true,
      data: { medicationId: medication.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  // Salva o id da notificação vinculado ao medicamento
  saveNotificationId(medication.id, id);
  return id;
}

export async function cancelMedicationNotification(
  medicationId: number,
): Promise<void> {
  if (Platform.OS === "web") return;

  const notifId = getNotificationId(medicationId);
  if (notifId) {
    await Notifications.cancelScheduledNotificationAsync(notifId);
    removeNotificationId(medicationId);
  }
}

export async function scheduleAllNotifications(
  medications: Medication[],
): Promise<void> {
  for (const med of medications) {
    await scheduleMedicationNotification(med);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  clearAllNotificationIds();
}

// Armazena os IDs das notificações no localStorage
const NOTIF_KEY = "pharmalife:notif_ids";

function getNotificationIds(): Record<number, string> {
  try {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage?.getItem(NOTIF_KEY)
        : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotificationId(medicationId: number, notifId: string) {
  const ids = getNotificationIds();
  ids[medicationId] = notifId;
  window.localStorage?.setItem(NOTIF_KEY, JSON.stringify(ids));
}

function getNotificationId(medicationId: number): string | null {
  return getNotificationIds()[medicationId] ?? null;
}

function removeNotificationId(medicationId: number) {
  const ids = getNotificationIds();
  delete ids[medicationId];
  window.localStorage?.setItem(NOTIF_KEY, JSON.stringify(ids));
}

function clearAllNotificationIds() {
  window.localStorage?.removeItem(NOTIF_KEY);
}
