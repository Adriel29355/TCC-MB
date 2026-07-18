import { StyleSheet, Text } from "react-native";

export const INVALID_INPUT_STYLE = {
  borderColor: "#DC2626",
  borderWidth: 1.5,
} as const;

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
