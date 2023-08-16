"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { ThemeModeContext } from "../ThemeToggle/ThemeToggleProvider";
import NextAppDirEmotionCacheProvider from "./EmotionCache";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const themeMode = useMemo(
    () => ({
      toggleThemeMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        typography: {
          fontFamily: ["Noto Sans", "sans-serif"].join(","),
        },
      }),
    [mode]
  );
  return (
    <NextAppDirEmotionCacheProvider options={{ key: "mui" }}>
      <ThemeModeContext.Provider value={themeMode}>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </NextAppDirEmotionCacheProvider>
  );
}
