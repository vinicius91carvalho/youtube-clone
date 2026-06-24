"use client";

import type { User } from "firebase/auth";
import { signInWithGoogle, signOut } from "@/src/firebase/firebase";
import styles from "./sign-in-or-out.module.css";

interface SignInProps {
  user: User | null;
}

export function SignIn({ user }: SignInProps) {
  return user ? (
    <button type="button" className={styles["signin-or-out"]} onClick={signOut}>
      Sign out
    </button>
  ) : (
    <button
      type="button"
      className={styles["signin-or-out"]}
      onClick={signInWithGoogle}
    >
      Sign In
    </button>
  );
}
