import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

// ─── Color palettes ───────────────────────────────────────────────────────────
export const DARK = {
  bg: "#0a0a0f",
  surface: "#111118",
  card: "#16161f",
  cardBorder: "#1e1e2e",
  accent: "#7c6af7",
  accentDim: "#2a2040",
  red: "#f87171",
  text: "#e8e8f0",
  textDim: "#6b6b80",
  textMuted: "#3a3a50",
  inputBg: "#0e0e16",
  statusBar: "light-content" as const,
};

export const LIGHT = {
  bg: "#f5f5f5",
  surface: "#ffffff",
  card: "#ffffff",
  cardBorder: "#e0e0e0",
  accent: "#6200ee",
  accentDim: "#ede7f6",
  red: "#e53935",
  text: "#0a0a0f",
  textDim: "#555555",
  textMuted: "#aaaaaa",
  inputBg: "#f0f0f0",
  statusBar: "dark-content" as const,
};

export type Theme = {
  bg: string;
  surface: string;
  card: string;
  cardBorder: string;
  accent: string;
  accentDim: string;
  red: string;
  text: string;
  textDim: string;
  textMuted: string;
  inputBg: string;
  statusBar: "light-content" | "dark-content"; // ← union type fixes it
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK,
  isDark: true,
  toggleTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  // Sync with system theme changes
  useEffect(() => {
    setIsDark(systemScheme === "dark");
  }, [systemScheme]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook — use this in any screen or component ───────────────────────────────
export const useTheme = () => useContext(ThemeContext);