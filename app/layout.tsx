import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Mabry is licensed to Mercive and may only be served from Mercive
// properties. If this app is ever hosted elsewhere, delete app/fonts and this
// block; the fallback sans-serif in globals.css then takes over.
const mabry = localFont({
  src: [
    { path: "./fonts/mabry-light.woff2", weight: "300" },
    { path: "./fonts/mabry-regular.woff2", weight: "400" },
    { path: "./fonts/mabry-medium.woff2", weight: "500" },
  ],
  variable: "--font-mabry",
  display: "swap",
});

const plex = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Mercive Julefrokost",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#4d0c16",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mabry.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
