import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { app } from "./firebase";

// Reuse the default app initialized in firebase.ts; getFunctions() on its own
// would throw if this module were imported before the app was created.
const functions = getFunctions(app);

// In Docker, the Functions emulator runs in the firebase-emulator container on
// port 5001 (see docker-compose.yml). This call runs in the browser, so the
// emulator must be addressed by its host-reachable URL. Use localhost, not
// 0.0.0.0 — without this the SDK calls the (non-existent) production Cloud
// Functions endpoint and every upload fails with "internal"/"Failed to fetch".
connectFunctionsEmulator(functions, "localhost", 5001);

const generateUploadUrl = httpsCallable(functions, "generateUploadUrl");

export async function uploadVideo(file: File): Promise<string> {
  const response: any = await generateUploadUrl({
    fileExtension: file.name.split(".").pop(),
  });

  // The server decides the upload URL and HTTP method: a signed PUT against real
  // GCS, or a POST to the fake-gcs emulator's upload endpoint when running offline.
  const uploadResponse = await fetch(response.data.url, {
    method: response.data.method,
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload failed with status ${uploadResponse.status}: ${await uploadResponse.text()}`,
    );
  } else {
    // Simulate the Pub/Sub message that the server would normally send to the video-processing-service.
    await fetch("http://localhost:3001/process-video", {
      method: "POST",
      body: JSON.stringify({
        message: {
          data: btoa(
            JSON.stringify({
              name: response.data.fileName,
            }),
          ),
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return response.data.fileName;
}
