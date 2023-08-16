"use client";

import { sendPasswordReset } from "@/firebase/client-config";
import { Box, Button, Container, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (e) {
      setError("Could not reset password");
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
        <Typography component="h1" variant="h5">
          Forgot password
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {
            "Enter your email address and we'll send you an email to reset your password."
          }
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            gap: 2,
            mt: 3,
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          {success && (
            <Typography variant="body2" color="success.main">
              Password reset email sent!
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={!email}
          >
            Reset password
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
