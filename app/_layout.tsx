import { Stack } from "expo-router";
import { PropsWithChildren, useEffect } from "react";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";

import { AppProvider, useAppContext } from "@/contexts/AppContext";
import { initializeNotificationsAsync } from "@/lib/notifications";

const ignoredWarnings = [
  "Image: style.resizeMode is deprecated. Please use props.resizeMode.",
  "props.pointerEvents is deprecated. Use style.pointerEvents",
];

LogBox.ignoreLogs(ignoredWarnings);

function SessionGuard({ children }: PropsWithChildren) {
  const { authenticated } = useAppContext();

  useEffect(() => {
    if (authenticated) initializeNotificationsAsync();
  }, [authenticated]);

  return children;
}

function AppNavigator() {
  const { authenticated, sessionReady } = useAppContext();

  return (
    <SessionGuard>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8FCFF" },
          headerTintColor: "#14324A",
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: "#F8FCFF" },
        }}
      >
        <Stack.Protected guard={authenticated}>
          <Stack.Screen name="index" options={{ title: "PharmaLife" }} />
          <Stack.Screen name="agenda" options={{ title: "Agenda" }} />
          <Stack.Screen name="adicionar" options={{ title: "Adicionar" }} />
          <Stack.Screen name="historico" options={{ title: "Historico" }} />
          <Stack.Screen
            name="configuracoes"
            options={{ title: "Configuracoes" }}
          />
          <Stack.Screen name="ajuda" options={{ title: "Ajuda" }} />
          <Stack.Screen name="sobre" options={{ title: "Sobre" }} />
          <Stack.Screen name="modal" options={{ title: "Atendimentos" }} />
        </Stack.Protected>

        <Stack.Protected guard={!authenticated}>
          <Stack.Screen name="login" options={{ title: "Entrar" }} />
          <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
          <Stack.Screen
            name="termos-de-uso"
            options={{ title: "Termos de uso" }}
          />
        </Stack.Protected>
      </Stack>

      {!sessionReady ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#2F80ED" size="large" />
        </View>
      ) : null}
    </SessionGuard>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FCFF",
  },
});
