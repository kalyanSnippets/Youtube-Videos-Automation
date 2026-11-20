import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "AI with Kalyan", template: "%s · AI with Kalyan" },
  icons: { icon: "/api/logo", apple: "/api/logo" },
  description: "Free AI prompts and templates from AI with Kalyan videos. Copy, paste, create.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
