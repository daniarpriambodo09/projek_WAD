"use client"

import { useState } from "react"

export default function DataMentah() {
  const [searchTerm, setSearchTerm] = useState("")

  const rawData = [
    { id: 1, desa: "Desa A", populasi: 2450, luas: 45.2, infrastruktur: "Baik" },
    { id: 2, desa: "Desa B", populasi: 1890, luas: 38.5, infrastruktur: "Baik" },
    { id: 3, desa: "Desa C", populasi: 3120, luas: 52.1, infrastruktur: "Sedang" },
    { id: 4, desa: "Desa D", populasi: 2680, luas: 41.3, infrastruktur: "Baik" },
    { id: 5, desa: "Desa E", populasi: 1950, luas: 35.8, infrastruktur: "Rusak" },
    { id: 6, desa: "Desa F", populasi: 2340, luas: 48.2, infrastruktur: "Baik" },
  ]

  const filteredData = rawData.filter((row) => row.desa.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Data Mentah</h1>
        <p className="text-gray-400">Data mentah siDesa sebelum diproses</p>
      </div>

      {/* Search */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <input
          type="text"
          placeholder="Cari desa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-300">ID</th>
              <th className="text-left py-3 px-4 text-gray-300">Desa</th>
              <th className="text-left py-3 px-4 text-gray-300">Populasi</th>
              <th className="text-left py-3 px-4 text-gray-300">Luas (km²)</th>
              <th className="text-left py-3 px-4 text-gray-300">Infrastruktur</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                <td className="py-3 px-4 text-gray-300">{row.id}</td>
                <td className="py-3 px-4 text-gray-300">{row.desa}</td>
                <td className="py-3 px-4 text-gray-300">{row.populasi.toLocaleString()}</td>
                <td className="py-3 px-4 text-gray-300">{row.luas}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      row.infrastruktur === "Baik"
                        ? "bg-green-900 text-green-200"
                        : row.infrastruktur === "Sedang"
                          ? "bg-yellow-900 text-yellow-200"
                          : "bg-red-900 text-red-200"
                    }`}
                  >
                    {row.infrastruktur}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Records</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{rawData.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Populasi</p>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {rawData.reduce((sum, r) => sum + r.populasi, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Luas</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {rawData.reduce((sum, r) => sum + r.luas, 0).toFixed(1)} km²
          </p>
        </div>
      </div>
    </div>
  )
}
