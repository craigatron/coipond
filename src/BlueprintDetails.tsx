import { CopyAll } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Blueprint, parseBlueprint } from "coi-bp-parse";
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { DateTime } from "luxon";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import noscreenshot from "./assets/noscreenshot.png";
import { useFirebaseAuth } from "./context/FirebaseAuthContext";
import { BlueprintDoc, db, storage } from "./services/firebase";

export default function BlueprintDetails() {
  const { user } = useFirebaseAuth();
  const navigate = useNavigate();
  const { blueprintId } = useParams();
  const [loading, setLoading] = useState(true);
  const [blueprintDoc, setBlueprintDoc] = useState<BlueprintDoc | null>(null);
  const [parsedBlueprint, setParsedBlueprint] = useState<Blueprint | null>(
    null
  );
  const [invalid, setInvalid] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | undefined>(undefined);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    const docFetch = async () => {
      const docRef = doc(db, "blueprints", blueprintId || "");
      let blueprintString: string | undefined;
      try {
        const bpDoc = await getDoc(docRef);
        if (bpDoc.exists()) {
          setBlueprintDoc(bpDoc.data() as BlueprintDoc);
          blueprintString = bpDoc.data().blueprint;
        } else {
          setInvalid(true);
        }
      } catch (e) {
        console.error(e);
        setInvalid(true);
        setLoading(false);
        return;
      }

      setLoading(false);

      if (blueprintString) {
        try {
          setParsedBlueprint(parseBlueprint(blueprintString));
        } catch (e) {
          console.error(e);
          enqueueSnackbar("Could not parse blueprint", {
            variant: "error",
            anchorOrigin: { vertical: "top", horizontal: "center" },
          });
        }
      }
    };
    docFetch();
  }, [blueprintId]);

  useEffect(() => {
    setCanEdit(
      user !== null && blueprintDoc !== null && user.uid === blueprintDoc.uid
    );
  }, [blueprintDoc, user]);

  useEffect(() => {
    const uploadScreenshot = async () => {
      if (fileToUpload && blueprintDoc && blueprintId) {
        setFileUploading(true);
        try {
          await deleteScreenshot(blueprintDoc);

          const screenshotRef = ref(
            storage,
            `/blueprints/${blueprintId}.${fileToUpload.name.slice(
              fileToUpload.name.lastIndexOf(".") + 1
            )}`
          );
          await uploadBytes(screenshotRef, fileToUpload);
          const screenshotUrl = await getDownloadURL(screenshotRef);

          blueprintDoc.screenshotUrl = screenshotUrl;
          updateDoc(doc(db, "blueprints", blueprintId), { screenshotUrl });
        } catch (e) {
          enqueueSnackbar("Could not update screenshot", {
            variant: "error",
            anchorOrigin: { vertical: "top", horizontal: "center" },
          });
        }
        setFileToUpload(undefined);
        setFileUploading(false);
      }
    };
    uploadScreenshot();
  }, [blueprintDoc, blueprintId, fileToUpload]);

  const handleCopyClick = () => {
    if (blueprintDoc === null) {
      return;
    }

    navigator.clipboard.writeText(blueprintDoc.blueprint);
    enqueueSnackbar("Copied blueprint!", {
      variant: "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  if (invalid) {
    return (
      <Typography variant="h6" sx={{ mt: 2 }}>
        No blueprint found
      </Typography>
    );
  }

  if (loading || blueprintDoc === null) {
    return (
      <Typography variant="h4" sx={{ mt: 2 }}>
        Loading blueprint...
      </Typography>
    );
  }

  const deleteScreenshot = async (blueprintDoc: BlueprintDoc) => {
    if (blueprintDoc.screenshotUrl) {
      const screenshotRef = ref(storage, blueprintDoc.screenshotUrl);
      await deleteObject(screenshotRef);
    }
  };

  const deleteBlueprint = async () => {
    if (!blueprintId) {
      return;
    }

    try {
      await deleteScreenshot(blueprintDoc);
      await deleteDoc(doc(db, "blueprints", blueprintId));
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Could not delete blueprint", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
      return;
    }

    enqueueSnackbar("Deleted blueprint!", {
      variant: "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
    setDeleteDialogOpen(false);

    // index can take a bit to catch up, stash deleted blueprints
    // so we can weed them out in the blueprints list
    const recentlyDeleted = JSON.parse(
      sessionStorage.getItem("recently-deleted") || "[]"
    ) as string[];
    recentlyDeleted.push(blueprintId);
    sessionStorage.setItem("recently-deleted", JSON.stringify(recentlyDeleted));

    navigate("/blueprints");
  };

  return (
    <>
      <Box maxWidth="lg" margin="auto" width="1" sx={{ mt: 4, mb: 2 }}>
        {" "}
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h4">{blueprintDoc.name}</Typography>
          {canEdit && (
            <Button color="error" onClick={() => setDeleteDialogOpen(true)}>
              Delete
            </Button>
          )}
        </Stack>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Stack>
              {fileUploading && (
                <Box
                  height={150}
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <CircularProgress></CircularProgress>
                </Box>
              )}
              {!fileUploading && blueprintDoc.screenshotUrl === undefined && (
                <img
                  alt="screenshot placeholder"
                  src={noscreenshot}
                  style={{ maxWidth: "100%" }}
                ></img>
              )}
              {!fileUploading && blueprintDoc.screenshotUrl !== undefined && (
                <a
                  href={blueprintDoc.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    alt="blueprint screenshot"
                    src={blueprintDoc.screenshotUrl || noscreenshot}
                    style={{ maxWidth: "100%" }}
                  ></img>
                </a>
              )}
              {canEdit && (
                <Button variant="contained" sx={{ mt: 1 }} component="label">
                  Upload screenshot{" "}
                  <input
                    type="file"
                    hidden
                    name="screenshot"
                    accept="image/*"
                    onChange={(e) =>
                      setFileToUpload(
                        e.target.files ? e.target.files[0] : undefined
                      )
                    }
                  />
                </Button>
              )}
              <Typography variant="body1" sx={{ mt: 1 }}>
                Submitted by {blueprintDoc.username}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Last updated{" "}
                {DateTime.fromJSDate(
                  (blueprintDoc.updated as Timestamp).toDate()
                ).toLocaleString(DateTime.DATETIME_MED)}
              </Typography>
              <Typography variant="body1">
                Created{" "}
                {DateTime.fromJSDate(
                  (blueprintDoc.created as Timestamp).toDate()
                ).toLocaleString(DateTime.DATETIME_MED)}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Created with game version {blueprintDoc.gameVersion}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ padding: 2 }}>
                <Typography variant="h6">Description</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {blueprintDoc.description || "none"}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ padding: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Blueprint</Typography>
                  <IconButton
                    onClick={handleCopyClick}
                    aria-label="Copy blueprint"
                  >
                    <CopyAll />
                  </IconButton>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{ mt: 1, wordBreak: "break-word" }}
                >
                  {blueprintDoc.blueprint}
                </Typography>
              </Paper>
              {parsedBlueprint !== null && (
                <Paper variant="outlined" sx={{ padding: 2 }}>
                  <Typography variant="h6">Blueprint details</Typography>
                  <pre>{JSON.stringify(parsedBlueprint.rawItems, null, 2)}</pre>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Really delete blueprint?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            This is not reversible!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={deleteBlueprint}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
