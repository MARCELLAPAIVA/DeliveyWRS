import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery WRS",
  description: "Plataforma de delivery white-label com Next.js + Supabase"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
