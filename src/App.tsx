import { Brightness4, Brightness7 } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  PaletteMode,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";
import { SnackbarProvider } from "notistack";
import { useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Link as RouterLink,
  Routes,
} from "react-router-dom";
import About from "./About";
import "./App.css";
import BlueprintAdd from "./BlueprintAdd";
import BlueprintDetails from "./BlueprintDetails";
import BlueprintList from "./BlueprintList";
import BlueprintParser from "./BlueprintParser";
import Changelog from "./Changelog";
import ForgotPassword from "./ForgotPassword";
import Login from "./Login";
import Signup from "./Signup";
import {
  FirebaseAuthProvider,
  useFirebaseAuth,
} from "./context/FirebaseAuthContext";
import { logout } from "./services/firebase";

function App() {
  const [themeMode, setThemeMode] = useState<PaletteMode>("dark");
  const { user } = useFirebaseAuth();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
        typography: {
          fontFamily: ["Noto Sans", "sans-serif"].join(","),
        },
      }),
    [themeMode]
  );

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", flexGrow: 1 }}
          >
            <Typography
              id="logo"
              component={RouterLink}
              to="/blueprints"
              variant="h6"
              color="inherit"
              sx={{
                textDecoration: "none",
              }}
            >
              The CoI Pond
            </Typography>
            <Button component={RouterLink} to="/blueprints">
              Blueprints
            </Button>
            <Button component={RouterLink} to="/parser">
              Parser
            </Button>
            <Button component={RouterLink} to="/about">
              About
            </Button>
            <Button component={RouterLink} to="/changelog">
              Changelog
            </Button>
          </Stack>
          {user === null && (
            <>
              <Button component={RouterLink} to="/login">
                Login
              </Button>
              <Button component={RouterLink} to="/signup">
                Signup
              </Button>
            </>
          )}
          {user !== null && (
            <Button color="inherit" onClick={handleLogoutClick}>
              Logout
            </Button>
          )}
          <IconButton
            title="Toggle light/dark mode"
            sx={{ ml: 1 }}
            onClick={() =>
              setThemeMode(themeMode === "dark" ? "light" : "dark")
            }
            color="inherit"
          >
            {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ pl: 2, pr: 2 }}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/blueprints"></Navigate>}
          ></Route>
          <Route path="/blueprints" element={<BlueprintList></BlueprintList>} />
          <Route
            path="/blueprints/new"
            element={<BlueprintAdd></BlueprintAdd>}
          ></Route>
          <Route
            path="/blueprints/:blueprintId"
            element={<BlueprintDetails></BlueprintDetails>}
          ></Route>
          <Route path="/signup" element={<Signup></Signup>} />
          <Route path="/login" element={<Login></Login>} />
          <Route
            path="/reset-password"
            element={<ForgotPassword></ForgotPassword>}
          />
          <Route path="/about" element={<About></About>}></Route>
          <Route
            path="/parser"
            element={<BlueprintParser></BlueprintParser>}
          ></Route>
          <Route path="/changelog" element={<Changelog></Changelog>}></Route>
        </Routes>
      </Box>
      <SnackbarProvider></SnackbarProvider>
    </ThemeProvider>
  );
}

export default function AppWrapper() {
  return (
    <FirebaseAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </FirebaseAuthProvider>
  );
}
