import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bengali Buddy",
  description: "Picture + audio Bengali lessons (BD dialect) with real photos.",
  manifest: "/manifest.json",
  themeColor: "#111111",
  viewport: { width: "device-width", initialScale: 1, viewportFit: "cover" },
  icons: { icon: "/icons/icon-192.png", shortcut: "/icons/icon-192.png", apple: "/icons/icon-192.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
