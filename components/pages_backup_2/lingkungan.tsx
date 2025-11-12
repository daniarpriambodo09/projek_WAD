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

export default function Lingkungan() {
  const lingkunganData = [
    { month: "Jan", air: 85, udara: 72, tanah: 68 },
    { month: "Feb", air: 83, udara: 70, tanah: 66 },
    { month: "Mar", air: 81, udara: 68, tanah: 64 },
    { month: "Apr", air: 84, udara: 71, tanah: 67 },
    { month: "May", air: 86, udara: 73, tanah: 69 },
    { month: "Jun", air: 88, udara: 75, tanah: 71 },
  ]

  const sampahData = [
    { name: "Organik", value: 45 },
    { name: "Plastik", value: 28 },
    { name: "Kertas", value: 18 },
    { name: "Lainnya", value: 9 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Analisis Lingkungan</h1>
        <p className="text-gray-600">Data kualitas lingkungan desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Kualitas Air</p>
          <p className="text-3xl font-bold text-black mt-2">88%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Kualitas Udara</p>
          <p className="text-3xl font-bold text-black mt-2">75%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Kualitas Tanah</p>
          <p className="text-3xl font-bold text-black mt-2">71%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Penghijauan</p>
          <p className="text-3xl font-bold text-black mt-2">2,450 pohon</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Trend Kualitas Lingkungan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lingkunganData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="air" stroke="#273526" strokeWidth={2} name="Air" />
              <Line type="monotone" dataKey="udara" stroke="#45624e" strokeWidth={2} name="Udara" />
              <Line type="monotone" dataKey="tanah" stroke="#6c8776" strokeWidth={2} name="Tanah" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Komposisi Sampah</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sampahData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Bar dataKey="value" fill="#44604e" name="Persentase (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
