import "./globals.css";
import type { Viewport } from "next";

export const metadata = {
  title: "FRANCHISE OS",
  description: "Финансово-операционная система владельца сети франшиз"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
