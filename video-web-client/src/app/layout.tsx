import type { Metadata } from "next";
import Navbar from "../components/navbar/navbar";

export const metadata: Metadata = {
  title: "YouTube Clone",
  description: "A YouTube clone demo built with Next.js and Firebase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
