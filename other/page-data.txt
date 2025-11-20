// data-mentah.tsx
"use client"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
// --- Interfaces untuk data dari Supabase ---
interface BaseClusterData {
  id?: string;
  NAMA_KAB: string;
  NAMA_KEC: string;
  NAMA_DESA: string;
  cluster: number;
  label: string;
  [key: string]: any; // Untuk menangani kolom dinamis lainnya
}
interface EducationData extends BaseClusterData {
  skor_paud?: number;
  skor_sd?: number;
  skor_smp?: number;
  skor_sma?: number;
  skor_literasi?: number;
  skor_pendidikan_total?: number;
  kategori_pendidikan?: string;
}
interface TipologiData extends BaseClusterData {
  skor_akses_dasar?: number;
  skor_konektivitas?: number;
  skor_pengelolaan_lingkungan?: number;
  skor_kesejahteraan?: number;
  skor_kelembagaan_ekonomi?: number;
  skor_produktivitas_ekonomi?: number;
  skor_akses_kesehatan?: number;
  skor_kualitas_kesehatan?: number;
  skor_program_kesehatan?: number;
  skor_pendidikan_lanjut?: number;
  skor_literasi_masyarakat?: number;
  skor_kualitas_lingkungan?: number;
  skor_ketahanan_bencana?: number;
  skor_digital_readiness?: number;
  skor_status_wilayah?: number;
  skor_karakteristik_khusus?: number;
  sektor_pertanian?: number;
  sektor_industri?: number;
  sektor_jasa?: number;
  status_perkotaan?: number;
  ada_pades?: number;
  ada_bumdes?: number;
  ada_sid?: number;
  kelengkapan_pendidikan?: number;
  ada_vokasi?: number;
  ada_mitigasi_bencana?: number;
  kelengkapan_kesehatan?: number;
  kelengkapan_ekonomi?: number;
  total_penduduk?: number;
  total_kk?: number;
  cluster_label?: string;
  cluster_label_detail?: string;
  final_label?: string;
}
interface InfrastrukturData extends BaseClusterData {
  skor_listrik?: number;
  skor_sanitasi?: number;
  skor_air?: number;
  skor_transportasi?: number;
  skor_digital?: number;
  skor_aksesibilitas?: number;
  label_infrastruktur?: string; // Kolom label khusus untuk infrastruktur
}
interface EkonomiData extends BaseClusterData {
  total_kk: number;
  total_penduduk: number;
  sktm: number;
  skor_kesejahteraan: number;
  sektor_dominan: number;
  grup_sektor: string;
  sektor_pertanian: number;
  sektor_perdagangan: number;
  sektor_industri: number;
  sektor_jasa: number;
  sektor_lainnya: number;
  ada_pades: number;
  jumlah_bumdes: number;
  skor_bumdes: number;
  jumlah_koperasi: number;
  skor_koperasi: number;
  ada_produk_unggulan: number;
  total_industri: number;
  skor_industri: number;
  skor_akses_modal: number;
  skor_infrastruktur_ekonomi: number;
  skor_ekonomi_total: number;
  kategori_ekonomi: string;
  // Label sudah ada di BaseClusterData
}
// --- Interface untuk data kesehatan ---
interface HealthData extends BaseClusterData {
  total_penduduk: number;
  skor_fasilitas: number;
  skor_tenaga_kesehatan: number;
  skor_gizi: number;
  skor_klb: number;
  skor_program_prioritas: number;
  skor_kesejahteraan: number;
  skor_kesehatan_total: number;
  // Label dan cluster sudah ada di BaseClusterData
  puskesmas_per_1000: number;
  posyandu_per_1000: number;
  dokter_per_1000: number;
  bidan_per_1000: number;
  Longitude: number;
  Latitude: number;
}
// --- Interface untuk data digital ---
interface DigitalData extends BaseClusterData {
  jumlah_bts: number;
  jumlah_operator: number;
  sinyal_telepon: number;
  sinyal_internet: number;
  ada_warnet: number;
  komputer_desa: number;
  internet_kantordesa: number;
  sid: number;
  skor_digitalisasi_pemdes: number;
  skor_digital_readiness: number;
  // Label dan cluster sudah ada di BaseClusterData
}
// --- Interface untuk data lingkungan ---
interface LingkunganData extends BaseClusterData {
  IDDESA: string;
  skor_pengelolaan_sampah: number;
  total_pencemaran: number;
  skor_kualitas_lingkungan: number;
  total_bencana: number;
  tingkat_kerawanan: number;
  skor_ketahanan_bencana: number;
  skor_mitigasi_bencana: number;
  skor_pelestarian: number;
  skor_lingkungan_total: number;
  kategori_lingkungan: string;
  // Label dan cluster sudah ada di BaseClusterData
  Latitude: number;
  Longitude: number;
}

export default function DataMentah() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const clusterFilterList = [
    "Infrastruktur",
    "Digital",
    "Pendidikan",    // Kategori ini akan menampilkan data pendidikan
    "Kesehatan",     // Kategori ini akan menampilkan data kesehatan
    "Ekonomi",       // Kategori ini akan menampilkan data ekonomi
    "Lingkungan",    // Kategori ini akan menampilkan data lingkungan
    "Tipologi",      // Kategori ini akan menampilkan data tipologi
  ];
  const [selectedCluster, setSelectedCluster] = useState<string>("Tipologi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState<BaseClusterData[]>([]);
  // Mapping nama tabel Supabase
  const TABLE_NAMES: Record<string, string> = {
    Pendidikan: 'cluster_pendidikan',
    Tipologi: 'cluster_tipologi',
    Infrastruktur: 'cluster_infrastruktur', // Tambahkan mapping tabel infrastruktur
    Ekonomi: 'cluster_ekonomi', // Tambahkan mapping tabel ekonomi
    Kesehatan: 'cluster_kesehatan', // Tambahkan mapping tabel kesehatan
    Digital: 'cluster_digital', // Tambahkan mapping tabel digital
    Lingkungan: 'cluster_lingkungan', // Tambahkan mapping tabel lingkungan
    // Tambahkan mapping untuk tabel lainnya jika diperlukan
  };
  // Ambil data dari Supabase saat komponen dimuat atau selectedCluster berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tableName = TABLE_NAMES[selectedCluster];
        if (!tableName) {
          throw new Error(`Tabel untuk klaster ${selectedCluster} tidak ditemukan.`);
        }
        // Ambil SEMUA data dari Supabase
        let allData: any[] = [];
        const limit = 1000;
        let offset = 0;
        while (true) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*') // Ambil semua kolom
            .range(offset, offset + limit - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData.push(...data);
          if (data.length < limit) break;
          offset += limit;
        }
        // Simpan data mentah ke state, casting ke BaseClusterData
        setAllData(allData as BaseClusterData[]);
      } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err);
        setError(`Gagal memuat ${(err as Error).message}`);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCluster]);

  // --- Gunakan useMemo untuk efisiensi ---
  const filteredData = useMemo(() => {
    if (!allData.length) return [];
    return allData.filter((row) =>
      row.NAMA_DESA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.NAMA_KEC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.NAMA_KAB.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allData, searchTerm]);

  // --- Pagination ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- Fungsi untuk membuat kolom header berdasarkan klaster (untuk tabel UI) ---
  const getTableHeaders = () => {
    if (selectedCluster === "Pendidikan") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "PAUD", "SD", "SMP", "SMA", "Literasi", "Total Skor", "Kategori"];
    } else if (selectedCluster === "Tipologi") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Akses Dasar", "Konektivitas", "Pengelolaan Lingkungan", "Kesejahteraan", "Klaster", "Label"];
    } else if (selectedCluster === "Infrastruktur") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Listrik", "Sanitasi", "Air", "Transportasi", "Digital", "Aksesibilitas", "Label"];
    } else if (selectedCluster === "Ekonomi") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Total KK", "Kesejahteraan", "BUMDES", "Koperasi", "Industri", "Total Skor", "Label"];
    } else if (selectedCluster === "Kesehatan") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Fasilitas", "Tenaga", "Gizi", "KLB", "Program", "Total Skor", "Label"];
    } else if (selectedCluster === "Digital") {
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Jumlah BTS", "Jumlah Operator", "Sinyal Telepon", "Sinyal Internet", "Warnet", "Komputer Desa", "Internet Kantor", "Label"];
    } else if (selectedCluster === "Lingkungan") {
      return ["No", "Kab/Kota", "Kecamatan", "Desa", "Skor Lingkungan", "Kualitas Lingkungan", "Pengelolaan Sampah", "Ketahanan Bencana", "Kategori", "Label"];
    } else {
      // Kolom umum untuk klaster lainnya
      return ["No", "Kabupaten", "Kecamatan", "Desa", "Klaster", "Label"];
    }
  };

  // --- Fungsi untuk membuat baris data berdasarkan klaster (untuk tabel UI) ---
  const renderTableRows = () => {
    return paginatedData.map((row, idx) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + idx;
      if (selectedCluster === "Pendidikan") {
        const typedRow = row as EducationData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-black">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-black">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-black">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-black">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-black">{typedRow.skor_paud?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-black">{typedRow.skor_sd?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-black">{typedRow.skor_smp?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-black">{typedRow.skor_sma?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-black">{typedRow.skor_literasi?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-black font-semibold">{typedRow.skor_pendidikan_total?.toFixed(2) || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {typedRow.kategori_pendidikan || row.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Tipologi") {
        const typedRow = row as TipologiData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_akses_dasar?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_konektivitas?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_pengelolaan_lingkungan?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_kesejahteraan?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#7FEFE8]">{row.cluster}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {typedRow.final_label || row.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Infrastruktur") {
        const typedRow = row as InfrastrukturData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_listrik?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_sanitasi?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_air?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_transportasi?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_digital?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_aksesibilitas?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {typedRow.label_infrastruktur || row.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Ekonomi") {
        const typedRow = row as EkonomiData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.total_kk}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_kesejahteraan?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_bumdes?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_koperasi?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_industri?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF] font-semibold">{typedRow.skor_ekonomi_total?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {typedRow.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Kesehatan") {
        const typedRow = row as HealthData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_fasilitas?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_tenaga_kesehatan?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_gizi?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_klb?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_program_prioritas?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF] font-semibold">{typedRow.skor_kesehatan_total?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-blue-900 text-blue-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : row.cluster === 2
                        ? "bg-[#016B61] text-green-200"
                        : row.cluster === 3
                          ? "bg-[#473472] text-purple-200"
                          : row.cluster === 4
                            ? "bg-grey-900 text-grey-200"
                            : "bg-red-900 text-red-200"
                }`}
              >
                {row.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Digital") {
        const typedRow = row as DigitalData;
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.jumlah_bts}</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.jumlah_operator}</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.sinyal_telepon}%</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.sinyal_internet}%</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.ada_warnet}</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.komputer_desa}</td>
            <td className="py-3 px-4 text-[#E6F2EF] text-center">{typedRow.internet_kantordesa}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {row.label}
              </span>
            </td>
          </tr>
        );
      } else if (selectedCluster === "Lingkungan") {
        const typedRow = row as LingkunganData;
        return (
          <tr key={`${typedRow.IDDESA || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_lingkungan_total?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_kualitas_lingkungan?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_pengelolaan_sampah?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.skor_ketahanan_bencana?.toFixed(1) || '-'}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{typedRow.kategori_lingkungan || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {row.label}
              </span>
            </td>
          </tr>
        );
      } else {
        // Format umum untuk klaster lain
        return (
          <tr key={`${row.id || globalIndex}`} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-[#E6F2EF]">{globalIndex + 1}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KAB}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_KEC}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.NAMA_DESA}</td>
            <td className="py-3 px-4 text-[#E6F2EF]">{row.cluster}</td>
            <td className="py-3 px-4">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  row.cluster === 0
                    ? "bg-green-900 text-green-200"
                    : row.cluster === 1
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                }`}
              >
                {row.label}
              </span>
            </td>
          </tr>
        );
      }
    });
  };

  // --- Fungsi untuk render data mobile (untuk UI) ---
  const renderMobileRows = () => {
    return paginatedData.map((row, idx) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + idx;
      if (selectedCluster === "Pendidikan") {
        const typedRow = row as EducationData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {typedRow.kategori_pendidikan || row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>PAUD: {typedRow.skor_paud?.toFixed(1) || '-'}</div>
              <div>SD: {typedRow.skor_sd?.toFixed(1) || '-'}</div>
              <div>SMP: {typedRow.skor_smp?.toFixed(1) || '-'}</div>
              <div>SMA: {typedRow.skor_sma?.toFixed(1) || '-'}</div>
              <div>Literasi: {typedRow.skor_literasi?.toFixed(1) || '-'}</div>
              <div>Total Skor: {typedRow.skor_pendidikan_total?.toFixed(2) || '-'}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Tipologi") {
        const typedRow = row as TipologiData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {typedRow.final_label || row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Akses Dasar: {typedRow.skor_akses_dasar?.toFixed(1) || '-'}</div>
              <div>Konektivitas: {typedRow.skor_konektivitas?.toFixed(1) || '-'}</div>
              <div>Pengelolaan Lingkungan: {typedRow.skor_pengelolaan_lingkungan?.toFixed(1) || '-'}</div>
              <div>Kesejahteraan: {typedRow.skor_kesejahteraan?.toFixed(1) || '-'}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Infrastruktur") {
        const typedRow = row as InfrastrukturData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {typedRow.label_infrastruktur || row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Listrik: {typedRow.skor_listrik?.toFixed(1) || '-'}</div>
              <div>Sanitasi: {typedRow.skor_sanitasi?.toFixed(1) || '-'}</div>
              <div>Air: {typedRow.skor_air?.toFixed(1) || '-'}</div>
              <div>Transportasi: {typedRow.skor_transportasi?.toFixed(1) || '-'}</div>
              <div>Digital: {typedRow.skor_digital?.toFixed(1) || '-'}</div>
              <div>Aksesibilitas: {typedRow.skor_aksesibilitas?.toFixed(1) || '-'}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Ekonomi") {
        const typedRow = row as EkonomiData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {typedRow.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Total KK: {typedRow.total_kk}</div>
              <div>Kesejahteraan: {typedRow.skor_kesejahteraan?.toFixed(1) || '-'}</div>
              <div>BUMDES: {typedRow.skor_bumdes?.toFixed(1) || '-'}</div>
              <div>Koperasi: {typedRow.skor_koperasi?.toFixed(1) || '-'}</div>
              <div>Industri: {typedRow.skor_industri?.toFixed(1) || '-'}</div>
              <div>Total Skor: {typedRow.skor_ekonomi_total?.toFixed(1) || '-'}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Kesehatan") {
        const typedRow = row as HealthData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-blue-900 text-blue-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : row.cluster === 2
                      ? "bg-[#016B61] text-green-200"
                      : row.cluster === 3
                        ? "bg-[#473472] text-purple-200"
                        : row.cluster === 4
                          ? "bg-grey-900 text-grey-200"
                          : "bg-red-900 text-red-200"
              }`}
              >
                {row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Fasilitas: {typedRow.skor_fasilitas?.toFixed(1) || '-'}</div>
              <div>Tenaga: {typedRow.skor_tenaga_kesehatan?.toFixed(1) || '-'}</div>
              <div>Gizi: {typedRow.skor_gizi?.toFixed(1) || '-'}</div>
              <div>KLB: {typedRow.skor_klb?.toFixed(1) || '-'}</div>
              <div>Program: {typedRow.skor_program_prioritas?.toFixed(1) || '-'}</div>
              <div>Total Skor: {typedRow.skor_kesehatan_total?.toFixed(1) || '-'}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Digital") {
        const typedRow = row as DigitalData;
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Jumlah BTS: {typedRow.jumlah_bts}</div>
              <div>Jumlah Operator: {typedRow.jumlah_operator}</div>
              <div>Sinyal Telepon: {typedRow.sinyal_telepon}%</div>
              <div>Sinyal Internet: {typedRow.sinyal_internet}%</div>
              <div>Warnet: {typedRow.ada_warnet}</div>
              <div>Komputer Desa: {typedRow.komputer_desa}</div>
              <div>Internet Kantor: {typedRow.internet_kantordesa}</div>
            </div>
          </div>
        );
      } else if (selectedCluster === "Lingkungan") {
        const typedRow = row as LingkunganData;
        return (
          <div key={`${typedRow.IDDESA || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Skor Lingkungan: {typedRow.skor_lingkungan_total?.toFixed(1) || '-'}</div>
              <div>Kualitas Lingkungan: {typedRow.skor_kualitas_lingkungan?.toFixed(1) || '-'}</div>
              <div>Pengelolaan Sampah: {typedRow.skor_pengelolaan_sampah?.toFixed(1) || '-'}</div>
              <div>Ketahanan Bencana: {typedRow.skor_ketahanan_bencana?.toFixed(1) || '-'}</div>
              <div>Kategori: {typedRow.kategori_lingkungan || '-'}</div>
            </div>
          </div>
        );
      } else {
        return (
          <div key={`${row.id || globalIndex}`} className="border-b border-[#e0e0e0] pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-black font-medium">{row.NAMA_DESA}</p>
                <p className="text-gray-600 text-sm">{row.NAMA_KEC}, {row.NAMA_KAB}</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                row.cluster === 0
                  ? "bg-green-900 text-green-200"
                  : row.cluster === 1
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-red-900 text-red-200"
              }`}
              >
                {row.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>Klaster: {row.cluster}</div>
            </div>
          </div>
        );
      }
    });
  };

  // --- Fungsi untuk mengunduh SELURUH DATA dari Supabase sebagai CSV ---
  const downloadCSV = () => {
    if (!allData.length) {
      console.warn("Tidak ada data untuk diunduh.");
      return;
    }
    // Ambil semua field names dari objek pertama
    // Ini akan mencakup semua kolom dari tabel Supabase
    const headers = Object.keys(allData[0]).filter(key => key !== '__obfuscated_id'); // Hilangkan field internal jika ada
    // Buat baris CSV dari data
    const rows = allData.map(row => {
      // Ambil nilai untuk setiap header
      return headers.map(header => {
        let value = row[header];
        // Tangani nilai null/undefined agar tidak muncul sebagai "null" atau "undefined"
        if (value === null || value === undefined) {
            value = '';
        }
        // Tangani nilai string yang mungkin mengandung koma atau kutipan
        if (typeof value === 'string') {
          // Jika string mengandung koma atau kutipan, bungkus dengan kutipan dan escape kutipan
          if (value.includes(',') || value.includes('"') || value.includes('')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
        }
        return value;
      });
    });
    // Gabungkan header dan rows menjadi string CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("");
    // Buat blob dan URL untuk download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    // Nama file berdasarkan klaster yang dipilih
    link.setAttribute('download', `data-raw-${selectedCluster.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6">Memuat data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Mentah</h1>
          <p className="text-muted-foreground">Data mentah siDesa sebelum diproses</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground">Filter Clustering</label>
              <div className="flex gap-2">
                <select
                  value={selectedCluster}
                  onChange={(e) => {
                    setSelectedCluster(e.target.value);
                    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
                  }}
                  className="px-3 py-2 bg-white border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {clusterFilterList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <button
                  onClick={downloadCSV}
                  className="px-3 py-2 bg-green-600 text-white border border-green-700 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Download Raw CSV
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Search */}
      <div
        className="rounded-xl shadow-md overflow-hidden p-4"
        style={{
          background: "rgba(10, 31, 26, 0.7)",
          border: "1px solid rgba(34, 211, 238, 0.2)",
          boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)",
        }}
      >
        <input
          type="text"
          placeholder={`Cari di ${selectedCluster}...`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="
            w-full px-4 py-2 
            bg-[rgba(255,255,255,0.1)] 
            border border-[rgba(34,211,238,0.3)] 
            rounded-lg 
            text-white text-sm
            placeholder-gray-400
            focus:outline-none
            focus:ring-2 focus:ring-teal-400 
            focus:border-teal-400
            transition-all
          "
        />
      </div>

      {/* Table */}
      <div 
        className="
          rounded-xl shadow-md overflow-hidden
          bg-[rgba(10,31,26,0.7)]
          border border-[rgba(34,211,238,0.2)]
          shadow-[0_0_30px_rgba(16,185,129,0.1)]
        "
      >

        {/* MOBILE TABLE */}
        <div className="sm:hidden overflow-x-auto p-6">
          {paginatedData.length > 0 ? (
            renderMobileRows()
          ) : (
            <p className="text-center text-gray-400 py-4">
              Tidak ada data ditemukan
            </p>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block sm:overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className="bg-gray-900/40 border-b border-gray-700/60 backdrop-blur-sm"
            >
              <tr className="border-b border-gray-700">
                {getTableHeaders().map((header, i) => {
                  const centerIndex = [0, 4, 5, 7, 8, 9, 10]
                  const alignClass = centerIndex.includes(i)
                    ? "text-center"
                    : "text-left"

                  return (
                    <th
                      key={i}
                      className={`${alignClass} py-3 px-4 text-[#C8FFD4]`}
                    >
                      {header}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                renderTableRows()
              ) : (
                <tr>
                  <td
                    colSpan={getTableHeaders().length}
                    className="py-3 px-4 text-center text-[#A8DCC8]"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-[#c9ece7] p-6">
          
          {/* Info jumlah data */}
          <div className="text-white text-xs sm:text-sm">
            Menampilkan{" "}
            {paginatedData.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            -{" "}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} dari{" "}
            {filteredData.length} data
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="
                px-3 py-1 sm:px-4 sm:py-2 rounded font-medium text-xs sm:text-sm text-white 
                border border-[#c9ece7]
                disabled:opacity-50 disabled:cursor-not-allowed 
                hover:bg-gray-700 transition-colors
              "
            >
              Sebelumnya
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;

                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm
                      ${
                        currentPage === pageNum
                          ? "bg-green-600 text-white"
                          : "border border-gray-400 text-white hover:bg-gray-700"
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="
                px-3 py-1 sm:px-4 sm:py-2 rounded font-medium text-xs sm:text-sm text-white 
                border border-[#c9ece7]
                disabled:opacity-50 disabled:cursor-not-allowed 
                hover:bg-gray-700 transition-colors
              "
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>


      {/* Stats - Contoh sederhana */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
          <div className="p-6">
            <p className="text-muted-foreground text-sm">Total Records (Filtered)</p>
            <p className="text-3xl font-bold text-white mt-2">{filteredData.length}</p>
          </div>
        </div>
        <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
          <div className="p-6">
            <p className="text-muted-foreground text-sm">Total Klaster</p>
            <p className="text-3xl font-bold text-white mt-2">
              {[...new Set(filteredData.map(r => r.cluster))].length}
            </p>
          </div>
        </div>
        <div 
              className="rounded-xl shadow-md overflow-hidden"
              style={{
                background: "rgba(10, 31, 26, 0.7)", // Warna latar dari digital.txt
                border: "1px solid rgba(34, 211, 238, 0.2)", // Warna border dari digital.txt
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)", // Bayangan dari digital.txt
              }}
            >
          <div className="p-6">
            <p className="text-muted-foreground text-sm">Halaman Saat Ini</p>
            <p className="text-3xl font-bold text-white mt-2">{currentPage} / {totalPages || 1}</p>
          </div>
        </div>  
      </div>
    </div>
  )
}