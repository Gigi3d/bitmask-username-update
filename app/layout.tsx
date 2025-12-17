import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bitmask Username Update",
    template: "%s | Bitmask Username Update",
  },
  description: "Update your Bitmask wallet username from campaign/testnet to mainnet. Simple 2-step process with real-time validation and tracking.",
  keywords: ["Bitmask", "username", "update", "mainnet", "Bitcoin", "RGB protocol", "wallet"],
  authors: [{ name: "Bitmask" }],
  creator: "Bitmask",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bitmask.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Bitmask Username Update",
    title: "Bitmask Username Update - Mainnet Migration",
    description: "Update your Bitmask wallet username from campaign/testnet to mainnet. Simple 2-step process with real-time validation and tracking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitmask Username Update",
    description: "Update your Bitmask wallet username from campaign/testnet to mainnet",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        suppressHydrationWarning
      >
        {children}
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

