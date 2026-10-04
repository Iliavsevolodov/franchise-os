import "./globals.css";

export const metadata = {
  title: "FRANCHISE OS",
  description: "Финансово-операционная система владельца сети франшиз"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
