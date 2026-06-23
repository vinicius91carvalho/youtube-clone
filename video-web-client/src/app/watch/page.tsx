"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

// fake-gcs serves processed objects from its media-download endpoint; ?alt=media
// returns the bytes instead of the object's JSON metadata.
const videoPrefix =
  "http://localhost:4443/storage/v1/b/neetcode-youtube-course-processed-videos/o/";

export default function Watch() {
  const videoSrc = useSearchParams().get("v");

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.back}>
        ← Back
      </Link>
      {videoSrc ? (
        <>
          <video
            className={styles.player}
            controls
            src={`${videoPrefix}${videoSrc}?alt=media`}
          >
            <track kind="captions" />
          </video>
          <h1 className={styles.title}>{videoSrc}</h1>
        </>
      ) : (
        <p className={styles.empty}>No video selected.</p>
      )}
    </div>
  );
}
