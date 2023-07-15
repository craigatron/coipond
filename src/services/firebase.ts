import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  Timestamp,
  doc,
  getDoc,
  initializeFirestore,
  persistentLocalCache,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

class UsernameTakenError extends Error {}

interface BlueprintDoc {
  uid: string;
  username: string;
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

interface BlueprintVersion {
  uid: string;
  versions: {
    blueprint: string;
    gameVersion: string;
    created: Timestamp;
  }[];
}

const app = initializeApp(JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG));
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
const analytics = getAnalytics(app);
const storage = getStorage(app);

const logInWithEmailAndPassword = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

const registerWithEmailAndPassword = async (
  username: string,
  email: string,
  password: string
) => {
  // see if username taken
  const usernameRef = doc(db, `usernames/${username}`);
  const usernameDoc = await getDoc(usernameRef);
  if (usernameDoc.exists()) {
    throw new UsernameTakenError();
  }

  const res = await createUserWithEmailAndPassword(auth, email, password);
  const user = res.user;
  await updateProfile(user, { displayName: username });

  const batch = writeBatch(db);
  batch.set(doc(db, `users/${user.uid}`), {
    uid: user.uid,
    username,
    authProvider: "local",
    email,
  });
  batch.set(usernameRef, { uid: user.uid });

  await batch.commit();
};

const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

const logout = () => {
  signOut(auth);
};

export {
  UsernameTakenError,
  analytics,
  auth,
  db,
  logInWithEmailAndPassword,
  logout,
  registerWithEmailAndPassword,
  sendPasswordReset,
  storage,
  type BlueprintDoc,
  type BlueprintVersion,
};
