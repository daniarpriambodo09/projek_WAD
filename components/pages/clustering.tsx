"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabaseClient"; // <-- Pastikan path ini benar

// Mapping nama tabel di Supabase
const TABLE_NAMES: Record<string, string> = {
  Tipologi: "cluster_tipologi",
  Infrastruktur: "cluster_infrastruktur",
  Ekonomi: "cluster_ekonomi",
  Kesehatan: "cluster_kesehatan",
  Digital: "cluster_digital",
  Pendidikan: "cluster_pendidikan",
  Lingkungan: "cluster_lingkungan",
};

// Mapping label sumbu X dan Y
const AXIS_LABELS: Record<string, { x: string; y: string }> = {
  Tipologi: { x: "Komponen 1", y: "Komponen 2" },
  Infrastruktur: { x: "Akses Jalan Baik (%)", y: "Akses Air Bersih (%)" },
  Ekonomi: { x: "PDRB per Kapita", y: "Indeks Ekonomi" },
  Kesehatan: { x: "Cakupan Puskesmas", y: "Stunting Rate (%)" },
  Digital: { x: "Akses Internet Desa (%)", y: "Tingkat Digitalisasi" },
  Pendidikan: { x: "Skor Infrastruktur Pendidikan", y: "Skor Kualitas Pendidikan" },
  Lingkungan: { x: "Kualitas Lingkungan", y: "Akses Sanitasi" },
};

type ClusterPoint = {
  x: number;
  y: number;
  clusterId: number;
  clusterLabel: string;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
};

type ClusterStats = {
  name: string;
  value: number;
  label: string;
};

export default function Clustering() {
  const [selectedCluster, setSelectedCluster] = useState<string>("Infrastruktur");
  const clusterFilterList = [
    "Infrastruktur",
    "Digital",
    "Pendidikan",
    "Kesehatan",
    "Ekonomi",
    "Lingkungan",
    "Tipologi",
  ];

  const [chartData, setChartData] = useState<ClusterPoint[]>([]);
  const [uniqueClusters, setUniqueClusters] = useState<number[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStats[]>([]);
  const [clusterColors, setClusterColors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const baseColors = [
    "#12372a", // cluster 0
    "#ad1457", // cluster 1
    "#b71c1c", // cluster 2
    "#4caf50", // cluster 3
    "#2e7d32", // cluster 4
    "#0d47a1", // cluster 5
    "#ff9800", // cluster 6
    "#9e9e9e", // cluster 7
    "#7b1fa2",
    "#0097a7",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tableName = TABLE_NAMES[selectedCluster];
        if (!tableName) throw new Error("Tabel tidak ditemukan");

        // Ambil SEMUA data dari Supabase (untuk tabel >1000 baris)
        let allData: any[] = [];
        const limit = 1000;
        let offset = 0;

        while (true) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(offset, offset + limit - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          allData.push(...data);
          if (data.length < limit) break;
          offset += limit;
        }

        if (allData.length === 0) {
          setChartData([]);
          setUniqueClusters([]);
          setClusterStats([]);
          setClusterColors({});
          setLoading(false);
          return;
        }

        // Mapping data dari Supabase ke format ClusterPoint
        // Sesuaikan kolom berdasarkan struktur tabel Anda di Supabase
        const mapped = allData
          .map((row) => {
            // Ambil X dan Y berdasarkan indeks atau nama kolom
            // Kita asumsikan kolom ke-16 dan 17 (indeks 15, 16) adalah X dan Y
            // atau gunakan nama kolom jika lebih spesifik
            const xVal = parseFloat(row["komponen_1"] || row["akses_jalan_baik"] || row["pdrb_per_kapita"] || row["cakupan_puskesmas"] || row["akses_internet_desa"] || row["skor_infrastruktur_pendidikan"] || row["skor_lingkungan"] || row[15] || 0);
            const yVal = parseFloat(row["komponen_2"] || row["akses_air_bersih"] || row["indeks_ekonomi"] || row["stunting_rate"] || row["tingkat_digitalisasi"] || row["skor_kualitas_pendidikan"] || row["akses_sanitasi"] || row[16] || 0);

            // Kolom 'cluster' (numerik) sebagai identitas
            const clusterId = parseInt(row["cluster"], 10);

            // Kolom 'label' sebagai deskripsi
            const clusterLabel = row["final_label"] || row["label_infrastruktur"] || row["kategori_ekonomi"] || row["label"] || "Unknown";

            const namaDesa = row["NAMA_DESA"] || "Desa";
            const kecamatan = row["NAMA_KEC"] || "Kecamatan";
            const kabupaten = row["NAMA_KAB"] || "Kabupaten";

            if (isNaN(xVal) || isNaN(yVal) || isNaN(clusterId)) return null;

            return {
              x: xVal,
              y: yVal,
              clusterId,
              clusterLabel,
              nama_desa: namaDesa,
              kecamatan,
              kabupaten,
            };
          })
          .filter((item): item is ClusterPoint => item !== null);

        const clusterIds = [...new Set(mapped.map((d) => d.clusterId))].sort((a, b) => a - b);

        // Mapping warna berdasarkan cluster ID (numerik)
        const colors: Record<number, string> = {};
        clusterIds.forEach((id) => {
          colors[id] = baseColors[id % baseColors.length];
        });

        // Statistik per cluster
        const stats = clusterIds.map((id) => {
          const items = mapped.filter((d) => d.clusterId === id);
          return {
            name: `Cluster ${id}`,
            value: items.length,
            label: items[0]?.clusterLabel || `Cluster ${id}`,
          };
        });

        setChartData(mapped);
        setUniqueClusters(clusterIds);
        setClusterStats(stats);
        setClusterColors(colors);
      } catch (err) {
        console.error("Gagal memuat data klaster dari Supabase:", err);
        setError("Gagal memuat data dari Supabase.");
        setChartData([]);
        setUniqueClusters([]);
        setClusterStats([]);
        setClusterColors({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster]);

  const { x: xLabel, y: yLabel } = AXIS_LABELS[selectedCluster] || {
    x: "Variabel X",
    y: "Variabel Y",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Clustering Analysis – {selectedCluster}
          </h1>
          <p className="text-gray-600">
            Analisis pengelompokan data desa berdasarkan aspek {selectedCluster.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground">Filter Clustering</label>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {clusterFilterList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Jumlah Cluster</p>
          <p className="text-3xl font-bold text-black mt-2">{uniqueClusters.length || "-"}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Jumlah Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{chartData.length || "-"}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Status Data</p>
          <p className="text-3xl font-bold text-black mt-2">
            {loading ? "Memuat..." : error ? "Error" : "Siap"}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Klaster Terbesar</p>
          <p className="text-3xl font-bold text-black mt-2">
            {clusterStats.length > 0
              ? `Cluster ${clusterStats.reduce((a, b) => (a.value > b.value ? a : b)).name.split(" ")[1]}`
              : "-"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* Chart & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Visualisasi Klaster</h2>
          {loading ? (
            <p className="text-center py-10">Memuat data...</p>
          ) : chartData.length === 0 ? (
            <p className="text-center py-10 text-gray-500">Tidak ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={xLabel}
                  label={{ value: xLabel, position: "insideBottomRight", offset: -5 }}
                  stroke="#9CA3AF"
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={yLabel}
                  label={{ value: yLabel, angle: -90, position: "insideLeft" }}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fbfada", border: "1px solid #374151" }}
                  formatter={(value, name) => {
                    if (name === "x") return [value, xLabel];
                    if (name === "y") return [value, yLabel];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload[0]?.payload;
                    return `${data?.nama_desa || "Desa"} – ${data?.kecamatan || ""}`;
                  }}
                />
                <Legend />
                {uniqueClusters.map((clusterId) => (
                  <Scatter
                    key={clusterId}
                    name={`Cluster ${clusterId}`}
                    data={chartData.filter((d) => d.clusterId === clusterId)}
                    fill={clusterColors[clusterId] || "#757575"}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Desa per Klaster</h2>
          {clusterStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clusterStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {clusterStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={clusterColors[parseInt(entry.name.split(" ")[1])]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Jumlah Desa"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-10 text-gray-500">Tidak ada data.</p>
          )}
        </div>
      </div>

      {/* Karakteristik Klaster */}
      {clusterStats.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Karakteristik Klaster</h2>
          <div className="space-y-4">
            {clusterStats.map((stat, idx) => {
              const clusterId = parseInt(stat.name.split(" ")[1]);
              const count = stat.value;
              const percentage = ((count / chartData.length) * 100).toFixed(2);
              return (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-lg p-4 border-l-4"
                  style={{ borderColor: clusterColors[clusterId] || "#757575" }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-black">{stat.name}</p>
                    <p className="text-sm text-gray-600">
                      {count} desa ({percentage}%)
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}