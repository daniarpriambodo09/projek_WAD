// src/app/(your-path)/infrastruktur.tsx
"use client"
import { useState, useEffect, useMemo } from "react"
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
import dynamic from "next/dynamic"
import { useChatbotContext } from '@/context/ChatbotContext';
import { supabase } from "@/lib/supabaseClient";

interface VillageData {
  kk_pln: number
  kk_non_pln: number
  kk_tanpa_listrik: number
  total_kk: number
  penerangan_jalan: number
  air_minum_aman: number
  air_cuci_bersih: number
  sanitasi_layak: number
  irigasi: number
  jalan_aspal: number
  skor_listrik: number
  skor_sanitasi: number
  skor_air: number
  skor_transportasi: number
  skor_digital: number
  skor_aksesibilitas: number
  cluster: number
  label_infrastruktur: string
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  Longitude: number
  Latitude: number
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div 
      className="h-56 sm:h-80 md:h-96 rounded-lg animate-pulse flex items-center justify-center"
      style={{
        background: "rgba(10, 31, 26, 0.6)", // Warna latar dari digital.txt
        border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
      }}
    >
      <p className="text-sm" style={{ color: "#a8dcc8" }}>Memuat peta...</p> {/* Warna teks dari digital.txt */}
    </div>
  ),
})
const COLORS = ["#10b981", "#14b8a6", "#22d3ee", "#34d399", "#06b6d4", "#7dd3fc"]
const ITEMS_PER_PAGE = 10
export default function Infrastruktur() {
  const [searchTerm, setSearchTerm] = useState("")
  const [villageData, setVillageData] = useState<VillageData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  // Filter states
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])
  const [selectedInfra, setSelectedInfra] = useState<string>("skor_listrik")
  const { setPageContext } = useChatbotContext();
  // Update kecamatan options
  useEffect(() => {
    if (selectedKab) {
      const kecList = [...new Set(villageData.filter(d => d.NAMA_KAB === selectedKab).map(d => d.NAMA_KEC))].sort()
      setKecamatanOptions(kecList)
      setSelectedKec("")
      setSelectedDesa("")
    } else {
      setKecamatanOptions([])
      setSelectedKec("")
      setSelectedDesa("")
    }
  }, [selectedKab, villageData])
  // Update desa options
  useEffect(() => {
    if (selectedKec && selectedKab) {
      const desaList = [...new Set(villageData.filter(d => d.NAMA_KEC === selectedKec && d.NAMA_KAB === selectedKab).map(d => d.NAMA_DESA))].sort()
      setDesaOptions(desaList)
      setSelectedDesa("")
    } else {
      setDesaOptions([])
      setSelectedDesa("")
    }
  }, [selectedKec, selectedKab, villageData])
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('cluster_infrastruktur')
        .select('*');
      if (error) {
        console.error('Error fetching data:', error);
        setVillageData([]);
      } else {
        setVillageData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeData = useMemo(() => {
    if (!villageData.length) return []
    let filtered = villageData
    if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
    if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
    if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
    return filtered
  }, [villageData, selectedKab, selectedKec, selectedDesa])

  const kecamatanData = useMemo(() => {
    if (!villageData.length) return [];
    let result = villageData;
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab);
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec);
    return result;
  }, [villageData, selectedKab, selectedKec]);

  const kabupatenAggregates = useMemo(() => {
    if (!villageData.length) return [];
    const agg = villageData.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = {
          nama_kab: key,
          desa_count: 0,
          total_listrik: 0,
          total_sanitasi: 0,
          total_air: 0,
          total_transportasi: 0,
          total_digital: 0,
          total_aksesibilitas: 0,
        };
      }
      acc[key].desa_count += 1;
      acc[key].total_listrik += d.skor_listrik;
      acc[key].total_sanitasi += d.skor_sanitasi;
      acc[key].total_air += d.skor_air;
      acc[key].total_transportasi += d.skor_transportasi;
      acc[key].total_digital += d.skor_digital;
      acc[key].total_aksesibilitas += d.skor_aksesibilitas;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(agg).map((kab: any) => ({
      nama_kab: kab.nama_kab,
      desa_count: kab.desa_count,
      skor_rata_rata: (
        kab.total_listrik +
        kab.total_sanitasi +
        kab.total_air +
        kab.total_transportasi +
        kab.total_digital +
        kab.total_aksesibilitas
      ) / (6 * kab.desa_count),
      skor_listrik: kab.total_listrik / kab.desa_count,
      skor_sanitasi: kab.total_sanitasi / kab.desa_count,
      skor_air: kab.total_air / kab.desa_count,
      skor_transportasi: kab.total_transportasi / kab.desa_count,
      skor_digital: kab.total_digital / kab.desa_count,
      skor_aksesibilitas: kab.total_aksesibilitas / kab.desa_count,
    }));
  }, [villageData]);

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

  const top5Infra = useMemo(() => {
    if (!villageData.length) return { terbaik: [], terburuk: [] };
    const byKab = villageData.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = { nama: key, total: 0, count: 0 };
      }
      acc[key].total += (
        d.skor_listrik + d.skor_sanitasi + d.skor_air +
        d.skor_transportasi + d.skor_digital + d.skor_aksesibilitas
      ) / 6;
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
  }, [villageData]);

  const visibleDataSummary = useMemo(() => {
    if (!activeData.length) return null;
    const totalDesa = activeData.length;
    const avg = (key: keyof VillageData) =>
      (activeData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);
    const countTrue = (key: keyof VillageData) =>
      (activeData.filter(d => (d[key] as number) > 0).length / totalDesa * 100).toFixed(1);
    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec && !selectedDesa)
      wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec && selectedDesa)
      wilayah = `Desa ${selectedDesa}, Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    const clusterDist: Record<string, number> = {};
    kecamatanData.forEach(d => {
      clusterDist[d.label_infrastruktur] = (clusterDist[d.label_infrastruktur] || 0) + 1;
    });

    let desaTerburuk: VillageData | null = null;
    let desaTerbaik: VillageData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;
    if (selectedKab && selectedKec) {
      kecamatanData.forEach(des => {
        const totalSkor = (
          des.skor_listrik +
          des.skor_sanitasi +
          des.skor_air +
          des.skor_transportasi +
          des.skor_digital +
          des.skor_aksesibilitas
        ) / 6;
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
      const kecAgg = villageData
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, d) => {
          const key = d.NAMA_KEC;
          if (!acc[key]) {
            acc[key] = { nama_kec: key, desa_count: 0, total_skor: 0 };
          }
          acc[key].desa_count += 1;
          acc[key].total_skor += (
            d.skor_listrik + d.skor_sanitasi + d.skor_air +
            d.skor_transportasi + d.skor_digital + d.skor_aksesibilitas
          ) / 6;
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
      globalInsights = { kecamatanTerbaik: kecBest, kecamatanTerburuk: kecWorst };
    }

    return {
      wilayah,
      jumlah_desa: totalDesa,
      rata_rata_skor: {
        listrik: parseFloat(avg("skor_listrik")),
        sanitasi: parseFloat(avg("skor_sanitasi")),
        air: parseFloat(avg("skor_air")),
        transportasi: parseFloat(avg("skor_transportasi")),
        digital: parseFloat(avg("skor_digital")),
        aksesibilitas: parseFloat(avg("skor_aksesibilitas")),
      },
      persentase_akses: {
        air_minum_aman: parseFloat(countTrue("air_minum_aman")),
        air_cuci_bersih: parseFloat(countTrue("air_cuci_bersih")),
        sanitasi_layak: parseFloat(countTrue("sanitasi_layak")),
        penerangan_jalan: parseFloat(countTrue("penerangan_jalan")),
      },
      distribusi_kluster: clusterDist,
      desa_dengan_infrastruktur_terburuk: desaTerburuk
        ? {
            nama_desa: (desaTerburuk as VillageData).NAMA_DESA,
            nama_kecamatan: (desaTerburuk as VillageData).NAMA_KEC,
            nama_kabupaten: (desaTerburuk as VillageData).NAMA_KAB,
            skor_listrik: (desaTerburuk as VillageData).skor_listrik,
            skor_sanitasi: (desaTerburuk as VillageData).skor_sanitasi,
            skor_air: (desaTerburuk as VillageData).skor_air,
            skor_transportasi: (desaTerburuk as VillageData).skor_transportasi,
            skor_digital: (desaTerburuk as VillageData).skor_digital,
            skor_aksesibilitas: (desaTerburuk as VillageData).skor_aksesibilitas,
            label_kluster: (desaTerburuk as VillageData).label_infrastruktur,
          }
        : null,
      desa_dengan_infrastruktur_terbaik: desaTerbaik
        ? {
            nama_desa: (desaTerbaik as VillageData).NAMA_DESA,
            nama_kecamatan: (desaTerbaik as VillageData).NAMA_KEC,
            nama_kabupaten: (desaTerbaik as VillageData).NAMA_KAB,
            skor_listrik: (desaTerbaik as VillageData).skor_listrik,
            skor_sanitasi: (desaTerbaik as VillageData).skor_sanitasi,
            skor_air: (desaTerbaik as VillageData).skor_air,
            skor_transportasi: (desaTerbaik as VillageData).skor_transportasi,
            skor_digital: (desaTerbaik as VillageData).skor_digital,
            skor_aksesibilitas: (desaTerbaik as VillageData).skor_aksesibilitas,
            label_kluster: (desaTerbaik as VillageData).label_infrastruktur,
          }
        : null,
      globalInsights,
      top5_terbaik: top5Infra.terbaik,
      top5_terburuk: top5Infra.terburuk,
    };
  }, [kecamatanData, selectedKab, selectedKec, selectedDesa, villageData, kabupatenTerbaik, kabupatenTerburuk, top5Infra, activeData]);

  useEffect(() => {
    setPageContext({
      pageId: "infrastruktur",
      pageTitle: "Analisis Infrastruktur",
      filters: {
        kabupaten: selectedKab || undefined,
        kecamatan: selectedKec || undefined,
        desa: selectedDesa || undefined,
      },
      visibleDataSummary,
    });
  }, [selectedKab, selectedKec, selectedDesa, visibleDataSummary, setPageContext]);

  const tableData = useMemo(() => {
    if (!villageData.length) return []
    let result = villageData
    if (selectedKab) {
      result = result.filter(item => item.NAMA_KAB === selectedKab)
    }
    if (selectedKec) {
      result = result.filter(item => item.NAMA_KEC === selectedKec)
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.NAMA_DESA.toLowerCase().includes(searchLower) ||
          item.NAMA_KEC.toLowerCase().includes(searchLower) ||
          item.NAMA_KAB.toLowerCase().includes(searchLower) ||
          item.label_infrastruktur.toLowerCase().includes(searchLower)
      )
    }
    return result
  }, [villageData, selectedKab, selectedKec, searchTerm])

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => {
    return tableData.slice(startIndex, endIndex)
  }, [tableData, startIndex, endIndex])
  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  const mapMarkers = useMemo(() => {
    if (!villageData.length) return [];

    // ====== MODE: LEVEL KABUPATEN ======
    if (!selectedKab) {
      const kabupatenMap = new Map();

      villageData.forEach(item => {
        if (item.Latitude && item.Longitude && !kabupatenMap.has(item.NAMA_KAB)) {
          kabupatenMap.set(item.NAMA_KAB, {
            lat: item.Latitude,
            lng: item.Longitude,
            name: item.NAMA_KAB,
            cluster: item.cluster,
            label: item.label_infrastruktur,

            // Ambil satu sample data untuk ditampilkan di tooltip
            skor_transportasi: item.skor_transportasi,
            skor_aksesibilitas: item.skor_aksesibilitas,
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
        skor_transportasi: m.skor_transportasi,
        skor_aksesibilitas: m.skor_aksesibilitas,
      }));
    }

    // ====== MODE: LEVEL KECAMATAN ======
    if (selectedKab && !selectedKec) {
      const kecamatanMap = new Map();

      villageData
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
                label: item.label_infrastruktur,

                // Ambil satu sample data per kecamatan
                skor_transportasi: item.skor_transportasi,
                skor_aksesibilitas: item.skor_aksesibilitas,
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
        skor_transportasi: m.skor_transportasi,
        skor_aksesibilitas: m.skor_aksesibilitas,
      }));
    }

    // ====== MODE: LEVEL DESA ======
    if (selectedKab && selectedKec) {
      return villageData
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
          label: m.label_infrastruktur,

          // Data tambahan untuk tooltip
          skor_air: m.skor_air,
          skor_sanitasi: m.skor_sanitasi,
          skor_transportasi: m.skor_transportasi,
          skor_aksesibilitas: m.skor_aksesibilitas,
        }));
    }

    // Default: tampilkan semua desa jika tidak ada filter
    return villageData
      .filter(m => m.Latitude && m.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,

        cluster: m.cluster,
        label: m.label_infrastruktur,

        // Data tambahan untuk tooltip
        skor_air: m.skor_air,
        skor_sanitasi: m.skor_sanitasi,
        skor_transportasi: m.skor_transportasi,
        skor_aksesibilitas: m.skor_aksesibilitas,
      }));
  }, [villageData, selectedKab, selectedKec, selectedDesa]);

  const chartData = useMemo(() => {
    if (!villageData.length) return { data: [], label: "Data" }
    const numericKeys = [
      "skor_listrik",
      "skor_sanitasi",
      "skor_air",
      "skor_transportasi",
      "skor_digital",
      "skor_aksesibilitas"
    ]
    const safeSelectedInfra = numericKeys.includes(selectedInfra)
      ? selectedInfra
      : "skor_listrik"
    const getKey = (item: VillageData) => {
      if (selectedKab && selectedKec) return item.NAMA_DESA
      if (selectedKab) return item.NAMA_KEC
      return item.NAMA_KAB
    }
    const getValue = (item: VillageData): number => {
      const rawValue = item[safeSelectedInfra as keyof VillageData]
      return Number(rawValue) || 0
    }
    const grouped = villageData
      .filter(item => {
        if (selectedKab && item.NAMA_KAB !== selectedKab) return false
        if (selectedKec && item.NAMA_KEC !== selectedKec) return false
        if (selectedDesa && item.NAMA_DESA !== selectedDesa) return false
        return true
      })
      .reduce((acc, item) => {
        const key = getKey(item)
        const value = getValue(item)
        if (!acc[key]) {
          acc[key] = { name: key, total: 0, count: 0 }
        }
        acc[key].total += value
        acc[key].count += 1
        return acc
      }, {} as Record<string, { name: string; total: number; count: number }>)

    const result = Object.values(grouped).map(item => ({
      name: item.name,
      value: Number(((item.total / item.count) || 0).toFixed(1))
    }))

    const label = selectedKab && selectedKec ? "Desa" : selectedKab ? "Kecamatan" : "Kabupaten"
    return { data: result, label }
  }, [villageData, selectedKab, selectedKec, selectedDesa, selectedInfra])

  const aksesListrikChartData = useMemo(() => {
    if (!villageData.length) return []
    const totalKK = villageData.reduce((sum, d) => sum + d.total_kk, 0)
    const plnTotal = villageData.reduce((sum, d) => sum + d.kk_pln, 0)
    const nonPlnTotal = villageData.reduce((sum, d) => sum + d.kk_non_pln, 0)
    const tanpaListrikTotal = villageData.reduce((sum, d) => sum + d.kk_tanpa_listrik, 0)
    return [
      { name: "Akses Listrik", value: Number((((plnTotal + nonPlnTotal) / totalKK) * 100).toFixed(1)) },
      { name: "Tanpa Akses Listrik", value: Number(((tanpaListrikTotal / totalKK) * 100).toFixed(1)) },
    ]
  }, [villageData])

  const jalanIrigasiChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof VillageData) => {
      const sum = activeData.reduce((acc, item) => acc + (item[key] as number), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "Jalan Aspal", avg: avg("jalan_aspal") },
      { name: "Irigasi", avg: avg("irigasi") },
    ]
  }, [activeData])

  const peneranganJalanChartData = useMemo(() => {
    if (!activeData.length) return []
    const withLight = activeData.filter(d => d.penerangan_jalan > 0).length
    const withoutLight = activeData.filter(d => d.penerangan_jalan === 0).length
    return [
      { name: "Dengan Penerangan", value: withLight },
      { name: "Tanpa Penerangan", value: withoutLight },
    ]
  }, [activeData])

  const sanitasiLayakChartData = useMemo(() => {
    if (!activeData.length) return []
    const layak = activeData.filter(d => d.sanitasi_layak > 0).length
    const tidakLayak = activeData.filter(d => d.sanitasi_layak === 0).length
    return [
      { name: "Sanitasi Layak", value: layak },
      { name: "Tidak Layak", value: tidakLayak },
    ]
  }, [activeData])

  const clusterDistribution = useMemo(() => {
    if (!activeData.length) return []
    return activeData.reduce(
      (acc, item) => {
        const existing = acc.find(x => x.name === item.label_infrastruktur)
        if (existing) {
          existing.value += 1
        } else {
          acc.push({ name: item.label_infrastruktur, value: 1 })
        }
        return acc
      },
      [] as Array<{ name: string; value: number }>
    )
  }, [activeData])

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
        fill="#d4f4e8" // Warna teks utama dari digital.txt
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={12}
      >
        {lines.map((line: string, i: number) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : "1em"}>
            {line}
          </tspan>
        ))}
        <tspan x={x} dy="1em" fontWeight="bold" fill="#22d3ee"> {/* Warna aksen dari digital.txt */}
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgListrik: "0.0",
        avgSanitasi: "0.0",
        avgAir: "0.0",
        avgTransportasi: "0.0",
        avgDigital: "0.0",
        avgAksesibilitas: "0.0",
      }
    }
    return {
      totalDesa: activeData.length,
      avgListrik: (activeData.reduce((sum, d) => sum + d.skor_listrik, 0) / activeData.length).toFixed(1),
      avgSanitasi: (activeData.reduce((sum, d) => sum + d.skor_sanitasi, 0) / activeData.length).toFixed(1),
      avgAir: (activeData.reduce((sum, d) => sum + d.skor_air, 0) / activeData.length).toFixed(1),
      avgTransportasi: (activeData.reduce((sum, d) => sum + d.skor_transportasi, 0) / activeData.length).toFixed(1),
      avgDigital: (activeData.reduce((sum, d) => sum + d.skor_digital, 0) / activeData.length).toFixed(1),
      avgAksesibilitas: (activeData.reduce((sum, d) => sum + d.skor_aksesibilitas, 0) / activeData.length).toFixed(1),
    }
  }, [activeData])

  const aksesAirChartData = useMemo(() => {
    if (!activeData.length) return []
    const airMinum = (activeData.filter(d => d.air_minum_aman > 0).length / activeData.length) * 100
    const airCuci = (activeData.filter(d => d.air_cuci_bersih > 0).length / activeData.length) * 100
    return [
      { name: "Air Minum Aman", value: airMinum },
      { name: "Air Cuci Bersih", value: airCuci },
    ]
  }, [activeData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          {/* Loading spinner dari digital.txt */}
          <div 
            className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
            style={{
              border: "3px solid rgba(34, 211, 238, 0.2)",
              borderTopColor: "#22d3ee",
            }}
          ></div>
          <p style={{ color: "#a8dcc8" }}>Memuat data dari server...</p> {/* Warna teks dari digital.txt */}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* STICKY HEADER - Mobile Optimized - Gaya dari digital.txt */}
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
                Dashboard Infrastruktur
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#a8dcc8" }}> {/* Warna teks dari digital.txt */}
                Analisis clustering infrastruktur desa dengan machine learning
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 transition-all"
              style={{
                background: "rgba(34, 211, 238, 0.15)", // Warna tombol dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                color: "#22d3ee", // Warna teks dari digital.txt
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.25)" // Efek hover dari digital.txt
                e.currentTarget.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.3)" // Efek hover dari digital.txt
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.15)" // Efek hover dari digital.txt
                e.currentTarget.style.boxShadow = "none" // Efek hover dari digital.txt
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
                    {[...new Set(villageData.map(d => d.NAMA_KAB))].sort().map(kab => (
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
        {/* Stats Cards - Responsive Grid - Gaya dari digital.txt */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-emerald-700 to-emerald-200" },
            { label: "Rata-rata Skor Listrik", value: stats.avgListrik, color: "from-green-700 to-green-300" },
            { label: "Rata-rata Skor Sanitasi", value: stats.avgSanitasi, color: "from-teal-700 to-teal-300" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg text-white`}>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Map Section - Gaya dari digital.txt */}
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
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
              Sebaran Infrastruktur Desa
              <span className="ml-2 text-sm font-normal" style={{ color: "#a8dcc8" }}> {/* Warna teks dari digital.txt */}
                ({mapMarkers.length} lokasi)
              </span>
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
                  {(marker.skor_transportasi !== undefined || marker.skor_aksesibilitas !== undefined || marker.skor_air !== undefined || marker.skor_sanitasi !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-gray-700 space-y-1">
                      {marker.skor_transportasi !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Transportasi:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_transportasi).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_aksesibilitas !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Aksesibilitas:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_aksesibilitas).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_air !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Air Minum:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_air).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_sanitasi !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Sanitasi:</span>
                          <span className="font-medium text-[#22d3ee]">{Number(marker.skor_sanitasi).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>
        {/* Charts Section - Mobile Optimized - Gaya dari digital.txt */}
        <div className="space-y-4 sm:space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 1 - Distribusi Cluster */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Distribusi Cluster Infrastruktur
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
                      label={renderCustomLabel} // Gunakan label kustom dari digital.txt
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
            {/* Chart 2 - Skor Infrastruktur dengan Filter */}
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                    Rata-rata Skor per {chartData.label}
                  </h2>
                  <select
                    value={selectedInfra}
                    onChange={(e) => setSelectedInfra(e.target.value)}
                    className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 w-full sm:w-auto"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)", // Warna input dari digital.txt
                      border: "1px solid rgba(34, 211, 238, 0.3)", // Warna border dari digital.txt
                      color: "#d4f4e8", // Warna teks dari digital.txt
                    }}
                  >
                    <option value="skor_listrik" style={{ background: "#1a3a32" }}>Listrik</option> {/* Warna background dari digital.txt */}
                    <option value="skor_sanitasi" style={{ background: "#1a3a32" }}>Sanitasi</option> {/* Warna background dari digital.txt */}
                    <option value="skor_air" style={{ background: "#1a3a32" }}>Air</option> {/* Warna background dari digital.txt */}
                    <option value="skor_transportasi" style={{ background: "#1a3a32" }}>Transportasi</option> {/* Warna background dari digital.txt */}
                    <option value="skor_digital" style={{ background: "#1a3a32" }}>Digital</option> {/* Warna background dari digital.txt */}
                    <option value="skor_aksesibilitas" style={{ background: "#1a3a32" }}>Aksesibilitas</option> {/* Warna background dari digital.txt */}
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis 
                      dataKey="name" 
                      stroke="#a8dcc8" // Warna sumbu dari digital.txt
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={9}
                      interval={0}
                    />
                    <YAxis stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} /> {/* Warna baris pertama */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Akses Air */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Akses Air Bersih
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={aksesAirChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis dataKey="name" stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <YAxis stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, "Persentase"]}
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Bar dataKey="value" fill="#7dd3fc" radius={[4, 4, 0, 0]} /> {/* Warna baris kedua */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4 - Penerangan Jalan */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Penerangan Jalan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
                    <Pie
                      data={peneranganJalanChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel} // Gunakan label kustom dari digital.txt
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {peneranganJalanChartData.map((entry, index) => (
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
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5 - Sanitasi Layak */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Sanitasi Layak
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:10}}>
                    <Pie
                      data={sanitasiLayakChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel} // Gunakan label kustom dari digital.txt
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sanitasiLayakChartData.map((entry, index) => (
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
            {/* Chart 6 - Jalan & Irigasi */}
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
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: "#d4f4e8" }}> {/* Warna teks dari digital.txt */}
                  Infrastruktur Jalan & Irigasi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={jalanIrigasiChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" /> {/* Warna grid dari digital.txt */}
                    <XAxis dataKey="name" stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <YAxis stroke="#a8dcc8" fontSize={10} /> {/* Warna sumbu dari digital.txt */}
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 31, 26, 0.95)', // Warna latar tooltip dari digital.txt
                        border: '1px solid rgba(34, 211, 238, 0.3)', // Warna border tooltip dari digital.txt
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#d4f4e8', // Warna teks tooltip dari digital.txt
                      }} 
                    />
                    <Bar dataKey="avg" fill="#10b981" name="Rata-rata" radius={[4, 4, 0, 0]} /> {/* Warna baris pertama */}
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