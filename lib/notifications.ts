import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Use um dispositivo físico.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permissão negada.");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  console.log("Expo Push Token:");
  console.log(token);

  return token;
}

export async function scheduleMedicationNotification(medication: {
  id: number;
  nome: string;
  descricao?: string;
  agenda?: {
    horario?: string;
  };
}) {
  if (!Device.isDevice) {
    return null;
  }

  const horario = medication.agenda?.horario;
  if (!horario) {
    return null;
  }

  const [hourString, minuteString] = horario.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: medication.nome || "Lembrete de medicamento",
        body: medication.descricao || "Hora de tomar seu medicamento.",
        sound: "default",
        data: { medicationId: medication.id },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return notificationId;
  } catch (error) {
    console.log("Falha ao agendar notificação:", error);
    return null;
  }
}

export async function cancelMedicationNotification(medicationId: number) {
  if (!Device.isDevice) {
    return;
  }

  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    await Promise.all(
      scheduledNotifications
        .filter(
          (notification) =>
            notification.content?.data?.medicationId === medicationId,
        )
        .map((notification) =>
          Notifications.cancelScheduledNotificationAsync(
            notification.identifier,
          ),
        ),
    );
  } catch (error) {
    console.log("Falha ao cancelar notificação:", error);
  }
}
