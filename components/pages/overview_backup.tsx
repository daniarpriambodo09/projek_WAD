"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface TipologiData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  Latitude: number
  Longitude: number
  jml_koperasi: number
  bumdes: number
  produk_unggulan: number
  akses_listrik: number
  sanitasi_layak: number
  air_aman: number
  jalan_baik: number
  kesejahteraan_ekonomi: number
  // tambahkan lainnya sesuai kebutuhan
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const ITEMS_PER_PAGE = 10

export default function Overview() {
  const [data, setData] = useState<TipologiData[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  // === Efek: Fetch data ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/tipologi-desa")
        if (!response.ok) throw new Error("Gagal mengambil data")
        const result = await response.json()
        if (Array.isArray(result)) {
          setData(result)
        } else {
          setData([])
        }
      } catch (error) {
        console.error("Error fetching tipologi data:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // === Efek: Update opsi kecamatan berdasarkan kabupaten ===
  useEffect(() => {
    if (selectedKab) {
      const kecs = [...new Set(data.filter(d => d.NAMA_KAB === selectedKab).map(d => d.NAMA_KEC))]
      setKecamatanOptions(kecs)
      setSelectedKec("")
      setSelectedDesa("")
    } else {
      setKecamatanOptions([])
      setSelectedKec("")
      setSelectedDesa("")
    }
  }, [selectedKab, data])

  // === Efek: Update opsi desa berdasarkan kecamatan ===
  useEffect(() => {
    if (selectedKec && selectedKab) {
      const desas = [...new Set(
        data
          .filter(d => d.NAMA_KEC === selectedKec && d.NAMA_KAB === selectedKab)
          .map(d => d.NAMA_DESA)
      )]
      setDesaOptions(desas)
      setSelectedDesa("")
    } else {
      setDesaOptions([])
      setSelectedDesa("")
    }
  }, [selectedKec, selectedKab, data])

  // === Filter data berdasarkan pilihan ===
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedKab && item.NAMA_KAB !== selectedKab) return false
      if (selectedKec && item.NAMA_KEC !== selectedKec) return false
      if (selectedDesa && item.NAMA_DESA !== selectedDesa) return false
      return true
    })
  }, [data, selectedKab, selectedKec, selectedDesa])

  // === Data untuk chart ===
  const topKoperasiData = useMemo(() => {
    return filteredData
      .filter(item => item.jml_koperasi > 0)
      .sort((a, b) => b.jml_koperasi - a.jml_koperasi)
      .slice(0, 5)
      .map(item => ({
        name: item.NAMA_DESA,
        jml_koperasi: item.jml_koperasi,
      }))
  }, [filteredData])

  const infrastrukturData = useMemo(() => {
  if (filteredData.length === 0) return []

  const avg = (key: keyof TipologiData) => {
    const sum = filteredData.reduce((acc, item) => {
      const value = Number(item[key]) // 👈 Konversi ke number
      return acc + (isNaN(value) ? 0 : value) // 👈 Jika NaN, gunakan 0
    }, 0)
    return (sum / filteredData.length).toFixed(1)
  }

  return [
    { name: "Listrik", value: parseFloat(avg("akses_listrik")) },
    { name: "Sanitasi Layak", value: parseFloat(avg("sanitasi_layak")) },
    { name: "Air Aman", value: parseFloat(avg("air_aman")) },
    { name: "Jalan Baik", value: parseFloat(avg("jalan_baik")) },
  ]
}, [filteredData])

  // === Map markers ===
  const mapMarkers = useMemo(() => {
    return filteredData
      .filter(item => item.Latitude != null && item.Longitude != null)
      .map(item => ({
        name: `${item.NAMA_DESA}, ${item.NAMA_KEC}`,
        position: [item.Latitude, item.Longitude] as [number, number],
      }))
  }, [filteredData])

  // === Stats ===
  const stats = useMemo(() => ({
    totalDesa: filteredData.length,
    avgKoperasi: filteredData.length
      ? (filteredData.reduce((sum, d) => sum + d.jml_koperasi, 0) / filteredData.length).toFixed(1)
      : "0.0",
    avgBUMDES: filteredData.length
      ? (filteredData.reduce((sum, d) => sum + d.bumdes, 0) / filteredData.length).toFixed(1)
      : "0.0",
  }), [filteredData])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Analitik data siDesa Jawa Timur berbasis AI</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Kabupaten</label>
            <select
              value={selectedKab}
              onChange={(e) => setSelectedKab(e.target.value)}
              className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8]"
            >
              <option value="">Semua Kabupaten</option>
              {[...new Set(data.map(d => d.NAMA_KAB))].map(kab => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Kecamatan</label>
            <select
              value={selectedKec}
              onChange={(e) => setSelectedKec(e.target.value)}
              disabled={!selectedKab}
              className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] disabled:opacity-50"
            >
              <option value="">Semua Kecamatan</option>
              {kecamatanOptions.map(kec => (
                <option key={kec} value={kec}>{kec}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600">Desa</label>
            <select
              value={selectedDesa}
              onChange={(e) => setSelectedDesa(e.target.value)}
              disabled={!selectedKec}
              className="px-3 py-2 bg-white border border-[#c9ece7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] disabled:opacity-50"
            >
              <option value="">Semua Desa</option>
              {desaOptions.map(desa => (
                <option key={desa} value={desa}>{desa}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Total Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Koperasi</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgKoperasi}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata BUMDES</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgBUMDES}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-black p-3 pb-2">
          Sebaran Desa di Jawa Timur ({filteredData.length} desa)
        </h2>
        <div className="h-96 w-full">
          <MapComponent markers={mapMarkers} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Koperasi */}
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Top 5 Desa: Jumlah Koperasi
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topKoperasiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="jml_koperasi" fill="#1d2415" name="Jumlah Koperasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Infrastruktur Rata-rata */}
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Rata-rata Indikator Infrastruktur
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={infrastrukturData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" stroke="#666" />
              <YAxis dataKey="name" type="category" stroke="#666" />
              <Tooltip />
              <Bar dataKey="value" fill="#697857" name="Persentase" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}