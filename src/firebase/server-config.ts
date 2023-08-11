import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { BlueprintDoc, BlueprintVersion } from "./data";

interface ServerBlueprintDoc {
  uid: string;
  username: string;
  kind: "b" | "f";
  name: string;
  description: string;
  blueprint: string;
  gameVersion: string;
  views: number;
  downloads: number;
  created: Timestamp;
  updated: Timestamp;
  screenshotUrl?: string;
}

interface ServerBlueprintVersion {
  uid: string;
  versions: {
    blueprint: string;
    gameVersion: string;
    created: Timestamp;
  }[];
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({ projectId: process.env.PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

async function getBlueprint(bpId: string): Promise<BlueprintDoc | null> {
  const doc = await db.collection("blueprints").doc(bpId).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as ServerBlueprintDoc;
  return {
    ...data,
    created: data.created.toDate(),
    updated: data.updated.toDate(),
  };
}

async function getBlueprintVersions(
  bpId: string
): Promise<BlueprintVersion | null> {
  const doc = await db.collection("blueprintVersions").doc(bpId).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as ServerBlueprintVersion;
  return {
    ...data,
    versions: data.versions.map((v) => {
      return {
        ...v,
        created: v.created.toDate(),
      };
    }),
  };
}

export { auth, db, getBlueprint, getBlueprintVersions };
