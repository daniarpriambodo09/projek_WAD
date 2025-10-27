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

export default function Pendidikan() {
  const pendidikanData = [
    { month: "Jan", sd: 1200, smp: 850, sma: 620 },
    { month: "Feb", sd: 1210, smp: 860, sma: 630 },
    { month: "Mar", sd: 1220, smp: 870, sma: 640 },
    { month: "Apr", sd: 1230, smp: 880, sma: 650 },
    { month: "May", sd: 1240, smp: 890, sma: 660 },
    { month: "Jun", sd: 1250, smp: 900, sma: 670 },
  ]

  const tingkatData = [
    { name: "SD", value: 1250 },
    { name: "SMP", value: 900 },
    { name: "SMA", value: 670 },
    { name: "Lainnya", value: 180 },
  ]

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analisis Pendidikan</h1>
        <p className="text-gray-400">Data pendidikan masyarakat desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Siswa</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">3,000</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Sekolah</p>
          <p className="text-3xl font-bold text-green-400 mt-2">45</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Guru</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">280</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Tingkat Kelulusan</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">96.5%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Trend Siswa per Tingkat</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pendidikanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="sd" stroke="#3B82F6" strokeWidth={2} name="SD" />
              <Line type="monotone" dataKey="smp" stroke="#10B981" strokeWidth={2} name="SMP" />
              <Line type="monotone" dataKey="sma" stroke="#F59E0B" strokeWidth={2} name="SMA" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Distribusi Siswa</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tingkatData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tingkatData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
