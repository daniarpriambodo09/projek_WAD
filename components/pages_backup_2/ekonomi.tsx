"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

export default function Ekonomi() {
  const ekonomiData = [
    { month: "Jan", pertanian: 2400, perdagangan: 2210, industri: 2290 },
    { month: "Feb", pertanian: 2210, perdagangan: 2290, industri: 2000 },
    { month: "Mar", pertanian: 2290, perdagangan: 2000, industri: 2181 },
    { month: "Apr", pertanian: 2000, perdagangan: 2181, industri: 2500 },
    { month: "May", pertanian: 2181, perdagangan: 2500, industri: 2100 },
    { month: "Jun", pertanian: 2500, perdagangan: 2100, industri: 2200 },
  ]

  const sektorData = [
    { name: "Pertanian", value: 35 },
    { name: "Perdagangan", value: 28 },
    { name: "Industri", value: 22 },
    { name: "Jasa", value: 15 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Analisis Ekonomi</h1>
        <p className="text-gray-700">Data ekonomi dan sektor usaha desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Total UMKM</p>
          <p className="text-3xl font-bold text-black mt-2">2,456</p>
        </div> */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Pertanian</p>
          <p className="text-3xl font-bold text-black mt-2">860</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Perdagangan</p>
          <p className="text-3xl font-bold text-black mt-2">688</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Industri</p>
          <p className="text-3xl font-bold text-black mt-2">540</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Trend Sektor Ekonomi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ekonomiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Area type="monotone" dataKey="pertanian" stackId="1" stroke="#37432b" fill="#37432b" name="Pertanian" />
              <Area
                type="monotone"
                dataKey="perdagangan"
                stackId="1"
                stroke="#697857"
                fill="#697857"
                name="Perdagangan"
              />
              <Area type="monotone" dataKey="industri" stackId="1" stroke="#adb3ad" fill="#adb3ad" name="Industri" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Sektor</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sektorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Bar dataKey="value" fill="#516140" name="Persentase (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
