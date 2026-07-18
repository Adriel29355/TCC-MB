import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  hydrateSessionAsync,
  isSessionHydrated,
  isUserAuthenticated,
  subscribeSession,
} from "@/lib/pharmalife";

type AppContextType = {
  darkMode: boolean;
  largeText: boolean;
  sessionReady: boolean;
  authenticated: boolean;
  toggleDarkMode: () => void;
  toggleLargeText: () => void;
};

const AppContext = createContext<AppContextType>({
  darkMode: false,
  largeText: false,
  sessionReady: false,
  authenticated: false,
  toggleDarkMode: () => {},
  toggleLargeText: () => {},
});

export function AppProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [sessionState, setSessionState] = useState({
    ready: isSessionHydrated(),
    authenticated: isUserAuthenticated(),
  });

  useEffect(() => {
    const refreshSession = () =>
      setSessionState({
        ready: isSessionHydrated(),
        authenticated: isUserAuthenticated(),
      });
    const unsubscribe = subscribeSession(refreshSession);
    hydrateSessionAsync();
    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        largeText,
        sessionReady: sessionState.ready,
        authenticated: sessionState.authenticated,
        toggleDarkMode: () => setDarkMode((v) => !v),
        toggleLargeText: () => setLargeText((v) => !v),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
