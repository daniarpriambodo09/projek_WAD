// src/app/(your-path)/kesehatan.tsx
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

import { useChatbotContext } from "@/context/ChatbotContext"
import { supabase } from "@/lib/supabaseClient"

interface HealthData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  total_penduduk: number
  skor_fasilitas: number
  skor_tenaga_kesehatan: number
  skor_gizi: number
  skor_klb: number
  skor_program_prioritas: number
  skor_kesejahteraan: number
  skor_kesehatan_total: number
  cluster: number
  label: string
  puskesmas_per_1000: number
  posyandu_per_1000: number
  dokter_per_1000: number
  bidan_per_1000: number
  Longitude: number
  Latitude: number
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
      fontSize={10}
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

const COLORS = ["#324D3E", "#5A7A60", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 10

export default function KeseshatanPage() {
  const [data, setData] = useState<HealthData[]>([])
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
        .from('cluster_kesehatan')
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

  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])

  const kabupatenAggregates = useMemo(() => {
    if (!data.length) return [];
    const agg = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = {
          nama_kab: key,
          desa_count: 0,
          total_fasilitas: 0,
          total_tenaga: 0,
          total_gizi: 0,
          total_klb: 0,
          total_program: 0,
          total_kesehatan: 0,
        };
      }
      acc[key].desa_count += 1;
      acc[key].total_fasilitas += d.skor_fasilitas;
      acc[key].total_tenaga += d.skor_tenaga_kesehatan;
      acc[key].total_gizi += d.skor_gizi;
      acc[key].total_klb += d.skor_klb;
      acc[key].total_program += d.skor_program_prioritas;
      acc[key].total_kesehatan += d.skor_kesehatan_total;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agg).map((kab: any) => ({
      nama_kab: kab.nama_kab,
      desa_count: kab.desa_count,
      skor_rata_rata: kab.total_kesehatan / kab.desa_count,
      skor_fasilitas: kab.total_fasilitas / kab.desa_count,
      skor_tenaga: kab.total_tenaga / kab.desa_count,
      skor_gizi: kab.total_gizi / kab.desa_count,
      skor_klb: kab.total_klb / kab.desa_count,
      skor_program: kab.total_program / kab.desa_count,
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

  const top5Kesehatan = useMemo(() => {
    if (!data.length) return { terbaik: [], terburuk: [] };
    
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) acc[key] = { nama: key, total: 0, count: 0 };
      acc[key].total += d.skor_kesehatan_total;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { nama: string; total: number; count: number }>);

    const list= Object.values(byKab).map(k => ({
      nama: k.nama,
      skor: k.total / k.count
    }));

    const sorted = [...list].sort((a, b) => b.skor - a.skor);
    return {
      terbaik: sorted.slice(0, 5),
      terburuk: sorted.slice(-5).reverse()
    };
  }, [data]);

  const kecamatanData = useMemo(() => {
    if (!data.length) return [];
    let result = data;
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab);
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec);
    return result;
  }, [data, selectedKab, selectedKec]);

  const visibleDataSummary = useMemo(() => {
    if (!data.length || !kecamatanData.length) return null;

    const totalDesa = kecamatanData.length;
    const avg = (key: keyof HealthData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    let desaTerburuk: HealthData | null = null;
    let desaTerbaik: HealthData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    if (selectedKab && selectedKec) {
      kecamatanData.forEach(des => {
        const totalSkor = des.skor_kesehatan_total;
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
          acc[key].total_skor += d.skor_kesehatan_total;
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
        fasilitas: parseFloat(avg("skor_fasilitas")),
        tenaga_kesehatan: parseFloat(avg("skor_tenaga_kesehatan")),
        gizi: parseFloat(avg("skor_gizi")),
        klb: parseFloat(avg("skor_klb")),
        program_prioritas: parseFloat(avg("skor_program_prioritas")),
        kesehatan_total: parseFloat(avg("skor_kesehatan_total")),
      },
      distribusi_kluster: kecamatanData.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      desa_dengan_kesehatan_terburuk: desaTerburuk
        ? {
            nama_desa: (desaTerburuk as HealthData).NAMA_DESA,
            nama_kecamatan: (desaTerburuk as HealthData).NAMA_KEC,
            nama_kabupaten: (desaTerburuk as HealthData).NAMA_KAB,
            skor_fasilitas: (desaTerburuk as HealthData).skor_fasilitas,
            skor_tenaga_kesehatan: (desaTerburuk as HealthData).skor_tenaga_kesehatan,
            skor_gizi: (desaTerburuk as HealthData).skor_gizi,
            skor_klb: (desaTerburuk as HealthData).skor_klb,
            skor_program_prioritas: (desaTerburuk as HealthData).skor_program_prioritas,
            skor_kesehatan_total: (desaTerburuk as HealthData).skor_kesehatan_total,
            label_kluster: (desaTerburuk as HealthData).label,
          }
        : null,
      desa_dengan_kesehatan_terbaik: desaTerbaik
        ? {
            nama_desa: (desaTerbaik as HealthData).NAMA_DESA,
            nama_kecamatan: (desaTerbaik as HealthData).NAMA_KEC,
            nama_kabupaten: (desaTerbaik as HealthData).NAMA_KAB,
            skor_fasilitas: (desaTerbaik as HealthData).skor_fasilitas,
            skor_tenaga_kesehatan: (desaTerbaik as HealthData).skor_tenaga_kesehatan,
            skor_gizi: (desaTerbaik as HealthData).skor_gizi,
            skor_klb: (desaTerbaik as HealthData).skor_klb,
            skor_program_prioritas: (desaTerbaik as HealthData).skor_program_prioritas,
            skor_kesehatan_total: (desaTerbaik as HealthData).skor_kesehatan_total,
            label_kluster: (desaTerbaik as HealthData).label,
          }
        : null,
      globalInsights,
      top5_terbaik: top5Kesehatan.terbaik,
      top5_terburuk: top5Kesehatan.terburuk,
    };
  }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerbaik, kabupatenTerburuk, top5Kesehatan]);

  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "kesehatan",
        pageTitle: "Analisis Kesehatan",
        filters: {
          kabupaten: selectedKab || undefined,
          kecamatan: selectedKec || undefined,
          desa: selectedDesa || undefined,
        },
        visibleDataSummary,
      });
    }
  }, [visibleDataSummary, selectedKab, selectedKec, selectedDesa, setPageContext]);

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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    if (!selectedKab && !selectedKec && !selectedDesa) {
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

    if (selectedKab && selectedKec && !selectedDesa) {
      return data
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && d.Latitude && d.Longitude)
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          cluster: m.cluster,
          label: m.label,
        }))
    }

    if (selectedDesa) {
      const desaItem = data.find(d => d.NAMA_DESA === selectedDesa)
      if (!desaItem) return []
      return data
        .filter(d => d.NAMA_KAB === desaItem.NAMA_KAB && d.NAMA_KEC === desaItem.NAMA_KEC && d.Latitude && d.Longitude)
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
      .filter(d => d.Latitude && d.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        cluster: m.cluster,
        label: m.label,
      }))
  }, [data, selectedKab, selectedKec, selectedDesa])

  const chartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }

    if (selectedKab && selectedKec && selectedDesa) {
      const desaItem = data.find(d => d.NAMA_DESA === selectedDesa)
      if (!desaItem) return { data: [], label: "Desa" }
      return {
        data: [{ name: desaItem.NAMA_DESA, fasilitas: desaItem.skor_fasilitas, tenaga: desaItem.skor_tenaga_kesehatan }],
        label: "Desa"
      }
    } else if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, fasilitas: d.skor_fasilitas, tenaga: d.skor_tenaga_kesehatan })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KEC)
          if (existing) {
            existing.totalFasilitas += item.skor_fasilitas
            existing.totalTenaga += item.skor_tenaga_kesehatan
            existing.count += 1
          } else {
            acc.push({
              name: item.NAMA_KEC,
              totalFasilitas: item.skor_fasilitas,
              totalTenaga: item.skor_tenaga_kesehatan,
              count: 1
            })
          }
          return acc
        }, [] as Array<{ name: string; totalFasilitas: number; totalTenaga: number; count: number }>)
        .map(item => ({
          name: item.name,
          fasilitas: Number((item.totalFasilitas / item.count).toFixed(1)),
          tenaga: Number((item.totalTenaga / item.count).toFixed(1))
        }))
      return { data: grouped, label: "Kecamatan" }
    } else {
      const grouped = data
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KAB)
          if (existing) {
            existing.totalFasilitas += item.skor_fasilitas
            existing.totalTenaga += item.skor_tenaga_kesehatan
            existing.count += 1
          } else {
            acc.push({
              name: item.NAMA_KAB,
              totalFasilitas: item.skor_fasilitas,
              totalTenaga: item.skor_tenaga_kesehatan,
              count: 1
            })
          }
          return acc
        }, [] as Array<{ name: string; totalFasilitas: number; totalTenaga: number; count: number }> )
        .map(item => ({
          name: item.name,
          fasilitas: Number((item.totalFasilitas / item.count).toFixed(1)),
          tenaga: Number((item.totalTenaga / item.count).toFixed(1))
        }))
      return { data: grouped, label: "Kabupaten" }
    }
  }, [data, selectedKab, selectedKec, selectedDesa])

  const skorComponentChartData = useMemo(() => {
    if (!activeData.length) return []
    const n = activeData.length
    return [
      { name: "Gizi", avg: Number((activeData.reduce((sum, item) => sum + item.skor_gizi, 0) / n).toFixed(1)) },
      { name: "KLB", avg: Number((activeData.reduce((sum, item) => sum + item.skor_klb, 0) / n).toFixed(1)) },
      { name: "Program", avg: Number((activeData.reduce((sum, item) => sum + item.skor_program_prioritas, 0) / n).toFixed(1)) },
      { name: "Kesejahteraan", avg: Number((activeData.reduce((sum, item) => sum + item.skor_kesejahteraan, 0) / n).toFixed(1)) },
    ]
  }, [activeData])

  const infraChartData = useMemo(() => {
    if (!activeData.length) return []
    const n = activeData.length
    return [
      { name: "Puskesmas", avg: Number((activeData.reduce((sum, item) => sum + item.puskesmas_per_1000, 0) / n).toFixed(2)) },
      { name: "Posyandu", avg: Number((activeData.reduce((sum, item) => sum + item.posyandu_per_1000, 0) / n).toFixed(2)) },
    ]
  }, [activeData])

  const workforceChartData = useMemo(() => {
    if (!activeData.length) return []
    const n = activeData.length
    return [
      { name: "Dokter", avg: Number((activeData.reduce((sum, item) => sum + item.dokter_per_1000, 0) / n).toFixed(2)) },
      { name: "Bidan", avg: Number((activeData.reduce((sum, item) => sum + item.bidan_per_1000, 0) / n).toFixed(2)) },
    ]
  }, [activeData])

  const clusterDistribution = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.label)
        if (existing) {
          existing.value += 1
        } else {
          acc.push({ name: item.label, value: 1 })
        }
        return acc
      },
      [] as Array<{ name: string; value: number }>
    )
  }, [activeData])

  const stats = useMemo(() => {
    if (!activeData.length) {
      return { totalDesa: 0, avgFasilitas: "0.0", avgTenaga: "0.0", avgKesehatan: "0.0" }
    }
    const n = activeData.length
    return {
      totalDesa: n,
      avgFasilitas: (activeData.reduce((sum, item) => sum + item.skor_fasilitas, 0) / n).toFixed(1),
      avgTenaga: (activeData.reduce((sum, item) => sum + item.skor_tenaga_kesehatan, 0) / n).toFixed(1),
      avgKesehatan: (activeData.reduce((sum, item) => sum + item.skor_kesehatan_total, 0) / n).toFixed(1),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* STICKY HEADER - Mobile Optimized */}
      <div className="sticky top-0 z-[999] bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Dashboard Kesehatan Desa
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Analisis clustering kesehatan masyarakat per desa
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
            { label: "Total Desa", value: stats.totalDesa, color: "from-blue-500 to-blue-600" },
            { label: "Rata-rata Skor Fasilitas", value: stats.avgFasilitas, color: "from-green-500 to-green-600" },
            { label: "Rata-rata Skor Tenaga", value: stats.avgTenaga, color: "from-purple-500 to-purple-600" },
            { label: "Rata-rata Skor Kesehatan", value: stats.avgKesehatan, color: "from-pink-500 to-pink-600" },
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
              Sebaran Kesehatan Desa
              <span className="ml-2 text-sm font-normal text-gray-600">({mapMarkers.length} lokasi)</span>
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
                    <div className="mt-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium inline-block">
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
            {/* Chart 1 - Distribusi Cluster */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Kluster Kesehatan
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
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clusterDistribution.map((entry, index) => (
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

            {/* Chart 2 - Skor Fasilitas */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Rata-rata Skor Fasilitas per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={9}
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
                    <Bar dataKey="fasilitas" fill="#324D3E" name="Skor Fasilitas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Skor Tenaga */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Rata-rata Skor Tenaga Kesehatan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={9}
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
                    <Line type="monotone" dataKey="tenaga" stroke="#5A7A60" strokeWidth={3} name="Skor Tenaga" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4 - Komponen Kesehatan */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Rata-rata Skor Komponen Kesehatan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skorComponentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
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
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5 - Fasilitas per 1000 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Fasilitas Kesehatan per 1000 Penduduk
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={infraChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="avg" fill="#8EA48B" name="Per 1000 Penduduk" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6 - Tenaga per 1000 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Tenaga Kesehatan per 1000 Penduduk
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workforceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="avg" fill="#B3C8A1" name="Per 1000 Penduduk" radius={[4, 4, 0, 0]} />
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