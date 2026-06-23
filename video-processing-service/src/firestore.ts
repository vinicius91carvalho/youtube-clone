import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// The Admin SDK auto-connects to the Firestore emulator when this is set; the
// container overrides it to reach the emulator by its compose service name.
process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";

// Reuse the existing app to avoid re-initialization on reload.
const existingApp = getApps()[0];
export const app =
  existingApp ?? initializeApp({ projectId: "demo-neetcode-firebase" });

const firestore = getFirestore(app);

const videoCollectionId = "videos";

export interface Video {
  id?: string;
  uid?: string;
  filename?: string;
  status?: "processing" | "processed" | "failed";
  title?: string;
  description?: string;
}

// Fetches a video document by ID, or null if it doesn't exist.
export async function getVideo(videoId: string): Promise<Video | null> {
  const docRef = firestore.collection(videoCollectionId).doc(videoId);
  const docSnapshot = await docRef.get();
  if (!docSnapshot.exists) {
    return null;
  }
  return { id: docSnapshot.id, ...docSnapshot.data() } as Video;
}

// Creates or merges a video document.
export async function setVideo(videoId: string, video: Video): Promise<void> {
  await firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set(video, { merge: true });
}

// A video is "new" when it has no processing status yet (no doc, or no status).
export async function isVideoNew(videoId: string): Promise<boolean> {
  const docRef = firestore.collection(videoCollectionId).doc(videoId);
  const snapshot = await docRef.get();
  return (snapshot.data() as Video | undefined)?.status === undefined;
}
