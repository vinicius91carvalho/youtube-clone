import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app);

// Reach the Functions emulator from the right host: the browser uses localhost,
// while SSR runs inside the container and must use the compose service name.
const functionsEmulatorHost =
  typeof window === "undefined"
    ? (process.env.FUNCTIONS_EMULATOR_HOST ?? "firebase-emulator")
    : "localhost";
connectFunctionsEmulator(functions, functionsEmulatorHost, 5001);

const generateUploadUrlFunction = httpsCallable(functions, "generateUploadUrl");
const getVideosFunction = httpsCallable(functions, "getVideos");

export interface Video {
  id?: string;
  uid?: string;
  filename?: string;
  status?: "processing" | "processed" | "failed";
  title?: string;
  description?: string;
}

interface UploadUrlResponse {
  url: string;
  method: string;
  fileName: string;
}

export async function uploadVideo(file: File): Promise<string> {
  const response = await generateUploadUrlFunction({
    fileExtension: file.name.split(".").pop(),
  });
  const data = response.data as UploadUrlResponse;

  // The server returns the upload URL and HTTP method (real GCS or fake-gcs).
  const uploadResponse = await fetch(data.url, {
    method: data.method,
    body: file,
    headers: {
      "Content-Type": file.type,
    },
    cache: "no-cache",
  });

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload failed with status ${uploadResponse.status}: ${await uploadResponse.text()}`,
    );
  } else {
    // Simulate the Pub/Sub message the server would send to the processing service.
    await fetch("http://localhost:3001/process-video", {
      method: "POST",
      body: JSON.stringify({
        message: {
          data: btoa(
            JSON.stringify({
              name: data.fileName,
            }),
          ),
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return data.fileName;
}

export async function getVideos(): Promise<Video[]> {
  const response = await getVideosFunction();
  return response.data as Video[];
}
