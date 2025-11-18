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
    priorityMetric: "skor_pendidikan_total"
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

const scatterCOLORS = [
  "#10F0A0", // neon teal
  "#2EE6FF", // neon cyan
  "#B4FF4A", // neon green

  "#FFEA00", // neon yellow
  "#FF7AE6", // neon pink-magenta
  "#7F7CFF", // neon violet
];
const COLORS = ["#10b981", "#14b8a6", "#22d3ee", "#34d399", "#06b6d4", "#7dd3fc"]

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

  const wrapText = (text: string, maxCharsPerLine = 18) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const offset = 25;
    const radius = outerRadius + offset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const lines = wrapText(String(name), 25);
    const anchor = x > cx ? "start" : "end";
    return (
      <text
        x={x}
        y={y}
        fill="#ffff"
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={12}
      >
        {lines.map((line: string, i: number) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : "1em"}>
            {line}
          </tspan>
        ))}
        <tspan x={x} dy="1em" fontWeight="bold">
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Analisis Clustering – {selectedCluster}
          </h1>
          <p className="text-teal-300">
            Pengelompokan desa berdasarkan karakteristik {selectedCluster.toLowerCase()} untuk prioritas intervensi kebijakan
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex flex-col gap-1">
            <h2 
              className="text-xs font-bold text-black"
              style={{ color: "#d4f4e8" }}
            >PILIH DOMAIN
            </h2>
            <select
              value={selectedCluster}
              onChange={(e) => {
                setSelectedCluster(e.target.value);
                setSelectedClusterId(null);
                setSearchTerm("");
              }}
              className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 w-full sm:w-auto"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                color: "#d4f4e8",
              }}
            >
              {clusterFilterList.map((cls) => (
                <option key={cls} value={cls} style={{ background: "#1a3a32" }}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Jumlah Cluster</p>
          <p className="text-4xl font-bold mt-2">{uniqueClusters.length || "-"}</p>
          <p className="text-xs mt-1 opacity-75">Kategori pengelompokan</p>
        </div>
        <div className="bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Total Desa</p>
          <p className="text-4xl font-bold mt-2">{chartData.length || "-"}</p>
          <p className="text-xs mt-1 opacity-75">Dianalisis dalam sistem</p>
        </div>
        <div className="bg-gradient-to-br from-[#14b8a6] to-[#5eead4] rounded-xl p-6 text-white shadow-lg">
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
        <div className="bg-gradient-to-br from-[#22d3ee] to-[#7dd3fc] rounded-xl p-6 text-white shadow-lg">
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
        <div
          className="xl:col-span-8 rounded-xl shadow-md overflow-hidden"
          style={{
            background: "rgba(10, 31, 26, 0.7)", // latar digital
            border: "1px solid rgba(34, 211, 238, 0.2)", // border digital
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // shadow digital
          }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              borderBottom: "1px solid rgba(34, 211, 238, 0.2)",
              background: "rgba(16, 185, 129, 0.08)", // header digital
            }}
          >
            <h2
              className="text-sm sm:text-base font-semibold"
              style={{ color: "#d4f4e8" }}
            >
              Distribusi Spatial Cluster
            </h2>

            {/* BADGES */}
            <div className="flex items-center gap-2">

              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(34, 211, 238, 0.15)",
                  color: "#d4f4e8",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                }}
              >
                {chartData.length} desa
              </span>

              {chartData.length > 800 && (
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(234, 179, 8, 0.15)",
                    color: "#facc15",
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                  }}
                >
                  📊 Menampilkan {sampledData.length} sample
                </span>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="p-3 sm:p-4">
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: "520px" }}>
                <div className="text-center">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                    style={{ borderColor: "#34d399" }}
                  ></div>
                  <p className="text-gray-300">Memuat data clustering...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: "520px" }}>
                <p className="text-gray-300 text-center">📊 Tidak ada data tersedia</p>
              </div>
            ) : (
              <div style={{ height: "520px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 15, bottom: 45, left: 65 }}>

                    {/* GRID */}
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

                    {/* X-AXIS */}
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={config.axes.x}
                      label={{
                        value: config.axes.x.replace(/_/g, " ").toUpperCase(),
                        position: "insideBottom",
                        offset: -5,
                        style: {
                          fontWeight: "bold",
                          fontSize: 12,
                          fill: "#d4f4e8",
                        },
                      }}
                      stroke="#94a3b8"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#cbd5e1" }}
                    />

                    {/* Y-AXIS */}
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={config.axes.y}
                      label={{
                        value: config.axes.y.replace(/_/g, " ").toUpperCase(),
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        style: {
                          fontWeight: "bold",
                          fontSize: 12,
                          fill: "#d4f4e8",
                          textAnchor: "middle",
                        },
                      }}
                      stroke="#94a3b8"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#cbd5e1" }}
                      width={55}
                    />

                    {/* TOOLTIP DIGITAL */}
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 31, 26, 0.95)",
                        border: "1px solid rgba(34, 211, 238, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                      }}

                      labelStyle={{
                        color: "#d4f4e8",      // warna label tooltip
                        fontWeight: "bold",
                      }}

                      itemStyle={{
                        color: "#d4f4e8",      // warna nilai tooltip
                      }}

                      formatter={(value: any, name: string) => {
                        let numericValue: number;

                        if (typeof value === "number") {
                          numericValue = value;
                        } else if (typeof value === "string") {
                          numericValue = parseFloat(value);
                        } else {
                          return [value, name];
                        }

                        if (name === "x") {
                          return [numericValue.toFixed(2), config.axes.x];
                        }

                        if (name === "y") {
                          return [numericValue.toFixed(2), config.axes.y];
                        }

                        return [value, name];
                      }}

                      labelFormatter={(label, payload) => {
                        const data = payload[0]?.payload;
                        return (
                          <div>
                            <p className="font-bold text-teal-300">{data?.nama_desa || "Desa"}</p>
                            <p className="text-xs text-teal-100">{data?.kecamatan || ""}</p>
                          </div>
                        );
                      }}
                    />

                    {/* LEGEND */}
                    <Legend
                      verticalAlign="bottom"
                      height={35}
                      wrapperStyle={{
                        paddingTop: "5px",
                        fontSize: "10px",
                        color: "#d4f4e8",
                      }}
                      iconSize={8}
                      onClick={(e) => {
                        const clusterId = parseInt(e.value.split(" ")[1]);
                        setSelectedClusterId(clusterId);
                      }}
                    />

                    {/* SCATTER PLOT */}
                    {uniqueClusters.map((clusterId) => (
                      <Scatter
                        key={clusterId}
                        name={`Cluster ${clusterId}`}
                        data={sampledData.filter((d) => d.clusterId === clusterId)}
                        fill={scatterCOLORS[clusterId] || "#757575"}
                        opacity={0.8}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>


        {/* Pie Chart */}
        <div
          className="xl:col-span-4 rounded-xl shadow-md overflow-hidden"
          style={{
            background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
            border: "1px solid rgba(34, 211, 238, 0.2)", // Border card
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Shadow
          }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3"
            style={{
              borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Border bawah header
              background: "rgba(16, 185, 129, 0.08)", // Background header
            }}
          >
            <h2
              className="text-sm sm:text-base font-semibold"
              style={{ color: "#d4f4e8" }} // Warna teks dari digital.txt
            >
              Proporsi Cluster
            </h2>
          </div>

          {/* BODY */}
          <div className="p-3 sm:p-4">
            {clusterStats.length > 0 ? (
              <>
                {/* PIE CHART */}
                <div style={{ height: "300px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clusterStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        dataKey="value"
                        label={renderCustomLabel}
                      >
                        {clusterStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [`${value} desa`, "Jumlah"]}
                        contentStyle={{
                          background: "rgba(10, 31, 26, 0.95)", // Latar tooltip digital.txt
                          border: "1px solid rgba(34, 211, 238, 0.3)", // Border tooltip
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#d4f4e8", // Teks tooltip digital.txt
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* LIST CLUSTER */}
                <div
                  className="mt-4 space-y-2"
                  style={{ maxHeight: "228px", overflowY: "auto", paddingRight: "8px" }}
                >
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
                            style={{ backgroundColor: COLORS[clusterId] }}
                          ></div>
                          <span className="text-sm font-medium text-white">
                            {stat.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">
                          {stat.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ height: "520px" }}
              >
                <p className="text-gray-400">Tidak ada data</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Radar Chart */}
      <div
        className="rounded-xl shadow-lg overflow-hidden"
        style={{
          background: "rgba(10, 31, 26, 0.7)",
          border: "1px solid rgba(34, 211, 238, 0.25)",
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.20)",
        }}
      >
        {/* HEADER */}
        <div
          className="px-5 py-4"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            borderBottom: "1px solid rgba(34, 211, 238, 0.25)",
          }}
        >
          <h2 className="text-lg font-semibold text-teal-300">
            Profil Karakteristik per Cluster
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            Perbandingan rata-rata indikator antar cluster
          </p>
        </div>

        {/* CHART */}
        <div className="p-4">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={440}>
              <RadarChart data={radarData}>
                
                {/* Grid */}
                <PolarGrid stroke="rgba(34, 211, 238, 0.2)" />

                {/* Label keliling */}
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#e5e7eb", fontSize: 12, fontWeight: "500" }}
                />

                {/* Sumbu radius */}
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#cbd5e1", fontSize: 10 }}
                  stroke="rgba(34, 211, 238, 0.25)"
                />

                {/* Radar Cluster */}
                {uniqueClusters.map((clusterId) => (
                  <Radar
                    key={clusterId}
                    name={`Cluster ${clusterId}`}
                    dataKey={`Cluster ${clusterId}`}
                    stroke={scatterCOLORS[clusterId]}
                    fill={scatterCOLORS[clusterId]}
                    fillOpacity={0.28}
                    strokeWidth={2}
                  />
                ))}

                {/* Legend */}
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                  iconSize={10}
                />

                {/* Tooltip */}
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.85)",
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  labelStyle={{ color: "#f8fafc", fontWeight: "600" }}
                  itemStyle={{ color: "#f8fafc" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[440px]">
              <p className="text-gray-400 text-sm">Tidak ada data radar</p>
            </div>
          )}
        </div>
      </div>

      {/* Karakteristik Cluster */}
      <div
        className="rounded-xl shadow-lg overflow-hidden"
        style={{
          background: "rgba(10, 31, 26, 0.65)",
          border: "1px solid rgba(34, 211, 238, 0.18)",
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.15)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* HEADER */}
        <div
          className="px-6 py-4"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            borderBottom: "1px solid rgba(34, 211, 238, 0.22)",
          }}
        >
          <h2 className="text-lg font-bold text-teal-300">
            Karakteristik & Prioritas Cluster
          </h2>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">
          {clusterStats.map((stat, idx) => {
            const clusterId = parseInt(stat.name.split(" ")[1]);
            const count = stat.value;
            const percentage = ((count / chartData.length) * 100).toFixed(1);

            const clusterItems = chartData.filter(d => d.clusterId === clusterId);

            const avgPriority =
              clusterItems.reduce(
                (sum, item) =>
                  sum + (parseFloat(item.rawData[config.priorityMetric]) || 0),
                0
              ) / clusterItems.length;

            const priorityLevel =
              avgPriority < 35
                ? "🔴 Tinggi"
                : avgPriority < 66
                ? "🟡 Sedang"
                : "🟢 Rendah";

            return (
              <div
                key={idx}
                className="rounded-lg p-4 transition shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                  borderLeft: `4px solid ${scatterCOLORS[clusterId]}`,
                  boxShadow: `0 0 12px ${scatterCOLORS[clusterId]}25`,
                  backdropFilter: "blur(3px)",
                }}
                onClick={() => {
                  setSelectedClusterId(clusterId);
                  setCurrentPage(1);
                }}
              >
                {/* TOP ROW */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-teal-200 text-lg">{stat.name}</p>
                    <p className="text-sm text-gray-300">{stat.label}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-200">
                      {count} desa ({percentage}%)
                    </p>
                    <p className="text-xs mt-1 text-gray-300">
                      Prioritas: <span className="font-bold">{priorityLevel}</span>
                    </p>
                  </div>
                </div>

                {/* DETAIL */}
                <div className="mt-3 pt-2 border-t border-gray-700/40">
                  <p className="text-xs text-gray-300">
                    Skor rata-rata {config.priorityMetric.replace(/_/g, " ")}:{" "}
                    <span className="font-semibold text-teal-200">
                      {avgPriority.toFixed(1)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Detail Desa */}
      {selectedClusterId !== null && (
      <div
        className="rounded-xl p-6 shadow-lg"
        style={{
          background: "rgba(10, 31, 26, 0.65)",
          border: "1px solid rgba(34, 211, 238, 0.18)",
          boxShadow: "0 0 25px rgba(16, 185, 129, 0.15)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-teal-300">
              Detail Desa – Cluster {selectedClusterId}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Menampilkan {startIndex + 1}–{Math.min(endIndex, filteredVillages.length)} dari{" "}
              {filteredVillages.length} desa
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* SEARCH INPUT */}
            <input
              type="text"
              placeholder="🔍 Cari desa atau kecamatan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg text-sm text-gray-200
                        bg-gray-800/40 border border-teal-500/30
                        placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-teal-400"
            />

            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                setSelectedClusterId(null);
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-red-600/80 text-white rounded-lg text-sm font-medium
                        hover:bg-red-600 transition shadow-sm"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead
              className="bg-gray-900/40 border-b border-gray-700/60"
              style={{ backdropFilter: "blur(6px)" }}
            >
              <tr>
                {["No", "Nama Desa", "Kecamatan", "Kabupaten", config.axes.x, config.axes.y, "Label"].map(
                  (title, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 font-bold text-gray-200 ${
                        i >= 4 && i <= 5 ? "text-center" : "text-center"
                      }`}
                    >
                      {title.replace(/_/g, " ")}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700/40">
              {currentVillages.map((village, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-800/40 transition text-gray-300"
                >
                  <td className="px-4 py-3 text-center ">{startIndex + idx + 1}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-100">{village.nama_desa}</td>
                  <td className="px-4 py-3 text-center">{village.kecamatan}</td>
                  <td className="px-4 py-3 text-center">{village.kabupaten}</td>

                  <td className="px-4 py-3 text-center font-mono">{village.x.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center font-mono">{village.y.toFixed(2)}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium text-white shadow"
                      style={{
                        backgroundColor: clusterColors[selectedClusterId],
                      }}
                    >
                      {village.clusterLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVillages.length === 0 && (
            <p className="text-center py-8 text-gray-400">
              Tidak ada desa yang sesuai dengan pencarian
            </p>
          )}
        </div>

        {/* PAGINATION */}
        {filteredVillages.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
            <div className="text-sm text-gray-300">
              Halaman{" "}
              <span className="font-bold text-teal-300">{currentPage}</span> dari{" "}
              <span className="font-bold text-teal-300">{totalPages}</span>
            </div>

            <div className="flex gap-2">
              {/* BACK BUTTON */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  currentPage === 1
                    ? "bg-gray-700/40 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600/80 text-white hover:bg-teal-600"
                }`}
              >
                ← Back
              </button>

              {/* PAGE NUMBER BUTTONS */}
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
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        currentPage === pageNum
                          ? "bg-teal-600 text-white shadow"
                          : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* NEXT BUTTON */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  currentPage === totalPages
                    ? "bg-gray-700/40 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600/80 text-white hover:bg-teal-600"
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