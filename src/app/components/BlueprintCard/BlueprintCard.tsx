"use client";

import { IndexedBlueprint } from "@/algolia/client";
import { db } from "@/firebase/client-config";
import { BlueprintDoc } from "@/firebase/data";
import { CopyAll, Folder, Share, TextSnippet } from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { DateTime } from "luxon";
import NextLink from "next/link";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

export default function BlueprintCard(props: {
  blueprintObj: BlueprintDoc | IndexedBlueprint;
  blueprintId?: string;
  screenshotOverride?: string;
}) {
  const [screenshot, setScreenshot] = useState("");

  useEffect(() => {
    if (props.screenshotOverride) {
      setScreenshot(props.screenshotOverride);
    } else if (!props.blueprintId || !props.blueprintObj.screenshotUrl) {
      setScreenshot("/noscreenshot.png");
    } else {
      setScreenshot(props.blueprintObj.screenshotUrl);
    }
  }, [props]);

  const handleCopyClick = async () => {
    let blueprintText: string;
    if ("objectID" in props.blueprintObj) {
      // need to fetch from firebase
      const docRef = doc(db, "blueprints", props.blueprintObj.objectID);
      const bpDoc = (await getDoc(docRef))?.data();
      if (!bpDoc) {
        enqueueSnackbar("Could not get blueprint string", {
          variant: "error",
          anchorOrigin: { vertical: "top", horizontal: "center" },
        });
        return;
      }
      blueprintText = bpDoc.blueprint;
    } else {
      blueprintText = props.blueprintObj.blueprint;
    }
    navigator.clipboard.writeText(blueprintText);
    enqueueSnackbar("Copied blueprint!", {
      variant: "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  const handleShareClick = () => {
    const url = `${window.location.origin}/blueprints/${props.blueprintId}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar("Copied blueprint URL!", {
      variant: "success",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  const cardContents = (
    <>
      <CardHeader
        avatar={props.blueprintObj.kind === "f" ? <Folder /> : <TextSnippet />}
        title={props.blueprintObj.name}
        subheader={"Submitted by " + props.blueprintObj.username}
      />
      <CardMedia
        component="img"
        sx={{ height: 175, objectFit: "contain" }}
        image={screenshot}
      ></CardMedia>
      <CardContent>
        <Typography variant="body2">
          <strong>Last updated: </strong>{" "}
          {(typeof props.blueprintObj.updated === "number"
            ? DateTime.fromMillis(props.blueprintObj.updated)
            : DateTime.fromJSDate(props.blueprintObj.updated)
          ).toLocaleString(DateTime.DATETIME_MED)}
        </Typography>
        <Typography variant="body2">
          <strong>
            {props.blueprintObj.kind === "f" ? "Min version:" : "Version:"}
          </strong>{" "}
          {props.blueprintObj.gameVersion}
        </Typography>
      </CardContent>
    </>
  );

  return (
    <Card variant="outlined" sx={{ maxHeight: 450, width: 400, maxWidth: 400 }}>
      {props.blueprintId === undefined ? (
        cardContents
      ) : (
        <CardActionArea
          component={NextLink}
          href={`/blueprints/${props.blueprintId}`}
        >
          {cardContents}
        </CardActionArea>
      )}
      <CardActions>
        <IconButton
          onClick={handleCopyClick}
          aria-label="Copy blueprint"
          title="Copy blueprint"
        >
          <CopyAll />
        </IconButton>
        {props.blueprintId !== undefined && (
          <IconButton
            onClick={handleShareClick}
            aria-label="Copy URL"
            title="Copy URL"
          >
            <Share />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}
