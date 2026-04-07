import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/src/lib/firebase";

type AuthContextValue = {
  user: User | null;
  emailVerified: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setEmailVerified(Boolean(nextUser?.emailVerified));
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      emailVerified,
      initializing,
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signup: async (email: string, password: string) => {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
      },
      logout: async () => {
        await signOut(auth);
      },
      sendVerificationEmail: async () => {
        if (!auth.currentUser) {
          throw new Error("No authenticated user.");
        }

        await sendEmailVerification(auth.currentUser);
      },
      resetPassword: async (email: string) => {
        await sendPasswordResetEmail(auth, email.trim());
      },
      refreshUser: async () => {
        if (!auth.currentUser) {
          setUser(null);
          setEmailVerified(false);
          return;
        }

        await auth.currentUser.reload();
        setUser(auth.currentUser);
        setEmailVerified(Boolean(auth.currentUser.emailVerified));
      },
    }),
    [emailVerified, initializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
