// siDesa/components/pages/lingkungan.tsx
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
    <div 
      className="h-56 sm:h-80 md:h-96 rounded-lg flex items-center justify-center"
      style={{
        background: "rgba(10, 31, 26, 0.9)",
        border: "2px solid rgba(34, 211, 238, 0.4)",
        boxShadow: "0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 40px rgba(34, 211, 238, 0.1)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div 
          className="animate-spin rounded-full h-12 w-12"
          style={{
            border: "4px solid rgba(34, 211, 238, 0.3)",
            borderTopColor: "#22d3ee",
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
          }}
        ></div>
        <p className="text-base font-semibold" style={{ 
          color: "#ffffff",
          textShadow: "0 0 10px rgba(34, 211, 238, 0.8)"
        }}>Memuat peta...</p>
      </div>
    </div>
  ),
})
const COLORS = ["#10b981", "#14b8a6", "#22d3ee", "#34d399", "#06b6d4", "#7dd3fc"]
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
      fill="#ffffff"
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
      style={{
        textShadow: "0 0 8px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)"
      }}
    >
      {lines.map((line: string, i: number) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : "1em"}>
          {line}
        </tspan>
      ))}
      <tspan x={x} dy="1em" fontWeight="bold" fill="#22d3ee" style={{
        textShadow: "0 0 12px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.5)"
      }}>
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
        pageTitle: "Dashboard Lingkungan Desa",
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
    if (!data.length) return [];
    // ====== MODE: LEVEL KABUPATEN ======
    if (!selectedKab) {
      const kabupatenMap = new Map();
      data.forEach(item => {
        if (item.Latitude && item.Longitude && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.label,
            // Ambil satu sample data untuk ditampilkan di tooltip
            skor_kualitas_lingkungan: item.skor_kualitas_lingkungan,
            skor_ketahanan_bencana: item.skor_ketahanan_bencana,
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
        // Data tambahan untuk tooltip
        skor_kualitas_lingkungan: m.skor_kualitas_lingkungan,
        skor_ketahanan_bencana: m.skor_ketahanan_bencana,
      }));
    }
    // ====== MODE: LEVEL KECAMATAN ======
    if (selectedKab && !selectedKec) {
      const kecamatanMap = new Map();
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (item.Latitude && item.Longitude) {
            const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`;
            if (!kecamatanMap.has(key)) {
              kecamatanMap.set(key, {
                lat: item.Latitude,
                lng: item.Longitude,
                name: item.NAMA_KEC,
                kabupaten: item.NAMA_KAB,
                cluster: item.cluster,
                label: item.label,
                // Ambil satu sample data per kecamatan
                skor_kualitas_lingkungan: item.skor_kualitas_lingkungan,
                skor_ketahanan_bencana: item.skor_ketahanan_bencana,
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
        // Data tambahan untuk tooltip
        skor_kualitas_lingkungan: m.skor_kualitas_lingkungan,
        skor_ketahanan_bencana: m.skor_ketahanan_bencana,
      }));
    }
    // ====== MODE: LEVEL DESA ======
    if (selectedKab && selectedKec) {
      return data
        .filter(
          d =>
            d.NAMA_KAB === selectedKab &&
            d.NAMA_KEC === selectedKec &&
            d.Latitude &&
            d.Longitude
        )
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          cluster: m.cluster,
          label: m.label,
          // Data tambahan untuk tooltip
          skor_kualitas_lingkungan: m.skor_kualitas_lingkungan,
          skor_ketahanan_bencana: m.skor_ketahanan_bencana,
        }));
    }
    // Default: tampilkan semua desa jika tidak ada filter
    return data
      .filter(m => m.Latitude && m.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        cluster: m.cluster,
        label: m.label,
        // Data tambahan untuk tooltip
        skor_kualitas_lingkungan: m.skor_kualitas_lingkungan,
        skor_ketahanan_bencana: m.skor_ketahanan_bencana,
      }));
  }, [data, selectedKab, selectedKec, selectedDesa]);
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
          <div 
            className="animate-spin rounded-full h-16 w-16 mx-auto mb-6"
            style={{
              border: "4px solid rgba(34, 211, 238, 0.3)",
              borderTopColor: "#22d3ee",
              boxShadow: "0 0 30px rgba(34, 211, 238, 0.6)",
            }}
          ></div>
          <p className="text-xl font-bold" style={{ 
            color: "#ffffff",
            textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 8px rgba(0, 0, 0, 0.8)"
          }}>Memuat data dari server...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen">
      {/* STICKY HEADER - Mobile Optimized */}
     <div 
        className="sticky top-0 z-[999] shadow-lg"
        style={{
          background: "rgba(10, 31, 26, 0.98)",
          backdropFilter: "blur(20px)",
          borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(34, 211, 238, 0.2)",
        }}
      >
        <div className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 
                className="text-lg sm:text-2xl md:text-3xl font-bold truncate"
                style={{ 
                  background: "linear-gradient(135deg, #22d3ee, #10b981)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 30px rgba(34, 211, 238, 0.5)",
                  filter: "drop-shadow(0 2px 8px rgba(16, 185, 129, 0.6))",
                }}
              >
                Dashboard Lingkungan Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1 font-semibold" style={{ 
                color: "#ffffff",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.6)"
              }}>
                Data kluster lingkungan dan keberlanjutan per desa
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-3 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shrink-0 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(34, 211, 238, 0.25), rgba(16, 185, 129, 0.25))",
                border: "2px solid rgba(34, 211, 238, 0.6)",
                color: "#ffffff",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2)",
                textShadow: "0 0 10px rgba(34, 211, 238, 0.8)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(34, 211, 238, 0.4), rgba(16, 185, 129, 0.4))"
                e.currentTarget.style.boxShadow = "0 0 30px rgba(34, 211, 238, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.3)"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(34, 211, 238, 0.25), rgba(16, 185, 129, 0.25))"
                e.currentTarget.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2)"
                e.currentTarget.style.transform = "translateY(0)"
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
                borderTop: "2px solid rgba(34, 211, 238, 0.4)",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 8px rgba(34, 211, 238, 0.6)"
                  }}>Kabupaten</label>
                  <select
                    value={selectedKab}
                    onChange={(e) => setSelectedKab(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid rgba(34, 211, 238, 0.5)",
                      color: "#ffffff",
                      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 10px rgba(10, 31, 26, 0.8)",
                    }}
                  >
                    <option value="" style={{ background: "#0a1f1a", color: "#ffffff" }}>Semua Kabupaten</option>
                    {[...new Set(data.map(d => d.NAMA_KAB))].sort().map(kab => (
                      <option key={kab} value={kab} style={{ background: "#0a1f1a", color: "#ffffff" }}>{kab}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 8px rgba(34, 211, 238, 0.6)"
                  }}>Kecamatan</label>
                  <select
                    value={selectedKec}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid rgba(34, 211, 238, 0.5)",
                      color: "#ffffff",
                      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 10px rgba(10, 31, 26, 0.8)",
                    }}
                    disabled={!selectedKab}
                  >
                    <option value="" style={{ background: "#0a1f1a", color: "#ffffff" }}>Semua Kecamatan</option>
                    {kecamatanOptions.map(kec => (
                      <option key={kec} value={kec} style={{ background: "#0a1f1a", color: "#ffffff" }}>{kec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 8px rgba(34, 211, 238, 0.6)"
                  }}>Desa</label>
                  <select
                    value={selectedDesa}
                    onChange={(e) => setSelectedDesa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid rgba(34, 211, 238, 0.5)",
                      color: "#ffffff",
                      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 10px rgba(10, 31, 26, 0.8)",
                    }}
                    disabled={!selectedKec}
                  >
                    <option value="" style={{ background: "#0a1f1a", color: "#ffffff" }}>Semua Desa</option>
                    {desaOptions.map(desa => (
                      <option key={desa} value={desa} style={{ background: "#0a1f1a", color: "#ffffff" }}>{desa}</option>
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
                  className="text-xs font-bold flex items-center gap-1 transition-all px-3 py-1.5 rounded-lg"
                  style={{ 
                    color: "#ffffff",
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.5)",
                    boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
                  }}
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
            { label: "Total Desa", value: stats.totalDesa, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.9) 100%)", shadow: "0 8px 32px rgba(16, 185, 129, 0.5)" },
            { label: "Rata-rata Skor Lingkungan", value: stats.avgLingkungan, gradient: "linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(45, 212, 191, 0.9) 100%)", shadow: "0 8px 32px rgba(20, 184, 166, 0.5)" },
            { label: "Rata-rata Kualitas Lingkungan", value: stats.avgKualitas, gradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(125, 211, 252, 0.9) 100%)", shadow: "0 8px 32px rgba(34, 211, 238, 0.5)" },
            { label: "Rata-rata Pengelolaan Sampah", value: stats.avgSampah, gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.9) 100%)", shadow: "0 8px 32px rgba(6, 182, 212, 0.5)" },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="rounded-xl p-4 text-white transition-transform hover:scale-105"
              style={{
                background: stat.gradient,
                boxShadow: `${stat.shadow}, inset 0 0 30px rgba(255, 255, 255, 0.15)`,
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <p className="text-xs sm:text-sm font-bold mb-1" style={{
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)"
              }}>{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-black" style={{
                textShadow: "0 3px 6px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.4)"
              }}>{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Map Section */}
        <div 
          className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
          style={{
            background: "rgba(10, 31, 26, 0.95)",
            border: "2px solid rgba(34, 211, 238, 0.5)",
            boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
          }}
        >
          <div 
            className="px-4 py-3"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
              borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
              boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
            }}
          >
            <h2 className="text-base sm:text-lg font-black" style={{
              color: "#ffffff",
              textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
            }}>
              Sebaran Desa ({mapMarkers.length} lokasi)
            </h2>
          </div>
          <div className="h-56 sm:h-80 md:h-96">
            <MapComponent
              markers={mapMarkers}
              renderTooltip={(marker) => (
                <div
                  className="px-4 py-3 rounded-xl shadow-2xl text-white space-y-2 max-w-xs"
                  style={{
                    background: "rgba(10, 31, 26, 0.98)",
                    border: "2px solid rgba(34, 211, 238, 0.6)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(34, 211, 238, 0.5), 0 0 60px rgba(16, 185, 129, 0.3), inset 0 0 30px rgba(34, 211, 238, 0.15)",
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {/* Nama Utama */}
                  <div className="font-black text-lg tracking-tight" style={{
                    color: "#ffffff",
                    textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.8)"
                  }}>
                    {marker.name}
                  </div>
                  {/* Informasi Lokasi */}
                  <div className="space-y-1 text-xs font-semibold" style={{
                    color: "#ffffff",
                    textShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 1px 3px rgba(0, 0, 0, 0.7)"
                  }}>
                    {marker.kecamatan && (
                      <div className="flex items-center gap-1">
                        <span className="text-[12px]">📍</span>
                        <span>Kec. {marker.kecamatan}</span>
                      </div>
                    )}
                    {marker.kabupaten && (
                      <div className="flex items-center gap-1">
                        <span className="text-[12px]">🗺️</span>
                        <span>Kab. {marker.kabupaten}</span>
                      </div>
                    )}
                  </div>
                  {/* Badge Label (seperti contoh visual) */}
                  {marker.label && (
                    <div
                      className="mt-2 px-3 py-1.5 rounded-lg font-black text-sm whitespace-nowrap"
                      style={{
                        color: "#ffffff",
                        background: "linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(16, 185, 129, 0.3))",
                        border: "2px solid rgba(34, 211, 238, 0.6)",
                        boxShadow: "0 0 20px rgba(34, 211, 238, 0.5), inset 0 0 15px rgba(16, 185, 129, 0.3)",
                        textShadow: "0 0 10px rgba(34, 211, 238, 0.8)"
                      }}
                    >
                      {marker.label}
                    </div>
                  )}
                  {/* Skor Tambahan */}
                  {(marker.skor_kualitas_lingkungan !== undefined || marker.skor_ketahanan_bencana !== undefined) && (
                    <div className="mt-2 pt-2 space-y-1" style={{
                      borderTop: "1px solid rgba(34, 211, 238, 0.4)"
                    }}>
                      {marker.skor_kualitas_lingkungan !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Kualitas Lingkungan:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_kualitas_lingkungan).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_ketahanan_bencana !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Ketahanan Bencana:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_ketahanan_bencana).toFixed(1)}</span>
                        </div>
                      )}
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
            <div 
              className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
              style={{
                background: "rgba(10, 31, 26, 0.95)",
                border: "2px solid rgba(34, 211, 238, 0.5)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <h2 className="text-sm sm:text-base font-black" style={{ 
                  color: "#ffffff",
                  textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                }}>
                  Skor Lingkungan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.skorLingkungan} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.3)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                      style={{ fontWeight: 'bold' }}
                    />
                    <YAxis stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.98)',
                        border: '2px solid rgba(34, 211, 238, 0.6)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      }} 
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="skor" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 2: Kualitas Lingkungan */}
            <div 
              className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
              style={{
                background: "rgba(10, 31, 26, 0.95)",
                border: "2px solid rgba(34, 211, 238, 0.5)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <h2 className="text-sm sm:text-base font-black" style={{ 
                  color: "#ffffff",
                  textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                }}>
                  Kualitas Lingkungan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.kualitasLingkungan} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.3)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                      style={{ fontWeight: 'bold' }}
                    />
                    <YAxis stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.98)',
                        border: '2px solid rgba(34, 211, 238, 0.6)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      }} 
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="skor" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3: Komponen Lingkungan */}
            <div 
              className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
              style={{
                background: "rgba(10, 31, 26, 0.95)",
                border: "2px solid rgba(34, 211, 238, 0.5)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <h2 className="text-sm sm:text-base font-black" style={{ 
                  color: "#ffffff",
                  textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                }}>
                  Rata-rata Komponen Lingkungan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={komponenLingkunganNasional} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.3)" />
                    <XAxis dataKey="name" stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
                    <YAxis stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.98)',
                        border: '2px solid rgba(34, 211, 238, 0.6)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      }} 
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avg" fill="#7dd3fc" name="Skor Rata-rata" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4: Distribusi Kategori */}
            <div 
              className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
              style={{
                background: "rgba(10, 31, 26, 0.95)",
                border: "2px solid rgba(34, 211, 238, 0.5)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <h2 className="text-sm sm:text-base font-black" style={{ 
                  color: "#ffffff",
                  textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                }}>
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
                      outerRadius={80}
                      dataKey="value"
                    >
                      {distribusiKategori.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.98)',
                        border: '2px solid rgba(34, 211, 238, 0.6)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      }} 
                      labelStyle={{
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                      itemStyle={{
                        color: "#22d3ee",
                        fontWeight: "bold",
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
            <div 
              className="rounded-xl shadow-xl overflow-hidden transition-transform hover:scale-[1.01]"
              style={{
                background: "rgba(10, 31, 26, 0.95)",
                border: "2px solid rgba(34, 211, 238, 0.5)",
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)",
              }}
            >
              <div 
                className="px-4 py-3"
                style={{
                  borderBottom: "2px solid rgba(34, 211, 238, 0.5)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(34, 211, 238, 0.2))",
                  boxShadow: "0 4px 15px rgba(34, 211, 238, 0.3)",
                }}
              >
                <h2 className="text-sm sm:text-base font-black" style={{ 
                  color: "#ffffff",
                  textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                }}>
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
                      outerRadius={80}
                      dataKey="value"
                    >
                      {distribusiCluster.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.98)',
                        border: '2px solid rgba(34, 211, 238, 0.6)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
                      }} 
                      labelStyle={{
                        color: "#ffffff",
                        fontWeight: "bold",
                      }}
                      itemStyle={{
                        color: "#22d3ee",
                        fontWeight: "bold",
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