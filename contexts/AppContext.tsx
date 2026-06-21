import { createContext, PropsWithChildren, useContext, useState } from "react";

type AppContextType = {
  darkMode: boolean;
  largeText: boolean;
  toggleDarkMode: () => void;
  toggleLargeText: () => void;
};

const AppContext = createContext<AppContextType>({
  darkMode: false,
  largeText: false,
  toggleDarkMode: () => {},
  toggleLargeText: () => {},
});

export function AppProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        largeText,
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
