// src/app/(your-path)/ekonomi.tsx
"use client"
import dynamic from "next/dynamic"
import { useEffect, useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useChatbotContext } from '@/context/ChatbotContext';
import { supabase } from "@/lib/supabaseClient";
interface EkonomiData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  total_kk: number
  total_penduduk: number
  sktm: number
  skor_kesejahteraan: number
  sektor_dominan: number
  grup_sektor: string
  sektor_pertanian: number
  sektor_perdagangan: number
  sektor_industri: number
  sektor_jasa: number
  sektor_lainnya: number
  ada_pades: number
  jumlah_bumdes: number
  skor_bumdes: number
  jumlah_koperasi: number
  skor_koperasi: number
  ada_produk_unggulan: number
  total_industri: number
  skor_industri: number
  skor_akses_modal: number
  skor_infrastruktur_ekonomi: number
  skor_ekonomi_total: number
  kategori_ekonomi: string
  cluster: number
  label: string
  Latitude: number
  Longitude: number
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
      fill="#12201A"
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

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-56 sm:h-80 md:h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500 text-sm">Memuat peta...</p>
    </div>
  ),
})

const COLORS = ["#324D3E", "#5A7A60", "#728A6E", "#8EA48B", "#B3C8A1", "#9AB59F"]

export default function EkonomiPage() {
  const [data, setData] = useState<EkonomiData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { setPageContext } = useChatbotContext();

  // Helpers
  const safeToFixed = (value: number | null, decimals = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A"
    return Number(value).toFixed(decimals)
  }

  // Filter dependencies
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
      const { data, error } = await supabase
        .from('cluster_ekonomi')
        .select('*');
      if (error) {
        console.error('Error fetching ', error);
        setData([]);
      } else {
        setData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Active data (for stats & charts)
  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])

  // Stats
  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgEkonomi: "0.0",
        avgKesejahteraan: "0.0",
        avgBUMDES: "0.0",
      }
    }
    const total = activeData.length
    const avgEkonomi = activeData.reduce((sum, d) => sum + d.skor_ekonomi_total, 0) / total
    const avgKesejahteraan = activeData.reduce((sum, d) => sum + d.skor_kesejahteraan, 0) / total
    const avgBUMDES = activeData.reduce((sum, d) => sum + d.jumlah_bumdes, 0) / total
    return {
      totalDesa: total,
      avgEkonomi: safeToFixed(avgEkonomi),
      avgKesejahteraan: safeToFixed(avgKesejahteraan),
      avgBUMDES: safeToFixed(avgBUMDES),
    }
  }, [activeData])

  // Map markers
  const mapMarkers = useMemo(() => {
    if (!data.length) return []
    if (!selectedKab) {
      const kabupatenMap = new Map()
      data.forEach(item => {
        if (item.Latitude && item.Longitude && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.label,
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
      const kecamatanMap = new Map()
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (item.Latitude && item.Longitude) {
            const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`
            if (!kecamatanMap.has(key)) {
              kecamatanMap.set(key, {
                lat: item.Latitude,
                lng: item.Longitude,
                name: item.NAMA_KEC,
                kabupaten: item.NAMA_KAB,
                cluster: item.cluster,
                label: item.label,
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
    if (selectedKab && selectedKec) {
      return data
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && d.Latitude && d.Longitude)
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          skorEkonomi: m.skor_ekonomi_total,
          skorKesejahteraan: m.skor_kesejahteraan,
          cluster: m.cluster,
          label: m.label,
        }))
    }
    return []
  }, [data, selectedKab, selectedKec])

  // Chart data
  const chartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }
    if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_ekonomi_total.toFixed(1)) })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KEC)
          if (existing) {
            existing.totalSkor += item.skor_ekonomi_total
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KEC, totalSkor: item.skor_ekonomi_total, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kecamatan" }
    } else {
      const grouped = data
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KAB)
          if (existing) {
            existing.totalSkor += item.skor_ekonomi_total
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KAB, totalSkor: item.skor_ekonomi_total, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kabupaten" }
    }
  }, [data, selectedKab, selectedKec])

  const kesejahteraanChartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }
    if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_kesejahteraan.toFixed(1)) })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KEC)
          if (existing) {
            existing.totalSkor += item.skor_kesejahteraan
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KEC, totalSkor: item.skor_kesejahteraan, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kecamatan" }
    } else {
      const grouped = data
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KAB)
          if (existing) {
            existing.totalSkor += item.skor_kesejahteraan
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KAB, totalSkor: item.skor_kesejahteraan, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kabupaten" }
    }
  }, [data, selectedKab, selectedKec])

  const sectorChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof EkonomiData) => {
      const sum = activeData.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "Pertanian", avg: avg("sektor_pertanian") },
      { name: "Perdagangan", avg: avg("sektor_perdagangan") },
      { name: "Industri", avg: avg("sektor_industri") },
    ]
  }, [activeData])

  const komponenEkonomiData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof EkonomiData) => {
      const sum = activeData.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "BUMDES", avg: avg("skor_bumdes") },
      { name: "Koperasi", avg: avg("skor_koperasi") },
      { name: "Industri", avg: avg("skor_industri") },
      { name: "Akses Modal", avg: avg("skor_akses_modal") },
    ]
  }, [activeData])

  const sektorDominanDistribution = useMemo(() => {
    if (!activeData.length) return []
    const distribution = activeData.reduce((acc, item) => {
      const key = item.grup_sektor || "Tidak Diketahui";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [activeData])

  const clusterDistribution = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.label)
        if (existing) existing.value += 1
        else acc.push({ name: item.label, value: 1 })
        return acc
      },
      [] as Array<{ name: string; value: number }>
    )
  }, [activeData])

  const visibleDataSummary = useMemo(() => {
    if (!activeData.length) return null
    const totalDesa = activeData.length
    const avg = (key: keyof EkonomiData) =>
      (activeData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1)

    let wilayah = "Provinsi Jawa Timur"
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`

    return {
      wilayah,
      jumlah_desa: totalDesa,
      rata_rata_skor: {
        kesejahteraan: parseFloat(avg("skor_kesejahteraan")),
        bumdes: parseFloat(avg("skor_bumdes")),
        koperasi: parseFloat(avg("skor_koperasi")),
        industri: parseFloat(avg("skor_industri")),
        akses_modal: parseFloat(avg("skor_akses_modal")),
        infrastruktur_ekonomi: parseFloat(avg("skor_infrastruktur_ekonomi")),
        ekonomi_total: parseFloat(avg("skor_ekonomi_total")),
      },
      distribusi_kluster: activeData.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    }
  }, [activeData, selectedKab, selectedKec])

  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "ekonomi",
        pageTitle: "Analisis Ekonomi",
        filters: {
          kabupaten: selectedKab || undefined,
          kecamatan: selectedKec || undefined,
          desa: selectedDesa || undefined,
        },
        visibleDataSummary,
      });
    }
  }, [visibleDataSummary, selectedKab, selectedKec, selectedDesa, setPageContext]);

  useEffect(() => {
    setPageContext({
      pageId: "ekonomi",
      pageTitle: "Analisis Ekonomi",
      filters: {},
      visibleDataSummary: { wilayah: "Provinsi Jawa Timur" },
    });
    return () => {
      setPageContext({
        pageId: "overview",
        pageTitle: "Overview",
        filters: {},
        visibleDataSummary: null,
      });
    };
  }, [setPageContext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#324D3E] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data dari server...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen from-gray-50 to-gray-100">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-[999] backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Dashboard Ekonomi Desa
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Data kluster ekonomi dan usaha per desa
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-3 px-3 py-2 bg-[#324D3E] text-white rounded-lg text-sm font-medium hover:bg-[#5A7A60] transition-colors flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
          {showFilters && (
            <div className="space-y-2 sm:space-y-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Kabupaten</label>
                  <select
                    value={selectedKab}
                    onChange={(e) => setSelectedKab(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] focus:border-transparent"
                  >
                    <option value="">Semua Kabupaten</option>
                    {[...new Set(data.map(d => d.NAMA_KAB))].sort().map(kab => (
                      <option key={kab} value={kab}>{kab}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Kecamatan</label>
                  <select
                    value={selectedKec}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!selectedKab}
                  >
                    <option value="">Semua Kecamatan</option>
                    {kecamatanOptions.map(kec => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Desa</label>
                  <select
                    value={selectedDesa}
                    onChange={(e) => setSelectedDesa(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!selectedKec}
                  >
                    <option value="">Semua Desa</option>
                    {desaOptions.map(desa => (
                      <option key={desa} value={desa}>{desa}</option>
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
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-emerald-200 to-emerald-700" },
            { label: "Rata-rata Skor Ekonomi", value: stats.avgEkonomi, color: "from-green-500 to-green-600" },
            { label: "Rata-rata Kesejahteraan", value: stats.avgKesejahteraan, color: "from-teal-500 to-teal-600" },
            { label: "Rata-rata BUMDES", value: stats.avgBUMDES, color: "from-cyan-500 to-cyan-600" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg text-white`}>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Sebaran Desa ({mapMarkers.length} lokasi)
            </h2>
          </div>
          <div className="h-56 sm:h-80 md:h-96">
            <MapComponent
              markers={mapMarkers}
              renderTooltip={(marker) => (
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{marker.name}</div>
                  {marker.kecamatan && <div className="text-gray-600">Kec. {marker.kecamatan}</div>}
                  {marker.kabupaten && <div className="text-gray-600">Kab. {marker.kabupaten}</div>}
                  {marker.skorEkonomi !== undefined && (
                    <div className="text-gray-700">Skor Ekonomi: {marker.skorEkonomi.toFixed(1)}</div>
                  )}
                  {marker.label && (
                    <div className="mt-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium inline-block">
                      {marker.label}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Skor Ekonomi per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} fontSize={10} interval={0} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="skor" fill="#324D3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Skor Kesejahteraan per {kesejahteraanChartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={kesejahteraanChartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} fontSize={10} interval={0} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="skor" fill="#5A7A60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Sektor Ekonomi (Rata-rata)
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart layout="vertical" data={sectorChartData} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="avg" fill="#728A6E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Skor Komponen Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={komponenEkonomiData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="avg" fill="#8EA48B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Sektor Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sektorDominanDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {sektorDominanDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Kluster Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={clusterDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {clusterDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
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