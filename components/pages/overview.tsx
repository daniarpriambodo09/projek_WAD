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

// Fungsi bantu untuk wrap teks (tetap dipakai)
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
  const offset = 30;
  const radius = outerRadius + offset;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const lines = wrapText(String(name), 30);
  const anchor = x > cx ? "start" : "end";

    return (
      <text
        x={x}
        y={y}
        fill="#12201A"
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={12}
      >
        {lines.map((line: string, i: number) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : "1.1em"}>
            {line}
          </tspan>
        ))}
        <tspan x={x} dy="1.1em">
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <div className="h-64 sm:h-80 md:h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />,
})

const COLORS = [
  '#324D3E', // Akses Dasar / Desa Mandiri
  '#5A7A60', // Kesejahteraan / Desa Berkembang
  '#728A6E', // Komponen Lain / Desa Transisi
  '#8EA48B', // Sektor Dominan / Desa Potensial
  '#B3C8A1', // Infrastruktur / Desa Tertinggal
  '#9AB59F'  // Alternatif / Desa Spesifik
];
const ITEMS_PER_PAGE = 5 // Kurangi jumlah item per halaman di mobile

export default function OverviewPage() {
  const [data, setData] = useState<ClusterTipologiData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

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

  // === VALIDASI KOORDINAT ===
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

  // === EFFECTS UNTUK FILTER ===
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Gunakan klien yang sudah diimpor
      const { data, error } = await supabase
        .from('cluster_tipologi') // Ganti nama tabel sesuai kebutuhan
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

  // === DATA DINAMIS ===
  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])

  // === TABEL & PAGINASI ===
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

  // === MAP MARKERS (SESUAI LOGIKA digital.tsx) ===
  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    if (!selectedKab) {
      // Tampilkan kabupaten
      const kabupatenMap = new Map()
      data.forEach(item => {
        if (isValidCoord(item.Latitude, item.Longitude) && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.final_label,
          })
        }
      })
      return Array.from(kabupatenMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.name,
        kecamatan: "",
        cluster: m.cluster,
        label: m.label,
      }))
    }

    if (selectedKab && !selectedKec) {
      // Tampilkan kecamatan
      const kecamatanMap = new Map()
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (isValidCoord(item.Latitude, item.Longitude)) {
            const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`
            if (!kecamatanMap.has(key)) {
              kecamatanMap.set(key, {
                lat: item.Latitude,
                lng: item.Longitude,
                name: item.NAMA_KEC,
                kabupaten: item.NAMA_KAB,
                cluster: item.cluster,
                label: item.final_label,
              })
            }
          }
        })
      return Array.from(kecamatanMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.kabupaten,
        kecamatan: m.name,
        cluster: m.cluster,
        label: m.label,
      }))
    }

    // Jika kabupaten + kecamatan dipilih → tampilkan SEMUA desa dalam kecamatan itu
    if (selectedKab && selectedKec) {
      return data
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && isValidCoord(d.Latitude, d.Longitude))
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          skorProduktifitas: m.skor_produktivitas_ekonomi,
          skorKesejahteraan: m.skor_kesejahteraan,
          cluster: m.cluster,
          label: m.final_label,
        }))
    }

    return []
  }, [data, selectedKab, selectedKec]) // ⚠️ jangan masukkan selectedDesa

  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
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

  // === CHART TAMBAHAN ===
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

  // === VISIBLE DATA SUMMARY UNTUK CHATBOT ===
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
    return <div className="p-4 sm:p-6 text-black">Memuat data dari server...</div>
  }

  return (
    <div className="space-y-2 p-2 sm:p-2">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#c9ece7] px-4 sm:px-6 py-4 -mx-4 sm:-mx-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-2">Dashboard Tipologi Desa</h1>
            <p className="text-sm sm:text-base text-gray-600">Tipologi desa berdasarkan klaster multidimensional</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap justify-end">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-600">Filter Kabupaten</label>
              <select
                value={selectedKab}
                onChange={(e) => setSelectedKab(e.target.value)}
                className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] w-full"
              >
                <option value="">Semua Kabupaten</option>
                {[...new Set(data.map(d => d.NAMA_KAB))].sort().map(kab => (
                  <option key={kab} value={kab}>{kab}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-600">Filter Kecamatan</label>
              <select
                value={selectedKec}
                onChange={(e) => setSelectedKec(e.target.value)}
                className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] w-full"
                disabled={!selectedKab}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanOptions.map(kec => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-600">Filter Desa</label>
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] w-full"
                disabled={!selectedKec}
              >
                <option value="">Semua Desa</option>
                {desaOptions.map(desa => (
                  <option key={desa} value={desa}>{desa}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Total Desa</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Rata-rata Akses Dasar</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.avgAksesDasar}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Rata-rata Kesejahteraan</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.avgKesejahteraan}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Rata-rata Digital Ready</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.avgDigital}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-lg overflow-hidden">
        <h2 className="text-base sm:text-lg font-semibold text-black p-3 pb-2">
          Sebaran Desa di Jawa Timur ({mapMarkers.length} desa)
        </h2>
        <div className="h-64 sm:h-80 w-full">
          <MapComponent
            markers={mapMarkers}
            renderTooltip={(marker) => (
              <>
                <div className="font-semibold">{marker.name}</div>
                {marker.kecamatan && <div>Kec. {marker.kecamatan}</div>}
                {marker.kabupaten && <div>Kab. {marker.kabupaten}</div>}
                {marker.label && <div>{marker.label}</div>}
              </>
            )}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 1 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Rata-rata Skor Akses Dasar per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={chartData.aksesDasar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Akses Dasar" fill="#324D3E" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Rata-rata Skor Kesejahteraan per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <LineChart data={chartData.kesejahteraan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Kesejahteraan" stroke="#5A7A60" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 3 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Skor Komponen per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={komponenChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg" fill="#728A6E" name="Rata-rata" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Jumlah Sektor Dominan pada Wilayah per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={sektorChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8EA48B" name="Jumlah Desa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 5 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Ketersediaan Infrastruktur & Program per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={infraProgramChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#B3C8A1" name="Jumlah Desa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Distribusi Kluster Tipologi Desa
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <PieChart margin={{bottom:20}}>
                <Pie
                  data={clusterDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clusterDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-black">
            Detail Tipologi Desa ({tableData.length.toLocaleString()} hasil)
          </h2>
          <input
            type="text"
            placeholder="Cari nama desa, kecamatan, kabupaten, atau label ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 sm:px-4 sm:py-2 border border-[#c9ece7] rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] w-full"
          />
        </div>

        {/* Tabel untuk Mobile */}
        <div className="sm:hidden overflow-x-auto">
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => {
              const sektor =
                item.sektor_pertanian === 1 ? "Pertanian" : item.sektor_industri === 1 ? "Industri" : "Jasa"
              return (
                <div key={item.IDDESA + index} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-black font-medium">{item.NAMA_DESA}</p>
                      <p className="text-gray-600 text-sm">{item.NAMA_KEC}, {item.NAMA_KAB}</p>
                    </div>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.final_label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Akses Dasar: {safeToFixed(item.skor_akses_dasar)}</div>
                    <div>Konektivitas: {safeToFixed(item.skor_konektivitas)}</div>
                    <div>Kesejahteraan: {safeToFixed(item.skor_kesejahteraan)}</div>
                    <div>Lingkungan: {safeToFixed(item.skor_kualitas_lingkungan)}</div>
                    <div>Digital: {safeToFixed(item.skor_digital_readiness)}</div>
                    <div>Sektor: {sektor}</div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-gray-500 py-4">Tidak ada data ditemukan</p>
          )}
        </div>

        {/* Tabel untuk Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#c9ece7] bg-gray-50">
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">No</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Kab/Kota</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Kecamatan</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Desa</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Akses Dasar</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Konektivitas</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Kesejahteraan</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Lingkungan</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Digital Ready</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Sektor</th>
                <th className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">Label</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const sektor =
                    item.sektor_pertanian === 1 ? "Pertanian" : item.sektor_industri === 1 ? "Industri" : "Jasa"
                  return (
                    <tr key={item.IDDESA + index} className="border-b border-[#e0e0e0] hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{startIndex + index + 1}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{item.NAMA_KAB}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{item.NAMA_KEC}</td>
                      <td className="px-3 py-2 text-black font-medium text-xs sm:text-sm">{item.NAMA_DESA}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_akses_dasar)}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_konektivitas)}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_kesejahteraan)}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_kualitas_lingkungan)}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_digital_readiness)}</td>
                      <td className="px-3 py-2 text-black text-xs sm:text-sm">{sektor}</td>
                      <td className="px-3 py-2 text-xs sm:text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          item.cluster === 0
                            ? "bg-green-900 text-green-200"
                            : item.cluster === 1
                            ? "bg-blue-900 text-blue-200"
                            :item.cluster === 2
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-red-900 text-red-200"
                        }`}>
                          {item.final_label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-3 py-4 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-[#c9ece7]">
          <div className="text-black text-xs sm:text-sm">
            Menampilkan {paginatedData.length > 0 ? startIndex + 1 : 0} -{" "}
            {Math.min(endIndex, tableData.length)} dari {tableData.length.toLocaleString()} data
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 sm:px-4 sm:py-2 border border-[#c9ece7] rounded text-xs sm:text-sm text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Sebelumnya
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, tableTotalPages) }, (_, i) => {
                let pageNum
                if (tableTotalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= tableTotalPages - 2) {
                  pageNum = tableTotalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm ${
                      currentPage === pageNum
                        ? "bg-green-600 text-white"
                        : "border border-gray-300 text-black hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, tableTotalPages))}
              disabled={currentPage === tableTotalPages}
              className="px-3 py-1 sm:px-4 sm:py-2 border border-[#c9ece7] rounded text-xs sm:text-sm text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}