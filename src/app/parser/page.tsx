"use client";

import { Box, Link, Paper, TextField, Typography } from "@mui/material";
import {
  Blueprint,
  BlueprintFolder,
  parseBlueprintOrFolder,
} from "coi-bp-parse";
import { useEffect, useState } from "react";

export default function BlueprintParser() {
  const [blueprint, setBlueprint] = useState("");
  const [blueprintError, setBlueprintError] = useState("");
  const [parsedBlueprint, setParsedBlueprint] = useState<
    Blueprint | BlueprintFolder | undefined
  >(undefined);

  useEffect(() => {
    setBlueprintError("");
    if (blueprint) {
      try {
        setParsedBlueprint(parseBlueprintOrFolder(blueprint));
      } catch (e) {
        setParsedBlueprint(undefined);
        console.error(`failed to parse blueprint: ${e}`);
        setBlueprintError("Could not parse blueprint string");
      }
    }
  }, [blueprint]);

  return (
    <Box maxWidth="lg" margin="auto" width="1" sx={{ mt: 4, mb: 2 }}>
      <Typography variant="h6">Blueprint parser</Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        Paste your blueprint below and see what wonders it contains! Uses the{" "}
        <Link href="https://github.com/craigatron/coi-bp-parse">
          coi-bp-parse
        </Link>{" "}
        Typescript library.
      </Typography>
      <TextField
        margin="normal"
        multiline
        maxRows={5}
        required
        fullWidth
        id="blueprint"
        label="Blueprint"
        name="blueprint"
        value={blueprint}
        error={!!blueprintError}
        helperText={blueprintError || undefined}
        onChange={(e) => setBlueprint(e.target.value.trim())}
      />
      {parsedBlueprint !== undefined && (
        <Paper variant="outlined" sx={{ padding: 2 }}>
          <Typography variant="h6">Blueprint details</Typography>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(parsedBlueprint, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
}
