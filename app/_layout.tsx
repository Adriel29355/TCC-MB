import { Stack } from "expo-router";
import { LogBox } from "react-native";

import { AppProvider } from "@/contexts/AppContext";

const ignoredWarnings = [
  "Image: style.resizeMode is deprecated. Please use props.resizeMode.",
  "props.pointerEvents is deprecated. Use style.pointerEvents",
];

LogBox.ignoreLogs(ignoredWarnings);

const globalWithConsoleFilter = globalThis as typeof globalThis & {
  __tccConsoleWarningsFiltered?: boolean;
};

if (!globalWithConsoleFilter.__tccConsoleWarningsFiltered) {
  const originalWarn = console.warn;

  console.warn = (...args) => {
    const firstArg = args[0];

    if (
      typeof firstArg === "string" &&
      ignoredWarnings.some((warning) => firstArg.includes(warning))
    ) {
      return;
    }

    originalWarn(...args);
  };

  globalWithConsoleFilter.__tccConsoleWarningsFiltered = true;
}

export default function Layout() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}
