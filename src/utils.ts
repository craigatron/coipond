"use client";

import { BlueprintFolder } from "coi-bp-parse";
import { enqueueSnackbar } from "notistack";

export const successSnack = (msg: string) => {
  enqueueSnackbar(msg, {
    variant: "success",
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });
};

export const errorSnack = (msg: string) => {
  enqueueSnackbar(msg, {
    variant: "error",
    anchorOrigin: { vertical: "top", horizontal: "center" },
  });
};

const getMinGameVersionInternal = (
  folder: BlueprintFolder
): string | undefined => {
  let min: string | undefined;
  for (const bp of folder.blueprints) {
    if (!min || bp.gameVersion < min) {
      min = bp.gameVersion;
    }
  }
  for (const subfolder of folder.blueprintFolders) {
    const folderMin = getMinGameVersionInternal(subfolder);
    if (folderMin && (!min || folderMin < min)) {
      min = folderMin;
    }
  }
  return min;
};

// Determine the blueprint with the lowest game version in this folder.
export const getMinGameVersion = (folder: BlueprintFolder): string => {
  if (!folder.blueprints.length && !folder.blueprintFolders.length) {
    throw new Error("folder must not be empty");
  }

  const folderMin = getMinGameVersionInternal(folder);
  if (!folderMin) {
    throw new Error("could not determine min game version");
  }

  return folderMin;
};
