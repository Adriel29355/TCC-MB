import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export function PasswordInput({ style, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        style={[style, styles.input]}
      />
      <Pressable
        accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => setVisible((current) => !current)}
        style={styles.button}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={22}
          color="#2F80ED"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    paddingRight: 50,
  },
  button: {
    position: "absolute",
    right: 4,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
