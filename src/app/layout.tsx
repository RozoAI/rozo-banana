import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from '../providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Banana - AI Image Generation",
  description: "Generate amazing AI images with points. Earn through referrals!",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/banana.svg',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
