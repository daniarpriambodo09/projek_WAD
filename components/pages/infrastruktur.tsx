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
    <div className="h-56 sm:h-80 md:h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500 text-sm">Memuat peta...</p>
    </div>
  ),
})

const COLORS = ["#324D3E", "#5A7A60", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
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
    if (!villageData.length) return []

    if (!selectedKab && !selectedKec && !selectedDesa) {
      const kabMap = new Map()
      villageData.forEach(item => {
        if (item.Latitude && item.Longitude && !kabMap.has(item.NAMA_KAB)) {
          kabMap.set(item.NAMA_KAB, { lat: item.Latitude, lng: item.Longitude, name: item.NAMA_KAB })
        }
      })
      return Array.from(kabMap.values()).map(m => ({
        name: m.name,
        position: [m.lat, m.lng] as [number, number],
        kabupaten: m.name,
        kecamatan: "",
        cluster: villageData.find(d => d.NAMA_KAB === m.name)?.cluster || 0,
        label: villageData.find(d => d.NAMA_KAB === m.name)?.label_infrastruktur || "",
      }))
    }

    if (selectedKab && !selectedKec) {
      const kecMap = new Map()
      villageData
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
                label: item.label_infrastruktur,
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

    if (selectedKab && selectedKec) {
      const targetDesa = villageData.find(d => d.NAMA_DESA === selectedDesa)
      const kec = targetDesa ? targetDesa.NAMA_KEC : selectedKec
      return villageData
        .filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === kec && d.Latitude && d.Longitude)
        .map(m => ({
          name: m.NAMA_DESA,
          position: [m.Latitude, m.Longitude] as [number, number],
          kabupaten: m.NAMA_KAB,
          kecamatan: m.NAMA_KEC,
          skorAir: m.skor_air,
          skorSanitasi: m.skor_sanitasi,
          skorAksesbilitas: m.skor_aksesibilitas,
          cluster: m.cluster,
          label: m.label_infrastruktur,
        }))
    }

    return villageData
      .filter(m => m.Latitude && m.Longitude)
      .map(m => ({
        name: m.NAMA_DESA,
        position: [m.Latitude, m.Longitude] as [number, number],
        kabupaten: m.NAMA_KAB,
        kecamatan: m.NAMA_KEC,
        skorAir: m.skor_air,
        skorSanitasi: m.skor_sanitasi,
        skorAksesbilitas: m.skor_aksesibilitas,
        cluster: m.cluster,
        label: m.label_infrastruktur,
      }))
  }, [villageData, selectedKab, selectedKec, selectedDesa])

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#324D3E] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data dari server...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen from-gray-50 to-gray-100">
      {/* STICKY HEADER - Mobile Optimized */}
      <div className="sticky top-0 z-[999] backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Dashboard Infrastruktur
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Analisis clustering infrastruktur desa dengan machine learning
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
                    {[...new Set(villageData.map(d => d.NAMA_KAB))].sort().map(kab => (
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, color: "from-blue-500 to-blue-600" },
            { label: "Rata-rata Skor Listrik", value: stats.avgListrik, color: "from-yellow-500 to-yellow-600" },
            { label: "Rata-rata Skor Sanitasi", value: stats.avgSanitasi, color: "from-green-500 to-green-600" },
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
              Sebaran Infrastruktur Desa
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
            {/* Chart 1 - Distribusi Cluster */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
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

            {/* Chart 2 - Skor Infrastruktur dengan Filter */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                    Rata-rata Skor per {chartData.label}
                  </h2>
                  <select
                    value={selectedInfra}
                    onChange={(e) => setSelectedInfra(e.target.value)}
                    className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5fb8a8] w-full sm:w-auto"
                  >
                    <option value="skor_listrik">Listrik</option>
                    <option value="skor_sanitasi">Sanitasi</option>
                    <option value="skor_air">Air</option>
                    <option value="skor_transportasi">Transportasi</option>
                    <option value="skor_digital">Digital</option>
                    <option value="skor_aksesibilitas">Aksesibilitas</option>
                  </select>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="value" fill="#324D3E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Akses Air */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Akses Air Bersih
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={aksesAirChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                    <YAxis stroke="#6b7280" fontSize={10} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, "Persentase"]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="value" fill="#5A7A60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4 - Penerangan Jalan */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
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
                      label={renderCustomLabel}
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
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5 - Sanitasi Layak */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
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
                      label={renderCustomLabel}
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

            {/* Chart 6 - Jalan & Irigasi */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Infrastruktur Jalan & Irigasi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={jalanIrigasiChartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
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
                    <Bar dataKey="avg" fill="#8EA48B" name="Rata-rata" radius={[4, 4, 0, 0]} />
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