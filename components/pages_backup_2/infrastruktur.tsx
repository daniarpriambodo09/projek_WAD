"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function Infrastruktur() {
  const infraData = [
    { name: "Jalan", value: 450 },
    { name: "Jembatan", value: 320 },
    { name: "Sekolah", value: 280 },
    { name: "Puskesmas", value: 150 },
    { name: "Kantor Desa", value: 120 },
  ]

  const trendData = [
    { month: "Jan", baik: 400, rusak: 100, sedang: 50 },
    { month: "Feb", baik: 420, rusak: 90, sedang: 45 },
    { month: "Mar", baik: 450, rusak: 80, sedang: 40 },
    { month: "Apr", baik: 480, rusak: 70, sedang: 35 },
    { month: "May", baik: 500, rusak: 60, sedang: 30 },
    { month: "Jun", baik: 520, rusak: 50, sedang: 25 },
  ]

  const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#8B907C", "#9EA99C"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Analisis Infrastruktur</h1>
        <p className="text-gray-600">Data kondisi infrastruktur desa di Jawa Timur</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Total Infrastruktur</p>
          <p className="text-3xl font-bold text-black mt-2">1,320</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Kondisi Baik</p>
          <p className="text-3xl font-bold text-black mt-2">520</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Perlu Perbaikan</p>
          <p className="text-3xl font-bold text-black mt-2">50</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Jenis Infrastruktur</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={infraData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {infraData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Trend Kondisi Infrastruktur</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2415" />
              <XAxis dataKey="month" stroke="#37432B" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="baik" stroke="#1D2415" strokeWidth={2} name="Baik" />
              <Line type="monotone" dataKey="sedang" stroke="#516140" strokeWidth={2} name="Sedang" />
              <Line type="monotone" dataKey="rusak" stroke="#8B907C" strokeWidth={2} name="Rusak" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Detail Infrastruktur per Desa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-black">Desa</th>
                <th className="text-left py-3 px-4 text-black">Jalan (km)</th>
                <th className="text-left py-3 px-4 text-black">Jembatan</th>
                <th className="text-left py-3 px-4 text-black">Sekolah</th>
                <th className="text-left py-3 px-4 text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { desa: "Desa A", jalan: 45.2, jembatan: 12, sekolah: 8, status: "Baik" },
                { desa: "Desa B", jalan: 38.5, jembatan: 9, sekolah: 6, status: "Baik" },
                { desa: "Desa C", jalan: 52.1, jembatan: 15, sekolah: 10, status: "Sedang" },
                { desa: "Desa D", jalan: 41.3, jembatan: 11, sekolah: 7, status: "Baik" },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-4 text-black">{row.desa}</td>
                  <td className="py-3 px-4 text-black">{row.jalan}</td>
                  <td className="py-3 px-4 text-black">{row.jembatan}</td>
                  <td className="py-3 px-4 text-black">{row.sekolah}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${row.status === "Baik" ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
