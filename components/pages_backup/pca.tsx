"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

export default function PCA() {
  const pcaData = [
    { x: 2.1, y: 1.8, label: "Desa A" },
    { x: 2.5, y: 2.2, label: "Desa B" },
    { x: 3.2, y: 1.5, label: "Desa C" },
    { x: 1.8, y: 2.8, label: "Desa D" },
    { x: 3.5, y: 2.1, label: "Desa E" },
    { x: 2.8, y: 1.9, label: "Desa F" },
  ]

  const varianceData = [
    { name: "PC1", variance: 45.2 },
    { name: "PC2", variance: 28.5 },
    { name: "PC3", variance: 15.3 },
    { name: "PC4", variance: 8.2 },
    { name: "PC5", variance: 2.8 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Principal Component Analysis</h1>
        <p className="text-gray-400">Analisis komponen utama untuk reduksi dimensi data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Fitur</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">12</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Komponen Utama</p>
          <p className="text-3xl font-bold text-green-400 mt-2">5</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Varians Dijelaskan</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">100%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">PCA Projection (PC1 vs PC2)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="x" type="number" stroke="#9CA3AF" name="PC1" />
              <YAxis dataKey="y" type="number" stroke="#9CA3AF" name="PC2" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter name="Desa" data={pcaData} fill="#3B82F6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Explained Variance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={varianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Bar dataKey="variance" fill="#10B981" name="Varians (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
