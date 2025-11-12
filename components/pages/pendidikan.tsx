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

import { useChatbotContext } from "@/context/ChatbotContext"

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-64 sm:h-80 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 5 // Kurangi untuk mobile

const safeToFixed = (value: number | null, decimals = 1): string => {
  return value === null || isNaN(value) ? "N/A" : Number(value).toFixed(decimals)
}

export default function PendidikanPage() {
  const [data, setData] = useState<EducationData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

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
        // Gunakan klien yang sudah diimpor
        const { data, error } = await supabase
          .from('cluster_pendidikan') // Ganti nama tabel sesuai kebutuhan
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
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  // === MAP MARKERS ===
  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    if (!selectedKab && !selectedKec && !selectedDesa) {
      // Tampilkan kabupaten
      const kabMap = new Map()
      data.forEach(item => {
        if (item.Latitude && item.Longitude && !kabMap.has(item.NAMA_KAB)) {
          kabMap.set(item.NAMA_KAB, { lat: item.Latitude, lng: item.Longitude, name: item.NAMA_KAB })
        }
      })
      return Array.from(kabMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.name,
        kecamatan: "",
        cluster: data.find(d => d.NAMA_KAB === m.name)?.cluster || 0,
        label: data.find(d => d.NAMA_KAB === m.name)?.label || "",
      }))
    }

    if (selectedKab && !selectedKec) {
      // Tampilkan kecamatan
      const kecMap = new Map()
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (item.Latitude && item.Longitude) {
            const key = `${item.NAMA_KAB}-${item.NAMA_KEC}`
            if (!kecMap.has(key)) {
              kecMap.set(key, {
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
      return Array.from(kecMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.kabupaten,
        kecamatan: m.name,
        cluster: m.cluster,
        label: m.label,
      }))
    }

    // Tampilkan semua desa dalam kecamatan (termasuk saat desa dipilih)
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
          cluster: m.cluster,
          label: m.label,
        }))
    }

    return data
      .filter(m => m.Latitude && m.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        cluster: m.cluster,
        label: m.label,
      }))
  }, [data, selectedKab, selectedKec, selectedDesa])

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
    return <div className="p-4 sm:p-6 text-black">Loading...</div>
  }

  return (
    <div className="space-y-2 p-2 sm:p-2">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#c9ece7] px-4 sm:px-6 py-4 -mx-4 sm:-mx-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-2">Dashboard Pendidikan Desa</h1>
            <p className="text-sm sm:text-base text-gray-600">Data kluster pendidikan masyarakat per desa</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Total Desa</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Rata-rata Skor Pendidikan</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.avgPendidikan}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Rata-rata Skor Literasi</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.avgLiterasi}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <p className="text-black text-xs sm:text-sm font-medium">Total Sekolah</p>
          <p className="text-2xl sm:text-3xl font-bold text-black mt-1">{stats.totalSekolah}</p>
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
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Rata-rata Skor Komponen Pendidikan</h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={skorComponentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Bar dataKey="avg" fill="#728A6E" name="Skor Rata-rata" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Skor Pendidikan per {chartData.label}
            </h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Bar dataKey="skor" fill="#324D3E" name="Skor Pendidikan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 3 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Distribusi Kategori Pendidikan</h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <PieChart>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 */}
          <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Total Fasilitas Pendidikan</h2>
            <ResponsiveContainer width="100%" height={300} className="sm:h-64">
              <BarChart data={fasilitasChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis stroke="#666" />
                <Tooltip />
                <Bar dataKey="count" fill="#8EA48B" name="Jumlah" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-black">
            Detail Pendidikan Desa ({tableData.length.toLocaleString()} hasil)
          </h2>
          <input
            type="text"
            placeholder="Cari nama desa, kecamatan, atau kabupaten ..."
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
            paginatedData.map((item, index) => (
              <div key={item.NAMA_DESA + index} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-black font-medium">{item.NAMA_DESA}</p>
                    <p className="text-gray-600 text-sm">{item.NAMA_KEC}, {item.NAMA_KAB}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    item.cluster === 0
                      ? "bg-green-900 text-green-200"
                      : item.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                  }`}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>PAUD: {safeToFixed(item.skor_paud)}</div>
                  <div>SD: {safeToFixed(item.skor_sd)}</div>
                  <div>SMP: {safeToFixed(item.skor_smp)}</div>
                  <div>SMA: {safeToFixed(item.skor_sma)}</div>
                  <div>Literasi: {safeToFixed(item.skor_literasi)}</div>
                  <div>Total Skor: {safeToFixed(item.skor_pendidikan_total)}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Tidak ada data ditemukan</p>
          )}
        </div>

        {/* Tabel untuk Desktop */}
        <div className="hidden sm:block sm:overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#c9ece7] bg-gray-50">
                {["No", "Kabupaten", "Kecamatan", "Desa", "PAUD", "SD", "SMP", "SMA", "Literasi", "Total Skor", "Kategori"]
                  .map((header, i) => (
                    <th key={i} className="px-3 py-2 text-left text-black font-semibold text-xs sm:text-sm">{header}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.NAMA_DESA + index} className="border-b border-[#e0e0e0] hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{startIndex + index + 1}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{item.NAMA_KAB}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{item.NAMA_KEC}</td>
                    <td className="px-3 py-2 text-black font-medium text-xs sm:text-sm">{item.NAMA_DESA}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_paud)}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_sd)}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_smp)}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_sma)}</td>
                    <td className="px-3 py-2 text-black text-xs sm:text-sm">{safeToFixed(item.skor_literasi)}</td>
                    <td className="px-3 py-2 text-black font-semibold text-xs sm:text-sm">
                      {safeToFixed(item.skor_pendidikan_total)}
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
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