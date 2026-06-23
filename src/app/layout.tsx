import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dopamine — Управление компьютерным клубом",
  description: "Система управления компьютерным клубом Dopamine",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-[#f5f5f5] antialiased bg-[#0a0a0a]">{children}</body>
    </html>
  );
}
