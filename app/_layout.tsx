import { router, Stack, usePathname } from "expo-router";
import { PropsWithChildren, useEffect } from "react";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";

import { AppProvider, useAppContext } from "@/contexts/AppContext";
import { initializeNotificationsAsync } from "@/lib/notifications";

const ignoredWarnings = [
  "Image: style.resizeMode is deprecated. Please use props.resizeMode.",
  "props.pointerEvents is deprecated. Use style.pointerEvents",
];

LogBox.ignoreLogs(ignoredWarnings);

const PUBLIC_ROUTES = new Set(["/login", "/cadastro", "/termos-de-uso"]);

function SessionGuard({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { authenticated, sessionReady } = useAppContext();
  const publicRoute = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (!sessionReady) return;
    if (!authenticated && !publicRoute) router.replace("/login");
    if (authenticated && publicRoute) router.replace("/");
  }, [authenticated, publicRoute, sessionReady]);

  useEffect(() => {
    if (authenticated) initializeNotificationsAsync();
  }, [authenticated]);

  if (!sessionReady || (!authenticated && !publicRoute)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2F80ED" size="large" />
      </View>
    );
  }

  return children;
}

export default function Layout() {
  return (
    <AppProvider>
      <SessionGuard>
        <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8FCFF" },
          headerTintColor: "#14324A",
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: "#F8FCFF" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "PharmaLife" }} />
        <Stack.Screen name="login" options={{ title: "Entrar" }} />
        <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
        <Stack.Screen
          name="termos-de-uso"
          options={{ title: "Termos de uso" }}
        />
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
        </Stack>
      </SessionGuard>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FCFF",
  },
});
