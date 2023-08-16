import { auth } from "@/firebase/client-config";
import { User } from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type ContextState = { user: User | null; loading: boolean };

const FirebaseAuthContext = createContext<ContextState | undefined>(undefined);

const FirebaseAuthProvider = (props: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const value = { user, loading };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setLoading(false);
      setUser(u);
    });
    return unsubscribe;
  }, []);

  return (
    <FirebaseAuthContext.Provider value={value}>
      {props.children}
    </FirebaseAuthContext.Provider>
  );
};

const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useFirebaseAuth must be used within a FirebaseAuthProvider"
    );
  }
  return context;
};

export { FirebaseAuthProvider, useFirebaseAuth };
