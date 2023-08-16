import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  initializeFirestore,
  persistentLocalCache,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG!);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
const storage = getStorage(app);

class UsernameTakenError extends Error {}

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
  auth,
  db,
  logInWithEmailAndPassword,
  logout,
  registerWithEmailAndPassword,
  sendPasswordReset,
  storage,
};
