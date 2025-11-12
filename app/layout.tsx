import type React from "react"
import type { Metadata } from "next"
// import localFont from "next/font/local"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ChatbotProvider } from '@/context/ChatbotContext';
import Chatbot from '@/components/chatbot';

// Import font lokal Geist & Geist Mono


export const metadata: Metadata = {
  title: "siDesa - Dashboard Analitik Berbasis AI",
  description: "Dashboard analitik untuk Sistem Informasi Desa Jawa Timur",
  icons :
  {icon : "/logo/siDesa2.png"}
}


// Di dalam root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatbotProvider>
          {children}
          <Chatbot /> {/* pastikan Chatbot di dalam provider */}
        </ChatbotProvider>
      </body>
    </html>
  );
}
