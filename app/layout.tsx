import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ChatbotProvider } from '@/context/ChatbotContext';
// import Chatbot from '@/components/chatbot'; // HAPUS BARIS INI

export const metadata: Metadata = {
  title: "siDesa - Dashboard Analitik Berbasis AI",
  description: "Dashboard analitik untuk Sistem Informasi Desa Jawa Timur",
  icons: { icon: "/logo/siDesa2.png" }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatbotProvider>
          {children}
          {/* <Chatbot /> */} {/* KOMENTARI ATAU HAPUS INI */}
        </ChatbotProvider>
      </body>
    </html>
  );
}