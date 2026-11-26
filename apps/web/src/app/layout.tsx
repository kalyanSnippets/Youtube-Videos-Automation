import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "AI with Kalyan", template: "%s · AI with Kalyan" },
  icons: { icon: "/api/logo", apple: "/api/logo" },
  description: "Free AI prompts and templates from AI with Kalyan videos. Copy, paste, create.",
};

export const viewport: Viewport = {
  themeColor: "#0a0c11",
  // Lets the bottom tab bar sit above the iPhone home indicator (env(safe-area-inset-bottom)).
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
