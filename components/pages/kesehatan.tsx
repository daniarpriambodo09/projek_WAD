// siDesa/components/pages/kesehatan.tsx
"use client"
import { useEffect, useState, useMemo, useCallback } from "react"
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
  ada_puskesmas : number
  ada_pustu : number
  ada_posyandu : number
  ada_dokter : number
  ada_bidan : number
  total_klb : number
  gizi_buruk : number
  gizi_buruk_per_1000 : number
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
const ITEMS_PER_PAGE = 10
export default function KesehatanPage() {
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

  // --- Fungsi Pembantu: Hitung Statistik untuk Satu Kluster ---
  const getStatsForCluster = useCallback((clusterLabel: string) => {
    // Filter desa berdasarkan cluster label
    const filteredDesa = kecamatanData.filter(d => d.label === clusterLabel);
    
    if (filteredDesa.length === 0) {
      return null;
    }

    // Hitung rata-rata skor untuk desa dalam kluster ini
    const avg = (key: keyof HealthData) => {
      const sum = filteredDesa.reduce((total, d) => total + (d[key] as number), 0);
      return Number((sum / filteredDesa.length).toFixed(1));
    };

    return {
      count: filteredDesa.length,
      rata_rata_skor: {
        fasilitas: avg("skor_fasilitas"),
        tenaga_kesehatan: avg("skor_tenaga_kesehatan"),
        gizi: avg("skor_gizi"),
        klb: avg("skor_klb"),
        program_prioritas: avg("skor_program_prioritas"),
        kesejahteraan: avg("skor_kesejahteraan"),
        kesehatan_total: avg("skor_kesehatan_total"),
      },
      infrastruktur_pendukung: {
        ada_puskesmas: filteredDesa.filter(d => d.ada_puskesmas === 1).length,
        ada_posyandu: filteredDesa.filter(d => d.ada_posyandu === 1).length,
        dokter_per_1000: Number(
          (filteredDesa.reduce((sum, d) => sum + d.dokter_per_1000, 0) / filteredDesa.length).toFixed(1)
        ),
        bidan_per_1000: Number(
          (filteredDesa.reduce((sum, d) => sum + d.bidan_per_1000, 0) / filteredDesa.length).toFixed(1)
        ),
      }
    };
  }, [kecamatanData]);

  const visibleDataSummary = useMemo(() => {
    if (!data.length || !kecamatanData.length) return null;

    const totalDesa = kecamatanData.length;

    // --- Fungsi Pembantu ---
    const avg = (key: keyof HealthData) => {
      const valid = kecamatanData.filter(d => d[key] != null && !isNaN(d[key] as number));
      if (valid.length === 0) return "N/A";
      const sum = valid.reduce((acc, d) => acc + (d[key] as number), 0);
      return Number((sum / valid.length).toFixed(1));
    };

    const countIf = (condition: (item: HealthData) => boolean) => {
      return kecamatanData.filter(condition).length;
    };

    // --- Wilayah ---
    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // --- Rata-rata Skor Kesehatan ---
    const rata_rata_skor = {
      fasilitas: avg("skor_fasilitas"),
      tenaga_kesehatan: avg("skor_tenaga_kesehatan"),
      gizi: avg("skor_gizi"),
      klb: avg("skor_klb"),
      program_prioritas: avg("skor_program_prioritas"),
      kesejahteraan: avg("skor_kesejahteraan"),
      kesehatan_total: avg("skor_kesehatan_total"),
    };

    // --- Distribusi Kluster Kesehatan ---
    const distribusi_kluster = kecamatanData.reduce((acc, d) => {
      acc[d.label] = (acc[d.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // --- Infrastruktur Pendukung Kesehatan ---
    const infrastruktur_pendukung = {
      ada_puskesmas: countIf(d => d.ada_puskesmas === 1),
      ada_pustu: countIf(d => d.ada_pustu === 1),
      ada_posyandu: countIf(d => d.ada_posyandu === 1),
      ada_dokter: countIf(d => d.ada_dokter === 1),
      ada_bidan: countIf(d => d.ada_bidan === 1),
      puskesmas_per_1000: Number(avg("puskesmas_per_1000")),
      posyandu_per_1000: Number(avg("posyandu_per_1000")),
      dokter_per_1000: Number(avg("dokter_per_1000")),
      bidan_per_1000: Number(avg("bidan_per_1000")),
    };

    // --- Indikator Gizi Buruk & KLB ---
    const indikator_kritis = {
      jumlah_desa_gizi_buruk: countIf(d => d.gizi_buruk > 0),
      total_gizi_buruk: kecamatanData.reduce((sum, d) => sum + d.gizi_buruk, 0),
      rasio_gizi_buruk_per_1000: Number((kecamatanData.reduce((sum, d) => sum + d.gizi_buruk_per_1000, 0) / totalDesa).toFixed(2)),
      jumlah_desa_klb: countIf(d => d.total_klb > 0),
      total_klb: kecamatanData.reduce((sum, d) => sum + d.total_klb, 0),
    };

    // --- Desa Terbaik & Terburuk ---
    let desaTerburuk: HealthData | null = null;
    let desaTerbaik: HealthData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    kecamatanData.forEach(des => {
      const skor = des.skor_kesehatan_total;
      if (skor < skorMin) {
        skorMin = skor;
        desaTerburuk = des;
      }
      if (skor > skorMax) {
        skorMax = skor;
        desaTerbaik = des;
      }
    });

    // --- Ranking Kabupaten berdasarkan Rata-rata Skor Kesehatan Total ---
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = { nama: key, total: 0, count: 0 };
      }
      acc[key].total += d.skor_kesehatan_total;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { nama: string; total: number; count: number }>);

    const listKab = Object.values(byKab).map(k => ({
      nama: k.nama,
      skor: Number((k.total / k.count).toFixed(1)),
    }));
    const sortedKab = [...listKab].sort((a, b) => b.skor - a.skor);
    const top5Terbaik = sortedKab.slice(0, 5);
    const top5Terburuk = sortedKab.slice(-5).reverse();

    return {
      wilayah,
      jumlah_desa: totalDesa,
      rata_rata_skor,
      distribusi_kluster,
      infrastruktur_pendukung,
      indikator_kritis,
      desa_dengan_kesehatan_terburuk: desaTerburuk ? {
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
        gizi_buruk: (desaTerburuk as HealthData).gizi_buruk,
        total_klb: (desaTerburuk as HealthData).total_klb,
        dokter_per_1000: (desaTerburuk as HealthData).dokter_per_1000,
        bidan_per_1000: (desaTerburuk as HealthData).bidan_per_1000,
      } : null,
      desa_dengan_kesehatan_terbaik: desaTerbaik ? {
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
        gizi_buruk: (desaTerbaik as HealthData).gizi_buruk,
        total_klb: (desaTerbaik as HealthData).total_klb,
        dokter_per_1000: (desaTerbaik as HealthData).dokter_per_1000,
        bidan_per_1000: (desaTerbaik as HealthData).bidan_per_1000,
      } : null,
      top5_terbaik: top5Terbaik,
      top5_terburuk: top5Terburuk,
      globalInsights: null,

      cluster_stats: {
        miskin_ekstrem: getStatsForCluster("Desa Miskin Ekstrem"),
        subsisten: getStatsForCluster("Desa Subsisten Pertanian"),
        tenaga_kesehatan: getStatsForCluster("Desa Tenaga Kesehatan"),
        mandiri: getStatsForCluster("Desa Mandiri Program"),
        // Tambahkan jika ada label lain
      }
    };
    }, [kecamatanData, selectedKab, selectedKec, data, kabupatenTerburuk, kabupatenTerbaik, top5Kesehatan]);
  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "kesehatan",
        pageTitle: "Dashboard Kesehatan Desa",
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
            skor_gizi: item.skor_gizi,
            skor_kesejahteraan: item.skor_kesejahteraan,
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
        skor_gizi: m.skor_gizi,
        skor_kesejahteraan: m.skor_kesejahteraan,
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
                skor_gizi: item.skor_gizi,
                skor_kesejahteraan: item.skor_kesejahteraan,
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
        skor_gizi: m.skor_gizi,
        skor_kesejahteraan: m.skor_kesejahteraan,
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
          skor_gizi: m.skor_gizi,
          skor_kesejahteraan: m.skor_kesejahteraan,
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
        skor_gizi: m.skor_gizi,
        skor_kesejahteraan: m.skor_kesejahteraan,
      }));
  }, [data, selectedKab, selectedKec, selectedDesa]);
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
                Dashboard Kesehatan Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1 font-semibold" style={{ 
                color: "#ffffff",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.6)"
              }}>
                Analisis clustering kesehatan masyarakat per desa
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
          {/* Filter Panel - Collapsible on Mobile */}
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
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.9) 100%)", shadow: "0 8px 32px rgba(16, 185, 129, 0.5)" },
            { label: "Rata-rata Skor Fasilitas", value: stats.avgFasilitas, gradient: "linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(45, 212, 191, 0.9) 100%)", shadow: "0 8px 32px rgba(20, 184, 166, 0.5)" },
            { label: "Rata-rata Skor Tenaga", value: stats.avgTenaga, gradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(125, 211, 252, 0.9) 100%)", shadow: "0 8px 32px rgba(34, 211, 238, 0.5)" },
            { label: "Rata-rata Skor Kesehatan", value: stats.avgKesehatan, gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.9) 100%)", shadow: "0 8px 32px rgba(6, 182, 212, 0.5)" },
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
        {/* Map Section */}
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
              Sebaran Kesehatan Desa
              <span className="ml-2 text-sm font-normal" style={{ color: "#a8dcc8" }}> ({mapMarkers.length} lokasi)</span>
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
                  {/* Nama Utama */}
                  <div className="font-black text-lg tracking-tight" style={{
                    color: "#ffffff",
                    textShadow: "0 0 15px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.8)"
                  }}>
                    {marker.name}
                  </div>
                  {/* Informasi Lokasi */}
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
                  {/* Badge Label (seperti contoh visual) */}
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
                  {/* Skor Tambahan */}
                  {(marker.skor_gizi !== undefined || marker.skor_kesejahteraan !== undefined) && (
                    <div className="mt-2 pt-2 space-y-1" style={{
                      borderTop: "1px solid rgba(34, 211, 238, 0.4)"
                    }}>
                      {marker.skor_gizi !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Gizi:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_gizi).toFixed(1)}</span>
                        </div>
                      )}
                      {marker.skor_kesejahteraan !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Kesejahteraan:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{Number(marker.skor_kesejahteraan).toFixed(1)}</span>
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
            {/* Chart 1 - Distribusi Cluster */}
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
                  Distribusi Kluster Kesehatan
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
            {/* Chart 2 - Skor Fasilitas */}
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
                  Rata-rata Skor Fasilitas per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <YAxis stroke="#ffffff" fontSize={10} style={{ fontWeight: 'bold' }} />
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
                    <Bar dataKey="fasilitas" fill="#10b981" name="Skor Fasilitas" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 3 - Skor Tenaga */}
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
                  Rata-rata Skor Tenaga Kesehatan per {chartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }} />
                    <Line 
                      type="monotone" 
                      dataKey="tenaga" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      name="Skor Tenaga"
                      dot={{ r: 4, fill: "#22d3ee", strokeWidth: 2, stroke: "#ffffff" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4 - Komponen Kesehatan */}
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
                  Rata-rata Skor Komponen Kesehatan
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skorComponentChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="avg" fill="#7dd3fc" name="Skor Rata-rata" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 5 - Fasilitas per 1000 */}
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
                  Fasilitas Kesehatan per 1000 Penduduk
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={infraChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="avg" fill="#10b981" name="Per 1000 Penduduk" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 6 - Tenaga per 1000 */}
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
                  Tenaga Kesehatan per 1000 Penduduk
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={workforceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="avg" fill="#10b981" name="Per 1000 Penduduk" radius={[6, 6, 0, 0]} />
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