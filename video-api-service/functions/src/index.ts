import { Storage } from "@google-cloud/storage";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import { onCall } from "firebase-functions/v2/https";

initializeApp();

const firestore = getFirestore();
const storage = new Storage();

const rawVideoBucketName = "neetcode-youtube-course-raw-videos";

// When set (offline/Docker mode), this is the browser-reachable base URL of the
// fake-gcs storage emulator. The browser — not this function — uploads to it, so
// it must be the host URL (http://localhost:4443), not the container name. See
// docker-compose.yml.
const gcsApiEndpoint = process.env.GCS_API_ENDPOINT;

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadUrl = onCall(
  { maxInstances: 1 },
  async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The functions must be called while authenticated",
      );
    }

    const auth = request.auth;
    const data = request.data;

    const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

    // Offline mode: fake-gcs doesn't verify signatures and only accepts uploads
    // on the JSON-API simple-upload endpoint via POST. Generating a signed PUT
    // URL would require signing credentials the emulator doesn't have (and
    // fake-gcs wouldn't honour the path-style signed URL anyway), so hand the
    // browser the upload endpoint directly.
    if (gcsApiEndpoint) {
      return {
        url:
          `${gcsApiEndpoint}/upload/storage/v1/b/${rawVideoBucketName}` +
          `/o?uploadType=media&name=${encodeURIComponent(fileName)}`,
        method: "POST",
        fileName,
      };
    }

    // Real GCS: return a short-lived signed URL the browser PUTs the file to.
    const [url] = await storage
      .bucket(rawVideoBucketName)
      .file(fileName)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

    return {
      url,
      method: "POST",
      fileName,
    };
  },
);
