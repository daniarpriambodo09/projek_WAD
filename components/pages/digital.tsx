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
import { supabase } from "@/lib/supabaseClient"

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

export default function DigitalPage() {
  const [data, setData] = useState<DigitalData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filter State
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  // Filter Komponen untuk Grafik
  const [selectedBtsOperator, setSelectedBtsOperator] = useState<string>("bts") // "bts" atau "operator"
  const [selectedSignal, setSelectedSignal] = useState<string>("telepon") // "telepon" atau "internet"

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
        .from('cluster_digital')
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
    return []
  }, [data, selectedKab, selectedKec]) // ⚠️ JANGAN masukkan selectedDesa ke dependency array!

  // === CHART DATA: Rata-rata Jumlah BTS dan Operator (dengan filter) ===
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

      // Jika filter diatur ke 'bts', maka hanya kembalikan data untuk BTS
      if (selectedBtsOperator === "bts") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalBts / item.count).toFixed(1)),
        }))
      }
      // Jika filter diatur ke 'operator', maka hanya kembalikan data untuk Operator
      else if (selectedBtsOperator === "operator") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalOperator / item.count).toFixed(1)),
        }))
      }
      // Default: kembalikan kedua-duanya (untuk kompatibilitas, tapi seharusnya tidak terjadi karena filter selalu ada)
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
  }, [data, selectedKab, selectedKec, selectedDesa, selectedBtsOperator])

  // === CHART DATA: Rata-rata Sinyal Telepon dan Internet (dengan filter) ===
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

      // Jika filter diatur ke 'telepon', maka hanya kembalikan data untuk Telepon
      if (selectedSignal === "telepon") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalTelepon / item.count).toFixed(1)),
        }))
      }
      // Jika filter diatur ke 'internet', maka hanya kembalikan data untuk Internet
      else if (selectedSignal === "internet") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalInternet / item.count).toFixed(1)),
        }))
      }
      // Default: kembalikan kedua-duanya (untuk kompatibilitas, tapi seharusnya tidak terjadi karena filter selalu ada)
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
  }, [data, selectedKab, selectedKec, selectedDesa, selectedSignal])

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
                Analisis Digital Desa
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Data kluster transformasi digital masyarakat per desa
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
            { label: "Total Desa", value: stats.totalDesa, color: "from-blue-200 to-blue-900" },
            { label: "Rata-rata Jumlah BTS", value: stats.avgBts, color: "from-green-500 to-green-600" },
            { label: "Rata-rata Jumlah Operator", value: stats.avgOperator, color: "from-purple-500 to-purple-600" },
            { label: "Rata-rata Sinyal Internet", value: stats.avgSinyalInternet + "%", color: "from-orange-500 to-orange-600" },
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
                    <div className="mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium inline-block">
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
            {/* Chart 1: Distribusi Cluster */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Distribusi Kluster Digital
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

            {/* Chart 2: Rata-rata Jumlah BTS dan Operator (dengan filter) */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                    Rata-rata {selectedBtsOperator === "bts" ? "Jumlah BTS" : "Jumlah Operator"} per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
                  </h2>
                  <select
                    value={selectedBtsOperator}
                    onChange={(e) => setSelectedBtsOperator(e.target.value)}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] focus:border-transparent w-full sm:w-auto"
                  >
                    <option value="bts">Jumlah BTS</option>
                    <option value="operator">Jumlah Operator</option>
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={btsOperatorByKabupaten} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar
                      dataKey="value"
                      fill={
                        selectedBtsOperator === "bts"
                          ? "#324D3E"
                          : "#728A6E"
                      }
                      name={
                        selectedBtsOperator === "bts"
                          ? "Jumlah BTS"
                          : "Jumlah Operator"
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3: Kualitas Sinyal (dengan filter) */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                    Kualitas Sinyal {selectedSignal === "telepon" ? "Telepon" : "Internet"} per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
                  </h2>
                  <select
                    value={selectedSignal}
                    onChange={(e) => setSelectedSignal(e.target.value)}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] focus:border-transparent w-full sm:w-auto"
                  >
                    <option value="telepon">Sinyal Telepon</option>
                    <option value="internet">Sinyal Internet</option>
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={signalByKabupaten} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar
                      dataKey="value"
                      fill={
                        selectedSignal === "telepon"
                          ? "#324D3E"
                          : "#8EA48B"
                      }
                      name={
                        selectedSignal === "telepon"
                          ? "Sinyal Telepon (%)"
                          : "Sinyal Internet (%)"
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Rata-rata Infrastruktur Digital */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Rata-rata Infrastruktur Digital
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={digitalInfraChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="avg" fill="#B3C8A1" name="Rata-rata" radius={[4, 4, 0, 0]} />
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