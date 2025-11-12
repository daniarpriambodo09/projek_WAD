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

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 10

export default function KeseshatanPage() {
  const [data, setData] = useState<HealthData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  const {setPageContext} = useChatbotContext();

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
        .from('cluster_kesehatan') // Ganti nama tabel sesuai kebutuhan
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

  // === DATA DINAMIS UNTUK SEMUA KOMPONEN ===
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

  // === DATA UNTUK ANALISIS PER KECAMATAN (abaikan selectedDesa) ===
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
    const avg = (key: keyof HealthData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // Desa terbaik/terburuk (hanya di level kecamatan)
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
  }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerbaik, kabupatenTerburuk]);

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

  // === PAGINASI ===
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  // === MAP MARKERS: HANYA SAMPAI LEVEL KECAMATAN ===
  const mapMarkers = useMemo(() => {
    if (!data.length) return []

    // Jika tidak ada filter → tampilkan kabupaten
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

    // Jika hanya kabupaten dipilih → tampilkan kecamatan
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

    // Jika kabupaten + kecamatan dipilih → tampilkan semua desa di kecamatan itu
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

    // Jika desa dipilih → tetap tampilkan semua desa di kecamatan itu
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

  // === CHART DATA: Tampilkan unit yang sesuai dengan filter aktif ===
  const chartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }

    if (selectedKab && selectedKec && selectedDesa) {
      // Tampilkan hanya satu bar: skor dari desa yang dipilih
      const desaItem = data.find(d => d.NAMA_DESA === selectedDesa)
      if (!desaItem) return { data: [], label: "Desa" }
      return {
        data: [{ name: desaItem.NAMA_DESA, fasilitas: desaItem.skor_fasilitas, tenaga: desaItem.skor_tenaga_kesehatan }],
        label: "Desa"
      }
    } else if (selectedKab && selectedKec) {
      // Tampilkan per desa di kecamatan
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, fasilitas: d.skor_fasilitas, tenaga: d.skor_tenaga_kesehatan })),
        label: "Desa"
      }
    } else if (selectedKab) {
      // Tampilkan per kecamatan di kabupaten
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
      // Tampilkan per kabupaten
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

  // === STATISTIK & CHART LAINNYA ===
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
    return <div className="p-8 text-black">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#c9ece7] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Analisis Kesehatan Desa</h1>
            <p className="text-gray-600">Data kluster kesehatan masyarakat per desa</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Total Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Skor Fasilitas</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgFasilitas}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Skor Tenaga</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgTenaga}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Skor Kesehatan</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgKesehatan}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-black p-3 pb-2">Sebaran Desa di Jawa Timur</h2>
        <div className="h-96 w-full">
          <MapComponent markers={mapMarkers} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Rata-rata Skor Fasilitas per {chartData.label}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }} />
              <Bar dataKey="fasilitas" fill="#324D3E" name="Skor Fasilitas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Rata-rata Skor Tenaga Kesehatan per {chartData.label}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }} />
              <Line type="monotone" dataKey="tenaga" stroke="#324D3E" strokeWidth={2} name="Skor Tenaga" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Rata-rata Skor Komponen Kesehatan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skorComponentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }} />
              <Bar dataKey="avg" fill="#728A6E" name="Skor Rata-rata" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Fasilitas Kesehatan per 1000 Penduduk</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={infraChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }} />
              <Bar dataKey="avg" fill="#8EA48B" name="Per 1000 Penduduk" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Tenaga Kesehatan per 1000 Penduduk</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workforceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#f5f5f5", border: "1px solid #ccc" }} />
              <Bar dataKey="avg" fill="#B3C8A1" name="Per 1000 Penduduk" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Kluster Kesehatan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clusterDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
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

      {/* Table */}
      <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-black">
            Detail Kesehatan Desa ({tableData.length.toLocaleString()} hasil)
          </h2>
          <input
            type="text"
            placeholder="Cari nama desa, label, kabupaten, atau kecamatan ..."
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
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Nama Kab/Kota</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Nama Kecamatan</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Nama Desa</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Fasilitas</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Tenaga</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Gizi</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">KLB</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Program</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Total Skor</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Label</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={item.NAMA_DESA + index} className="border-b border-[#e0e0e0] hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-black text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.NAMA_KAB}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.NAMA_KEC}</td>
                    <td className="px-4 py-3 text-black font-medium text-sm">{item.NAMA_DESA}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_fasilitas.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_tenaga_kesehatan.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_gizi.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_klb.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black text-sm">{item.skor_program_prioritas.toFixed(1)}</td>
                    <td className="px-4 py-3 text-black font-semibold text-sm">
                      {item.skor_kesehatan_total.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          item.cluster === 0
                            ? "bg-blue-900 text-blue-200"
                            : item.cluster === 1
                            ? "bg-yellow-900 text-yellow-200"
                            : item.cluster === 2
                            ? "bg-[#016B61] text-green-200"
                            :item.cluster === 3
                            ? "bg-[#473472] text-purple-200"
                            :item.cluster === 4
                            ? "bg-grey-900 text-grey-200"
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
                  <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
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