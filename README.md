# YouTube Clone

A YouTube-style video platform built while following the [neetcode.io](https://neetcode.io) full-stack course.

> **What's different from the course:** the original course deploys to real Google Cloud
> (Cloud Storage, Cloud Run, Pub/Sub) and real Firebase. **This version runs 100% offline
> with Docker** — no Google Cloud account, no billing, no internet required. Cloud Storage is
> replaced by [`fake-gcs-server`](https://github.com/fsouza/fake-gcs-server) and Firebase
> Auth/Firestore/Functions run inside the official **Firebase Emulator Suite**. Everything
> starts with a single `docker compose up`.

## Features

* List videos
* Watch a video
* Sign in / out (Google auth, via emulator)
* Upload a video
* Watch the transcoded (360p) video

## Tech Stack

* **TypeScript** — across all services
* **Next.js** + **React** — web client (`video-web-client`)
* **Express.js** — video processing service (`video-processing-service`)
* **FFmpeg** — video transcoding (raw → 360p)
* **Firebase Functions** — user creation + signed upload URLs (`video-api-service`)
* **Firebase Auth / Firestore** — authentication and user data
* **Docker** / Docker Compose — local orchestration
* **Biome** — linting & formatting

### Offline replacements for Google Cloud

| Course (cloud) | This project (local) |
| --- | --- |
| Google Cloud Storage | `fake-gcs-server` container |
| Firebase Auth / Firestore / Functions | Firebase Emulator Suite container |
| Cloud Run / Pub/Sub trigger | `POST /process-video` called manually (see [Testing](#testing-the-video-processing)) |

## Architecture

```
                ┌─────────────────────┐
                │  video-web-client   │  Next.js UI (sign in, upload, watch)
                │   localhost:3000    │
                └──────────┬──────────┘
                           │ Firebase SDK (Auth + callable functions)
                ┌──────────▼──────────┐
                │  firebase-emulator  │  Auth :9099 · Firestore :8080
                │   Functions :5001   │  Emulator UI :4000
                │  (video-api-service)│  createUser + generateUploadUrl
                └──────────┬──────────┘
                           │ signed upload URL
                ┌──────────▼──────────┐        ┌────────────────────────┐
                │      fake-gcs       │◄───────│  video-processor       │
                │   localhost:4443    │ down/up│  Express :3001         │
                │  raw + processed    │ videos │  FFmpeg → 360p         │
                │      buckets        │───────►│  POST /process-video   │
                └─────────────────────┘        └────────────────────────┘
```

Two GCS buckets are auto-created by `fake-gcs` from the folder layout under
`data/gcs-data/`:

* `neetcode-youtube-course-raw-videos` — uploads land here (seeded with a sample video)
* `neetcode-youtube-course-processed-videos` — transcoded output is written here

## Services

| Directory | What it is | Port(s) |
| --- | --- | --- |
| `video-web-client` | Next.js front-end | `3000` |
| `video-processing-service` | Express + FFmpeg transcoder | `3001` → `3000` in container |
| `video-api-service` | Firebase Functions (`createUser`, `generateUploadUrl`) | runs in emulator `5001` |
| `data/gcs-data` | fake-gcs storage root (buckets persist here) | — |

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/) and Docker Compose
* That's it — nothing else needs to be installed locally to run the stack.

## Run locally

From the repository root:

```bash
docker compose up
```

This builds and starts everything. First boot installs dependencies inside the
containers, so give it a minute. Once up, the following are available:

| URL | What |
| --- | --- |
| http://localhost:3000 | Web client |
| http://localhost:4000 | Firebase Emulator UI (Auth, Firestore, Functions, logs) |
| http://localhost:3001 | Video processing service |
| http://localhost:4443 | fake-gcs (Cloud Storage emulator) |

To stop: `Ctrl+C`, or `docker compose down` to remove the containers.

### Where local data lives

Runtime state is persisted to the host under `data/` (git-ignored except for the
seed video and `.gitkeep` markers):

```
data/
├─ gcs-data/                                   # fake-gcs storage root
│  ├─ neetcode-youtube-course-raw-videos/      # uploaded raw videos (seeded sample)
│  └─ neetcode-youtube-course-processed-videos/# transcoded 360p output
└─ video-processing-service/
   ├─ raw-videos/                              # processor scratch (download)
   └─ processed-videos/                        # processor scratch (FFmpeg output)
```

## Testing the video processing

In production this endpoint is triggered by a Cloud Pub/Sub message when a file
lands in the raw bucket. Offline, you trigger it manually.

Send the example request in
[`video-processing-service/http-examples/upload-video.http`](video-processing-service/http-examples/upload-video.http).
It posts a base64 Pub/Sub-style payload naming an object in the raw bucket; the
service downloads `gs://neetcode-youtube-course-raw-videos/<name>`, transcodes it
to 360p, and uploads the result to the processed bucket.

```http
POST http://localhost:3001/process-video
Content-Type: application/json

{
  "message": {
    "data": "eyJuYW1lIjoiZXhhbXBsZS1lcGljLW9mLWdpbGdhbWVzaC5tcDQifQ=="
  }
}
```

> `data` is base64 of `{"name":"example-epic-of-gilgamesh.mp4"}` — the repo ships
> with `example-epic-of-gilgamesh.mp4` already seeded in the raw bucket, so this
> request works out of the box.

The recommended way to fire it is the
[httpYac VS Code plugin](https://marketplace.visualstudio.com/items?itemName=anweber.vscode-httpyac),
but any HTTP client (curl, Postman, etc.) works:

```bash
curl -X POST http://localhost:3001/process-video \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"eyJuYW1lIjoiZXhhbXBsZS1lcGljLW9mLWdpbGdhbWVzaC5tcDQifQ=="}}'
```

After it completes, the transcoded file appears in
`data/gcs-data/neetcode-youtube-course-processed-videos/`.

## Notes / gotchas

These are baked into the Compose and source config (with inline comments explaining why):

* **`GCS_API_ENDPOINT`, not `STORAGE_EMULATOR_HOST`** — the latter makes
  `@google-cloud/storage` 404 against fake-gcs. The endpoint is forwarded as
  `apiEndpoint` in `storage.ts`.
* **fake-gcs `-filesystem-root /data`** makes runtime-uploaded objects persist
  back to the host instead of the container's internal storage.
* **Web client `node_modules` / `.next` live in named volumes**, isolated from the
  host copy, to avoid uid/path collisions between the root-running container and
  local `next dev`.
* **Auth emulator is addressed as `localhost:9099` from the browser**, since the
  Firebase SDK call runs client-side.
