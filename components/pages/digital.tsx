// src/app/(your-path)/digital.tsx
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

interface DigitalData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  jumlah_bts: number
  jumlah_operator: number
  sinyal_telepon: number
  sinyal_internet: number
  ada_warnet: number
  komputer_desa: number
  internet_kantordesa: number
  sid: number
  skor_digitalisasi_pemdes : number
  skor_digital_readiness : number
  cluster: number
  label: string
  Latitude: number
  Longitude: number
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 10

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
  const lines = wrapText(String(name), 18);
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
      <tspan x={x} dy="1.1em">
        {`${(percent * 100).toFixed(0)}%`}
      </tspan>
    </text>
  );
};

export default function DigitalPage() {
  const [data, setData] = useState<DigitalData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter State
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
          total_skor_digital: 0,
        };
      }
      // Hitung skor digital rata-rata per desa
      const skor = d.skor_digital_readiness;
      acc[key].desa_count += 1;
      acc[key].total_skor_digital += skor;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agg).map((kab: any) => ({
      nama_kab: kab.nama_kab,
      desa_count: kab.desa_count,
      skor_rata_rata: kab.total_skor_digital / kab.desa_count,
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

  // === TOP 5 KABUPATEN (berdasarkan skor digital) ===
  const top5Digital = useMemo(() => {
    if (!data.length) return { terbaik: [], terburuk: [] };
    
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = { nama: key, total: 0, count: 0 };
      }
      const skor = d.skor_digital_readiness;
      acc[key].total += skor;
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
    const avg = (key: keyof DigitalData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // Cari desa terbaik & terburuk berdasarkan skor digital
    let desaTerburuk: DigitalData | null = null;
    let desaTerbaik: DigitalData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    if (selectedKab && selectedKec) {
      kecamatanData.forEach(des => {
        const skor = des.skor_digital_readiness
        if (skor < skorMin) {
          skorMin = skor;
          desaTerburuk = des;
        }
        if (skor > skorMax) {
          skorMax = skor;
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
          acc[key].total_skor += d.skor_digital_readiness;
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
        bts: parseFloat(avg("jumlah_bts")),
        operator: parseFloat(avg("jumlah_operator")),
        sinyal_telepon: parseFloat(avg("sinyal_telepon")),
        sinyal_internet: parseFloat(avg("sinyal_internet")),
        warnet: parseFloat(avg("ada_warnet")),
        komputer_desa: parseFloat(avg("komputer_desa")),
        internet_kantor: parseFloat(avg("internet_kantordesa")),
        sid: parseFloat(avg("sid")),
      },
      distribusi_kluster: kecamatanData.reduce((acc, d) => {
        acc[d.label] = (acc[d.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      desa_dengan_digital_terburuk: desaTerburuk
        ? {
            nama_desa: (desaTerburuk as DigitalData).NAMA_DESA,
            nama_kecamatan: (desaTerburuk as DigitalData).NAMA_KEC,
            nama_kabupaten: (desaTerburuk as DigitalData).NAMA_KAB,
            jumlah_bts: (desaTerburuk as DigitalData).jumlah_bts,
            jumlah_operator: (desaTerburuk as DigitalData).jumlah_operator,
            sinyal_telepon: (desaTerburuk as DigitalData).sinyal_telepon,
            sinyal_internet: (desaTerburuk as DigitalData).sinyal_internet,
            warnet: (desaTerburuk as DigitalData).ada_warnet,
            komputer_desa: (desaTerburuk as DigitalData).komputer_desa,
            skor_readiness : (desaTerburuk as DigitalData).skor_digital_readiness,
            skor_dig_pemerintahan : (desaTerburuk as DigitalData).skor_digitalisasi_pemdes,
            internet_kantor: (desaTerburuk as DigitalData).internet_kantordesa,
            sid: (desaTerburuk as DigitalData).sid,
            label_kluster: (desaTerburuk as DigitalData).label,
          }
        : null,
      desa_dengan_digital_terbaik: desaTerbaik
        ? {
            nama_desa: (desaTerbaik as DigitalData).NAMA_DESA,
            nama_kecamatan: (desaTerbaik as DigitalData).NAMA_KEC,
            nama_kabupaten: (desaTerbaik as DigitalData).NAMA_KAB,
            jumlah_bts: (desaTerbaik as DigitalData).jumlah_bts,
            jumlah_operator: (desaTerbaik as DigitalData).jumlah_operator,
            sinyal_telepon: (desaTerbaik as DigitalData).sinyal_telepon,
            sinyal_internet: (desaTerbaik as DigitalData).sinyal_internet,
            warnet: (desaTerbaik as DigitalData).ada_warnet,
            komputer_desa: (desaTerbaik as DigitalData).komputer_desa, 
            skor_readiness : (desaTerbaik as DigitalData).skor_digital_readiness,
            skor_dig_pemerintahan : (desaTerbaik as DigitalData).skor_digitalisasi_pemdes,
            internet_kantor: (desaTerbaik as DigitalData).internet_kantordesa,
            sid: (desaTerbaik as DigitalData).sid,
            label_kluster: (desaTerbaik as DigitalData).label,
          }
        : null,
      globalInsights,
      top5_terbaik: top5Digital.terbaik,
      top5_terburuk: top5Digital.terburuk,
    };
  }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerbaik, kabupatenTerburuk]);

  // === UPDATE PAGE CONTEXT UNTUK CHATBOT ===
  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "digital",
        pageTitle: "Analisis Digital",
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
      pageId: "digital",
      pageTitle: "Analisis Digital",
      filters: {},
      visibleDataSummary: { wilayah: "Provinsi Jawa Timur" },
    });

    // Reset saat keluar dari halaman
    return () => {
      setPageContext({
        pageId: "overview",
        pageTitle: "Overview",
        filters: {},
        visibleDataSummary: null,
      });
    };
  }, [setPageContext]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/data_cluster/cluster_digital")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching digital ", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
  // === MAP MARKERS: HANYA SAMPAI LEVEL KECAMATAN (filter desa diabaikan untuk peta) ===
const mapMarkers = useMemo(() => {
  if (!data.length) return []

  // Helper: cek apakah koordinat valid
  const isValidCoord = (lat: number, lng: number) => {
    return (
      lat !== 0 &&
      lng !== 0 &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -11 && lat <= -6 &&     // rentang Jawa Timur
      lng >= 110 && lng <= 115
    )
  }

  // Jika tidak ada filter → tampilkan kabupaten
  if (!selectedKab) {
    const kabMap = new Map()
    data.forEach(item => {
      if (isValidCoord(item.Latitude, item.Longitude) && !kabMap.has(item.NAMA_KAB)) {
        kabMap.set(item.NAMA_KAB, {
          lat: item.Latitude,
          lng: item.Longitude,
          name: item.NAMA_KAB,
          cluster: item.cluster,
          label: item.label,
        })
      }
    })
    return Array.from(kabMap.values()).map(m => ({
      name: m.name,
      position: [m.lat, m.lng] as [number, number],
      kabupaten: m.name,
      kecamatan: "",
      cluster: m.cluster,
      label: m.label,
    }))
  }

  // Jika hanya kabupaten dipilih → tampilkan kecamatan
  if (selectedKab && !selectedKec) {
    const kecMap = new Map()
    data
      .filter(d => d.NAMA_KAB === selectedKab)
      .forEach(item => {
        if (isValidCoord(item.Latitude, item.Longitude)) {
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

  // Jika kabupaten + kecamatan dipilih → tampilkan SEMUA desa dalam kecamatan itu
  // (abaikan selectedDesa!)
  if (selectedKab && selectedKec) {
    return data
      .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && isValidCoord(d.Latitude, d.Longitude))
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        cluster: m.cluster,
        label: m.label,
      }))
  }

  // Fallback: tampilkan semua desa (seharusnya tidak terjadi)
  return data
    .filter(d => isValidCoord(d.Latitude, d.Longitude))
    .map(m => ({
      name: m.NAMA_DESA,
      position: [m.Latitude, m.Longitude] as [number, number],
      kabupaten: m.NAMA_KAB,
      kecamatan: m.NAMA_KEC,
      cluster: m.cluster,
      label: m.label,
    }))
}, [data, selectedKab, selectedKec]) // ⚠️ JANGAN masukkan selectedDesa ke dependency array!

  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
  const btsOperatorByKabupaten = useMemo(() => {
    if (!data.length) return []
    const process = (items: DigitalData[]) => {
      const grouped = items.reduce((acc, item) => {
        const key = selectedKab && selectedKec ? item.NAMA_DESA : selectedKab ? item.NAMA_KEC : item.NAMA_KAB
        if (!acc[key]) acc[key] = { name: key, totalBts: 0, totalOperator: 0, count: 0 }
        acc[key].totalBts += item.jumlah_bts
        acc[key].totalOperator += item.jumlah_operator
        acc[key].count += 1
        return acc
      }, {} as Record<string, { name: string; totalBts: number; totalOperator: number; count: number }>)
      return Object.values(grouped).map(item => ({
        name: item.name,
        bts: Number((item.totalBts / item.count).toFixed(1)),
        operator: Number((item.totalOperator / item.count).toFixed(1)),
      }))
    }

    if (selectedKab && selectedKec && selectedDesa) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && d.NAMA_DESA === selectedDesa))
    } else if (selectedKab && selectedKec) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec))
    } else if (selectedKab) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab))
    } else {
      return process(data)
    }
  }, [data, selectedKab, selectedKec, selectedDesa])

  const signalByKabupaten = useMemo(() => {
    if (!data.length) return []
    const process = (items: DigitalData[]) => {
      const grouped = items.reduce((acc, item) => {
        const key = selectedKab && selectedKec ? item.NAMA_DESA : selectedKab ? item.NAMA_KEC : item.NAMA_KAB
        if (!acc[key]) acc[key] = { name: key, totalTelepon: 0, totalInternet: 0, count: 0 }
        acc[key].totalTelepon += item.sinyal_telepon
        acc[key].totalInternet += item.sinyal_internet
        acc[key].count += 1
        return acc
      }, {} as Record<string, { name: string; totalTelepon: number; totalInternet: number; count: number }>)
      return Object.values(grouped).map(item => ({
        name: item.name,
        telepon: Number((item.totalTelepon / item.count).toFixed(1)),
        internet: Number((item.totalInternet / item.count).toFixed(1)),
      }))
    }

    if (selectedKab && selectedKec && selectedDesa) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec && d.NAMA_DESA === selectedDesa))
    } else if (selectedKab && selectedKec) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec))
    } else if (selectedKab) {
      return process(data.filter(d => d.NAMA_KAB === selectedKab))
    } else {
      return process(data)
    }
  }, [data, selectedKab, selectedKec, selectedDesa])

  const digitalInfraChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof DigitalData) => {
      const sum = activeData.reduce((acc, item) => acc + (item[key] as number), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "Warnet", avg: avg("ada_warnet") },
      { name: "Komputer Desa", avg: avg("komputer_desa") },
      { name: "Internet Kantor Desa", avg: avg("internet_kantordesa") },
    ]
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

  // === Statistik ===
  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgBts: "0.0",
        avgOperator: "0.0",
        avgSinyalInternet: "0.0",
      }
    }
    return {
      totalDesa: activeData.length,
      avgBts: (activeData.reduce((sum, d) => sum + d.jumlah_bts, 0) / activeData.length).toFixed(1),
      avgOperator: (activeData.reduce((sum, d) => sum + d.jumlah_operator, 0) / activeData.length).toFixed(1),
      avgSinyalInternet: (activeData.reduce((sum, d) => sum + d.sinyal_internet, 0) / activeData.length).toFixed(1),
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
            <h1 className="text-3xl font-bold text-black mb-2">Analisis Digital Desa</h1>
            <p className="text-gray-600">Data kluster transformasi digital masyarakat per desa</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Total Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.totalDesa}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Jumlah BTS</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgBts}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Jumlah Operator</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgOperator}</p>
        </div>
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <p className="text-black text-sm font-medium">Rata-rata Sinyal Internet</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgSinyalInternet}%</p>
        </div>
      </div>

      {/* Map */}
      <div className="border border-[#c9ece7] rounded-lg bg-white/80 backdrop-blur-sm overflow-hidden">
        <h2 className="p-3 font-semibold text-black">Sebaran Desa ({mapMarkers.length} desa)</h2>
        <div className="h-96 w-full">
          <MapComponent markers={mapMarkers} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Rata-rata BTS dan Operator per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={btsOperatorByKabupaten}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="bts" fill="#324D3E" name="BTS" />
              <Bar dataKey="operator" fill="#728A6E" name="Operator" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Kualitas Sinyal per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={signalByKabupaten}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="telepon" fill="#324D3E"  name="Sinyal Telepon (%)" />
              <Bar dataKey="internet" fill="#8EA48B"  name="Sinyal Internet (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Rata-rata Infrastruktur Digital</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={digitalInfraChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg" fill="#B3C8A1" name="Rata-rata" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-4">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Kluster Digital</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 30, right: 60, bottom: 30, left: 60 }}>
              <Pie
                data={clusterDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomLabel}
                outerRadius={100}
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
            Detail Digital Desa ({tableData.length.toLocaleString()} hasil)
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
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Jumlah BTS</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Jumlah Operator</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Sinyal Telepon</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Sinyal Internet</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Warnet</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Komputer Desa</th>
                <th className="px-4 py-3 text-left text-black font-semibold text-sm">Internet Kantor</th>
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
                    <td className="px-4 py-3 text-black text-sm text-center">{item.jumlah_bts}</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.jumlah_operator}</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.sinyal_telepon}%</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.sinyal_internet}%</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.ada_warnet}</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.komputer_desa}</td>
                    <td className="px-4 py-3 text-black text-sm text-center">{item.internet_kantordesa}</td>
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
                  <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
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