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

  const iconSize = "w-12 h-12"

  const menuItems = [
    {
      label: "TIPOLOGI DAERAH",
      icon: "/logo/HOME.png",
      submenu: [
        { label: "Tipologi", id: "overview" },
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
      } transition-all duration-300 flex flex-col overflow-y-auto z-20 relative`}
      style={{
        background: "rgba(10, 31, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(34, 211, 238, 0.2)",
        boxShadow: "0 0 30px rgba(16, 185, 129, 0.1), inset 0 0 50px rgba(34, 211, 238, 0.05)",
      }}
    >
      {/* Glow effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(34, 211, 238, 0.03) 0%, transparent 50%, rgba(16, 185, 129, 0.03) 100%)",
        }}
      ></div>

      {/* Header dengan Logo */}
      <div 
        className="p-4 flex items-center justify-between relative z-10"
        style={{
          borderBottom: "1px solid rgba(34, 211, 238, 0.2)",
          background: "rgba(16, 185, 129, 0.08)",
        }}
      >
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div 
              className="relative"
              style={{
                filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))",
              }}
            >
              <img
                src="/logo/LOGO.png"
                alt="Logo siDesa"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 
              className="text-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 20px rgba(34, 211, 238, 0.3)",
              }}
            >
              SiDesa
            </h1>
          </div>
        ) : (
          <div></div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded transition-all duration-300 relative overflow-hidden group"
          style={{
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            color: "#22d3ee",
          }}
          aria-label={isOpen ? "Tutup menu" : "Buka menu"}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(34, 211, 238, 0.2)"
            e.currentTarget.style.boxShadow = "0 0 15px rgba(34, 211, 238, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(34, 211, 238, 0.1)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          {isOpen ? "←" : "→"}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {menuItems.map((menu) => (
          <div key={menu.label}>
            <button
              onClick={() => setExpandedMenu(expandedMenu === menu.label ? null : menu.label)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 text-left relative overflow-hidden group ${
                !isOpen ? 'p-2' : ''
              }`}
              style={{
                background: expandedMenu === menu.label 
                  ? "rgba(16, 185, 129, 0.15)" 
                  : "rgba(34, 211, 238, 0.05)",
                border: "1px solid rgba(34, 211, 238, 0.15)",
                color: "#d4f4e8",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)"
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)"
                e.currentTarget.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = expandedMenu === menu.label 
                  ? "rgba(16, 185, 129, 0.15)" 
                  : "rgba(34, 211, 238, 0.05)"
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.15)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <span className="flex items-center gap-3">
                <div 
                  className={`${
                    isOpen 
                      ? 'w-8 h-8'
                      : 'w-8 h-8'
                  } relative`}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))",
                  }}
                >
                  <img
                    src={menu.icon}
                    alt={`${menu.label} icon`}
                    className={`${
                      isOpen 
                        ? 'w-8 h-8'
                        : 'w-8 h-8 object-cover'
                    }`}
                    style={{
                      filter: "brightness(1.2) saturate(1.3)",
                    }}
                  />
                </div>
                {isOpen && (
                  <span 
                    className="text-sm font-bold"
                    style={{
                      color: "#d4f4e8",
                      textShadow: "0 0 10px rgba(34, 211, 238, 0.3)",
                    }}
                  >
                    {menu.label}
                  </span>
                )}
              </span>
              {isOpen && (
                <span 
                  className="text-xs transition-transform duration-300"
                  style={{
                    color: "#22d3ee",
                    transform: expandedMenu === menu.label ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
              )}
            </button>

            {isOpen && expandedMenu === menu.label && (
              <div className="ml-6 space-y-1 mt-1 animate-fade-in">
                {menu.submenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-300 relative overflow-hidden ${
                      activePage === item.id
                        ? "font-medium"
                        : ""
                    }`}
                    style={{
                      background: activePage === item.id
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(34, 211, 238, 0.15))"
                        : "rgba(34, 211, 238, 0.03)",
                      border: activePage === item.id
                        ? "1px solid rgba(34, 211, 238, 0.4)"
                        : "1px solid transparent",
                      color: activePage === item.id ? "#22d3ee" : "#a8dcc8",
                      boxShadow: activePage === item.id
                        ? "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (activePage !== item.id) {
                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)"
                        e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.3)"
                        e.currentTarget.style.color = "#d4f4e8"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activePage !== item.id) {
                        e.currentTarget.style.background = "rgba(34, 211, 238, 0.03)"
                        e.currentTarget.style.borderColor = "transparent"
                        e.currentTarget.style.color = "#a8dcc8"
                      }
                    }}
                  >
                    {activePage === item.id && (
                      <span 
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{
                          background: "linear-gradient(180deg, #22d3ee, #10b981)",
                          boxShadow: "0 0 10px rgba(34, 211, 238, 0.6)",
                        }}
                      ></span>
                    )}
                    <span className="ml-2">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logo di bawah menu saat sidebar tertutup */}
      {!isOpen && (
        <div className="mt-auto p-4 flex justify-center relative z-10">
          <div
            style={{
              filter: "drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))",
            }}
          >
            <img
              src="/logo/siDesa2.png"
              alt="Logo siDesa"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
      )}

      {/* Footer (hanya muncul saat terbuka) */}
      {isOpen && (
        <div 
          className="p-4 text-xs relative z-10"
          style={{
            borderTop: "1px solid rgba(34, 211, 238, 0.2)",
            background: "rgba(16, 185, 129, 0.05)",
          }}
        >
          <p 
            style={{
              color: "#a8dcc8",
              textShadow: "0 0 8px rgba(34, 211, 238, 0.2)",
            }}
          >
            Dashboard Analitik
          </p>
          <p 
            style={{
              background: "linear-gradient(135deg, #22d3ee, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "bold",
            }}
          >
            Berbasis AI
          </p>
        </div>
      )}
    </aside>
  )
}