"use client";

import type { User } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChangedHelper } from "@/src/firebase/firebase";
import { SignIn } from "../sign-in-or-out/sign-in-or-out";
import styles from "./navbar.module.css";

export default function Navbar() {
  // Init user state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user);
    });

    // Clean up subscription to auth state events
    return () => unsubscribe();
  });

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoContainer}>
        <Image src="/logo.svg" alt="Youtube Logo" width={29} height={20} />
        <span className={styles.logoName}>Youtube</span>
      </Link>
      {
        // TODO: Add a upload button here
      }
      <SignIn user={user} />
    </nav>
  );
}
