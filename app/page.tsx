"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Chatbot from "@/components/chatbot"

export default function Home() {
  const [activePage, setActivePage] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Dashboard activePage={activePage} />
        <Chatbot />
      </div>
    </div>
  )
}
