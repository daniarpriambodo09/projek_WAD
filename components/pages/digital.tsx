// siDesa/components/pages/digital.tsx
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
  const [selectedBtsOperator, setSelectedBtsOperator] = useState<string>("bts")
  const [selectedSignal, setSelectedSignal] = useState<string>("telepon")
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
    const avg = (key: keyof DigitalData) =>
      (kecamatanData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);
    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;
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
  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "digital",
        pageTitle: "Dashboard Digital Desa",
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
  const activeData = useMemo(() => {
    if (!data.length) return []
    let filtered = data
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [data, selectedKab, selectedKec, selectedDesa])
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
  const startIndex = (currentPage - 1) * 5
  const endIndex = startIndex + 5
  const paginatedData = useMemo(() => tableData.slice(startIndex, endIndex), [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / 5)
  const mapMarkers = useMemo(() => {
    if (!data.length) return []
    const isValidCoord = (lat: number, lng: number) => {
      return (
        lat !== 0 &&
        lng !== 0 &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -11 && lat <= -6 &&
        lng >= 110 && lng <= 115
      )
    }
    // ====== MODE: LEVEL KABUPATEN ======
    if (!selectedKab) {
      const kabupatenMap = new Map();
      data.forEach(item => {
        if (isValidCoord(item.Latitude, item.Longitude) && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.label,
            // Ambil satu sample data untuk ditampilkan di tooltip
            skor_digitalisasi_pemdes: item.skor_digitalisasi_pemdes,
            skor_digital_readiness: item.skor_digital_readiness,
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
        skor_digitalisasi_pemdes: m.skor_digitalisasi_pemdes,
        skor_digital_readiness: m.skor_digital_readiness,
      }));
    }
    // ====== MODE: LEVEL KECAMATAN ======
    if (selectedKab && !selectedKec) {
      const kecamatanMap = new Map();
      data
        .filter(d => d.NAMA_KAB === selectedKab)
        .forEach(item => {
          if (isValidCoord(item.Latitude, item.Longitude)) {
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
                skor_digitalisasi_pemdes: item.skor_digitalisasi_pemdes,
                skor_digital_readiness: item.skor_digital_readiness,
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
        skor_digitalisasi_pemdes: m.skor_digitalisasi_pemdes,
        skor_digital_readiness: m.skor_digital_readiness,
      }));
    }
    // ====== MODE: LEVEL DESA ======
    if (selectedKab && selectedKec) {
      return data
        .filter(
          d =>
            d.NAMA_KAB === selectedKab &&
            d.NAMA_KEC === selectedKec &&
            isValidCoord(d.Latitude, d.Longitude)
        )
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          cluster: m.cluster,
          label: m.label,
          // Data tambahan untuk tooltip
          skor_digitalisasi_pemdes: m.skor_digitalisasi_pemdes,
          skor_digital_readiness: m.skor_digital_readiness,
        }));
    }
    // Default: tampilkan semua desa jika tidak ada filter
    return data
      .filter(m => isValidCoord(m.Latitude, m.Longitude))
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        cluster: m.cluster,
        label: m.label,
        // Data tambahan untuk tooltip
        skor_digitalisasi_pemdes: m.skor_digitalisasi_pemdes,
        skor_digital_readiness: m.skor_digital_readiness,
      }));
  }, [data, selectedKab, selectedKec, selectedDesa]);
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
      if (selectedBtsOperator === "bts") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalBts / item.count).toFixed(1)),
        }))
      } else if (selectedBtsOperator === "operator") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalOperator / item.count).toFixed(1)),
        }))
      }
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
      if (selectedSignal === "telepon") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalTelepon / item.count).toFixed(1)),
        }))
      } else if (selectedSignal === "internet") {
        return Object.values(grouped).map(item => ({
          name: item.name,
          value: Number((item.totalInternet / item.count).toFixed(1)),
        }))
      }
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
                Dashboard Digital Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1 font-semibold" style={{ 
                color: "#ffffff",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.6)"
              }}>
                Data kluster transformasi digital masyarakat per desa
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
        {/* Stats Cards - Enhanced Contrast */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.9) 100%)", shadow: "0 8px 32px rgba(16, 185, 129, 0.5)" },
            { label: "Rata-rata Jumlah BTS", value: stats.avgBts, gradient: "linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(45, 212, 191, 0.9) 100%)", shadow: "0 8px 32px rgba(20, 184, 166, 0.5)" },
            { label: "Rata-rata Jumlah Operator", value: stats.avgOperator, gradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(125, 211, 252, 0.9) 100%)", shadow: "0 8px 32px rgba(34, 211, 238, 0.5)" },
            { label: "Rata-rata Sinyal Internet", value: stats.avgSinyalInternet + "%", gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.9) 100%)", shadow: "0 8px 32px rgba(6, 182, 212, 0.5)" },
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
        {/* Map Section - Enhanced */}
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
                  <div className="font-black text-lg tracking-tight" style={{
                    color: "#ffffff",
                    textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.8)"
                  }}>
                    {marker.name}
                  </div>
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
                  {(marker.skor_digitalisasi_pemdes !== undefined || marker.skor_digital_readiness !== undefined) && (
                    <div className="mt-2 pt-2 space-y-1" style={{
                      borderTop: "1px solid rgba(34, 211, 238, 0.4)"
                    }}>
                      {marker.skor_digitalisasi_pemdes !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Digitalisasi Pemdes:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_digitalisasi_pemdes).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_digital_readiness !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Digital Readiness:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_digital_readiness).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>
        {/* Charts Section - Enhanced Contrast */}
        <div className="space-y-4 sm:space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 1: Distribusi Cluster */}
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
                  Distribusi Kluster Digital
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
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
            {/* Chart 2: BTS/Operator */}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-black" style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                  }}>
                    Rata-rata {selectedBtsOperator === "bts" ? "Jumlah BTS" : "Jumlah Operator"} per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
                  </h2>
                  <select
                    value={selectedBtsOperator}
                    onChange={(e) => setSelectedBtsOperator(e.target.value)}
                    className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 w-full sm:w-auto"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid rgba(34, 211, 238, 0.5)",
                      color: "#ffffff",
                      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 10px rgba(10, 31, 26, 0.8)",
                    }}
                  >
                    <option value="bts" style={{ background: "#0a1f1a", color: "#ffffff" }}>Jumlah BTS</option>
                    <option value="operator" style={{ background: "#0a1f1a", color: "#ffffff" }}>Jumlah Operator</option>
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={btsOperatorByKabupaten} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar
                      dataKey="value"
                      fill={selectedBtsOperator === "bts" ? "#10b981" : "#22d3ee"}
                      name={selectedBtsOperator === "bts" ? "Jumlah BTS" : "Jumlah Operator"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3: Kualitas Sinyal */}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-black" style={{ 
                    color: "#ffffff",
                    textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.7)"
                  }}>
                    Kualitas Sinyal {selectedSignal === "telepon" ? "Telepon" : "Internet"} per {selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"}
                  </h2>
                  <select
                    value={selectedSignal}
                    onChange={(e) => setSelectedSignal(e.target.value)}
                    className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 w-full sm:w-auto"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "2px solid rgba(34, 211, 238, 0.5)",
                      color: "#ffffff",
                      boxShadow: "0 0 15px rgba(34, 211, 238, 0.3), inset 0 0 10px rgba(10, 31, 26, 0.8)",
                    }}
                  >
                    <option value="telepon" style={{ background: "#0a1f1a", color: "#ffffff" }}>Sinyal Telepon</option>
                    <option value="internet" style={{ background: "#0a1f1a", color: "#ffffff" }}>Sinyal Internet</option>
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={signalByKabupaten} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar
                      dataKey="value"
                      fill={selectedSignal === "telepon" ? "#14b8a6" : "#22d3ee"}
                      name={selectedSignal === "telepon" ? "Sinyal Telepon (%)" : "Sinyal Internet (%)"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4: Infrastruktur Digital */}
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
                  Rata-rata Infrastruktur Digital
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={digitalInfraChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }} />
                    <Bar dataKey="avg" fill="#7dd3fc" name="Rata-rata" radius={[6, 6, 0, 0]} />
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