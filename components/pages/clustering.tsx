// clustering.tsx
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// --- GANTI DENGAN SUPABASE CLIENT ANDA ---
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// ---------------------------------------

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

// Konfigurasi untuk setiap domain clustering
const CLUSTER_CONFIGS: Record<string, {
  axes: { x: string; y: string };
  radarMetrics: string[];
  radarLabels: string[];
  priorityMetric: string;
}> = {
  Tipologi: {
    axes: { x: "skor_kesejahteraan", y: "skor_digital_readiness" },
    radarMetrics: ["skor_akses_dasar", "skor_kesejahteraan", "skor_kelembagaan_ekonomi", "skor_digital_readiness", "skor_pendidikan_lanjut"],
    radarLabels: ["Akses Dasar", "Kesejahteraan", "Kelembagaan", "Digital", "Pendidikan"],
    priorityMetric: "skor_kesejahteraan"
  },
  Infrastruktur: {
    axes: { x: "skor_aksesibilitas", y: "skor_sanitasi" },
    radarMetrics: ["skor_listrik", "skor_sanitasi", "skor_air", "skor_transportasi", "skor_digital"],
    radarLabels: ["Listrik", "Sanitasi", "Air", "Transportasi", "Digital"],
    priorityMetric: "skor_sanitasi"
  },
  Ekonomi: {
    axes: { x: "skor_bumdes", y: "skor_industri" },
    radarMetrics: ["skor_kesejahteraan", "skor_bumdes", "skor_koperasi", "skor_industri", "skor_akses_modal"],
    radarLabels: ["Kesejahteraan", "BUMDes", "Koperasi", "Industri", "Akses Modal"],
    priorityMetric: "skor_kesejahteraan"
  },
  Kesehatan: {
    axes: { x: "skor_fasilitas", y: "skor_program_prioritas" },
    radarMetrics: ["skor_fasilitas", "skor_tenaga_kesehatan", "skor_gizi", "skor_klb", "skor_program_prioritas"],
    radarLabels: ["Fasilitas", "Tenaga Kes", "Gizi", "KLB", "Program"],
    priorityMetric: "skor_gizi"
  },
  Digital: {
    axes: { x: "skor_digital_readiness", y: "skor_digitalisasi_pemdes" },
    radarMetrics: ["sinyal_telepon", "sinyal_internet", "jumlah_bts", "komputer_desa", "sid"],
    radarLabels: ["Sinyal Telp", "Sinyal Internet", "BTS", "Komputer", "SID"],
    priorityMetric: "skor_digital_readiness"
  },
  Pendidikan: {
    axes: { x: "skor_sd", y: "skor_sma" },
    radarMetrics: ["skor_paud", "skor_sd", "skor_smp", "skor_sma", "skor_literasi"],
    radarLabels: ["PAUD", "SD", "SMP", "SMA", "Literasi"],
    priorityMetric: "skor_literasi"
  },
  Lingkungan: {
    axes: { x: "skor_kualitas_lingkungan", y: "skor_ketahanan_bencana" },
    radarMetrics: ["skor_pengelolaan_sampah", "skor_kualitas_lingkungan", "skor_ketahanan_bencana", "skor_mitigasi_bencana", "skor_pelestarian"],
    radarLabels: ["Sampah", "Kualitas", "Ketahanan", "Mitigasi", "Pelestarian"],
    priorityMetric: "skor_mitigasi_bencana"
  }
};

type ClusterPoint = {
  x: number;
  y: number;
  clusterId: number;
  clusterLabel: string;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
  rawData: any;
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
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sampledData, setSampledData] = useState<ClusterPoint[]>([]);
  const itemsPerPage = 10;

  // Fungsi untuk sampling data secara proporsional per cluster
  const getSampledData = (data: ClusterPoint[], maxPoints: number = 800) => {
    if (data.length <= maxPoints) return data;

    const clusters = [...new Set(data.map(d => d.clusterId))];
    const sampledPoints: ClusterPoint[] = [];
    
    clusters.forEach(clusterId => {
      const clusterData = data.filter(d => d.clusterId === clusterId);
      const proportion = clusterData.length / data.length;
      const sampleSize = Math.max(Math.floor(maxPoints * proportion), 20); // Min 20 points per cluster
      
      // Sampling dengan interval untuk distribusi merata
      const interval = Math.floor(clusterData.length / sampleSize);
      for (let i = 0; i < clusterData.length; i += interval) {
        if (sampledPoints.length < maxPoints) {
          sampledPoints.push(clusterData[i]);
        }
      }
    });
    
    return sampledPoints;
  };

  const baseColors = [
    "#0d47a1", "#2e7d32", "#d32f2f", "#f57c00", 
    "#7b1fa2", "#0097a7", "#c2185b", "#5d4037", "#455a64",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tableName = TABLE_NAMES[selectedCluster];
        if (!tableName) throw new Error("Tabel tidak ditemukan");

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
          setRadarData([]);
          setLoading(false);
          return;
        }

        const config = CLUSTER_CONFIGS[selectedCluster];

        const mapped = allData
          .map((row) => {
            const xVal = parseFloat(row[config.axes.x] || 0);
            const yVal = parseFloat(row[config.axes.y] || 0);
            const clusterId = parseInt(row["cluster"], 10);
            const clusterLabel =
              row["final_label"] ||
              row["label_infrastruktur"] ||
              row["kategori_ekonomi"] ||
              row["kategori_pendidikan"] ||
              row["kategori_lingkungan"] ||
              row["label"] ||
              "Unknown";

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
              rawData: row,
            };
          })
          .filter((item): item is ClusterPoint => item !== null);

        const clusterIds = [...new Set(mapped.map((d) => d.clusterId))].sort((a, b) => a - b);

        const colors: Record<number, string> = {};
        clusterIds.forEach((id) => {
          colors[id] = baseColors[id % baseColors.length];
        });

        const stats = clusterIds.map((id) => {
          const items = mapped.filter((d) => d.clusterId === id);
          return {
            name: `Cluster ${id}`,
            value: items.length,
            label: items[0]?.clusterLabel || `Cluster ${id}`,
          };
        });

        const radarChartData = config.radarLabels.map((label, idx) => {
          const metric = config.radarMetrics[idx];
          const dataPoint: any = { metric: label };

          clusterIds.forEach(clusterId => {
            const clusterItems = mapped.filter(d => d.clusterId === clusterId);
            const avg = clusterItems.reduce((sum, item) => sum + (parseFloat(item.rawData[metric]) || 0), 0) / clusterItems.length;
            dataPoint[`Cluster ${clusterId}`] = avg.toFixed(1);
          });

          return dataPoint;
        });

        setChartData(mapped);
        setUniqueClusters(clusterIds);
        setClusterStats(stats);
        setClusterColors(colors);
        setRadarData(radarChartData);
        setSampledData(getSampledData(mapped, 800)); // Sampling untuk visualisasi
      } catch (err) {
        console.error("Gagal memuat data klaster:", err);
        setError("Gagal memuat data clustering.");
        setChartData([]);
        setUniqueClusters([]);
        setClusterStats([]);
        setClusterColors({});
        setRadarData([]);
        setSampledData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster]);

  const config = CLUSTER_CONFIGS[selectedCluster];
  const filteredVillages = selectedClusterId !== null 
    ? chartData.filter(d => d.clusterId === selectedClusterId && 
        (searchTerm === "" || 
         d.nama_desa.toLowerCase().includes(searchTerm.toLowerCase()) ||
         d.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  // Pagination calculation
  const totalPages = Math.ceil(filteredVillages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVillages = filteredVillages.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Analisis Clustering – {selectedCluster}
          </h1>
          <p className="text-gray-600">
            Pengelompokan desa berdasarkan karakteristik {selectedCluster.toLowerCase()} untuk prioritas intervensi kebijakan
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Pilih Domain</label>
            <select
              value={selectedCluster}
              onChange={(e) => {
                setSelectedCluster(e.target.value);
                setSelectedClusterId(null);
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-white border-2 border-teal-600 rounded-lg text-sm text-black font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Jumlah Cluster</p>
          <p className="text-4xl font-bold mt-2">{uniqueClusters.length || "-"}</p>
          <p className="text-xs mt-1 opacity-75">Kategori pengelompokan</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Total Desa</p>
          <p className="text-4xl font-bold mt-2">{chartData.length || "-"}</p>
          <p className="text-xs mt-1 opacity-75">Dianalisis dalam sistem</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Cluster Terbesar</p>
          <p className="text-4xl font-bold mt-2">
            {clusterStats.length > 0
              ? `#${clusterStats.reduce((a, b) => (a.value > b.value ? a : b)).name.split(" ")[1]}`
              : "-"}
          </p>
          <p className="text-xs mt-1 opacity-75">
            {clusterStats.length > 0
              ? `${clusterStats.reduce((a, b) => (a.value > b.value ? a : b)).value} desa`
              : ""}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Status Data</p>
          <p className="text-2xl font-bold mt-2">
            {loading ? "⏳ Memuat..." : error ? "❌ Error" : "✅ Siap"}
          </p>
          <p className="text-xs mt-1 opacity-75">Real-time dari database</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold">Terjadi Kesalahan</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts - FIXED LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Scatter Plot */}
        <div className="xl:col-span-8 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">Distribusi Spatial Cluster</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                {chartData.length} desa
              </span>
              {chartData.length > 800 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                  📊 Menampilkan {sampledData.length} sample
                </span>
              )}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: '520px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat data clustering...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: '520px' }}>
              <p className="text-gray-400 text-center">📊 Tidak ada data tersedia</p>
            </div>
          ) : (
            <div style={{ height: '520px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 15, bottom: 45, left: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={config.axes.x}
                    label={{ 
                      value: config.axes.x.replace(/_/g, ' ').toUpperCase(), 
                      position: "insideBottom", 
                      offset: -5,
                      style: { fontWeight: 'bold', fontSize: 12, fill: '#374151' } 
                    }}
                    stroke="#6b7280"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={config.axes.y}
                    label={{ 
                      value: config.axes.y.replace(/_/g, ' ').toUpperCase(), 
                      angle: -90, 
                      position: "insideLeft",
                      offset: 5,
                      style: { fontWeight: 'bold', fontSize: 12, textAnchor: 'middle', fill: '#374151' }
                    }}
                    stroke="#6b7280"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}
                    formatter={(value: any, name: string) => {
                      if (name === "x") return [parseFloat(value).toFixed(2), config.axes.x];
                      if (name === "y") return [parseFloat(value).toFixed(2), config.axes.y];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const data = payload[0]?.payload;
                      return (
                        <div>
                          <p className="font-bold text-black">{data?.nama_desa || "Desa"}</p>
                          <p className="text-xs text-gray-600">{data?.kecamatan || ""}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={35}
                    wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }}
                    iconSize={8}
                    onClick={(e) => {
                      const clusterId = parseInt(e.value.split(" ")[1]);
                      setSelectedClusterId(clusterId);
                    }}
                  />
                  {uniqueClusters.map((clusterId) => (
                    <Scatter
                      key={clusterId}
                      name={`Cluster ${clusterId}`}
                      data={sampledData.filter((d) => d.clusterId === clusterId)}
                      fill={clusterColors[clusterId] || "#757575"}
                      opacity={0.75}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="xl:col-span-4 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-black mb-4">Proporsi Cluster</h2>
          {clusterStats.length > 0 ? (
            <>
              <div style={{ height: '260px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clusterStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name.split(" ")[1]}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {clusterStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={clusterColors[parseInt(entry.name.split(" ")[1])]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} desa`, "Jumlah"]}
                      contentStyle={{ backgroundColor: "#ffffff", border: "2px solid #e5e7eb", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2" style={{ maxHeight: '228px', overflowY: 'auto', paddingRight: '8px' }}>
                {clusterStats.map((stat, idx) => {
                  const clusterId = parseInt(stat.name.split(" ")[1]);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setSelectedClusterId(clusterId)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: clusterColors[clusterId] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center" style={{ height: '520px' }}>
              <p className="text-gray-400">Tidak ada data</p>
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-black">Profil Karakteristik per Cluster</h2>
          <p className="text-sm text-gray-600 mt-1">Perbandingan rata-rata indikator antar cluster</p>
        </div>
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: '#374151', fontSize: 11, fontWeight: '600' }} 
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
              />
              {uniqueClusters.map((clusterId) => (
                <Radar
                  key={clusterId}
                  name={`Cluster ${clusterId}`}
                  dataKey={`Cluster ${clusterId}`}
                  stroke={clusterColors[clusterId]}
                  fill={clusterColors[clusterId]}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              ))}
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                iconSize={9}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#ffffff", 
                  border: "2px solid #e5e7eb", 
                  borderRadius: "8px",
                  fontSize: '12px'
                }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[450px]">
            <p className="text-gray-400">Tidak ada data radar</p>
          </div>
        )}
      </div>

      {/* Karakteristik Cluster */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-lg font-bold text-black mb-4">Karakteristik & Prioritas Cluster</h2>
        <div className="space-y-3">
          {clusterStats.map((stat, idx) => {
            const clusterId = parseInt(stat.name.split(" ")[1]);
            const count = stat.value;
            const percentage = ((count / chartData.length) * 100).toFixed(1);
            
            const clusterItems = chartData.filter(d => d.clusterId === clusterId);
            const avgPriority = clusterItems.reduce((sum, item) => 
              sum + (parseFloat(item.rawData[config.priorityMetric]) || 0), 0) / clusterItems.length;
            
            const priorityLevel = avgPriority < 33 ? "🔴 Tinggi" : avgPriority < 66 ? "🟡 Sedang" : "🟢 Rendah";
            
            return (
              <div
                key={idx}
                className="border-l-4 bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                style={{ borderColor: clusterColors[clusterId] }}
                onClick={() => {
                  setSelectedClusterId(clusterId);
                  setCurrentPage(1); // Reset to page 1 when selecting cluster
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-black text-lg">{stat.name}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {count} desa ({percentage}%)
                    </p>
                    <p className="text-xs mt-1">Prioritas: {priorityLevel}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Skor rata-rata {config.priorityMetric.replace(/_/g, ' ')}: <span className="font-semibold">{avgPriority.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Detail Desa */}
      {selectedClusterId !== null && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-black">
                Detail Desa - Cluster {selectedClusterId}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredVillages.length)} dari {filteredVillages.length} desa
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="🔍 Cari desa atau kecamatan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when searching
                }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={() => {
                  setSelectedClusterId(null);
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                ✕ Tutup
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Nama Desa</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Kecamatan</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Kabupaten</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-700">
                    {config.axes.x.replace(/_/g, ' ')}
                  </th>
                  <th className="px-4 py-3 text-right font-bold text-gray-700">
                    {config.axes.y.replace(/_/g, ' ')}
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentVillages.map((village, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{village.nama_desa}</td>
                    <td className="px-4 py-3 text-gray-700">{village.kecamatan}</td>
                    <td className="px-4 py-3 text-gray-700">{village.kabupaten}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-mono">
                      {village.x.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-mono">
                      {village.y.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: clusterColors[selectedClusterId] }}
                      >
                        {village.clusterLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVillages.length === 0 && (
              <p className="text-center py-8 text-gray-400">Tidak ada desa yang sesuai dengan pencarian</p>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredVillages.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari <span className="font-bold text-gray-900">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  ← Back
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}