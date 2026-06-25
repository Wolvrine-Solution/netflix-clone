import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChordGen — AI Chord Chart & Guitar Pro Generator",
  description:
    "Paste a YouTube link or upload a song. Get instant chord charts with lyrics and a Guitar Pro file ready to open.",
  openGraph: {
    title: "ChordGen — AI Chord & Tab Generator",
    description: "AI-powered chord detection. Guitar Pro files in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChordGen",
    description: "AI-powered chord detection. Guitar Pro files in seconds.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans bg-surface text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
