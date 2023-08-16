"use client";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import { useContext } from "react";
import { ThemeModeContext } from "./ThemeToggleProvider";

export function ThemeToggle() {
  const theme = useTheme();
  const themeMode = useContext(ThemeModeContext);

  return (
    <IconButton
      sx={{ ml: 1 }}
      onClick={themeMode.toggleThemeMode}
      color="inherit"
    >
      {theme.palette.mode === "dark" ? (
        <Brightness7Icon />
      ) : (
        <Brightness4Icon />
      )}
    </IconButton>
  );
}
