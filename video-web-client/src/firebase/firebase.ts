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
  // Required by signInWithPopup; the Auth emulator rewrites it to its own handler.
  authDomain: "demo-neetcode-firebase.firebaseapp.com",
};

// Reuse the existing app on HMR/SSR re-evaluation to avoid app/duplicate-app.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth emulator, reached from the browser via the published host port.
connectAuthEmulator(auth, "http://localhost:9099");

// Signs in with a Google popup.
export async function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

// Signs out the current user.
export async function signOut() {
  await auth.signOut();
}

// Subscribes to auth state changes; returns an unsubscribe function.
export function onAuthStateChangedHelper(
  callback: (user: User | null) => void,
) {
  return onAuthStateChanged(auth, callback);
}
