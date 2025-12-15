import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";

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
  description: "Update your Bitmask username for mainnet",
  keywords: ["Bitmask", "username", "update", "mainnet"],
  authors: [{ name: "Bitmask" }],
  creator: "Bitmask",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bitmask.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Bitmask Username Update",
    title: "Bitmask Username Update",
    description: "Update your Bitmask username for mainnet",
  },
  twitter: {
    card: "summary",
    title: "Bitmask Username Update",
    description: "Update your Bitmask username for mainnet",
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
      </body>
    </html>
  );
}

