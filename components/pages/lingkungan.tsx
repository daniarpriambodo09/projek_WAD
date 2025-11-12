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

import { useChatbotContext } from "@/context/ChatbotContext"

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 10

export default function LingkunganPage() {
  const [data, setData] = useState<LingkunganData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

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

  // === EFFECTS ===

  useEffect(() => {
    if (!selectedKab) {
      setKecamatanOptions([])
      setDesaOptions([])
      setSelectedKec("")
      setSelectedDesa("")
      return
    }
    const kecList = [...new Set(data.filter(d => d.NAMA_KAB === selectedKab).map(d => d.NAMA_KEC))]
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
    const desaList = [...new Set(data.filter(d => d.NAMA_KEC === selectedKec && d.NAMA_KAB === selectedKab).map(d => d.NAMA_DESA))]
    setDesaOptions(desaList)
    setSelectedDesa("")
  }, [selectedKec, selectedKab, data])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Gunakan klien yang sudah diimpor
      const { data, error } = await supabase
        .from('cluster_lingkungan') // Ganti nama tabel sesuai kebutuhan
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
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  // === MAP MARKERS ===
  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    if (!selectedKab && !selectedKec && !selectedDesa) {
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

    if (selectedKab && !selectedKec && !selectedDesa) {
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
    // Termasuk saat desa dipilih → tetap tampilkan semua desa di kecamatan itu
    if (selectedKab && selectedKec) {
      const targetDesa = data.find(d => d.NAMA_DESA === selectedDesa)
      const kec = targetDesa ? targetDesa.NAMA_KEC : selectedKec
      return data
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === kec && d.Latitude && d.Longitude)
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

    return data
      .filter(d => d.Latitude && d.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        skorEkonomi: m.skor_kualitas_lingkungan,
        skorKesejahteraan: m.skor_lingkungan_total,
        cluster: m.cluster,
        label: m.label,
      }))
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

  const wrapText = (text: string, maxCharsPerLine = 15) => {
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
    const offset = 30; // jarak label dari luar pie, sesuaikan jika perlu
    const radius = outerRadius + offset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const lines = wrapText(String(name), 18); // ubah 12 kalau mau lebih panjang/pendek per baris
    const anchor = x > cx ? "start" : "end";

    return (
      <text
        x={x}
        y={y}
        fill="#12201A"
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={14}
      >
        {lines.map((line: string, i: number) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : "1.1em"}>
            {line}
          </tspan>
        ))}
        {/* persentase di baris terakhir */}
        <tspan x={x} dy="1.1em">
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

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
    return <div className="p-8 text-black">Loading...</div>
  }

  return (
    <div className="space-y-6 p-8">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#c9ece7] px-6 py-4 -mx-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Analisis Lingkungan Desa</h1>
            <p className="text-gray-600">Data kluster lingkungan dan keberlanjutan per desa</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground">Filter Kabupaten</label>
              <select 
                value={selectedKab}
                onChange={(e) => setSelectedKab(e.target.value)}
                className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Semua Kabupaten</option>
                {[...new Set(data.map(d => d.NAMA_KAB))].map(kab => (
                  <option key={kab} value={kab}>{kab}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground">Filter Kecamatan</label>
              <select 
                value={selectedKec}
                onChange={(e) => setSelectedKec(e.target.value)}
                className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!selectedKab}
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanOptions.map(kec => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground">Filter Desa</label>
              <select 
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Total Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Skor Lingkungan</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgLingkungan}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Kualitas Lingkungan</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgKualitas}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Pengelolaan Sampah</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgSampah}</p>
        </div>
      </div>

      {/* Map */}
      <div className="border border-[#c9ece7] rounded-lg bg-white/80 backdrop-blur-sm overflow-hidden">
        <h2 className="p-3 font-semibold text-black">Sebaran Desa ({mapMarkers.length} desa)</h2>
        <div className="h-96 w-full">
          <MapComponent
            markers={mapMarkers}
            renderTooltip={(marker) => (
              <>
                <div className="font-semibold">{marker.name}</div>
                {marker.kecamatan && <div>Kec. {marker.kecamatan}</div>}
                {marker.kabupaten && <div>Kab. {marker.kabupaten}</div>}
                {marker.skorEkonomi !== undefined && (
                  <div>Skor Ekonomi: {marker.skorEkonomi.toFixed(1)}</div>
                )}
                {marker.label && <div>{marker.label}</div>}
              </>
            )}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Skor Lingkungan per {chartData.label}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.skorLingkungan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="skor" fill="#324D3E" name="Skor Lingkungan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Kualitas Lingkungan per {chartData.label}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.kualitasLingkungan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="skor" fill="#728A6E" name="Kualitas Lingkungan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Rata-rata Komponen Lingkungan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={komponenLingkunganNasional}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Bar dataKey="avg" fill="#8EA48B" name="Skor Rata-rata" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Kategori Lingkungan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribusiKategori}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distribusiKategori.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Kluster Lingkungan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribusiCluster}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distribusiCluster.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-black">
            Detail Lingkungan Desa ({tableData.length.toLocaleString()} hasil)
          </h2>
          <input
            type="text"
            placeholder="Cari nama desa, kabupaten, kecamatan, atau label..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-[#c9ece7] rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5fb8a8]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#c9ece7] bg-gray-50">
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">No</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Kab/Kota</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Kecamatan</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Desa</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Skor Lingkungan</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Kualitas Lingkungan</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Pengelolaan Sampah</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Ketahanan Bencana</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Kategori</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Label</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.IDDESA + index} className="border-b border-[#e0e0e0] hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-black text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.NAMA_KAB}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.NAMA_KEC}</td>
                    <td className="px-4 py-3 text-black font-medium text-sm">{item.NAMA_DESA}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_lingkungan_total.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_kualitas_lingkungan.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_pengelolaan_sampah.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_ketahanan_bencana.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.kategori_lingkungan}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          item.cluster === 0
                            ? "bg-green-900 text-green-200"
                            : item.cluster === 1
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-red-900 text-red-200"
                        }`}
                      >
                        {item.label}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 pt-6 border-t border-[#c9ece7]">
          <div className="text-black text-sm">
            Menampilkan {paginatedData.length > 0 ? startIndex + 1 : 0} -{" "}
            {Math.min(endIndex, tableData.length)} dari {tableData.length.toLocaleString()} data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-[#c9ece7] rounded-lg text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                    className={`px-3 py-2 rounded-lg text-sm ${
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
              className="px-4 py-2 border border-[#c9ece7] rounded-lg text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}