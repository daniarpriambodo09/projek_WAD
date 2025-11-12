"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function Digital() {
  const digitalData = [
    { month: "Jan", internet: 45, smartphone: 38, komputer: 22 },
    { month: "Feb", internet: 48, smartphone: 42, komputer: 25 },
    { month: "Mar", internet: 52, smartphone: 46, komputer: 28 },
    { month: "Apr", internet: 55, smartphone: 50, komputer: 32 },
    { month: "May", internet: 58, smartphone: 54, komputer: 35 },
    { month: "Jun", internet: 62, smartphone: 58, komputer: 38 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Digital Analysis</h1>
        <p className="text-gray-600">Data transformasi digital desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Penetrasi Internet</p>
          <p className="text-3xl font-bold text-black mt-2">62%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Pengguna Smartphone</p>
          <p className="text-3xl font-bold text-black mt-2">58%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Pengguna Komputer</p>
          <p className="text-3xl font-bold text-black mt-2">38%</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Literasi Digital</p>
          <p className="text-3xl font-bold text-black mt-2">71%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Trend Adopsi Digital</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={digitalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: "#f9edb2", border: "1px solid #374151" }} />
            <Legend />
            <Line type="monotone" dataKey="internet" stroke="#102f15" strokeWidth={2} name="Internet (%)" />
            <Line type="monotone" dataKey="smartphone" stroke="#728c5a" strokeWidth={2} name="Smartphone (%)" />
            <Line type="monotone" dataKey="komputer" stroke="#385723" strokeWidth={2} name="Komputer (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
