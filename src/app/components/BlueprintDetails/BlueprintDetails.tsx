"use client";

import { useFirebaseAuth } from "@/firebase/FirebaseAuthContext";
import { db, storage } from "@/firebase/client-config";
import { BlueprintDoc, BlueprintVersion } from "@/firebase/data";
import { errorSnack, getMinGameVersion, successSnack } from "@/utils";
import {
  Cancel,
  CopyAll,
  DeleteForever,
  Edit,
  ExpandMore,
  Folder,
  FolderOpen,
  Save,
  TextSnippet,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Blueprint,
  BlueprintFolder,
  parseBlueprintOrFolder,
} from "coi-bp-parse";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { DateTime } from "luxon";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import ReactMarkdown from "react-markdown";
import "./BlueprintDetails.css";

export default function BlueprintDetails(props: {
  bpId: string;
  bpDoc: BlueprintDoc;
  versions: BlueprintVersion | null;
}) {
  const { user } = useFirebaseAuth();
  const router = useRouter();
  const [blueprintDoc, setBlueprintDoc] = useState<BlueprintDoc>(props.bpDoc);
  const [parsedBlueprint, setParsedBlueprint] = useState<
    Blueprint | BlueprintFolder | null
  >(null);
  const [blueprintVersions, setBlueprintVersions] =
    useState<BlueprintVersion | null>(props.versions);

  const [canEdit, setCanEdit] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | undefined>(undefined);
  const [fileUploading, setFileUploading] = useState(false);

  const [nameEditing, setNameEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [blueprintEditing, setBlueprintEditing] = useState(false);
  const [newBlueprint, setNewBlueprint] = useState("");
  const [newParsedBlueprint, setNewParsedBlueprint] = useState<
    Blueprint | BlueprintFolder | null
  >(null);
  const [newMinGameVersion, setNewMinGameVersion] = useState("");

  const [disableSave, setDisableSave] = useState(false);

  const [bpDetailsOpen, setBpDetailsOpen] = useState(true);

  useEffect(() => {
    setParsedBlueprint(
      blueprintDoc ? parseBlueprintOrFolder(blueprintDoc.blueprint) : null
    );
  }, [blueprintDoc]);

  useEffect(() => {
    setCanEdit(
      user !== null && blueprintDoc !== null && user.uid === blueprintDoc.uid
    );
  }, [blueprintDoc, user]);

  useEffect(() => {
    const uploadScreenshot = async () => {
      if (fileToUpload && blueprintDoc) {
        setFileUploading(true);
        try {
          await deleteScreenshot(blueprintDoc);

          const screenshotRef = ref(
            storage,
            `/blueprints/${props.bpId}.${fileToUpload.name.slice(
              fileToUpload.name.lastIndexOf(".") + 1
            )}`
          );
          await uploadBytes(screenshotRef, fileToUpload);
          const screenshotUrl = await getDownloadURL(screenshotRef);

          blueprintDoc.screenshotUrl = screenshotUrl;
          updateDoc(doc(db, "blueprints", props.bpId), { screenshotUrl });
        } catch (e) {
          errorSnack("Could not update screenshot");
        }
        setFileToUpload(undefined);
        setFileUploading(false);
      }
    };
    uploadScreenshot();
  }, [blueprintDoc, props, fileToUpload]);

  useEffect(() => {
    if (newBlueprint) {
      try {
        const bpOrFolder = parseBlueprintOrFolder(newBlueprint);
        setNewParsedBlueprint(bpOrFolder);
        if (bpOrFolder.kind === "folder") {
          setNewMinGameVersion(getMinGameVersion(bpOrFolder));
        } else {
          setNewMinGameVersion("");
        }
      } catch (e) {
        console.error(e);
        setNewParsedBlueprint(null);
      }
    } else {
      setNewParsedBlueprint(null);
    }
  }, [newBlueprint]);

  const copyBlueprintToClipboard = (bp: string) => {
    navigator.clipboard.writeText(bp);
    successSnack("Copied blueprint!");
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    // don't trigger the accordion's click event
    e.stopPropagation();
    if (blueprintDoc === null) {
      return;
    }

    copyBlueprintToClipboard(blueprintDoc.blueprint);
  };

  const deleteScreenshot = async (blueprintDoc: BlueprintDoc) => {
    if (blueprintDoc.screenshotUrl) {
      const screenshotRef = ref(storage, blueprintDoc.screenshotUrl);
      try {
        await deleteObject(screenshotRef);
      } catch (e: any) {
        // swallow the exception if the object is already deleted somehow
        if (e.code !== "storage/object-not-found") {
          throw e;
        }
      }
    }
  };

  const deleteBlueprint = async () => {
    try {
      await deleteScreenshot(blueprintDoc);
    } catch (e: any) {
      console.error(e);
      errorSnack("Could not delete blueprint");
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "blueprints", props.bpId));
      batch.delete(doc(db, "blueprintVersions", props.bpId));
      await batch.commit();
    } catch (e) {
      console.error(e);
      errorSnack("Could not delete blueprint");
      return;
    }

    successSnack("Deleted blueprint!");
    setDeleteDialogOpen(false);

    // index can take a bit to catch up, stash deleted blueprints
    // so we can weed them out in the blueprints list
    const recentlyDeleted = JSON.parse(
      sessionStorage.getItem("recently-deleted") || "[]"
    ) as string[];
    recentlyDeleted.push(props.bpId);
    sessionStorage.setItem("recently-deleted", JSON.stringify(recentlyDeleted));

    router.push("/blueprints");
  };

  const onSaveNameClick = async () => {
    if (disableSave) {
      return;
    }
    if (!newName.trim()) {
      errorSnack("Must specify a name");
      return;
    }

    setDisableSave(true);
    setNameEditing(false);
    try {
      await updateDoc(doc(db, "blueprints", props.bpId), {
        name: newName,
        updated: serverTimestamp(),
      });
      setBlueprintDoc({
        ...blueprintDoc,
        name: newName.trim(),
        updated: DateTime.now().toJSDate(),
      });
      successSnack("Updated!");
    } catch (e) {
      errorSnack("Could not update name");
    }
    setDisableSave(false);
  };

  const onSaveDescriptionClick = async () => {
    if (disableSave) {
      return;
    }
    setDisableSave(true);
    setDescriptionEditing(false);
    try {
      await updateDoc(doc(db, "blueprints", props.bpId), {
        description: newDescription,
        updated: serverTimestamp(),
      });
      setBlueprintDoc({
        ...blueprintDoc,
        description: newDescription,
        updated: DateTime.now().toJSDate(),
      });
      successSnack("Updated!");
    } catch (e) {
      errorSnack("Could not update description");
    }
    setDisableSave(false);
  };

  const onSaveBlueprintClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !newParsedBlueprint) {
      return;
    }
    if (newBlueprint === blueprintDoc.blueprint) {
      setBlueprintEditing(false);
      setNewParsedBlueprint(null);
      return;
    }
    setDisableSave(true);

    try {
      const version = await runTransaction(db, async (transaction) => {
        const versionRef = doc(collection(db, "blueprintVersions"), props.bpId);
        const versionDoc = await transaction.get(versionRef);
        let version: BlueprintVersion;
        if (versionDoc.exists()) {
          const newVersions = [
            {
              blueprint: newBlueprint,
              created: new Date(),
              gameVersion:
                newParsedBlueprint.kind === "blueprint"
                  ? newParsedBlueprint.gameVersion
                  : newMinGameVersion,
            },
            ...versionDoc.data().versions.map((v: any) => {
              return {
                ...v,
                created: v.created.toDate(),
              };
            }),
          ];
          transaction.update(versionRef, {
            versions: newVersions,
          });
          version = {
            uid: versionDoc.data().uid,
            versions: newVersions,
          };
        } else {
          version = {
            uid: user.uid,
            versions: [
              {
                blueprint: newBlueprint,
                created: new Date(),
                gameVersion:
                  newParsedBlueprint.kind === "blueprint"
                    ? newParsedBlueprint.gameVersion
                    : newMinGameVersion,
              },
              {
                blueprint: blueprintDoc.blueprint,
                created: blueprintDoc.created,
                gameVersion: blueprintDoc.gameVersion,
              },
            ],
          };
          transaction.set(versionRef, version);
        }

        const docRef = doc(db, "blueprints", props.bpId);
        transaction.update(docRef, {
          blueprint: newBlueprint,
          gameVersion:
            newParsedBlueprint.kind === "blueprint"
              ? newParsedBlueprint.gameVersion
              : newMinGameVersion,
          kind: newParsedBlueprint.kind === "folder" ? "f" : "b",
          updated: serverTimestamp(),
        });

        return version;
      });
      setBlueprintEditing(false);
      setBlueprintDoc({
        ...blueprintDoc,
        blueprint: newBlueprint,
        gameVersion:
          newParsedBlueprint.kind === "blueprint"
            ? newParsedBlueprint.gameVersion
            : newMinGameVersion,
        updated: DateTime.now().toJSDate(),
      });
      setBlueprintVersions(version);
      setNewParsedBlueprint(null);
      successSnack("Blueprint updated!");
    } catch (e) {
      console.error(e);
      errorSnack("Could not update blueprint");
    }
    setDisableSave(false);
  };

  const getTreeViewData = (folder: BlueprintFolder): any => {
    const children = [];
    for (const bp of folder.blueprints) {
      children.push({
        name: `${bp.name} (version: ${bp.gameVersion})`,
      });
    }
    for (const subfolder of folder.blueprintFolders) {
      children.push(getTreeViewData(subfolder));
    }
    return {
      name: folder.name,
      children,
    };
  };

  const getTreeViewDataRoot = () => {
    if (parsedBlueprint?.kind !== "folder") {
      throw new Error("cannot get tree view for blueprint");
    }
    return flattenTree(getTreeViewData(parsedBlueprint));
  };

  return (
    <>
      <Box maxWidth="lg" margin="auto" width="1" sx={{ mt: 4, mb: 2 }}>
        {" "}
        <Stack direction="row" spacing={1} alignItems="center">
          {nameEditing && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Name"
                name="name"
                inputProps={{ maxLength: 50 }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <IconButton
                title="Save"
                color="primary"
                disabled={disableSave}
                onClick={onSaveNameClick}
              >
                <Save />
              </IconButton>
              <IconButton
                title="Cancel"
                color="error"
                onClick={() => setNameEditing(false)}
              >
                <Cancel />
              </IconButton>
            </>
          )}
          {!nameEditing && (
            <>
              <Typography variant="h4">{blueprintDoc.name}</Typography>
              {canEdit && (
                <>
                  <IconButton
                    color="primary"
                    title="Edit name"
                    onClick={() => {
                      setNewName(blueprintDoc.name);
                      setNameEditing(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    title="Delete blueprint"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <DeleteForever />
                  </IconButton>
                </>
              )}
            </>
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
                  src="/noscreenshot.png"
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
                    src={blueprintDoc.screenshotUrl}
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
                Submitted by{" "}
                <Link
                  component={NextLink}
                  href={`/blueprints/user/${blueprintDoc.username}`}
                >
                  {blueprintDoc.username}
                </Link>
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                Last updated{" "}
                {DateTime.fromJSDate(blueprintDoc.updated).toLocaleString(
                  DateTime.DATETIME_MED
                )}
              </Typography>
              <Typography variant="body1">
                Created{" "}
                {DateTime.fromJSDate(blueprintDoc.created).toLocaleString(
                  DateTime.DATETIME_MED
                )}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {blueprintDoc.kind === "f"
                  ? "Minimum game version"
                  : "Created with game version"}{" "}
                {blueprintDoc.gameVersion}
              </Typography>
              {blueprintVersions && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Version history
                  </Typography>
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table aria-label="version history table" size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Created</TableCell>
                          <TableCell>Game version</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {blueprintVersions.versions.map((v) => (
                          <TableRow key={v.created.getTime()}>
                            <TableCell>
                              {DateTime.fromJSDate(v.created).toLocaleString(
                                DateTime.DATETIME_MED
                              )}
                            </TableCell>
                            <TableCell>{v.gameVersion}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() =>
                                  copyBlueprintToClipboard(v.blueprint)
                                }
                                aria-label="Copy blueprint"
                              >
                                <CopyAll />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Paper sx={{ padding: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Description</Typography>
                  {canEdit && !descriptionEditing && (
                    <IconButton
                      color="primary"
                      title="Edit description"
                      onClick={() => {
                        setNewDescription(blueprintDoc.description);
                        setDescriptionEditing(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  )}
                  {canEdit && descriptionEditing && (
                    <>
                      <IconButton
                        title="Save"
                        color="primary"
                        disabled={disableSave}
                        onClick={onSaveDescriptionClick}
                      >
                        <Save />
                      </IconButton>
                      <IconButton
                        title="Cancel"
                        color="error"
                        onClick={() => setDescriptionEditing(false)}
                      >
                        <Cancel />
                      </IconButton>
                    </>
                  )}
                </Stack>
                {descriptionEditing && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={10}
                    id="description"
                    label="Description (supports markdown)"
                    name="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                )}
                {!descriptionEditing && (
                  <Typography variant="body1" sx={{ mt: 1 }} component="div">
                    <ReactMarkdown>
                      {blueprintDoc.description || "none"}
                    </ReactMarkdown>
                  </Typography>
                )}
              </Paper>
              {parsedBlueprint?.kind === "folder" && (
                <Paper sx={{ padding: 2 }} className="folder">
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Folder contents
                  </Typography>
                  <TreeView
                    data={getTreeViewDataRoot()}
                    nodeRenderer={({
                      element,
                      isBranch,
                      isExpanded,
                      getNodeProps,
                      level,
                    }) => (
                      <div
                        {...getNodeProps()}
                        style={{ paddingLeft: 20 * (level - 1) }}
                      >
                        {isBranch ? (
                          isExpanded ? (
                            <FolderOpen />
                          ) : (
                            <Folder />
                          )
                        ) : (
                          <TextSnippet />
                        )}
                        {element.name}
                      </div>
                    )}
                  />
                </Paper>
              )}
              <Accordion
                defaultExpanded
                expanded={bpDetailsOpen}
                onChange={(_, isExpanded) => setBpDetailsOpen(isExpanded)}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6">Blueprint</Typography>
                    <IconButton
                      onClick={handleCopyClick}
                      aria-label="Copy blueprint"
                    >
                      <CopyAll />
                    </IconButton>
                    {canEdit && !blueprintEditing && bpDetailsOpen && (
                      <IconButton
                        color="primary"
                        title="Edit blueprint"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setNewBlueprint(blueprintDoc.blueprint);
                          setNewParsedBlueprint(parsedBlueprint);
                          setBlueprintEditing(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canEdit && blueprintEditing && bpDetailsOpen && (
                      <>
                        <IconButton
                          title="Save"
                          color="primary"
                          disabled={disableSave || !newParsedBlueprint}
                          onClick={onSaveBlueprintClick}
                        >
                          <Save />
                        </IconButton>
                        <IconButton
                          title="Cancel"
                          color="error"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setBlueprintEditing(false);
                          }}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {blueprintEditing && (
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      maxRows={10}
                      id="blueprint"
                      label="Blueprint"
                      name="blueprint"
                      value={newBlueprint}
                      error={!newBlueprint || !newParsedBlueprint}
                      helperText={
                        !newBlueprint || !newParsedBlueprint
                          ? "Invalid blueprint"
                          : undefined
                      }
                      onChange={(e) => setNewBlueprint(e.target.value)}
                    />
                  )}
                  {!blueprintEditing && (
                    <Typography
                      variant="body1"
                      sx={{ mt: 1, wordBreak: "break-word" }}
                    >
                      {blueprintDoc.blueprint}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
              {parsedBlueprint !== null && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Blueprint details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre>{JSON.stringify(parsedBlueprint, null, 2)}</pre>
                  </AccordionDetails>
                </Accordion>
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
