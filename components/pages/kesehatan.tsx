"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function Kesehatan() {
  const kesehatanData = [
    { month: "Jan", pasien: 450, vaksin: 320, gizi: 180 },
    { month: "Feb", pasien: 480, vaksin: 350, gizi: 200 },
    { month: "Mar", pasien: 520, vaksin: 380, gizi: 220 },
    { month: "Apr", pasien: 490, vaksin: 360, gizi: 210 },
    { month: "May", pasien: 550, vaksin: 400, gizi: 240 },
    { month: "Jun", pasien: 580, vaksin: 420, gizi: 260 },
  ]

  const penyakitData = [
    { name: "Hipertensi", value: 245 },
    { name: "Diabetes", value: 180 },
    { name: "Infeksi", value: 320 },
    { name: "Lainnya", value: 155 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analisis Kesehatan</h1>
        <p className="text-gray-400">Data kesehatan masyarakat desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Pasien</p>
          <p className="text-3xl font-bold text-red-400 mt-2">3,075</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Vaksinasi</p>
          <p className="text-3xl font-bold text-green-400 mt-2">2,230</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Program Gizi</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">1,330</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Puskesmas</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">156</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Trend Kesehatan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kesehatanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="pasien" stroke="#EF4444" strokeWidth={2} name="Pasien" />
              <Line type="monotone" dataKey="vaksin" stroke="#10B981" strokeWidth={2} name="Vaksin" />
              <Line type="monotone" dataKey="gizi" stroke="#3B82F6" strokeWidth={2} name="Program Gizi" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Penyakit Utama</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={penyakitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Bar dataKey="value" fill="#EF4444" name="Jumlah Kasus" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
