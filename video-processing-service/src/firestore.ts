import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// This is a backend service, so it talks to Firestore through the Admin SDK
// (firebase-admin), not the client web SDK (firebase/firestore). The Admin SDK
// connects to the emulator automatically when FIRESTORE_EMULATOR_HOST is set —
// the docker-compose firebase-emulator service publishes Firestore on port 8080.
// Default to localhost:8080 for host-machine runs; the container overrides it via
// the env var to reach the emulator by its service name (e.g. firebase-emulator:8080).
process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";

// Guard against re-initialization (e.g. ts-node reloads): initializeApp throws if
// the default app already exists, so only create it once.
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

/**
 *  Fetches a video document from Firestore by its ID.
 * @param videoId The ID of the video document to fetch.
 * @returns A Promise that resolves to the Video object if found, or null if not found.
 */
export async function getVideo(videoId: string): Promise<Video | null> {
  const docRef = firestore.collection(videoCollectionId).doc(videoId);
  const docSnapshot = await docRef.get();
  if (!docSnapshot.exists) {
    return null;
  }
  return { id: docSnapshot.id, ...docSnapshot.data() } as Video;
}

/**
 * Sets or updates a video document in Firestore with the provided video data.
 * @param videoId The ID of the video document to set or update.
 * @param video The Video object containing the data to set or update.
 * @returns A Promise that resolves when the operation is complete.
 */
export async function setVideo(videoId: string, video: Video): Promise<void> {
  await firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set(video, { merge: true });
}

/**
 * Checks if a video document with the given ID exists in Firestore.
 * @param videoId  The ID of the video document to check.
 * @returns A Promise that resolves to true if the video document does not exist (i.e., it is new), or false if it already exists.
 */
export async function isVideoNew(videoId: string): Promise<boolean> {
  const docRef = firestore.collection(videoCollectionId).doc(videoId);
  const snapshot = await docRef.get();
  // .get() resolves to a DocumentSnapshot; the stored fields live under .data(),
  // not on the snapshot itself. A video is "new" when it has no processing status
  // yet (no doc, or a doc without a status).
  return (snapshot.data() as Video | undefined)?.status === undefined;
}
