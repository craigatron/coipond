import { Box, Paper } from "@mui/material";
import { useEffect, useState } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import changelog from "./assets/CHANGELOG.md";

export default function Changelog() {
  const [changes, setChanges] = useState("");

  useEffect(() => {
    fetch(changelog)
      .then((resp) => resp.text())
      .then((text) => {
        setChanges(text);
      });
  }, []);

  // TODO: could totally just store this in markdown and load it dynamically
  return (
    <Box maxWidth="md" margin="auto" sx={{ mt: 2 }}>
      <Paper sx={{ padding: 3 }} elevation={1}>
        <ReactMarkdown>{changes}</ReactMarkdown>
      </Paper>
    </Box>
  );
}
