import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  projectId: "demo-neetcode-firebase",
  apiKey: "1234567890",
  // signInWithPopup/Redirect require an authDomain, otherwise the SDK throws
  // auth/auth-domain-config-required. Once the Auth emulator is connected (below),
  // the popup is rewritten to the emulator's own handler, so this value just needs
  // to be present — it doesn't point at a real Firebase Hosting domain.
  authDomain: "demo-neetcode-firebase.firebaseapp.com",
};

// Guard against re-initialization: Next.js re-evaluates this module on every HMR
// update and on both the server and the client. Calling initializeApp twice for the
// default app throws app/duplicate-app, so reuse the existing instance if present.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// In Docker, the Auth emulator runs in the firebase-emulator container on port
// 9099 (see docker-compose.yml). This SDK call runs
// in the browser (the Sign In/Out component is a client component), so the emulator
// must be addressed by its host-reachable URL. Use localhost, not 0.0.0.0 — the
// latter is a bind-all address and is not a valid connection target from a browser.
connectAuthEmulator(auth, "http://localhost:9099");

/**
 * Signs in with Google popup.
 * @returns The user object.
 */
export async function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

/**
 * Signs out the user.
 */
export async function signOut() {
  await auth.signOut();
}

/**
 * Helper function to subscribe to auth state changes.
 * @param callback - The callback to call when the auth state changes.
 * @returns A function to unsubscribe from the auth state changes.
 */
export function onAuthStateChangedHelper(
  callback: (user: User | null) => void,
) {
  return onAuthStateChanged(auth, callback);
}
