import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Varta — Current affairs, organized like a dashboard",
  description:
    "A focused, searchable workspace for weekly current affairs PDFs. Find, read, and revise notes in seconds.",
  applicationName: "Varta",
  keywords: ["current affairs", "weekly notes", "PDF library", "UPSC", "revision"],
};

export const viewport: Viewport = {
  themeColor: "#050c16",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
