<<<<<<< HEAD
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
=======

export const metadata = {
  title: 'Hey Jude - Shared Household Assistant',
  description: 'Track household balances and expenses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
>>>>>>> 5dcb09e4c71c4f1415817fcfba3f12cec24a9961
