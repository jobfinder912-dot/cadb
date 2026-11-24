import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Varta — Weekly current affairs, beautifully organised",
  description:
    "A calm, searchable home for every weekly current affairs PDF. Read, revise, and download notes in seconds.",
  applicationName: "Varta",
  keywords: ["current affairs", "weekly notes", "PDF library", "UPSC", "revision"],
};

export const viewport: Viewport = {
  themeColor: "#fbfbfa",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
