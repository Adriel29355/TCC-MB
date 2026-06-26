// lib/confirm-dialog.ts
import { Alert, Platform } from "react-native";

export function confirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) onConfirm();
    else onCancel?.();
  } else {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: onCancel },
      { text: "Excluir", style: "destructive", onPress: onConfirm },
    ]);
  }
}
