import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";

export default function Navbar() {
    return (
        <nav className={styles.nav}>
            <Link href="/" className={styles.logoContainer}>
                <Image
                    src="/logo.svg"
                    alt="Youtube Logo"
                    width={29}
                    height={20}
                />
                <span className={styles.logoName}>
                    Youtube
                </span>
            </Link>
        </nav>
    )
}