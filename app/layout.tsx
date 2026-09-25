import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWA from "./pwa";

export const metadata: Metadata = {
  title: "Hey Jude — Household Financial Assistant",
  description: "A shared household money record for Cunningham & Lynne.",
  applicationName: "Hey Jude",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PWA />{children}</body>
    </html>
  );
}
