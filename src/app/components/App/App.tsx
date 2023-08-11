"use client";

import { FirebaseAuthProvider } from "@/firebase/FirebaseAuthContext";
import { Box } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { ReactNode } from "react";
import Header from "../Header/Header";

export default function App(props: { children: ReactNode }) {
  return (
    <FirebaseAuthProvider>
      <Header />
      <Box component="main" sx={{ pl: 2, pr: 2 }}>
        {props.children}
      </Box>
      <SnackbarProvider></SnackbarProvider>
    </FirebaseAuthProvider>
  );
}
