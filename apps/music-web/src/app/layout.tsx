import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ChordGen — AI Chord Chart & Guitar Pro Generator",
  description:
    "Paste a YouTube link or upload a song. Get instant chord charts with lyrics and a Guitar Pro file ready to open.",
  openGraph: {
    title: "ChordGen",
    description: "AI-powered chord detection. Guitar Pro files in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-surface text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
