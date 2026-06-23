"use client";

import { Fragment, useState } from "react";
import { uploadVideo } from "../../firebase/functions";

import styles from "./upload.module.css";

export default function Upload() {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);
    if (file) {
      void handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await uploadVideo(file);
      alert(
        `Uploaded as ${response}. It will appear once processing finishes.`,
      );
      window.location.reload();
    } catch (error) {
      alert(`Failed to upload file: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Fragment>
      <input
        id="upload"
        className={styles.uploadInput}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label
        htmlFor="upload"
        className={styles.uploadButton}
        aria-busy={uploading}
      >
        {uploading ? (
          <span className={styles.spinner} aria-label="Uploading" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <title>Upload</title>
            <path
              strokeLinecap="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        )}
      </label>
    </Fragment>
  );
}
