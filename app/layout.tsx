import type React from "react"
import type { Metadata } from "next"
// import localFont from "next/font/local"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

// Import font lokal Geist & Geist Mono


export const metadata: Metadata = {
  title: "siDesa - Dashboard Analitik Berbasis AI",
  description: "Dashboard analitik untuk Sistem Informasi Desa Jawa Timur",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${GeistSans.className} ${GeistMono.className}`}>{children}</body>
    </html>
  )
}
