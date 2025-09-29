import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../lib/cryptoPolyfill";
import { Providers } from "../providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || "https://b.rozo.ai";

  const embedConfig = {
    version: "1",
    imageUrl: "https://b.rozo.ai/banana.svg",
    button: {
      title: `Launch Rozo Banana 🍌`,
      action: {
        type: "launch_frame",
        name: "Rozo Banana 🍌",
        url: URL,
        splashImageUrl: "https://b.rozo.ai/banana.svg",
        splashBackgroundColor: "#ffffff",
      },
    },
  };

  const ogMetadata = {
    title: "Rozo Banana 🍌 - AI Image Generation",
    description:
      "Generate amazing AI images with points. Earn through referrals!",
    icons: {
      icon: "https://b.rozo.ai/banana.svg",
      shortcut: "https://b.rozo.ai/banana.svg",
      apple: "https://b.rozo.ai/banana.svg",
    },
  };

  return {
    robots: {
      index: false,
      follow: false,
    },
    other: {
      "fc:miniapp": JSON.stringify(embedConfig),
      "fc:frame": JSON.stringify(embedConfig),
    },
    ...ogMetadata,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
