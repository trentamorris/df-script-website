import React from "react";

export type BackgroundTheme = "galaxy" | "wave";

interface BackgroundThemeContextType {
  backgroundTheme: BackgroundTheme;
  setBackgroundTheme: (theme: BackgroundTheme) => void;
  toggleBackgroundTheme: () => void;
}

const STORAGE_KEY = "df_script_bg_theme";

const BackgroundThemeContext = React.createContext<BackgroundThemeContextType | null>(null);

export function BackgroundThemeProvider({ children }: { children: React.ReactNode }) {
  const [backgroundTheme, setBackgroundThemeState] = React.useState<BackgroundTheme>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "galaxy" || stored === "wave") {
        return stored;
      }
    }
    return "galaxy";
  });

  const setBackgroundTheme = React.useCallback((theme: BackgroundTheme) => {
    setBackgroundThemeState(theme);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, []);

  const toggleBackgroundTheme = React.useCallback(() => {
    setBackgroundThemeState((prev) => {
      const next: BackgroundTheme = prev === "galaxy" ? "wave" : "galaxy";
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      backgroundTheme,
      setBackgroundTheme,
      toggleBackgroundTheme,
    }),
    [backgroundTheme, setBackgroundTheme, toggleBackgroundTheme]
  );

  return (
    <BackgroundThemeContext.Provider value={value}>
      {children}
    </BackgroundThemeContext.Provider>
  );
}

export function useBackgroundTheme(): BackgroundThemeContextType {
  const context = React.useContext(BackgroundThemeContext);
  if (!context) {
    throw new Error("useBackgroundTheme must be used within a BackgroundThemeProvider");
  }
  return context;
}
