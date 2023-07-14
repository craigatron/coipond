import { LockOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Copyright from "./Copyright";
import {
  UsernameTakenError,
  registerWithEmailAndPassword,
} from "./services/firebase";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerWithEmailAndPassword(username, email, password);
      navigate("/blueprints");
    } catch (e) {
      setLoading(false);
      if (e instanceof UsernameTakenError) {
        setError("Username already exists");
      } else {
        console.error(e);
        setError("Could not create user");
      }
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{
            gap: 2,
            mt: 3,
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <TextField
            autoComplete="username"
            name="username"
            required
            fullWidth
            id="username"
            label="Username"
            inputProps={{ maxLength: 25 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={username !== "" && !username.match(/^[A-Za-z0-9]{3,25}$/)}
          />
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            required
            fullWidth
            name="confirm-password"
            label="Confirm password"
            type="password"
            id="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword !== "" && password !== confirmPassword}
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            disabled={
              loading ||
              !username ||
              !email ||
              !password ||
              password !== confirmPassword
            }
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} variant="body2" to="/login">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Copyright sx={{ mt: 5 }} />
    </Container>
  );
}
