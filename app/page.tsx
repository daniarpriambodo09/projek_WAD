//siDesa/app/page.tsx
"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Chatbot from "@/components/chatbot" // Import kembali di sini

export default function Home() {
  const [activePage, setActivePage] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Tentukan halaman mana saja yang ingin menampilkan chatbot
  const showChatbotOnPages = [
    "overview",
    "ekonomi",
    "lingkungan",
    "infrastruktur",
    "kesehatan", 
    "digital",
    "pendidikan"
    // tambahkan halaman lain sesuai kebutuhan
  ]

  const shouldShowChatbot = showChatbotOnPages.includes(activePage);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Dashboard activePage={activePage} />
        {shouldShowChatbot && <Chatbot />} {/* Tampilkan hanya jika kondisi terpenuhi */}
      </div>
    </div>
  )
}