import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import type { Medication } from "./pharmalife";

const MEDICATION_CHANNEL_ID = "medication-reminders-v3";
const BRAND_BLUE = "#2F80ED";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
}

async function configureAndroidChannelAsync() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(MEDICATION_CHANNEL_ID, {
    name: "Lembretes de medicamentos",
    description: "Avisos dos horarios cadastrados para os medicamentos.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    enableLights: true,
    lightColor: BRAND_BLUE,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    showBadge: true,
  });
}

async function ensureNotificationPermissionAsync() {
  if (Platform.OS === "web") return false;

  await configureAndroidChannelAsync();

  const currentPermission = await Notifications.getPermissionsAsync();
  if (currentPermission.status === "granted") return true;

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.status === "granted";
}

export async function initializeNotificationsAsync() {
  try {
    return await ensureNotificationPermissionAsync();
  } catch {
    return false;
  }
}

export async function getNotificationPermissionAsync() {
  if (Platform.OS === "web") return "unsupported" as const;
  try {
    const permission = await Notifications.getPermissionsAsync();
    return permission.status;
  } catch {
    return "undetermined" as const;
  }
}

export async function openNotificationSettingsAsync() {
  if (Platform.OS === "web") return;
  await Linking.openSettings();
}

function parseMedicationTime(horario?: string) {
  const match = horario?.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function normalizeFrequency(tipo: string) {
  const normalized = tipo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "")
    .toLowerCase();

  if (normalized === "8h" || normalized.includes("8em8")) return "8h";
  if (normalized === "12h" || normalized.includes("12em12")) return "12h";
  if (normalized.startsWith("seman")) return "weekly";
  return "daily";
}

function addMinutes(time: { hour: number; minute: number }, minutes: number) {
  const totalMinutes = (time.hour * 60 + time.minute + minutes) % (24 * 60);
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

function weekdayFromLocalDate(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date().getDay() + 1;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime())
    ? new Date().getDay() + 1
    : date.getDay() + 1;
}

function medicationNotificationContent(
  medication: Medication,
  occurrence: number,
) {
  const dosage = medication.descricao.trim();

  return {
    title: `Hora de tomar ${medication.nome}`,
    subtitle: "PharmaLife",
    body: dosage ? `Dosagem: ${dosage}` : "Confira a dosagem cadastrada.",
    sound: "default" as const,
    color: BRAND_BLUE,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    data: {
      kind: "medication-reminder",
      medicationId: medication.id,
      occurrence,
    },
  };
}

export async function scheduleMedicationNotification(medication: Medication) {
  try {
    const time = parseMedicationTime(medication.agenda?.horario);
    if (!time || !(await ensureNotificationPermissionAsync())) return null;

    // Remove a recorrencia anterior antes de reconstruir todos os horarios.
    await cancelMedicationNotification(medication.id);

    const channelId =
      Platform.OS === "android" ? MEDICATION_CHANNEL_ID : undefined;
    const frequency = normalizeFrequency(medication.tipo);

    if (frequency === "weekly") {
      const weekday = weekdayFromLocalDate(medication.agenda?.dataInicio);

      return await Promise.all([
        Notifications.scheduleNotificationAsync({
          content: medicationNotificationContent(medication, 0),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId,
            weekday,
            ...time,
          },
        }),
      ]);
    }

    const intervalHours = frequency === "8h" ? 8 : frequency === "12h" ? 12 : 24;
    const occurrences = 24 / intervalHours;
    const times = Array.from({ length: occurrences }, (_, index) =>
      addMinutes(time, index * intervalHours * 60),
    );

    return await Promise.all(
      times.map((scheduledTime, occurrence) =>
        Notifications.scheduleNotificationAsync({
          content: medicationNotificationContent(medication, occurrence),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId,
            ...scheduledTime,
          },
        }),
      ),
    );
  } catch {
    return null;
  }
}

export async function cancelMedicationNotification(medicationId: number) {
  if (Platform.OS === "web") return;

  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    const medicationNotifications = scheduledNotifications.filter(
      (notification) =>
        Number(notification.content.data?.medicationId) === medicationId,
    );

    await Promise.all(
      medicationNotifications.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        ),
      ),
    );
  } catch {}
}

export async function clearMedicationNotificationsAsync() {
  if (Platform.OS === "web") return;
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const medicationNotifications = scheduledNotifications.filter(
      (notification) =>
        notification.content.data?.kind === "medication-reminder",
    );
    await Promise.all(
      medicationNotifications.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        ),
      ),
    );
  } catch {}
}

export async function syncMedicationNotifications(
  medications: Medication[],
) {
  if (Platform.OS === "web") return;

  try {
    if (!(await ensureNotificationPermissionAsync())) return;

    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const medicationNotifications = scheduledNotifications.filter(
      (notification) => notification.content.data?.medicationId != null,
    );

    await Promise.all(
      medicationNotifications.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        ),
      ),
    );

    await Promise.all(
      medications.map((medication) =>
        scheduleMedicationNotification(medication),
      ),
    );
  } catch {}
}
