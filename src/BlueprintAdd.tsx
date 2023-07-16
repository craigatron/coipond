import { LoadingButton } from "@mui/lab";
import { Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import {
  Blueprint,
  BlueprintFolder,
  parseBlueprintOrFolder,
} from "coi-bp-parse";
import { Timestamp, collection, doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { DateTime } from "luxon";
import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlueprintCard from "./BlueprintCard";
import { useFirebaseAuth } from "./context/FirebaseAuthContext";
import { BlueprintDoc, db, storage } from "./services/firebase";
import { getMinGameVersion } from "./utils";

export default function BlueprintAdd() {
  const { user, loading } = useFirebaseAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [blueprint, setBlueprint] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [parsedBlueprint, setParsedBlueprint] = useState<
    Blueprint | BlueprintFolder | undefined
  >(undefined);
  const [fileError, setFileError] = useState("");
  const [blueprintError, setBlueprintError] = useState("");
  const [previewDoc, setPreviewDoc] = useState<BlueprintDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    setFileError("");
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setFileError("Screenshot too large (max 5 MB)");
    }
  }, [selectedFile]);

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

  useEffect(() => {
    if (!user || !parsedBlueprint) {
      setPreviewDoc(null);
      return;
    }

    const gameVersion =
      parsedBlueprint.kind === "blueprint"
        ? parsedBlueprint.gameVersion
        : getMinGameVersion(parsedBlueprint);

    const uploadTime = Timestamp.fromDate(DateTime.now().toJSDate());
    setPreviewDoc({
      uid: user.uid,
      username: user.displayName || "",
      kind: parsedBlueprint.kind === "blueprint" ? "b" : "f",
      name: name || "<NAME>",
      description,
      blueprint,
      gameVersion,
      views: 0,
      downloads: 0,
      created: uploadTime,
      updated: uploadTime,
    });
  }, [user, name, description, blueprint, parsedBlueprint, selectedFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      throw new Error("no user found");
    }

    setSubmitting(true);

    const uploadTime = Timestamp.fromDate(DateTime.now().toJSDate());

    const newDoc = { ...previewDoc, created: uploadTime, updated: uploadTime };

    const docRef = doc(collection(db, "blueprints"));
    try {
      let screenshotUrl: string | undefined = undefined;
      if (selectedFile) {
        const screenshotRef = ref(
          storage,
          `/blueprints/${docRef.id}.${selectedFile.name.slice(
            selectedFile.name.lastIndexOf(".") + 1
          )}`
        );
        await uploadBytes(screenshotRef, selectedFile);
        screenshotUrl = await getDownloadURL(screenshotRef);

        newDoc.screenshotUrl = screenshotUrl;
      }

      await setDoc(docRef, newDoc);
      navigate(`/blueprints/${docRef.id}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      enqueueSnackbar("Error creating blueprint", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    }
  };

  return (
    <>
      <h1>Add blueprint</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              inputProps={{ maxLength: 50 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal"
              multiline
              minRows={4}
              maxRows={10}
              required
              fullWidth
              id="description"
              label="Description (supports markdown)"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", display: "flex" }}
            >
              <Typography variant="body2">
                Screenshot:{" "}
                {selectedFile ? selectedFile.name : "No file selected"}
              </Typography>
              <Button variant="contained" component="label">
                Upload File
                <input
                  type="file"
                  hidden
                  name="screenshot"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedFile(
                      e.target.files ? e.target.files[0] : undefined
                    )
                  }
                />
              </Button>
              {fileError && (
                <Typography variant="body2" color="error">
                  {fileError}
                </Typography>
              )}
            </Stack>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={submitting}
              sx={{ mt: 3, mb: 2 }}
              disabled={!name || !description || !parsedBlueprint}
            >
              Add blueprint
            </LoadingButton>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">Preview</Typography>

          {previewDoc && (
            <BlueprintCard
              blueprintObj={previewDoc}
              screenshotOverride={
                selectedFile ? URL.createObjectURL(selectedFile) : undefined
              }
            ></BlueprintCard>
          )}
        </Grid>
      </Grid>
    </>
  );
}
