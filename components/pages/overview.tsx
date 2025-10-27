"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import dynamic from "next/dynamic"

// ✅ Import MapComponent dari lokasi yang benar
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />,
})

export default function Overview() {
  const [koperasiData, setKoperasiData] = useState<any[]>([]) // Data koperasi dari API
  const [loading, setLoading] = useState(true) // Loading state

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/tipologi-desa")
        if (!response.ok) throw new Error("Gagal mengambil data")
        const data = await response.json()

        // Filter desa yang punya jml_koperasi > 0
        const villagesWithKoperasi = data.filter((item: any) => item.jml_koperasi > 0)

        // Urutkan berdasarkan jml_koperasi (descending)
        const sorted = villagesWithKoperasi
          .sort((a: any, b: any) => b.jml_koperasi - a.jml_koperasi)
          .slice(0, 5) // Ambil 5 teratas

        // Siapkan data untuk Recharts
        const chartData = sorted.map((item: any) => ({
          name: `${item.NAMA_DESA}`, // label desa
          jml_koperasi: item.jml_koperasi,
        }))

        setKoperasiData(chartData)
      } catch (error) {
        console.error("Error loading API data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Contoh data statis untuk grafik trend (opsional)
  const trendData = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 200 },
    { name: "Apr", value: 278 },
    { name: "May", value: 190 },
    { name: "Jun", value: 229 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Analitik data siDesa Jawa Timur berbasis AI</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Desa", value: "2,456", icon: "🏘️" },
          { label: "Data Points", value: "15,234", icon: "📊" },
          { label: "Accuracy", value: "94.2%", icon: "✓" },
          // { label: "Last Update", value: "2 jam lalu", icon: "🕐" },
        ].map((stat, idx) => (
          <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1a3a3a] mt-2">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🗺️ Leaflet Map */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-black p-6 pb-2">Sebaran Desa di Jawa Timur</h2>
        <div className="h-72 w-full">
          <MapComponent key={Date.now()} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: 5 Desa dengan Jumlah Koperasi Terbanyak */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Top 5 Desa Berdasarkan Jumlah Koperasi</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={koperasiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  height={80}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
                <Legend />
                <Bar dataKey="jml_koperasi" fill="#10B981" name="Jumlah Koperasi" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart: Trend Data (contoh statis) */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Trend Data (Contoh)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#ffffffff", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}