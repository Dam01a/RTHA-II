import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: colorScheme ?? "system",
      isDark: (colorScheme ?? "system") === "dark",
      setMode: setColorScheme,
    }),
    [colorScheme, setColorScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
