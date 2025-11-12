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
    <div className="h-96 bg-white/80 backdrop-blur-sm rounded-lg animate-pulse" />
  ),
})

const COLORS = ["#324D3E", "#728A6E", "#8EA48B", "#B3C8A1", "#C9D9C3"]
const ITEMS_PER_PAGE = 10

export default function Infrastruktur() {
  const [searchTerm, setSearchTerm] = useState("")
  const [villageData, setVillageData] = useState<VillageData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Semua filter
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])

  // Filter komponen infrastruktur
  const [selectedInfra, setSelectedInfra] = useState<string>("listrik")

  // === EFFECTS ===

  // Update kecamatan options
  useEffect(() => {
    if (selectedKab) {
      const kecList = [...new Set(villageData.filter(d => d.NAMA_KAB === selectedKab).map(d => d.NAMA_KEC))]
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
      const desaList = [...new Set(villageData.filter(d => d.NAMA_KEC === selectedKec && d.NAMA_KAB === selectedKab).map(d => d.NAMA_DESA))]
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
      try {
        const response = await fetch("http://localhost:8000/api/data_cluster/cluster_infrastruktur")
        const data = await response.json()
        setVillageData(data)
      } catch (error) {
        console.log("[v0] Error fetching ", error)
        setVillageData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // === DATA DINAMIS ===
  const activeData = useMemo(() => {
      if (!villageData.length) return []
      let filtered = villageData
      if (selectedKab) filtered = filtered.filter(item => item.NAMA_KAB === selectedKab)
      if (selectedKec) filtered = filtered.filter(item => item.NAMA_KEC === selectedKec)
      if (selectedDesa) filtered = filtered.filter(item => item.NAMA_DESA === selectedDesa)
      return filtered
  }, [villageData, selectedKab, selectedKec, selectedDesa])

    // === DATA UNTUK ANALISIS PER KECAMATAN (abaikan selectedDesa) ===
  const kecamatanData = useMemo(() => {
    if (!villageData.length) return [];
    let result = villageData;
    if (selectedKab) result = result.filter(item => item.NAMA_KAB === selectedKab);
    if (selectedKec) result = result.filter(item => item.NAMA_KEC === selectedKec);
    return result;
  }, [villageData, selectedKab, selectedKec]);

  // === AGREGAT GLOBAL: PER KABUPATEN ===
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
    }, [kabupatenAggregates]);3

  // === TOP 5 INFRASTRUKTUR (Provinsi Level) ===
  const top5Infra = useMemo(() => {
    if (!villageData.length) return { terbaik: [], terburuk: [] };

    // Agregat per kabupaten
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

    // Hitung rata-rata & urutkan
    const list = Object.values(byKab).map(k => ({
      nama: k.nama,
      skor: k.total / k.count
    }));

    const sorted = [...list].sort((a, b) => b.skor - a.skor);
    return {
      terbaik: sorted.slice(0, 5),      // 5 terbaik
      terburuk: sorted.slice(-5).reverse() // 5 terburuk (dibalik agar terburuk pertama)
    };
  }, [villageData]);

  // === RINGKASAN NUMERIK UNTUK CHATBOT ===
  const visibleDataSummary = useMemo(() => {
    if (!activeData.length) return null;

    const totalDesa = activeData.length;
    const avg = (key: keyof VillageData) =>
      (activeData.reduce((sum, d) => sum + (d[key] as number), 0) / totalDesa).toFixed(1);

    const countTrue = (key: keyof VillageData) =>
      (activeData.filter(d => (d[key] as number) > 0).length / totalDesa * 100).toFixed(1);

    // Tentukan wilayah
    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec && !selectedDesa) 
      wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec && selectedDesa) 
      wilayah = `Desa ${selectedDesa}, Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // Hitung distribusi kluster
    const clusterDist: Record<string, number> = {};
    kecamatanData.forEach(d => {
      clusterDist[d.label_infrastruktur] = (clusterDist[d.label_infrastruktur] || 0) + 1;
    });

    // Desa terburuk & terbaik (hanya jika di level kecamatan)
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

    // Global insights
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
  }, [kecamatanData, selectedKab, selectedKec, villageData, kabupatenTerbaik, kabupatenTerburuk]);

  // Tambahkan di dalam komponen Infrastruktur()
  const { setPageContext } = useChatbotContext();

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

  // === DATA UNTUK TABEL: semua desa dalam kecamatan terpilih (abaikan selectedDesa) ===
  const tableData = useMemo(() => {
    if (!villageData.length) return []
    let result = villageData

    // Hanya filter berdasarkan kab & kec — jangan filter desa
    if (selectedKab) {
      result = result.filter(item => item.NAMA_KAB === selectedKab)
    }
    if (selectedKec) {
      result = result.filter(item => item.NAMA_KEC === selectedKec)
    }

    // Terapkan pencarian
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

  // === PAGINASI TABEL ===
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = useMemo(() => {
    return tableData.slice(startIndex, endIndex)
  }, [tableData, startIndex, endIndex])

  const tableTotalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)

  // === MAP MARKERS ===
  const mapMarkers = useMemo(() => {
    if (!villageData.length) return []

    if (!selectedKab && !selectedKec && !selectedDesa) {
      // Tampilkan kabupaten
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
      // Tampilkan kecamatan
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

    // Tampilkan semua desa dalam kecamatan (termasuk saat desa dipilih)
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

  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
  // === CHART DATA: AGREGASI BERDASARKAN LEVEL FILTER ===
  const chartData = useMemo(() => {
    if (!villageData.length) return { data: [], label: "Data" }

    // Hanya kolom numerik yang boleh dipilih
    const numericKeys = [
      "skor_listrik",
      "skor_sanitasi",
      "skor_air",
      "skor_transportasi",
      "skor_digital",
      "skor_aksesibilitas"
    ]

    // Jika selectedInfra bukan numerik, paksa ke skor_listrik
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
      // Konversi ke number, jika NaN -> 0
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

  // === Komponen Lainnya ===
// === Komposisi Akses Listrik (PLN vs Non-PLN) - Hanya untuk data keseluruhan (tidak terfilter)
const aksesListrikChartData = useMemo(() => {
  if (!villageData.length) return []

  // Hitung total nasional
  const totalKK = villageData.reduce((sum, d) => sum + d.total_kk, 0)
  const plnTotal = villageData.reduce((sum, d) => sum + d.kk_pln, 0)
  const nonPlnTotal = villageData.reduce((sum, d) => sum + d.kk_non_pln, 0)
  const tanpaListrikTotal = villageData.reduce((sum, d) => sum + d.kk_tanpa_listrik, 0)

  // Format ke persentase
  return [
    { name: "Akses Lirtrik", value: Number((((plnTotal + nonPlnTotal) / totalKK) * 100).toFixed(1)) },
    { name: "Tanpa Akses Listrik", value: Number(((tanpaListrikTotal / totalKK) * 100).toFixed(1)) },
  ]
}, [villageData]) // <-- Hanya bergantung pada villageData, bukan activeData

  const peneranganJalanChartData = useMemo(() => {
    if (!activeData.length) return []
    const withLight = activeData.filter(d => d.penerangan_jalan > 0).length
    const withoutLight = activeData.filter(d => d.penerangan_jalan === 0).length
    return [
      { name: "Dengan Penerangan Jalan", value: withLight },
      { name: "Tanpa Penerangan Jalan", value: withoutLight },
    ]
  }, [activeData])

  const sanitasiLayakChartData = useMemo(() => {
    if (!activeData.length) return []
    const layak = activeData.filter(d => d.sanitasi_layak > 0).length
    const tidakLayak = activeData.filter(d => d.sanitasi_layak === 0).length
    return [
      { name: "Sanitasi Layak", value: layak },
      { name: "Sanitasi Tidak Layak", value: tidakLayak },
    ]
  }, [activeData])

  // === Cluster Distribution ===
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
        fontSize={13}
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

  // === Chart Khusus: Akses Air ===
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
    return <div className="text-center py-8">Loading data...</div>
  }

  return (
    <div className="space-y-4">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-[#c9ece7] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Analisis Infrastruktur</h1>
            <p className="text-gray-600">Data clustering infrastruktur desa dengan machine learning</p>
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
                {[...new Set(villageData.map(d => d.NAMA_KAB))].map(kab => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Total Data Desa</p>
          <p className="text-3xl font-bold text-black mt-2">{villageData.length}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Rata-rata Skor Listrik</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgListrik}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <p className="text-gray-800 text-sm">Rata-rata Skor Sanitasi</p>
          <p className="text-3xl font-bold text-black mt-2">{stats.avgSanitasi}</p>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold text-black p-3 pb-2">Sebaran Desa di Jawa Timur</h2>
        <div className="h-96 w-full">
          <MapComponent markers={mapMarkers} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Distribusi Cluster */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Distribusi Cluster Infrastruktur</h2>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{right: 60, bottom : 30}}>
                <Pie
                  data={clusterDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
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

        {/* Chart 2: Rata-rata Skor Infrastruktur (dengan filter komponen) */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">
              Rata-rata Skor {selectedInfra === "listrik" ? "Listrik" : selectedInfra === "sanitasi" ? "Sanitasi" : selectedInfra === "air" ? "Air" : selectedInfra === "transportasi" ? "Transportasi" : selectedInfra === "digital" ? "Digital" : "Aksesibilitas"} per {chartData.label}
            </h2>
            <select
              value={selectedInfra}
              onChange={(e) => setSelectedInfra(e.target.value)}
              className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="skor_listrik">Listrik</option>
              <option value="skor_sanitasi">Sanitasi</option>
              <option value="skor_air">Air</option>
              <option value="skor_transportasi">Transportasi</option>
              <option value="skor_digital">Digital</option>
              <option value="skor_aksesibilitas">Aksesibilitas</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#324D3E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Rata-rata Skor Air */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Akses Air Bersih</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={aksesAirChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Persentase"]} />
              <Bar dataKey="value" fill="#8EA48B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart 4: Penerangan Jalan */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Penerangan Jalan</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={peneranganJalanChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {peneranganJalanChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 5: Sanitasi Layak */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Sanitasi Layak</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={sanitasiLayakChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sanitasiLayakChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 6: Akses Listrik (PLN vs Non-PLN) */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Komposisi Akses Listrik (Nasional)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={aksesListrikChartData}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: "#666", strokeWidth: 2 }}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {aksesListrikChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Persentase"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#c9ece7] bg-white/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">Detail Infrastruktur per Desa</h2>
          <input
            type="text"
            placeholder="Cari nama desa, label, kabupaten, atau kecamatan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-[#c9ece7] rounded-lg bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5fb8a8]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-400 bg-gray-50">
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">No</th>
                <th className="text-left py-4 px-4 text-black font-semibold text-sm">Nama Kab/Kota</th> 
                <th className="text-left py-4 px-4 text-black font-semibold text-sm">Nama Kecamatan</th> 
                <th className="text-left py-4 px-4 text-black font-semibold text-sm">Nama Desa</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Listrik</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Sanitasi</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Air</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Transportasi</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Digital</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Aksesibilitas</th>
                <th className="text-center py-4 px-4 text-black font-semibold text-sm">Label</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => (
                  <tr key={row.NAMA_DESA + idx} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-center text-black font-medium text-sm">{startIndex + idx + 1}</td>
                    <td className="py-4 px-4 text-black text-sm">{row.NAMA_KAB}</td>
                    <td className="py-4 px-4 text-black text-sm">{row.NAMA_KEC}</td>
                    <td className="py-4 px-4 text-black text-sm">{row.NAMA_DESA}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_listrik.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_sanitasi.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_air.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_transportasi.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_digital.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center text-black text-sm">{row.skor_aksesibilitas.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium ${
                        row.cluster === 0
                          ? "bg-green-900 text-green-200"
                          : row.cluster === 1
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-red-900 text-red-200"
                      }`}
                      >
                        {row.label_infrastruktur}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-6 px-4 text-center text-gray-500 text-sm">
                    Tidak ada data yang cocok dengan pencarian "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan {paginatedData.length > 0 ? startIndex + 1 : 0} hingga{" "}
            {Math.min(endIndex, tableData.length)} dari {tableData.length} data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
              onClick={() => setCurrentPage(Math.min(tableTotalPages, currentPage + 1))}
              disabled={currentPage === tableTotalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}