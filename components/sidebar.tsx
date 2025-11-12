"use client"

import { useState } from "react"

interface SidebarProps {
  activePage: string
  setActivePage: (page: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen }: SidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>("analisis")

  // --- ⭐️ ATUR UKURAN IKON DI SINI ⭐️ ---
  // Ubah nilai ini untuk mengatur ukuran semua ikon menu sekaligus
  const iconSize = "w-12 h-12" // Contoh: "w-5 h-5", "w-7 h-7", "w-8 h-8"

  const menuItems = [
    {
      label: "TIPOLOGI DAERAH",
      icon: "/logo/HOME.png",
      submenu: [
        { label: "Overview", id: "overview" },
        { label: "Infrastruktur", id: "infrastruktur" },
        { label: "Ekonomi", id: "ekonomi" },
        { label: "Kesehatan", id: "kesehatan" },
        { label: "Pendidikan", id: "pendidikan" },
        { label: "Lingkungan", id: "lingkungan" },
        { label: "Digital", id:"digital"}
      ],
    },
    {
      label: "MACHINE LEARNING",
      icon: "/logo/Machine Learning.png",
      submenu: [
        { label: "Clustering", id: "clustering" },
      ],
    },
    {
      label: "METODOLOGI",
      icon: "/logo/Metodelogi.png",
      submenu: [{ label: "Metodologi", id: "metodologi" }],
    },
    {
      label: "INFORMATION",
      icon: "/logo/Information_about.png",
      submenu: [
        { label: "ABOUT US", id: "about-us" },
        { label: "Data Mentah", id: "data-mentah" },
      ],
    },
  ]

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-[#016B61] border-r border-gray-700 transition-all duration-300 flex flex-col overflow-y-auto z-20`}
    >
      {/* Header dengan Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <img
              src="/logo/LOGO.png"
              alt="Logo siDesa"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-xl font-bold text-[#F1F5F9]">SiDesa</h1>
          </div>
        ) : (
          <div></div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        >
          {isOpen ? "←" : "→"}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((menu) => (
          <div key={menu.label}>
            <button
              onClick={() => setExpandedMenu(expandedMenu === menu.label ? null : menu.label)}
              className={`w-full flex items-center justify-between p-3 hover:bg-gray-700 rounded transition-colors text-left ${
                !isOpen ? 'p-2' : '' // 👈 Kurangi padding saat tertutup
              }`}
            >
              <span className="flex items-center gap-3">
                {/* --- MODIFIKASI UKURAN UNTUK SIDEBAR TERBUKA & TERTUTUP --- */}
                <img
                  src={menu.icon}
                  alt={`${menu.label} icon`}
                  className={`${
                    isOpen 
                      ? 'w-10 h-10'           // Saat terbuka: ukuran besar
                      : 'w-8 h-8 object-cover' // Saat tertutup: ukuran sedang + object-cover agar fill container
                  }`}
                />
                {isOpen && <span className="text-sm font-bold text-gray-200">{menu.label}</span>}
              </span>
              {isOpen && (
                <span className="text-xs text-gray-400">
                  {expandedMenu === menu.label ? "▼" : "▶"}
                </span>
              )}
            </button>

            {isOpen && expandedMenu === menu.label && (
              <div className="ml-6 space-y-1 mt-1">
                {menu.submenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      activePage === item.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logo di bawah menu saat sidebar tertutup */}
      {!isOpen && (
        <div className="mt-auto p-4 flex justify-center">
          <img
            src="/logo/siDesa2.png"
            alt="Logo siDesa"
            className="w-12 h-12 object-contain"
          />
        </div>
      )}

      {/* Footer (hanya muncul saat terbuka) */}
      {isOpen && (
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <p>Dashboard Analitik</p>
          <p>Berbasis AI</p>
        </div>
      )}
    </aside>
  )
}