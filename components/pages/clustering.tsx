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

// Mapping endpoint API
const API_ENDPOINTS: Record<string, string> = {
  Tipologi: "http://localhost:8000/api/data_cluster/cluster_tipologi",
  Infrastruktur: "http://localhost:8000/api/data_cluster/cluster_infrastruktur",
  Ekonomi: "http://localhost:8000/api/data_cluster/cluster_ekonomi",
  Kesehatan: "http://localhost:8000/api/data_cluster/cluster_kesehatan",
  Digital: "http://localhost:8000/api/data_cluster/cluster_digital",
  Pendidikan: "http://localhost:8000/api/data_cluster/cluster_pendidikan",
  Lingkungan: "http://localhost:8000/api/data_cluster/cluster_lingkungan",
};

// Mapping label sumbu X dan Y berdasarkan topik
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
  cluster: string;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
};

type ClusterStats = {
  name: string;
  value: number;
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
  const [uniqueClusters, setUniqueClusters] = useState<string[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Warna untuk setiap cluster
  const clusterColors: Record<string, string> = {
    "Desa Maju dan Terintegrasi": "#12372a",
    "Desa Menengah - Perlu Penyegaran Sanitasi & Akses": "#436850",
    "Desa Tertinggal Prioritas": "#adbc9f",
    "Digital Lengkap": "#0d47a1",
    "Digital Administrasi (Tanpa Akses Publik)": "#2e7d32",
    "Digitalisasi Rendah": "#ad1457",
    "Desa Pendidikan Lengkap": "#0d47a1",
    "Desa Pendidikan Dasar Terbatas": "#546e7a",
    "Desa Krisis Gizi": "#b71c1c",
    "Desa Miskin Ekstrem": "#e53935",
    "Desa Stabil": "#4caf50",
    "Lingkungan Sedang": "#66bb6a",
    "Lingkungan Terbaik": "#2e7d32",
    "Lingkungan Ideal (Tanpa Masalah)": "#388e3c",
    "Desa Mandiri Program": "#4caf50",
    "Desa Subsisten Pertanian": "#ff9800",
    "Desa Maju": "#4caf50",
    "Unknown": "#9e9e9e",
  };

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS[selectedCluster]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawData: any[] = await res.json();

        if (!Array.isArray(rawData) || rawData.length === 0) {
          setChartData([]);
          setUniqueClusters([]);
          setClusterStats([]);
          setLoading(false);
          return;
        }

        // Map data ke format chart
        const mapped = rawData
          .filter((row) => Array.isArray(row) || typeof row === "object")
          .map((row) => {
            const arr = Array.isArray(row) ? row : Object.values(row);
            if (arr.length < 18) return null;

            const xVal = parseFloat(arr[15]?.toString() || "0");
            const yVal = parseFloat(arr[16]?.toString() || "0");
            const clusterLabel = (arr[arr.length - 1]?.toString() || "Unknown").trim();
            const namaDesa = arr[3]?.toString() || "Desa";
            const kecamatan = arr[2]?.toString() || "Kecamatan";
            const kabupaten = arr[1]?.toString() || "Kabupaten";

            if (isNaN(xVal) || isNaN(yVal)) return null;

            return {
              x: xVal,
              y: yVal,
              cluster: clusterLabel,
              nama_desa: namaDesa,
              kecamatan,
              kabupaten,
            };
          })
          .filter((item): item is ClusterPoint => item !== null);

        const clusters = [...new Set(mapped.map((d) => d.cluster))];
        const stats = clusters.map((name) => ({
          name,
          value: mapped.filter((d) => d.cluster === name).length,
        }));

        setChartData(mapped);
        setUniqueClusters(clusters);
        setClusterStats(stats);
      } catch (err) {
        console.error("Gagal memuat data klaster:", err);
        setError("Gagal memuat data. Pastikan file CSV tersedia dan tidak kosong.");
        setChartData([]);
        setUniqueClusters([]);
        setClusterStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster]);

  // Deskripsi otomatis untuk setiap klaster
  const getClusterDescription = (name: string) => {
    if (name.includes("Maju")) return "Desa dengan infrastruktur, ekonomi, dan pelayanan publik yang maju.";
    if (name.includes("Tertinggal")) return "Desa dengan kebutuhan pengembangan prioritas.";
    if (name.includes("Krisis Gizi")) return "Desa dengan tingkat stunting tinggi dan akses layanan kesehatan terbatas.";
    if (name.includes("Pendidikan Lengkap")) return "Desa memiliki akses lengkap ke sekolah dasar hingga menengah.";
    if (name.includes("Digital Lengkap")) return "Desa telah menerapkan sistem digital secara menyeluruh.";
    if (name.includes("Lingkungan Terbaik")) return "Desa dengan kualitas lingkungan sangat baik.";
    if (name.includes("Subsisten")) return "Desa dengan basis ekonomi pertanian subsisten.";
    return "Deskripsi otomatis berdasarkan data.";
  };

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
            <label className="text-xs font-bold text-muted-foreground">
              Filter Clustering
            </label>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
          <p className="text-3xl font-bold text-black mt-2">
            {uniqueClusters.length || "-"}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-black text-sm">Jumlah Desa</p>
          <p className="text-3xl font-bold text-black mt-2">
            {chartData.length || "-"}
          </p>
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
              ? clusterStats.reduce((a, b) => (a.value > b.value ? a : b)).name
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
            <p className="text-center py-10 text-gray-500">
              Tidak ada data untuk klaster ini. Coba pilih topik lain.
            </p>
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
                {uniqueClusters.map((cluster) => (
                  <Scatter
                    key={cluster}
                    name={cluster}
                    data={chartData.filter((d) => d.cluster === cluster)}
                    fill={clusterColors[cluster] || "#757575"}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart Distribusi Klaster */}
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
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {clusterStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={clusterColors[entry.name] || "#9e9e9e"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Jumlah Desa"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-10 text-gray-500">Tidak ada data untuk ditampilkan.</p>
          )}
        </div>
      </div>

      {/* Karakteristik Klaster */}
      {uniqueClusters.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Karakteristik Klaster</h2>
          <div className="space-y-4">
            {uniqueClusters.map((cluster, idx) => {
              const count = chartData.filter((d) => d.cluster === cluster).length;
              const percentage = ((count / chartData.length) * 100).toFixed(2);

              return (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-lg p-4 border-l-4"
                  style={{ borderColor: clusterColors[cluster] || "#757575" }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-black">{cluster}</p>
                    <p className="text-sm text-gray-600">
                      {count} desa ({percentage}%)
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{getClusterDescription(cluster)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}