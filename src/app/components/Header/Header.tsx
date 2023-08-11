"use client";

import { useFirebaseAuth } from "@/firebase/FirebaseAuthContext";
import { logout } from "@/firebase/client-config";
import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";
import NextLink from "next/link";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";

export default function Header() {
  const { user } = useFirebaseAuth();

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <AppBar position="relative">
      <Toolbar>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", flexGrow: 1 }}
        >
          <Typography
            id="logo"
            component={NextLink}
            href="/"
            variant="h6"
            color="inherit"
            sx={{
              textDecoration: "none",
            }}
          >
            The CoI Pond
          </Typography>
          <Button component={NextLink} href="/blueprints" color="inherit">
            Blueprints
          </Button>
          <Button component={NextLink} href="/parser" color="inherit">
            Parser
          </Button>
          <Button component={NextLink} href="/about" color="inherit">
            About
          </Button>
        </Stack>
        {user === null && (
          <>
            <Button component={NextLink} href="/login" color="inherit">
              Login
            </Button>
            <Button component={NextLink} href="/signup" color="inherit">
              Signup
            </Button>
          </>
        )}
        {user !== null && (
          <Button onClick={handleLogoutClick} color="inherit">
            Logout
          </Button>
        )}
        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}
