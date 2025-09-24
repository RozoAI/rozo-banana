import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../providers";
import "../lib/cryptoPolyfill";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Banana 🍌 - AI Image Generation",
  description:
    "Generate amazing AI images with points. Earn through referrals!",
  icons: {
    icon: "/banana-favicon.svg",
    shortcut: "/banana-favicon.svg",
    apple: "/banana.svg",
  },
};

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
