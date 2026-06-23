import Image from "next/image";
import Link from "next/link";
import { getVideos } from "../firebase/functions";
import styles from "./page.module.css";

export default async function Home() {
  const videos = await getVideos();

  return (
    <main className={styles.grid}>
      {videos.map((video) => (
        <Link
          key={video.id ?? video.filename}
          href={`/watch?v=${video.filename}`}
          className={styles.card}
        >
          <Image
            src="/youtube-without-thumbnail.png"
            alt={video.title ?? video.filename ?? "video"}
            width={320}
            height={180}
            className={styles.thumbnail}
          />
          <span className={styles.title}>{video.title ?? video.filename}</span>
        </Link>
      ))}
    </main>
  );
}

export const revalidate = 30;
