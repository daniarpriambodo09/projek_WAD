// src/app/(your-path)/lingkungan.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
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
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabaseClient"
import { useChatbotContext } from "@/context/ChatbotContext"

interface LingkunganData {
  IDDESA: string
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  skor_pengelolaan_sampah: number
  total_pencemaran: number
  skor_kualitas_lingkungan: number
  total_bencana: number
  tingkat_kerawanan: number
  skor_ketahanan_bencana: number
  skor_mitigasi_bencana: number
  skor_pelestarian: number
  skor_lingkungan_total: number
  kategori_lingkungan: string
  cluster: number
  label: string
  Latitude: number
  Longitude: number
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-56 sm:h-80 md:h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500 text-sm">Memuat peta...</p>
    </div>
  ),
})

const COLORS = ["#324D3E", "#5A7A60", "#728A6E", "#8EA48B", "#B3C8A1", "#9AB59F"]

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

export default function LingkunganPage() {
  const [data, setData] = useState<LingkunganData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  const {setPageContext} = useChatbotContext();

  // === AGREGASI PER KABUPATEN UNTUK TOP5 ===
  const kabupatenAggregates = useMemo(() => {
    if (!data.length) return [];
    const agg = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = {
          nama_kab: key,
          desa_count: 0,
          total_lingkungan: 0,
        };
      }
      acc[key].desa_count += 1;
      acc[key].total_lingkungan += d.skor_lingkungan_total;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agg).map((kab: any) => ({
      nama_kab: kab.nama_kab,
      desa_count: kab.desa_count,
      skor_rata_rata: kab.total_lingkungan / kab.desa_count,
    }));
  }, [data]);

  // === GLOBAL INSIGHTS: Kabupaten/Kecamatan Terbaik & Terburuk ===
  const [kabupatenTerbaik, kabupatenTerburuk] = useMemo(() => {
    if (!kabupatenAggregates.length) return [null, null];
    let best = kabupatenAggregates[0];
    let worst = kabupatenAggregates[0];
    kabupatenAggregates.forEach(kab => {
      if (kab.skor_rata_rata > best.skor_rata_rata) best = kab;
      if (kab.skor_rata_rata < worst.skor_rata_rata) worst = kab;
    });
    return [best, worst];
  }, [kabupatenAggregates]);

  // === TOP 5 PROVINSI (KABUPATEN) ===
  const top5Lingkungan = useMemo(() => {
    if (!data.length) return { terbaik: [], terburuk: [] };
    
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) acc[key] = { nama: key, total: 0, count: 0 };
      acc[key].total += d.skor_lingkungan_total;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { nama: string; total: number; count: number }>);

    const list = Object.values(byKab).map(k => ({
      nama: k.nama,
      skor: k.total / k.count,
    }));

    const sorted = [...list].sort((a, b) => b.skor - a.skor);
    return {
      terbaik: sorted.slice(0, 5),
      terburuk: sorted.slice(-5).reverse(),
    };
  }, [data]);

  // === DATA UNTUK ANALISIS PER KECAMATAN (abaikan desa) ===
  const kecamatanData = useMemo(() => {
    if (!data.length) return [];
    let result = data;
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab);
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec);
    return result;
  }, [data, selectedKab, selectedKec]);

  // === RINGKASAN NUMERIK UNTUK CHATBOT ===
  const visibleDataSummary = useMemo(() => {
    if (!data.length || !kecamatanData.length) return null;

    const totalDesa = kecamatanData.length;
    const avg = (key: keyof LingkunganData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // Cari desa terbaik & terburuk (hanya saat di level kecamatan)
    let desaTerburuk: LingkunganData | null = null;
    let desaTerbaik: LingkunganData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    if (selectedKab && selectedKec) {
      kecamatanData.forEach(des => {
        const totalSkor = des.skor_lingkungan_total;
        if (totalSkor < skorMin) {
          skorMin = totalSkor;
          desaTerburuk = des;
        }
        if (totalSkor > skorMax) {
          skorMax = totalSkor;
          desaTerbaik = des;
        }
      });
    }

    // Global insights
    let globalInsights = null;
    if (!selectedKab && !selectedKec) {
      globalInsights = { kabupatenTerbaik, kabupatenTerburuk };
    } else if (selectedKab && !selectedKec) {
      const kecAgg = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, d) => {
          const key = d.NAMA_KEC;
          if (!acc[key]) {
            acc[key] = { nama_kec: key, desa_count: 0, total_skor: 0 };
          }
          acc[key].desa_count += 1;
          acc[key].total_skor += d.skor_lingkungan_total;
          return acc;
        }, {} as Record<string, any>);

      const kecList = Object.values(kecAgg).map((kec: any) => ({
        nama_kec: kec.nama_kec,
        skor_rata_rata: kec.total_skor / kec.desa_count,
      }));

      let kecBest = kecList[0];
      let kecWorst = kecList[0];
      kecList.forEach(kec => {
        if (kec.skor_rata_rata > kecBest.skor_rata_rata) kecBest = kec;
        if (kec.skor_rata_rata < kecWorst.skor_rata_rata) kecWorst = kec;
      });

      globalInsights = {
        kecamatanTerbaik: kecBest,
        kecamatanTerburuk: kecWorst,
      };
    }

    return {
      wilayah,
      jumlah_desa: totalDesa,
      rata_rata_skor: {
        pengelolaan_sampah: parseFloat(avg("skor_pengelolaan_sampah")),
        kualitas_lingkungan: parseFloat(avg("skor_kualitas_lingkungan")),
        ketahanan_bencana: parseFloat(avg("skor_ketahanan_bencana")),
        mitigasi_bencana: parseFloat(avg("skor_mitigasi_bencana")),
        pelestarian: parseFloat(avg("skor_pelestarian")),
        lingkungan_total: parseFloat(avg("skor_lingkungan_total")),
      },
      distribusi_kluster: kecamatanData.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      desa_dengan_lingkungan_terburuk: desaTerburuk
        ? {
            nama_desa: (desaTerburuk as LingkunganData).NAMA_DESA,
            nama_kecamatan: (desaTerburuk as LingkunganData).NAMA_KEC,
            nama_kabupaten: (desaTerburuk as LingkunganData).NAMA_KAB,
            skor_pengelolaan_sampah: (desaTerburuk as LingkunganData).skor_pengelolaan_sampah,
            skor_kualitas_lingkungan: (desaTerburuk as LingkunganData).skor_kualitas_lingkungan,
            skor_lingkungan_total: (desaTerburuk as LingkunganData).skor_lingkungan_total,
            label_kluster: (desaTerburuk as LingkunganData).label,
          }
        : null,
      desa_dengan_lingkungan_terbaik: desaTerbaik
        ? {
            nama_desa: (desaTerbaik as LingkunganData).NAMA_DESA,
            nama_kecamatan: (desaTerbaik as LingkunganData).NAMA_KEC,
            nama_kabupaten: (desaTerbaik as LingkunganData).NAMA_KAB,
            skor_pengelolaan_sampah: (desaTerbaik as LingkunganData).skor_pengelolaan_sampah,
            skor_kualitas_lingkungan: (desaTerbaik as LingkunganData).skor_kualitas_lingkungan,
            skor_lingkungan_total: (desaTerbaik as LingkunganData).skor_lingkungan_total,
            label_kluster: (desaTerbaik as LingkunganData).label,
          }
        : null,
      globalInsights,
      top5_terbaik: top5Lingkungan.terbaik,
      top5_terburuk: top5Lingkungan.terburuk,
    };
  }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerbaik, kabupatenTerburuk]);

  // === UPDATE PAGE CONTEXT UNTUK CHATBOT ===
  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "lingkungan",
        pageTitle: "Analisis Lingkungan",
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
        .from('cluster_lingkungan')
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

  // === DATA DINAMIS ===
  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])

  // === DATA UNTUK TABEL: semua desa dalam kecamatan terpilih (abaikan selectedDesa) ===
  const tableData = useMemo(() => {
    if (!data.length) return []
    let result = data
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec)
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.NAMA_DESA.toLowerCase().includes(s) ||
          item.NAMA_KEC.toLowerCase().includes(s) ||
          item.NAMA_KAB.toLowerCase().includes(s) ||
          item.label.toLowerCase().includes(s)
      )
    }
    return result
  }, [data, selectedKab, selectedKec, searchTerm])

  // === PAGINASI TABEL ===
  const startIndex = (currentPage - 1) * 5 // ITEMS_PER_PAGE
  const endIndex = startIndex + 5
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / 5)

  // === MAP MARKERS ===
  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    if (!selectedKab) {
      // Tampilkan kabupaten
      const kabupatenMap = new Map<string, { lat: number; lng: number; name: string; cluster: number; label: string }>()
      data.forEach(item => {
        if (!item.Latitude || !item.Longitude) return
        if (!kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.label
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
      const kecamatanMap = new Map<string, { lat: number; lng: number; name: string; cluster: number; label: string }>()
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (!item.Latitude || !item.Longitude) return
          const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`
          if (!kecamatanMap.has(key)) {
            kecamatanMap.set(key, {
              lat: item.Latitude,
              lng: item.Longitude,
              name: item.NAMA_KEC,
              cluster: item.cluster,
              label: item.label
            })
          }
        })
      return Array.from(kecamatanMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: selectedKab,
        kecamatan: m.name,
        cluster: m.cluster,
        label: m.label,
      }))
    }

    // Jika kabupaten + kecamatan dipilih → tampilkan semua desa di kecamatan itu
    if (selectedKab && selectedKec) {
      return data
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && d.Latitude && d.Longitude)
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          skorKualitasLingkungan: m.skor_kualitas_lingkungan,
          skorLingkunganTotal: m.skor_lingkungan_total,
          cluster: m.cluster,
          label: m.label,
        }))
    }

    return []
  }, [data, selectedKab, selectedKec, selectedDesa])

  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
  const chartData = useMemo(() => {
    if (!data.length) return { skorLingkungan: [], kualitasLingkungan: [], label: "Data" }

    if (selectedKab && selectedKec) {
      // Per desa di kecamatan
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        skorLingkungan: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_lingkungan_total.toFixed(1)) })),
        kualitasLingkungan: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_kualitas_lingkungan.toFixed(1)) })),
        label: "Desa",
      }
    } else if (selectedKab) {
      // Per kecamatan di kabupaten
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const key = item.NAMA_KEC
          if (!acc[key]) {
            acc[key] = { name: key, totalLingkungan: 0, totalKualitas: 0, count: 0 }
          }
          acc[key].totalLingkungan += item.skor_lingkungan_total
          acc[key].totalKualitas += item.skor_kualitas_lingkungan
          acc[key].count += 1
          return acc
        }, {} as Record<string, { name: string; totalLingkungan: number; totalKualitas: number; count: number }>)

      return {
        skorLingkungan: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.totalLingkungan / item.count).toFixed(1)) })),
        kualitasLingkungan: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.totalKualitas / item.count).toFixed(1)) })),
        label: "Kecamatan",
      }
    } else {
      // Per kabupaten
      const grouped = data
        .reduce((acc, item) => {
          const key = item.NAMA_KAB
          if (!acc[key]) {
            acc[key] = { name: key, totalLingkungan: 0, totalKualitas: 0, count: 0 }
          }
          acc[key].totalLingkungan += item.skor_lingkungan_total
          acc[key].totalKualitas += item.skor_kualitas_lingkungan
          acc[key].count += 1
          return acc
        }, {} as Record<string, { name: string; totalLingkungan: number; totalKualitas: number; count: number }>)

      return {
        skorLingkungan: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.totalLingkungan / item.count).toFixed(1)) })),
        kualitasLingkungan: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.totalKualitas / item.count).toFixed(1)) })),
        label: "Kabupaten",
      }
    }
  }, [data, selectedKab, selectedKec])

  // === Komponen Lingkungan Lainnya ===
  const komponenLingkunganNasional = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof LingkunganData) => {
      const sum = activeData.reduce((acc, item) => acc + (item[key] as number), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "Pengelolaan Sampah", avg: avg("skor_pengelolaan_sampah") },
      { name: "Ketahanan Bencana", avg: avg("skor_ketahanan_bencana") },
      { name: "Mitigasi Bencana", avg: avg("skor_mitigasi_bencana") },
      { name: "Pelestarian", avg: avg("skor_pelestarian") },
    ]
  }, [activeData])

  const distribusiKategori = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.kategori_lingkungan)
        if (existing) existing.value += 1
        else acc.push({ name: item.kategori_lingkungan, value: 1 })
        return acc
      },
      [] as Array<{ name: string; value: number }>
    )
  }, [activeData])

  const distribusiCluster = useMemo(() => {
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

  // === Statistik ===
  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgLingkungan: "0.0",
        avgKualitas: "0.0",
        avgSampah: "0.0",
      }
    }
    return {
      totalDesa: activeData.length,
      avgLingkungan: (activeData.reduce((sum, d) => sum + d.skor_lingkungan_total, 0) / activeData.length).toFixed(1),
      avgKualitas: (activeData.reduce((sum, d) => sum + d.skor_kualitas_lingkungan, 0) / activeData.length).toFixed(1),
      avgSampah: (activeData.reduce((sum, d) => sum + d.skor_pengelolaan_sampah, 0) / activeData.length).toFixed(1),
    }
  }, [activeData])

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
      {/* STICKY HEADER - Mobile Optimized */}
      <div className="sticky top-0 z-[999] backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Dashboard Lingkungan Desa
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Data kluster lingkungan dan keberlanjutan per desa
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
          {/* Filter Panel - Collapsible on Mobile */}
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
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-green-200 to-green-900" },
            { label: "Rata-rata Skor Lingkungan", value: stats.avgLingkungan, color: "from-emerald-500 to-emerald-600" },
            { label: "Rata-rata Kualitas Lingkungan", value: stats.avgKualitas, color: "from-teal-500 to-teal-600" },
            { label: "Rata-rata Pengelolaan Sampah", value: stats.avgSampah, color: "from-cyan-500 to-cyan-600" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg text-white`}>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Map Section */}
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

        {/* Charts Section - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 1: Skor Lingkungan */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Skor Lingkungan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.skorLingkungan} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="skor" fill="#324D3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Kualitas Lingkungan */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Kualitas Lingkungan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.kualitasLingkungan} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="skor" fill="#5A7A60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3: Komponen Lingkungan */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Rata-rata Komponen Lingkungan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={komponenLingkunganNasional} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="avg" fill="#728A6E" name="Skor Rata-rata" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Distribusi Kategori */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Kategori Lingkungan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
                    <Pie
                      data={distribusiKategori}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {distribusiKategori.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5: Distribusi Kluster */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Kluster Lingkungan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
                    <Pie
                      data={distribusiCluster}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {distribusiCluster.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
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