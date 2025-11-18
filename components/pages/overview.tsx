// src/app/(your-path)/overview.tsx
"use client"
import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  BarChart,
  Bar,
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
import { useChatbotContext } from "@/context/ChatbotContext"
import { supabase } from "@/lib/supabaseClient";

interface ClusterTipologiData {
  IDDESA: string
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  Latitude: number
  Longitude: number
  skor_akses_dasar: number
  skor_konektivitas: number
  skor_pengelolaan_lingkungan: number
  skor_kesejahteraan: number
  skor_kelembagaan_ekonomi: number
  skor_produktivitas_ekonomi: number
  skor_akses_kesehatan: number
  skor_kualitas_kesehatan: number
  skor_program_kesehatan: number
  skor_pendidikan_lanjut: number
  skor_literasi_masyarakat: number
  skor_kualitas_lingkungan: number
  skor_ketahanan_bencana: number
  skor_digital_readiness: number
  skor_status_wilayah: number
  skor_karakteristik_khusus: number
  sektor_pertanian: number
  sektor_industri: number
  sektor_jasa: number
  status_perkotaan: number
  ada_pades: number
  ada_bumdes: number
  ada_sid: number
  kelengkapan_pendidikan: number
  ada_vokasi: number
  ada_mitigasi_bencana: number
  kelengkapan_kesehatan: number
  kelengkapan_ekonomi: number
  cluster: number
  total_penduduk: number
  total_kk: number
  cluster_label: string
  cluster_label_detail: string
  final_label: string
}

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

// Fungsi untuk membuat label kustom dengan warna dan gaya sesuai tema digital.txt
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
      fill="#d4f4e8" // Warna teks utama dari digital.txt
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={12}
    >
      {lines.map((line: string, i: number) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : "1em"}>
          {line}
        </tspan>
      ))}
      <tspan x={x} dy="1em" fontWeight="bold" fill="#22d3ee"> {/* Warna aksen dari digital.txt */}
        {`${(percent * 100).toFixed(0)}%`}
      </tspan>
    </text>
  );
};

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div 
      className="h-56 sm:h-80 md:h-96 rounded-lg animate-pulse flex items-center justify-center"
      style={{
        background: "rgba(10, 31, 26, 0.6)", // Warna latar dari digital.txt
        border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
      }}
    >
      <p className="text-sm" style={{ color: "#a8dcc8" }}>Memuat peta...</p> {/* Warna teks dari digital.txt */}
    </div>
  ),
})

// Warna-warna dari digital.txt
const COLORS = ["#10b981", "#14b8a6", "#22d3ee", "#34d399", "#06b6d4", "#7dd3fc"]

const ITEMS_PER_PAGE = 10
export default function OverviewPage() {
  const [data, setData] = useState<ClusterTipologiData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  // Filter State
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])
  const { setPageContext } = useChatbotContext()
  const safeToFixed = (value: number | null, decimals = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A"
    return Number(value).toFixed(decimals)
  }

  const isValidCoord = (lat: number, lng: number) => {
    return (
      lat !== 0 &&
      lng !== 0 &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -11 &&
      lat <= -6 &&
      lng >= 110 &&
      lng <= 115
    )
  }

  useEffect(() => {
    if (!selectedKab) {
      setKecamatanOptions([])
      setDesaOptions([])
      setSelectedKec("")
      setSelectedDesa("")
      return
    }
    const kecList = [...new Set(data.filter(d => d.NAMA_KAB === selectedKab).map(d => d.NAMA_KEC))].sort()
    setKecamatanOptions(kecList)
    setSelectedKec("")
    setSelectedDesa("")
  }, [selectedKab, data])

  useEffect(() => {
    if (!selectedKec || !selectedKab) {
      setDesaOptions([])
      setSelectedDesa("")
      return
    }
    const desaList = [...new Set(data.filter(d => d.NAMA_KEC === selectedKec && d.NAMA_KAB === selectedKab).map(d => d.NAMA_DESA))].sort()
    setDesaOptions(desaList)
    setSelectedDesa("")
  }, [selectedKec, selectedKab, data])

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('cluster_tipologi')
        .select('*');
      if (error) {
        console.error('Error fetching data:', error);
        setData([]);
      } else {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])

  const tableData = useMemo(() => {
    if (!data.length) return []
    let result = data
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec)
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.NAMA_DESA?.toLowerCase().includes(s) ||
          item.NAMA_KEC?.toLowerCase().includes(s) ||
          item.NAMA_KAB?.toLowerCase().includes(s) ||
          item.final_label?.toLowerCase().includes(s)
      )
    }
    return result
  }, [data, selectedKab, selectedKec, searchTerm])

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  const mapMarkers = useMemo(() => {
    if (!data.length) return [];

    // ====== MODE: LEVEL KABUPATEN ======
    if (!selectedKab) {
      const kabupatenMap = new Map();

      data.forEach(item => {
        if (isValidCoord(item.Latitude, item.Longitude) && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.final_label,

            // Tambahan data (ambil 1 sample per kabupaten)
            total_penduduk: item.total_penduduk,
            skor_akses_dasar : item.skor_akses_dasar,
            skor_kualitas_lingkungan : item.skor_kualitas_lingkungan,
            total_kk: item.total_kk,
            cluster_label: item.cluster_label
          });
        }
      });

      return Array.from(kabupatenMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.name,
        kecamatan: "",

        cluster: m.cluster,
        label: m.label,

        // Extra fields
        total_penduduk: m.total_penduduk,
        skor_akses_dasar : m.skor_akses_dasar,
        skor_kualitas_lingkungan : m.skor_kualitas_lingkungan,
        total_kk: m.total_kk,
        cluster_label: m.cluster_label,
      }));
    }

    // ====== MODE: LEVEL KECAMATAN ======
    if (selectedKab && !selectedKec) {
      const kecamatanMap = new Map();

      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (isValidCoord(item.Latitude, item.Longitude)) {
            const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`;
            if (!kecamatanMap.has(key)) {
              kecamatanMap.set(key, {
                lat: item.Latitude,
                lng: item.Longitude,
                name: item.NAMA_KEC,
                kabupaten: item.NAMA_KAB,
                cluster: item.cluster,
                label: item.final_label,

                total_penduduk: item.total_penduduk,
                total_kk: item.total_kk,
                skor_akses_dasar : item.skor_akses_dasar,
                skor_kualitas_lingkungan : item.skor_kualitas_lingkungan,
                cluster_label: item.cluster_label
              });
            }
          }
        });

      return Array.from(kecamatanMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.kabupaten,
        kecamatan: m.name,

        cluster: m.cluster,
        label: m.label,

        total_penduduk: m.total_penduduk,
        total_kk: m.total_kk,

        skor_akses_dasar : m.skor_akses_dasar,
        skor_kualitas_lingkungan : m.skor_kualitas_lingkungan,
        cluster_label: m.cluster_label,
      }));
    }

    // ====== MODE: LEVEL DESA ======
    if (selectedKab && selectedKec) {
      return data
        .filter(
          d =>
            d.NAMA_KAB === selectedKab &&
            d.NAMA_KEC === selectedKec &&
            isValidCoord(d.Latitude, d.Longitude)
        )
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,

          cluster: m.cluster,
          label: m.final_label,

          // Extra detail fields
          total_penduduk: m.total_penduduk,
          total_kk: m.total_kk,
          cluster_label: m.cluster_label,

          skor_akses_dasar : m.skor_akses_dasar,
          skor_kualitas_lingkungan : m.skor_kualitas_lingkungan,

          skor_produktivitas: m.skor_produktivitas_ekonomi,
          skor_kesejahteraan: m.skor_kesejahteraan,
        }));
    }

    return [];
  }, [data, selectedKab, selectedKec]);


  const chartData = useMemo(() => {
    if (!data.length) return { aksesDasar: [], kesejahteraan: [], label: "Data" }
    if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        aksesDasar: desaData.map(d => ({ name: d.NAMA_DESA, "Akses Dasar": Number(d.skor_akses_dasar?.toFixed(1) || 0) })),
        kesejahteraan: desaData.map(d => ({ name: d.NAMA_DESA, "Kesejahteraan": Number(d.skor_kesejahteraan?.toFixed(1) || 0) })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const kecAkses = data.filter(d => d.NAMA_KAB === selectedKab).reduce((acc, item) => {
        const key = item.NAMA_KEC
        if (!acc[key]) acc[key] = { total: 0, count: 0 }
        acc[key].total += item.skor_akses_dasar || 0
        acc[key].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)
      const kecKesej = data.filter(d => d.NAMA_KAB === selectedKab).reduce((acc, item) => {
        const key = item.NAMA_KEC
        if (!acc[key]) acc[key] = { total: 0, count: 0 }
        acc[key].total += item.skor_kesejahteraan || 0
        acc[key].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)
      return {
        aksesDasar: Object.entries(kecAkses).map(([name, val]) => ({ name, "Akses Dasar": Number((val.total / val.count).toFixed(1)) })),
        kesejahteraan: Object.entries(kecKesej).map(([name, val]) => ({ name, "Kesejahteraan": Number((val.total / val.count).toFixed(1)) })),
        label: "Kecamatan"
      }
    } else {
      const kabAkses = data.reduce((acc, item) => {
        const key = item.NAMA_KAB
        if (!acc[key]) acc[key] = { total: 0, count: 0 }
        acc[key].total += item.skor_akses_dasar || 0
        acc[key].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)
      const kabKesej = data.reduce((acc, item) => {
        const key = item.NAMA_KAB
        if (!acc[key]) acc[key] = { total: 0, count: 0 }
        acc[key].total += item.skor_kesejahteraan || 0
        acc[key].count += 1
        return acc
      }, {} as Record<string, { total: number; count: number }>)
      return {
        aksesDasar: Object.entries(kabAkses).map(([name, val]) => ({ name, "Akses Dasar": Number((val.total / val.count).toFixed(1)) })),
        kesejahteraan: Object.entries(kabKesej).map(([name, val]) => ({ name, "Kesejahteraan": Number((val.total / val.count).toFixed(1)) })),
        label: "Kabupaten"
      }
    }
  }, [data, selectedKab, selectedKec])

  const komponenChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof ClusterTipologiData) => {
      const valid = activeData.filter(d => d[key] != null && !isNaN(d[key] as number))
      if (valid.length === 0) return 0
      return Number((valid.reduce((sum, d) => sum + (d[key] as number), 0) / valid.length).toFixed(1))
    }
    return [
      { name: "Akses Dasar", avg: avg("skor_akses_dasar") },
      { name: "Konektivitas", avg: avg("skor_konektivitas") },
      { name: "Lingkungan", avg: avg("skor_kualitas_lingkungan") },
      { name: "Kesejahteraan", avg: avg("skor_kesejahteraan") },
      { name: "Kesehatan", avg: avg("skor_akses_kesehatan") },
      { name: "Digital", avg: avg("skor_digital_readiness") },
    ]
  }, [activeData])

  const sektorChartData = useMemo(() => {
    if (!activeData.length) return []
    return [
      { name: "Pertanian", count: activeData.filter(d => d.sektor_pertanian === 1).length },
      { name: "Industri", count: activeData.filter(d => d.sektor_industri === 1).length },
      { name: "Jasa", count: activeData.filter(d => d.sektor_jasa === 1).length },
    ]
  }, [activeData])

  const infraProgramChartData = useMemo(() => {
    if (!activeData.length) return []
    return [
      { name: "PADES", value: activeData.filter(d => d.ada_pades === 1).length },
      { name: "BUMDES", value: activeData.filter(d => d.ada_bumdes === 1).length },
      { name: "SID", value: activeData.filter(d => d.ada_sid === 1).length },
      { name: "Vokasi", value: activeData.filter(d => d.ada_vokasi === 1).length },
      { name: "Mitigasi", value: activeData.filter(d => d.ada_mitigasi_bencana === 1).length },
      { name: "Kel. Pendidikan", value: activeData.filter(d => d.kelengkapan_pendidikan > 0).length },
    ]
  }, [activeData])

  const clusterDistribution = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.final_label)
        if (existing) existing.value += 1
        else acc.push({ name: item.final_label, value: 1 })
        return acc
      },
      [] as Array<{ name: string; value: number }>
    )
  }, [activeData])

  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgAksesDasar: "0.0",
        avgKesejahteraan: "0.0",
        avgDigital: "0.0",
      }
    }
    const total = activeData.length
    const avgAkses = activeData.reduce((sum, d) => sum + (d.skor_akses_dasar || 0), 0) / total
    const avgKesej = activeData.reduce((sum, d) => sum + (d.skor_kesejahteraan || 0), 0) / total
    const avgDigital = activeData.reduce((sum, d) => sum + (d.skor_digital_readiness || 0), 0) / total
    return {
      totalDesa: total,
      avgAksesDasar: safeToFixed(avgAkses),
      avgKesejahteraan: safeToFixed(avgKesej),
      avgDigital: safeToFixed(avgDigital),
    }
  }, [activeData])

  const visibleDataSummary = useMemo(() => {
    if (!activeData.length) return null
    const totalDesa = activeData.length
    const avg = (key: keyof ClusterTipologiData) =>
      (activeData.reduce((sum, d) => sum + (d[key] as number || 0), 0) / totalDesa).toFixed(1)

    let wilayah = "Provinsi Jawa Timur"
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`

    return {
      wilayah,
      jumlah_desa: totalDesa,
      rata_rata_skor: {
        akses_dasar: parseFloat(avg("skor_akses_dasar")),
        kesejahteraan: parseFloat(avg("skor_kesejahteraan")),
        digital: parseFloat(avg("skor_digital_readiness")),
        konektivitas: parseFloat(avg("skor_konektivitas")),
        lingkungan: parseFloat(avg("skor_kualitas_lingkungan")),
      },
      distribusi_kluster: activeData.reduce((acc, d) => {
        acc[d.final_label] = (acc[d.final_label] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }, [activeData, selectedKab, selectedKec])

  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "overview",
        pageTitle: "Dashboard Overview Desa",
        filters: {
          kabupaten: selectedKab || undefined,
          kecamatan: selectedKec || undefined,
          desa: selectedDesa || undefined,
        },
        visibleDataSummary,
      })
    }
  }, [visibleDataSummary, selectedKab, selectedKec, selectedDesa, setPageContext])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          {/* Loading spinner dari digital.txt */}
          <div 
            className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
            style={{
              border: "3px solid rgba(34, 211, 238, 0.2)",
              borderTopColor: "#22d3ee",
            }}
          ></div>
          <p style={{ color: "#a8dcc8" }}>Memuat data dari server...</p> {/* Warna teks dari digital.txt */}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* STICKY HEADER - Mobile Optimized - Gaya dari digital.txt */}
      <div 
        className="sticky top-0 z-[999] shadow-sm"
        style={{
          background: "rgba(10, 31, 26, 0.9)", // Warna latar dari digital.txt
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
        }}
      >
        <div className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 
                className="text-lg sm:text-2xl md:text-3xl font-bold truncate"
                style={{ 
                  background: "linear-gradient(135deg, #22d3ee, #10b981)", // Gradien judul dari digital.txt
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Dashboard Tipologi Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#a8dcc8" }}> {/* Warna teks dari digital.txt */}
                Tipologi desa berdasarkan klaster multidimensional
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 transition-all"
              style={{
                background: "rgba(34, 211, 238, 0.15)", // Warna tombol dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                color: "#22d3ee", // Warna teks dari digital.txt
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.25)" // Efek hover dari digital.txt
                e.currentTarget.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.3)" // Efek hover dari digital.txt
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.15)" // Efek hover dari digital.txt
                e.currentTarget.style.boxShadow = "none" // Efek hover dari digital.txt
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
          {/* Filter Panel - Collapsible on Mobile */}
          {showFilters && (
            <div 
              className="space-y-2 sm:space-y-3 pt-3 animate-in slide-in-from-top duration-200"
              style={{
                borderTop: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#d4f4e8" }}>Kabupaten</label> {/* Warna teks dari digital.txt */}
                  <select
                    value={selectedKab}
                    onChange={(e) => setSelectedKab(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      background: "rgba(16, 185, 129, 0.1)", // Warna input dari digital.txt
                      border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                      color: "#d4f4e8", // Warna teks dari digital.txt
                    }}
                  >
                    <option value="" style={{ background: "#1a3a32" }}>Semua Kabupaten</option> {/* Warna background dari digital.txt */}
                    {[...new Set(data.map(d => d.NAMA_KAB))].sort().map(kab => (
                      <option key={kab} value={kab} style={{ background: "#1a3a32" }}>{kab}</option> // Warna background dari digital.txt
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#d4f4e8" }}>Kecamatan</label> {/* Warna teks dari digital.txt */}
                  <select
                    value={selectedKec}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(16, 185, 129, 0.1)", // Warna input dari digital.txt
                      border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                      color: "#d4f4e8", // Warna teks dari digital.txt
                    }}
                    disabled={!selectedKab}
                  >
                    <option value="" style={{ background: "#1a3a32" }}>Semua Kecamatan</option> {/* Warna background dari digital.txt */}
                    {kecamatanOptions.map(kec => (
                      <option key={kec} value={kec} style={{ background: "#1a3a32" }}>{kec}</option> // Warna background dari digital.txt
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#d4f4e8" }}>Desa</label> {/* Warna teks dari digital.txt */}
                  <select
                    value={selectedDesa}
                    onChange={(e) => setSelectedDesa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(16, 185, 129, 0.1)", // Warna input dari digital.txt
                      border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                      color: "#d4f4e8", // Warna teks dari digital.txt
                    }}
                    disabled={!selectedKec}
                  >
                    <option value="" style={{ background: "#1a3a32" }}>Semua Desa</option> {/* Warna background dari digital.txt */}
                    {desaOptions.map(desa => (
                      <option key={desa} value={desa} style={{ background: "#1a3a32" }}>{desa}</option> // Warna background dari digital.txt
                    ))}
                  </select>
                </div>
              </div>
              {(selectedKab || selectedKec || selectedDesa) && (
                <button
                  onClick={() => {
                    setSelectedKab("")
                    setSelectedKec("")
                    setSelectedDesa("")
                  }}
                  className="text-xs font-medium flex items-center gap-1 transition-all"
                  style={{ color: "#ef4444" }} // Warna tombol reset dari digital.txt
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Cards - Responsive Grid - Gaya dari digital.txt */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-emerald-700 to-emerald-200" },
            { label: "Rata-rata Akses Dasar", value: stats.avgAksesDasar, color: "from-green-700 to-green-300" },
            { label: "Rata-rata Kesejahteraan", value: stats.avgKesejahteraan, color: "from-teal-700 to-teal-300" },
            { label: "Rata-rata Digital Ready", value: stats.avgDigital, color: "from-cyan-700 to-cyan-300" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg text-white`}>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Map Section - Gaya dari digital.txt */}
        <div
          className="
            rounded-xl shadow-md overflow-hidden
            bg-[rgba(10,31,26,0.7)]
            border border-[rgba(34,211,238,0.2)]
            shadow-[0_0_30px_rgba(16,185,129,0.1)]
          "
        >
          {/* Header */}
          <div
            className="
              px-4 py-3
              bg-[rgba(16,185,129,0.08)]
              border-b border-[rgba(34,211,238,0.2)]
            "
          >
            <h2 className="text-base sm:text-lg font-semibold text-[#d4f4e8]">
              Sebaran Desa ({mapMarkers.length} lokasi)
            </h2>
          </div>

          {/* Map */}
          <div className="h-56 sm:h-80 md:h-96">
            <MapComponent
              markers={mapMarkers}
              renderTooltip={(marker) => (
                <div
                  className="px-4 py-3 rounded-xl shadow-lg bg-[rgba(15,35,30,0.9)] border border-[rgba(34,211,238,0.4)] backdrop-blur-sm text-white space-y-2 max-w-xs"
                  style={{
                    boxShadow: "0 4px 16px rgba(34,211,238,0.2)",
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {/* Nama Utama */}
                  <div className="font-bold text-lg tracking-tight text-[#d4f4e8]">
                    {marker.name}
                  </div>

                  {/* Informasi Lokasi */}
                  <div className="space-y-1 text-xs text-[#a8dcc8]">
                    {marker.kecamatan && (
                      <div className="flex items-center gap-1">
                        <span className="text-[12px]">📍</span>
                        <span>Kec. {marker.kecamatan}</span>
                      </div>
                    )}
                    {marker.kabupaten && (
                      <div className="flex items-center gap-1">
                        <span className="text-[12px]">🏛️</span>
                        <span>Kab. {marker.kabupaten}</span>
                      </div>
                    )}
                  </div>

                  {/* Badge Label (seperti contoh visual) */}
                  {marker.label && (
                    <div
                      className="mt-2 px-3 py-1.5 rounded-lg font-semibold text-sm text-[#22d3ee] bg-[rgba(34,211,238,0.15)] border border-[rgba(34,211,238,0.3)] whitespace-nowrap"
                      style={{
                        boxShadow: "inset 0 0 4px rgba(34,211,238,0.2)"
                      }}
                    >
                      {marker.label}
                    </div>
                  )}

                  {/* Skor Tambahan */}
                  {(marker.skor_akses_dasar !== undefined || marker.skor_kualitas_lingkungan !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                      {marker.skor_akses_dasar !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Akses Dasar:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_akses_dasar).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_kualitas_lingkungan !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Kualitas Lingkungan:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_kualitas_lingkungan).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}  
                </div>
              )}
            />
          </div>
        </div>

        {/* Charts Section - Mobile Optimized - Gaya dari digital.txt */}
        <div className="space-y-4 sm:space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 1 - Akses Dasar */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Rata-rata Skor Akses Dasar per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.aksesDasar} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis 
                      dataKey="name" 
                      stroke="#a8dcc8" // Warna sumbu dari digital.txt
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a8dcc8' }} /> {/* Warna legenda dari digital.txt */}
                    <Bar dataKey="Akses Dasar" fill="#10b981" radius={[4, 4, 0, 0]} /> {/* Warna batang dari digital.txt */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 2 - Kesejahteraan */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Rata-rata Skor Kesejahteraan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.kesejahteraan} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis 
                      dataKey="name" 
                      stroke="#a8dcc8" // Warna sumbu dari digital.txt
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#a8dcc8" fontSize={12} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a8dcc8' }} /> {/* Warna legenda dari digital.txt */}
                    <Line type="monotone" dataKey="Kesejahteraan" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} /> {/* Warna garis dari digital.txt */}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Komponen */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Skor Komponen per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={komponenChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis 
                      dataKey="name" 
                      stroke="#a8dcc8" // Warna sumbu dari digital.txt
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={12}
                      interval={0}
                    />
                    <YAxis stroke="#a8dcc8" fontSize={12} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a8dcc8' }} /> {/* Warna legenda dari digital.txt */}
                    <Bar dataKey="avg" fill="#7dd3fc" name="Rata-rata" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4 - Sektor */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Sektor Dominan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sektorChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis dataKey="name" stroke="#a8dcc8" fontSize={12} /> {/* Warna sumbu dari digital.txt */}
                    <YAxis stroke="#a8dcc8" fontSize={12} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a8dcc8' }} /> {/* Warna legenda dari digital.txt */}
                    <Bar dataKey="count" fill="#7dd3fc" name="Jumlah Desa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5 - Infrastruktur */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Infrastruktur & Program
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={infraProgramChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis 
                      dataKey="name" 
                      stroke="#a8dcc8" // Warna sumbu dari digital.txt
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={12}
                      interval={0}
                    />
                    <YAxis stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#a8dcc8' }} /> {/* Warna legenda dari digital.txt */}
                    <Bar dataKey="value" fill="#10b981" name="Jumlah Desa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 6 - Distribusi Kluster */}
            <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                  background: "rgba(16, 185, 129, 0.08)", // Warna latar header dari digital.txt
                }}
              >
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Distribusi Kluster Tipologi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
                    <Pie
                      data={clusterDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel} // Gunakan label kustom dari digital.txt
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clusterDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                      labelStyle={{
                          color: "#d4f4e8",      // warna label tooltip
                          fontWeight: "bold",
                      }}
                      itemStyle={{
                        color: "#d4f4e8",      // warna nilai tooltip
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}