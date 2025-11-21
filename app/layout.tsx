import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FarcasterProvider } from "@/lib/farcaster-sdk";
import { WorldProvider } from "@/lib/world-sdk";
import { UnifiedAuthProvider } from "@/lib/contexts/UnifiedAuthContext";
import { AppProvider } from "@/lib/contexts/AppContext";
import { BackgroundMusicProvider } from "@/lib/contexts/BackgroundMusicContext";
import GlobalBottomNav from "@/components/global-bottom-nav";
import MusicControl from "@/components/music-control";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/og-image.png`,
  button: {
    title: "Play QuizCaster",
    action: {
      type: "launch_frame",
      name: "QuizCaster",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#CFB8FF"
    }
  }
};

export const metadata: Metadata = {
  title: "QuizCaster - Farcaster Quiz Game",
  description: "Battle opponents worldwide in fast-paced trivia challenges",
  openGraph: {
    title: "QuizCaster",
    description: "Battle opponents worldwide in fast-paced trivia challenges",
    images: [`${APP_URL}/og-image.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed)
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FarcasterProvider>
          <WorldProvider>
            <UnifiedAuthProvider>
              <AppProvider>
                <BackgroundMusicProvider>
                  <div className="relative">
                    {children}
                    <MusicControl />
                    <GlobalBottomNav />
                  </div>
                </BackgroundMusicProvider>
              </AppProvider>
            </UnifiedAuthProvider>
          </WorldProvider>
        </FarcasterProvider>
      </body>
    </html>
  );
}
