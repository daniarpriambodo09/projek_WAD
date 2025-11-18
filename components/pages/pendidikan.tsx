// src/app/(your-path)/pendidikan.tsx
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

import { supabase } from "@/lib/supabaseClient";
import { useChatbotContext } from "@/context/ChatbotContext"

interface EducationData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  total_paud: number
  total_tk: number
  total_sd: number
  total_mi: number
  total_smp: number
  total_mts: number
  total_sma: number
  total_ma: number
  total_smk: number
  skor_paud: number 
  skor_sd: number 
  skor_smp: number 
  skor_sma: number 
  skor_literasi: number 
  skor_pendidikan_total: number 
  kategori_pendidikan: string
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

const COLORS = ["#10b981", "#14b8a6", "#22d3ee", "#34d399", "#06b6d4", "#7dd3fc"]

const safeToFixed = (value: number | null, decimals = 1): string => {
  return value === null || isNaN(value) ? "N/A" : Number(value).toFixed(decimals)
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

export default function PendidikanPage() {
  const [data, setData] = useState<EducationData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  // === AGREGAT GLOBAL PER KABUPATEN ===
  const kabupatenAggregates = useMemo(() => {
    if (!data.length) return [];
    const agg = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = {
          nama_kab: key,
          desa_count: 0,
          total_pendidikan: 0,
          total_literasi: 0,
          total_paud: 0,
          total_sd: 0,
          total_smp: 0,
          total_sma: 0,
        };
      }
      acc[key].desa_count += 1;
      acc[key].total_pendidikan += d.skor_pendidikan_total;
      acc[key].total_literasi += d.skor_literasi;
      acc[key].total_paud += d.skor_paud;
      acc[key].total_sd += d.skor_sd;
      acc[key].total_smp += d.skor_smp;
      acc[key].total_sma += d.skor_sma;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agg).map((kab: any) => ({
      nama_kab: kab.nama_kab,
      desa_count: kab.desa_count,
      skor_rata_rata: kab.total_pendidikan / kab.desa_count,
      skor_literasi: kab.total_literasi / kab.desa_count,
      skor_paud: kab.total_paud / kab.desa_count,
      skor_sd: kab.total_sd / kab.desa_count,
      skor_smp: kab.total_smp / kab.desa_count,
      skor_sma: kab.total_sma / kab.desa_count,
    }));
  }, [data]);

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

  // === DATA UNTUK ANALISIS PER KECAMATAN (abaikan selectedDesa) ===
  const kecamatanData = useMemo(() => {
    if (!data.length) return [];
    let result = data;
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab);
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec);
    return result;
  }, [data, selectedKab, selectedKec]);

  // Top 5 Pendidikan Terbaik dan Terburuk
  const top5Pendidikan = useMemo(() => {
    if (!data.length) return { terbaik: [], terburuk: [] };
    
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) acc[key] = { nama: key, total: 0, count: 0 };
      acc[key].total += d.skor_pendidikan_total;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { nama: string; total: number; count: number }>);

    const list = Object.values(byKab).map(k => ({
      nama: k.nama,
      skor: k.total / k.count
    }));

    const sorted = [...list].sort((a, b) => b.skor - a.skor);
    return {
      terbaik: sorted.slice(0, 5),
      terburuk: sorted.slice(-5).reverse()
    };
  }, [data]);

  // === RINGKASAN NUMERIK UNTUK CHATBOT ===
  const visibleDataSummary = useMemo(() => {
    if (!kecamatanData.length) return null;

    const totalDesa = kecamatanData.length;
    const avg = (key: keyof EducationData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // Desa terbaik/terburuk (hanya di level kecamatan)
    let desaTerburuk: EducationData | null = null;
    let desaTerbaik: EducationData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    if (selectedKab && selectedKec) {
      kecamatanData.forEach(des => {
        const totalSkor = des.skor_pendidikan_total;
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
          acc[key].total_skor += d.skor_pendidikan_total;
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
        pendidikan_total: parseFloat(avg("skor_pendidikan_total")),
        literasi: parseFloat(avg("skor_literasi")),
        paud: parseFloat(avg("skor_paud")),
        sd: parseFloat(avg("skor_sd")),
        smp: parseFloat(avg("skor_smp")),
        sma: parseFloat(avg("skor_sma")),
      },
      distribusi_kluster: kecamatanData.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      desa_dengan_pendidikan_terburuk: desaTerburuk
        ? {
            nama_desa: (desaTerburuk as EducationData).NAMA_DESA,
            nama_kecamatan: (desaTerburuk as EducationData).NAMA_KEC,
            nama_kabupaten: (desaTerburuk as EducationData).NAMA_KAB,
            skor_pendidikan_total: (desaTerburuk as EducationData).skor_pendidikan_total,
            skor_literasi: (desaTerburuk as EducationData).skor_literasi,
            skor_paud: (desaTerburuk as EducationData).skor_paud,
            skor_sd: (desaTerburuk as EducationData).skor_sd,
            skor_smp: (desaTerburuk as EducationData).skor_smp,
            skor_sma: (desaTerburuk as EducationData).skor_sma,
            label_kluster: (desaTerburuk as EducationData).label,
          }
        : null,
      desa_dengan_pendidikan_terbaik: desaTerbaik
        ? {
            nama_desa: (desaTerbaik as EducationData).NAMA_DESA,
            nama_kecamatan: (desaTerbaik as EducationData).NAMA_KEC,
            nama_kabupaten: (desaTerbaik as EducationData).NAMA_KAB,
            skor_pendidikan_total: (desaTerbaik as EducationData).skor_pendidikan_total,
            skor_literasi: (desaTerbaik as EducationData).skor_literasi,
            skor_paud: (desaTerbaik as EducationData).skor_paud,
            skor_sd: (desaTerbaik as EducationData).skor_sd,
            skor_smp: (desaTerbaik as EducationData).skor_smp,
            skor_sma: (desaTerbaik as EducationData).skor_sma,
            label_kluster: (desaTerbaik as EducationData).label,
          }
        : null,
      globalInsights,
      top5_terbaik: top5Pendidikan.terbaik,
      top5_terburuk: top5Pendidikan.terburuk,
    };
  }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerbaik, kabupatenTerburuk]);

  const {setPageContext} = useChatbotContext();
  
  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "pendidikan",
        pageTitle: "Analisis Pendidikan",
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
          .from('cluster_pendidikan')
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
          item.kategori_pendidikan.toLowerCase().includes(s)
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
            skor_literasi: item.skor_literasi,
            skor_pendidikan_total: item.skor_pendidikan_total,
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
        skor_literasi: m.skor_literasi,
        skor_pendidikan_total: m.skor_pendidikan_total,
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
                skor_literasi: item.skor_literasi,
                skor_pendidikan_total: item.skor_pendidikan_total,
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
        skor_literasi: m.skor_literasi,
        skor_pendidikan_total: m.skor_pendidikan_total,
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
          skor_literasi: m.skor_literasi,
          skor_pendidikan_total: m.skor_pendidikan_total,
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
        skor_literasi: m.skor_literasi,
        skor_pendidikan_total: m.skor_pendidikan_total,
      }));
  }, [data, selectedKab, selectedKec, selectedDesa]);

  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
  const chartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }

    if (selectedKab && selectedKec) {
      // Per desa di kecamatan
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_pendidikan_total.toFixed(1)) })),
        label: "Desa",
      }
    } else if (selectedKab) {
      // Per kecamatan di kabupaten
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const key = item.NAMA_KEC
          if (!acc[key]) acc[key] = { name: key, total: 0, count: 0 }
          acc[key].total += item.skor_pendidikan_total || 0
          acc[key].count += 1
          return acc
        }, {} as Record<string, { name: string; total: number; count: number }>)

      return {
        data: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.total / item.count).toFixed(1)) })),
        label: "Kecamatan",
      }
    } else {
      // Per kabupaten
      const grouped = data
        .reduce((acc, item) => {
          const key = item.NAMA_KAB
          if (!acc[key]) acc[key] = { name: key, total: 0, count: 0 }
          acc[key].total += item.skor_pendidikan_total || 0
          acc[key].count += 1
          return acc
        }, {} as Record<string, { name: string; total: number; count: number }>)

      return {
        data: Object.values(grouped).map(item => ({ name: item.name, skor: Number((item.total / item.count).toFixed(1)) })),
        label: "Kabupaten",
      }
    }
  }, [data, selectedKab, selectedKec])

  // === Komponen Pendidikan ===
  const skorComponentChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof EducationData) => {
      const valid = activeData.filter(d => d[key] != null && !isNaN(d[key] as number))
      if (valid.length === 0) return 0
      return Number((valid.reduce((sum, d) => sum + (d[key] as number), 0) / valid.length).toFixed(1))
    }
    return [
      { name: "PAUD", avg: avg("skor_paud") },
      { name: "SD", avg: avg("skor_sd") },
      { name: "SMP", avg: avg("skor_smp") },
      { name: "SMA", avg: avg("skor_sma") },
      { name: "Literasi", avg: avg("skor_literasi") },
    ]
  }, [activeData])

  const fasilitasChartData = useMemo(() => {
    if (!activeData.length) return []
    const sum = (key: keyof EducationData) => {
      return activeData.reduce((acc, d) => acc + (d[key] as number || 0), 0)
    }
    return [
      { name: "PAUD", count: sum("total_paud") },
      { name: "TK", count: sum("total_tk") },
      { name: "SD", count: sum("total_sd") },
      { name: "SMP", count: sum("total_smp") },
      { name: "SMA", count: sum("total_sma") },
      { name: "SMK", count: sum("total_smk") },
    ]
  }, [activeData])

  const categoryDistribution = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.kategori_pendidikan)
        if (existing) existing.value += 1
        else acc.push({ name: item.kategori_pendidikan, value: 1 })
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
        avgPendidikan: "0.0",
        avgLiterasi: "0.0",
        totalSekolah: 0,
      }
    }
    const totalSekolah = activeData.reduce((sum, d) => 
      sum + (d.total_sd || 0) + (d.total_smp || 0) + (d.total_sma || 0) + (d.total_smk || 0), 0
    )
    return {
      totalDesa: activeData.length,
      avgPendidikan: (activeData.reduce((sum, d) => sum + (d.skor_pendidikan_total || 0), 0) / activeData.length).toFixed(1),
      avgLiterasi: (activeData.reduce((sum, d) => sum + (d.skor_literasi || 0), 0) / activeData.length).toFixed(1),
      totalSekolah,
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
                Dashboard Pendidikan Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#a8dcc8" }}>
                Data kluster pendidikan masyarakat per desa
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
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-emerald-700 to-emerald-200" },
            { label: "Rata-rata Skor Pendidikan", value: stats.avgPendidikan, color: "from-green-700 to-green-300" },
            { label: "Rata-rata Skor Literasi", value: stats.avgLiterasi, color: "from-teal-700 to-teal-300" }, 
            { label: "Total Sekolah", value: stats.totalSekolah, color: "from-cyan-700 to-cyan-300" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg text-white`}>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Map Section */}
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
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: "#d4f4e8" }}>
              Sebaran Desa ({mapMarkers.length} lokasi)
            </h2>
          </div>
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
                  {(marker.skor_literasi !== undefined || marker.skor_pendidikan_total !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                      {marker.skor_literasi !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Literasi:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_literasi).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_pendidikan_total !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Pendidikan Total:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_pendidikan_total).toFixed(1)}</span>
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
            {/* Chart 1 - Skor Komponen */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}>
                  Rata-rata Skor Komponen Pendidikan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skorComponentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffff" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#ffff" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="avg" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 - Skor Pendidikan per Level */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}>
                  Skor Pendidikan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffff" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#ffff" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="skor" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Distribusi Kategori */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}>
                  Distribusi Kategori Pendidikan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:20}}>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
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

            {/* Chart 4 - Total Fasilitas */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}>
                  Total Fasilitas Pendidikan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fasilitasChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffff" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#ffff" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="count" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}