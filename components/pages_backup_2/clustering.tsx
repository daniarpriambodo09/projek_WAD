"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function Clustering() {
  const clusterData = [
    { x: 2.5, y: 3.2, cluster: "Cluster 1" },
    { x: 2.8, y: 3.5, cluster: "Cluster 1" },
    { x: 3.1, y: 3.8, cluster: "Cluster 1" },
    { x: 5.2, y: 6.1, cluster: "Cluster 2" },
    { x: 5.5, y: 6.4, cluster: "Cluster 2" },
    { x: 5.8, y: 6.7, cluster: "Cluster 2" },
    { x: 8.1, y: 2.3, cluster: "Cluster 3" },
    { x: 8.4, y: 2.6, cluster: "Cluster 3" },
    { x: 8.7, y: 2.9, cluster: "Cluster 3" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Clustering Analysis</h1>
        <p className="text-gray-600">Analisis pengelompokan data desa menggunakan K-Means</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Jumlah Cluster</p>
          <p className="text-3xl font-bold text-black mt-2">3</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Silhouette Score</p>
          <p className="text-3xl font-bold text-black mt-2">0.78</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Inertia</p>
          <p className="text-3xl font-bold text-black mt-2">24.5</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Cluster Visualization</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="x" type="number" stroke="#9CA3AF" />
            <YAxis dataKey="y" type="number" stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: "#fbfada", border: "1px solid #374151" }} />
            <Legend />
            <Scatter name="Cluster 1" data={clusterData.filter((d) => d.cluster === "Cluster 1")} fill="#12372a" />
            <Scatter name="Cluster 2" data={clusterData.filter((d) => d.cluster === "Cluster 2")} fill="#436850" />
            <Scatter name="Cluster 3" data={clusterData.filter((d) => d.cluster === "Cluster 3")} fill="#adbc9f" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Details */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Karakteristik Cluster</h2>
        <div className="space-y-4">
          {[
            { name: "Cluster 1", color: "bg-blue-950", desc: "Desa dengan infrastruktur baik dan ekonomi berkembang" },
            { name: "Cluster 2", color: "bg-green-950", desc: "Desa dengan potensi pertanian tinggi" },
            { name: "Cluster 3", color: "bg-yellow-950", desc: "Desa dengan kebutuhan pengembangan prioritas" },
          ].map((cluster, idx) => (
            <div key={idx} className={`${cluster.color} rounded-lg p-4`}>
              <p className="font-semibold text-white">{cluster.name}</p>
              <p className="text-gray-200 text-sm mt-1">{cluster.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
