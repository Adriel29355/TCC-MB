import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import type { Medication } from "./pharmalife";

const MEDICATION_CHANNEL_ID = "medication-reminders-v3";
const BRAND_BLUE = "#2F80ED";
const SCHEDULING_HORIZON_DAYS = 30;
const MAX_NOTIFICATIONS_PER_MEDICATION = 100;

function reportNotificationError(operation: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[notifications] ${operation} falhou`, error);
  }
}

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
  } catch (error) {
    reportNotificationError("inicializacao", error);
    return false;
  }
}

export async function getNotificationPermissionAsync() {
  if (Platform.OS === "web") return "unsupported" as const;
  try {
    const permission = await Notifications.getPermissionsAsync();
    return permission.status;
  } catch (error) {
    reportNotificationError("consulta de permissao", error);
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

function parseLocalDate(value?: string) {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] ?? 0),
    Number(match[5] ?? 0),
    Number(match[6] ?? 0),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function notificationDates(
  medication: Medication,
  time: { hour: number; minute: number },
) {
  const now = new Date();
  const horizonEnd = new Date(now);
  horizonEnd.setDate(horizonEnd.getDate() + SCHEDULING_HORIZON_DAYS);

  const treatmentStart = parseLocalDate(medication.agenda?.dataInicio) ?? now;
  const treatmentEnd = parseLocalDate(medication.agenda?.dataFim) ?? horizonEnd;
  const scheduleEnd = treatmentEnd < horizonEnd ? treatmentEnd : horizonEnd;
  if (scheduleEnd <= now) return [];

  const frequency = normalizeFrequency(medication.tipo);
  const occurrence = new Date(treatmentStart);
  occurrence.setHours(time.hour, time.minute, 0, 0);

  const advance = () => {
    if (frequency === "8h") occurrence.setHours(occurrence.getHours() + 8);
    else if (frequency === "12h")
      occurrence.setHours(occurrence.getHours() + 12);
    else if (frequency === "weekly")
      occurrence.setDate(occurrence.getDate() + 7);
    else occurrence.setDate(occurrence.getDate() + 1);
  };

  while (occurrence < treatmentStart || occurrence <= now) advance();

  const dates: Date[] = [];
  while (
    occurrence <= scheduleEnd &&
    dates.length < MAX_NOTIFICATIONS_PER_MEDICATION
  ) {
    dates.push(new Date(occurrence));
    advance();
  }
  return dates;
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
    const dates = notificationDates(medication, time);
    const identifiers: string[] = [];
    for (const [occurrence, date] of dates.entries()) {
      identifiers.push(
        await Notifications.scheduleNotificationAsync({
          content: medicationNotificationContent(medication, occurrence),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            channelId,
            date,
          },
        }),
      );
    }
    return identifiers;
  } catch (error) {
    reportNotificationError(
      `agendamento do medicamento ${medication.id}`,
      error,
    );
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
  } catch (error) {
    reportNotificationError(
      `cancelamento do medicamento ${medicationId}`,
      error,
    );
  }
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
  } catch (error) {
    reportNotificationError("limpeza dos lembretes", error);
  }
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

    for (const medication of medications) {
      await scheduleMedicationNotification(medication);
    }
  } catch (error) {
    reportNotificationError("sincronizacao dos lembretes", error);
  }
}
