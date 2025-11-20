// siDesa/components/page/ekonomi.tsx
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
import { useChatbotContext } from '@/context/ChatbotContext';
import { supabase } from "@/lib/supabaseClient";

interface EkonomiData {
  NAMA_KAB: string
  NAMA_KEC: string
  NAMA_DESA: string
  total_kk: number
  total_penduduk: number
  sktm: number
  skor_kesejahteraan: number
  sektor_dominan: number
  grup_sektor: string
  sektor_pertanian: number
  sektor_perdagangan: number
  sektor_industri: number
  sektor_jasa: number
  sektor_lainnya: number
  ada_pades: number
  jumlah_bumdes: number
  skor_bumdes: number
  jumlah_koperasi: number
  skor_koperasi: number
  ada_produk_unggulan: number
  ada_industri : number
  total_industri: number
  skor_industri: number
  skor_akses_modal: number
  skor_infrastruktur_ekonomi: number
  skor_ekonomi_total: number
  kategori_ekonomi: string
  cluster: number
  label: string
  Latitude: number
  Longitude: number
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

export default function EkonomiPage() {
  const [data, setData] = useState<EkonomiData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedKab, setSelectedKab] = useState<string>("")
  const [selectedKec, setSelectedKec] = useState<string>("")
  const [selectedDesa, setSelectedDesa] = useState<string>("")
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [desaOptions, setDesaOptions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { setPageContext } = useChatbotContext();

  const safeToFixed = (value: number | null, decimals = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A"
    return Number(value).toFixed(decimals)
  }

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
        .from('cluster_ekonomi')
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

  const stats = useMemo(() => {
    if (!activeData.length) {
      return {
        totalDesa: 0,
        avgEkonomi: "0.0",
        avgKesejahteraan: "0.0",
        avgBUMDES: "0.0",
      }
    }
    const total = activeData.length
    const avgEkonomi = activeData.reduce((sum, d) => sum + d.skor_ekonomi_total, 0) / total
    const avgKesejahteraan = activeData.reduce((sum, d) => sum + d.skor_kesejahteraan, 0) / total
    const avgBUMDES = activeData.reduce((sum, d) => sum + d.jumlah_bumdes, 0) / total
    return {
      totalDesa: total,
      avgEkonomi: safeToFixed(avgEkonomi),
      avgKesejahteraan: safeToFixed(avgKesejahteraan),
      avgBUMDES: safeToFixed(avgBUMDES),
    }
  }, [activeData])

  const mapMarkers = useMemo(() => {
    if (!data.length) return [];

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
            grup_sektor: item.grup_sektor,
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
        grup_sektor: m.grup_sektor,
        skor_kesejahteraan: m.skor_kesejahteraan,
      }));
    }

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
                grup_sektor: item.grup_sektor,
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
        grup_sektor: m.grup_sektor,
        skor_kesejahteraan: m.skor_kesejahteraan,
      }));
    }

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
          grup_sektor: m.grup_sektor,
          skor_kesejahteraan: m.skor_kesejahteraan,
        }));
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
        grup_sektor: m.grup_sektor,
        skor_kesejahteraan: m.skor_kesejahteraan,
      }));
  }, [data, selectedKab, selectedKec, selectedDesa]);

  const chartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }
    if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_ekonomi_total.toFixed(1)) })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KEC)
          if (existing) {
            existing.totalSkor += item.skor_ekonomi_total
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KEC, totalSkor: item.skor_ekonomi_total, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kecamatan" }
    } else {
      const grouped = data
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KAB)
          if (existing) {
            existing.totalSkor += item.skor_ekonomi_total
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KAB, totalSkor: item.skor_ekonomi_total, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kabupaten" }
    }
  }, [data, selectedKab, selectedKec])

  const kesejahteraanChartData = useMemo(() => {
    if (!data.length) return { data: [], label: "Data" }
    if (selectedKab && selectedKec) {
      const desaData = data.filter(d => d.NAMA_KAB === selectedKab && d.NAMA_KEC === selectedKec)
      return {
        data: desaData.map(d => ({ name: d.NAMA_DESA, skor: Number(d.skor_kesejahteraan.toFixed(1)) })),
        label: "Desa"
      }
    } else if (selectedKab) {
      const grouped = data
        .filter(d => d.NAMA_KAB === selectedKab)
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KEC)
          if (existing) {
            existing.totalSkor += item.skor_kesejahteraan
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KEC, totalSkor: item.skor_kesejahteraan, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kecamatan" }
    } else {
      const grouped = data
        .reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.NAMA_KAB)
          if (existing) {
            existing.totalSkor += item.skor_kesejahteraan
            existing.count += 1
          } else {
            acc.push({ name: item.NAMA_KAB, totalSkor: item.skor_kesejahteraan, count: 1 })
          }
          return acc
        }, [] as Array<{ name: string; totalSkor: number; count: number }>)
        .map(item => ({ name: item.name, skor: Number((item.totalSkor / item.count).toFixed(1)) }))
      return { data: grouped, label: "Kabupaten" }
    }
  }, [data, selectedKab, selectedKec])

  const sectorChartData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof EkonomiData) => {
      const sum = activeData.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "Pertanian", avg: avg("sektor_pertanian") },
      { name: "Perdagangan", avg: avg("sektor_perdagangan") },
      { name: "Industri", avg: avg("sektor_industri") },
    ]
  }, [activeData])

  const komponenEkonomiData = useMemo(() => {
    if (!activeData.length) return []
    const avg = (key: keyof EkonomiData) => {
      const sum = activeData.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
      return Number((sum / activeData.length).toFixed(1))
    }
    return [
      { name: "BUMDES", avg: avg("skor_bumdes") },
      { name: "Koperasi", avg: avg("skor_koperasi") },
      { name: "Industri", avg: avg("skor_industri") },
      { name: "Akses Modal", avg: avg("skor_akses_modal") },
    ]
  }, [activeData])

  const sektorDominanDistribution = useMemo(() => {
    if (!activeData.length) return []
    const distribution = activeData.reduce((acc, item) => {
      const key = item.grup_sektor || "Tidak Diketahui";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
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

  const visibleDataSummary = useMemo(() => {
    if (!activeData.length) return null;

    const totalDesa = activeData.length;

    // --- Fungsi Pembantu ---
    const avg = (key: keyof EkonomiData) => {
      const valid = activeData.filter(d => d[key] != null && !isNaN(d[key] as number));
      if (valid.length === 0) return 0;
      const sum = valid.reduce((acc, d) => acc + (d[key] as number), 0);
      return Number((sum / valid.length).toFixed(1));
    };

    const countIf = (condition: (item: EkonomiData) => boolean) => {
      return activeData.filter(condition).length;
    };

    // --- Wilayah ---
    let wilayah = "Provinsi Jawa Timur";
    if (selectedKab && !selectedKec) wilayah = `Kabupaten ${selectedKab}`;
    else if (selectedKab && selectedKec) wilayah = `Kecamatan ${selectedKec}, Kabupaten ${selectedKab}`;

    // --- Rata-rata Skor Ekonomi ---
    const rata_rata_skor = {
      kesejahteraan: avg("skor_kesejahteraan"),
      bumdes: avg("skor_bumdes"),
      koperasi: avg("skor_koperasi"),
      industri: avg("skor_industri"),
      akses_modal: avg("skor_akses_modal"),
      infrastruktur_ekonomi: avg("skor_infrastruktur_ekonomi"),
      ekonomi_total: avg("skor_ekonomi_total"),
    };

    // --- Distribusi Kluster Ekonomi ---
    const distribusi_kluster = activeData.reduce((acc, d) => {
      acc[d.label] = (acc[d.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // --- Distribusi Sektor Dominan ---
    const distribusi_sektor = {
      pertanian: countIf(d => d.sektor_dominan === 1), // Asumsi kode 1 = pertanian
      perdagangan: countIf(d => d.sektor_dominan === 7), // Asumsi kode 7 = perdagangan
      industri: countIf(d => d.sektor_dominan === 3), // Asumsi kode 3 = industri
      // Tambahkan jika ada kode lain
    };

    // --- Distribusi Grup Sektor ---
    const distribusi_grup_sektor = activeData.reduce((acc, d) => {
      acc[d.grup_sektor] = (acc[d.grup_sektor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // --- Infrastruktur Pendukung Ekonomi ---
    const infrastruktur_pendukung = {
      ada_pades: countIf(d => d.ada_pades === 1),
      jumlah_bumdes: activeData.reduce((sum, d) => sum + d.jumlah_bumdes, 0),
      ada_produk_unggulan: countIf(d => d.ada_produk_unggulan === 1),
      total_industri: activeData.reduce((sum, d) => sum + d.total_industri, 0),
      ada_industri: countIf(d => d.ada_industri === 1),
    };

    // --- Desa Terbaik & Terburuk berdasarkan Skor Ekonomi Total ---
    let desaTerburuk: EkonomiData | null = null;
    let desaTerbaik: EkonomiData | null = null;
    let skorMin = Infinity;
    let skorMax = -Infinity;

    activeData.forEach(des => {
      const skor = des.skor_ekonomi_total;
      if (skor < skorMin) {
        skorMin = skor;
        desaTerburuk = des;
      }
      if (skor > skorMax) {
        skorMax = skor;
        desaTerbaik = des;
      }
    });

    // --- Ranking Kabupaten berdasarkan Rata-rata Skor Ekonomi Total (Contoh) ---
    const byKab = data.reduce((acc, d) => {
      const key = d.NAMA_KAB;
      if (!acc[key]) {
        acc[key] = { nama: key, total: 0, count: 0 };
      }
      acc[key].total += d.skor_ekonomi_total; // Gunakan data mentah untuk agregasi
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
      distribusi_sektor, // Tambahkan ini
      distribusi_grup_sektor, // Tambahkan ini
      infrastruktur_pendukung, // Tambahkan ini
      desa_dengan_ekonomi_terburuk: desaTerburuk ? {
        nama_desa: (desaTerburuk as EkonomiData).NAMA_DESA,
        nama_kecamatan: (desaTerburuk as EkonomiData).NAMA_KEC,
        nama_kabupaten: (desaTerburuk as EkonomiData).NAMA_KAB,
        skor_kesejahteraan: (desaTerburuk as EkonomiData).skor_kesejahteraan,
        skor_bumdes: (desaTerburuk as EkonomiData).skor_bumdes,
        skor_koperasi: (desaTerburuk as EkonomiData).skor_koperasi,
        skor_industri: (desaTerburuk as EkonomiData).skor_industri,
        skor_akses_modal: (desaTerburuk as EkonomiData).skor_akses_modal,
        skor_infrastruktur_ekonomi: (desaTerburuk as EkonomiData).skor_infrastruktur_ekonomi,
        skor_ekonomi_total: (desaTerburuk as EkonomiData).skor_ekonomi_total,
        label_kluster: (desaTerburuk as EkonomiData).kategori_ekonomi, // atau gunakan 'label' jika lebih spesifik
        sektor_dominan: (desaTerburuk as EkonomiData).sektor_dominan,
        grup_sektor: (desaTerburuk as EkonomiData).grup_sektor,
      } : null,
      desa_dengan_ekonomi_terbaik: desaTerbaik ? {
        nama_desa: (desaTerbaik as EkonomiData).NAMA_DESA,
        nama_kecamatan: (desaTerbaik as EkonomiData).NAMA_KEC,
        nama_kabupaten: (desaTerbaik as EkonomiData).NAMA_KAB,
        skor_kesejahteraan: (desaTerbaik as EkonomiData).skor_kesejahteraan,
        skor_bumdes: (desaTerbaik as EkonomiData).skor_bumdes,
        skor_koperasi: (desaTerbaik as EkonomiData).skor_koperasi,
        skor_industri: (desaTerbaik as EkonomiData).skor_industri,
        skor_akses_modal: (desaTerbaik as EkonomiData).skor_akses_modal,
        skor_infrastruktur_ekonomi: (desaTerbaik as EkonomiData).skor_infrastruktur_ekonomi,
        skor_ekonomi_total: (desaTerbaik as EkonomiData).skor_ekonomi_total,
        label_kluster: (desaTerbaik as EkonomiData).kategori_ekonomi, // atau gunakan 'label' jika lebih spesifik
        sektor_dominan: (desaTerbaik as EkonomiData).sektor_dominan,
        grup_sektor: (desaTerbaik as EkonomiData).grup_sektor,
      } : null,
      top5Terbaik,
      top5Terburuk,
      globalInsights: null, // Bisa diisi jika perlu
    };
  }, [activeData, data, selectedKab, selectedKec]);

  useEffect(() => {
    if (visibleDataSummary) {
      setPageContext({
        pageId: "ekonomi",
        pageTitle: "Analisis Ekonomi",
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
      pageId: "ekonomi",
      pageTitle: "Analisis Ekonomi",
      filters: {},
      visibleDataSummary: { wilayah: "Provinsi Jawa Timur" },
    });
    return () => {
      setPageContext({
        pageId: "overview",
        pageTitle: "Overview",
        filters: {},
        visibleDataSummary: null,
      });
    };
  }, [setPageContext]);

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
      {/* STICKY HEADER */}
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
                Dashboard Ekonomi Desa
              </h1>
              <p className="text-xs sm:text-sm mt-1 font-semibold" style={{ 
                color: "#ffffff",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.6)"
              }}>
                Data kluster ekonomi dan usaha per desa
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Desa", value: stats.totalDesa, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.9) 100%)", shadow: "0 8px 32px rgba(16, 185, 129, 0.5)" },
            { label: "Rata-rata Skor Ekonomi", value: stats.avgEkonomi, gradient: "linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(45, 212, 191, 0.9) 100%)", shadow: "0 8px 32px rgba(20, 184, 166, 0.5)" },
            { label: "Rata-rata Kesejahteraan", value: stats.avgKesejahteraan, gradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(125, 211, 252, 0.9) 100%)", shadow: "0 8px 32px rgba(34, 211, 238, 0.5)" },
            { label: "Rata-rata BUMDES", value: stats.avgBUMDES, gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.9) 100%)", shadow: "0 8px 32px rgba(6, 182, 212, 0.5)" },
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

        {/* Map */}
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
                        <span className="text-[12px]">🏛️</span>
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

                  {(marker.grup_sektor !== undefined || marker.skor_kesejahteraan !== undefined) && (
                    <div className="mt-2 pt-2 space-y-1" style={{
                      borderTop: "1px solid rgba(34, 211, 238, 0.4)"
                    }}>
                      {marker.grup_sektor !== undefined && (
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#ffffff", textShadow: "0 0 8px rgba(255, 255, 255, 0.5)" }}>Sektor Ekonomi:</span>
                          <span style={{ 
                            color: "#22d3ee",
                            textShadow: "0 0 12px rgba(34, 211, 238, 0.9)"
                          }}>{marker.grup_sektor}</span>
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

        {/* Charts */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  Skor Ekonomi per {chartData.label}
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
                    <Bar dataKey="skor" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
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
                  Skor Kesejahteraan per {kesejahteraanChartData.label}
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={kesejahteraanChartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="skor" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  Sektor Ekonomi (Rata-rata)
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart layout="vertical" data={sectorChartData} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.3)" />
                    <XAxis type="number" stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
                    <YAxis dataKey="name" type="category" stroke="#ffffff" fontSize={12} style={{ fontWeight: 'bold' }} />
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
                    <Bar dataKey="avg" fill="#7dd3fc" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
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
                  Skor Komponen Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={komponenEkonomiData} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
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
                    <Bar dataKey="avg" fill="#7dd3fc" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  Distribusi Sektor Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:20}}>
                    <Pie
                      data={sektorDominanDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {sektorDominanDistribution.map((entry, index) => (
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
                  Distribusi Kluster Ekonomi
                </h2>
              </div>
              <div className="p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{bottom:20}}>
                    <Pie
                      data={clusterDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
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
          </div>
        </div>
      </div>
    </div>
  )
}