"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { useChatbotContext } from '@/context/ChatbotContext';

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya adalah AI Assistant siDesa. Tanyakan apa saja tentang data desa, analisis, atau insights yang Anda butuhkan.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Di dalam komponen Chatbot()
  const { pageContext } = useChatbotContext();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    const isTipologi = pageContext.pageId === "overview";
    const isInfrastruktur = pageContext.pageId === "infrastruktur";
    const isKesehatan = pageContext.pageId === "kesehatan";
    const isPendidikan = pageContext.pageId === "pendidikan";
    const isLingkungan = pageContext.pageId === "lingkungan";
    const isEkonomi = pageContext.pageId === "ekonomi";
    const isDigital = pageContext.pageId === "digital";

    // === BANGUN PROMPT DENGAN KONTEKS ===
    const { pageTitle, filters, visibleDataSummary } = pageContext;

    let contextStr = `Pengguna sedang melihat halaman: "${pageTitle}".\n`;
    if (filters.kabupaten) contextStr += `Kabupaten: ${filters.kabupaten}\n`;
    if (filters.kecamatan) contextStr += `Kecamatan: ${filters.kecamatan}\n`;
    if (filters.desa) contextStr += `Desa: ${filters.desa}\n`;

    if (visibleDataSummary) {
      contextStr += `\nRingkasan data:\n`;
      contextStr += `- Wilayah: ${visibleDataSummary.wilayah}\n`;
      contextStr += `- Jumlah desa: ${visibleDataSummary.jumlah_desa}\n`;

      const domain = isInfrastruktur 
        ? "infrastruktur" 
        : isKesehatan 
        ? "kesehatan" 
        : isPendidikan 
        ? "pendidikan" 
        : "kinerja";

      // === RATA-RATA SKOR ===
      if (visibleDataSummary.rata_rata_skor) {
        const skor = visibleDataSummary.rata_rata_skor;
        if (isInfrastruktur) {
          contextStr += `- Rata-rata skor infrastruktur:\n`;
          contextStr += `  • Listrik: ${skor.listrik?.toFixed(1) || "–"}\n`;
          contextStr += `  • Sanitasi: ${skor.sanitasi?.toFixed(1) || "–"}\n`;
          contextStr += `  • Air: ${skor.air?.toFixed(1) || "–"}\n`;
          contextStr += `  • Transportasi: ${skor.transportasi?.toFixed(1) || "–"}\n`;
        } else if (isKesehatan) {
          contextStr += `- Rata-rata skor kesehatan:\n`;
          contextStr += `  • Fasilitas: ${skor.fasilitas?.toFixed(1) || "–"}\n`;
          contextStr += `  • Tenaga Kesehatan: ${skor.tenaga_kesehatan?.toFixed(1) || "–"}\n`;
          contextStr += `  • Gizi: ${skor.gizi?.toFixed(1) || "–"}\n`;
          contextStr += `  • KLB: ${skor.klb?.toFixed(1) || "–"}\n`;
          contextStr += `  • Program Prioritas: ${skor.program_prioritas?.toFixed(1) || "–"}\n`;
        } else if (isPendidikan) {
          contextStr += `- Rata-rata skor pendidikan:\n`;
          contextStr += `  • Total: ${skor.pendidikan_total?.toFixed(1) || "–"}\n`;
          contextStr += `  • Literasi: ${skor.literasi?.toFixed(1) || "–"}\n`;
          contextStr += `  • PAUD: ${skor.paud?.toFixed(1) || "–"}\n`;
          contextStr += `  • SD: ${skor.sd?.toFixed(1) || "–"}\n`;
          contextStr += `  • SMP: ${skor.smp?.toFixed(1) || "–"}\n`;
          contextStr += `  • SMA: ${skor.sma?.toFixed(1) || "–"}\n`;
        } else if (isLingkungan) {
          contextStr += `- Rata-rata skor lingkungan:\n`;
          contextStr += `  • Pengelolaan Sampah: ${skor.pengelolaan_sampah?.toFixed(1) || "–"}\n`;
          contextStr += `  • Kualitas Lingkungan: ${skor.kualitas_lingkungan?.toFixed(1) || "–"}\n`;
          contextStr += `  • Ketahanan Bencana: ${skor.ketahanan_bencana?.toFixed(1) || "–"}\n`;
          contextStr += `  • Mitigasi Bencana: ${skor.mitigasi_bencana?.toFixed(1) || "–"}\n`;
          contextStr += `  • Pelestarian: ${skor.pelestarian?.toFixed(1) || "–"}\n`;
          contextStr += `  • Skor Total Lingkungan: ${skor.lingkungan_total?.toFixed(1) || "–"}\n`;
        } else if (isEkonomi) {
          contextStr += `- Rata-rata skor ekonomi:\n`;
          contextStr += `  • Kesejahteraan: ${skor.kesejahteraan?.toFixed(1) || "–"}\n`;
          contextStr += `  • BUMDES: ${skor.bumdes?.toFixed(1) || "–"}\n`;
          contextStr += `  • Koperasi: ${skor.koperasi?.toFixed(1) || "–"}\n`;
          contextStr += `  • Industri: ${skor.industri?.toFixed(1) || "–"}\n`;
          contextStr += `  • Akses Modal: ${skor.akses_modal?.toFixed(1) || "–"}\n`;
          contextStr += `  • Infrastruktur Ekonomi: ${skor.infrastruktur_ekonomi?.toFixed(1) || "–"}\n`;
          contextStr += `  • Skor Total Ekonomi: ${skor.ekonomi_total?.toFixed(1) || "–"}\n`;
        } else if (isDigital) {
          contextStr += `- Rata-rata skor digital:\n`;
          contextStr += `  • Jumlah BTS: ${skor.bts?.toFixed(1) || "–"}\n`;
          contextStr += `  • Jumlah Operator: ${skor.operator?.toFixed(1) || "–"}\n`;
          contextStr += `  • Sinyal Telepon: ${skor.sinyal_telepon?.toFixed(1) || "–"}%\n`;
          contextStr += `  • Sinyal Internet: ${skor.sinyal_internet?.toFixed(1) || "–"}%\n`;
          contextStr += `  • Ada Warnet: ${skor.warnet?.toFixed(1) || "–"}\n`;
          contextStr += `  • Komputer Desa: ${skor.komputer_desa?.toFixed(1) || "–"}\n`;
          contextStr += `  • Internet Kantor: ${skor.internet_kantor?.toFixed(1) || "–"}\n`;
          contextStr += `  • SID: ${skor.sid?.toFixed(1) || "–"}\n`;
        } else if (isTipologi) {
          contextStr += `- Rata-rata skor berdasarkan komponen tipologi:\n`;
          contextStr += `  • Akses Dasar: ${skor.akses_dasar?.toFixed(1) || "–"}\n`;
          contextStr += `  • Konektivitas: ${skor.konektivitas?.toFixed(1) || "–"}\n`;
          contextStr += `  • Kesejahteraan: ${skor.kesejahteraan?.toFixed(1) || "–"}\n`;
          contextStr += `  • Kualitas Lingkungan: ${skor.kualitas_lingkungan?.toFixed(1) || "–"}\n`;
          contextStr += `  • Digital Readiness: ${skor.digital_readiness?.toFixed(1) || "–"}\n`;
        }
      }

      // === PERSENTASE AKSES (opsional, bisa disesuaikan) ===
      if (visibleDataSummary.persentase_akses) {
        const akses = visibleDataSummary.persentase_akses;
        if (isInfrastruktur) {
          contextStr += `- Persentase akses:\n`;
          contextStr += `  • Air minum aman: ${akses.air_minum_aman?.toFixed(1) || "–"}%\n`;
          contextStr += `  • Sanitasi layak: ${akses.sanitasi_layak?.toFixed(1) || "–"}%\n`;
        }
        // Untuk kesehatan, kamu bisa skip atau ganti dengan indikator lain
      }

      // === DESA TERBAIK & TERBURUK ===
      if (isInfrastruktur) {
        if (visibleDataSummary.desa_dengan_infrastruktur_terburuk) {
          const d = visibleDataSummary.desa_dengan_infrastruktur_terburuk;
          contextStr += `- Desa dengan infrastruktur terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Listrik=${d.skor_listrik}, Sanitasi=${d.skor_sanitasi}, Air=${d.skor_air}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
        if (visibleDataSummary.desa_dengan_infrastruktur_terbaik) {
          const d = visibleDataSummary.desa_dengan_infrastruktur_terbaik;
          contextStr += `- Desa dengan infrastruktur terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Listrik=${d.skor_listrik}, Sanitasi=${d.skor_sanitasi}, Air=${d.skor_air}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
      } else if (isKesehatan) {
        if (visibleDataSummary.desa_dengan_kesehatan_terburuk) {
          const d = visibleDataSummary.desa_dengan_kesehatan_terburuk;
          contextStr += `- Desa dengan kesehatan terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Fasilitas=${d.skor_fasilitas}, Tenaga=${d.skor_tenaga_kesehatan}, Gizi=${d.skor_gizi}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
        if (visibleDataSummary.desa_dengan_kesehatan_terbaik) {
          const d = visibleDataSummary.desa_dengan_kesehatan_terbaik;
          contextStr += `- Desa dengan kesehatan terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Fasilitas=${d.skor_fasilitas}, Tenaga=${d.skor_tenaga_kesehatan}, Gizi=${d.skor_gizi}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        } 
      } else if (isPendidikan) {
        if (visibleDataSummary.desa_dengan_pendidikan_terburuk) {
          const d = visibleDataSummary.desa_dengan_pendidikan_terburuk;
          contextStr += `- Desa dengan pendidikan terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Total=${d.skor_pendidikan_total}, Literasi=${d.skor_literasi}, SD=${d.skor_sd}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
        if (visibleDataSummary.desa_dengan_pendidikan_terbaik) {
          const d = visibleDataSummary.desa_dengan_pendidikan_terbaik;
          contextStr += `- Desa dengan pendidikan terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Total=${d.skor_pendidikan_total}, Literasi=${d.skor_literasi}, SD=${d.skor_sd}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
      } else if (isLingkungan) {
        if (visibleDataSummary.desa_dengan_lingkungan_terburuk) {
          const d = visibleDataSummary.desa_dengan_lingkungan_terburuk;
          contextStr += `- Desa dengan lingkungan terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Sampah=${d.skor_pengelolaan_sampah}, Kualitas=${d.skor_kualitas_lingkungan}, Total=${d.skor_lingkungan_total}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
        if (visibleDataSummary.desa_dengan_lingkungan_terbaik) {
          const d = visibleDataSummary.desa_dengan_lingkungan_terbaik;
          contextStr += `- Desa dengan lingkungan terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
          contextStr += `  • Skor: Sampah=${d.skor_pengelolaan_sampah}, Kualitas=${d.skor_kualitas_lingkungan}, Total=${d.skor_lingkungan_total}\n`;
          contextStr += `  • Kluster: ${d.label_kluster}\n`;
        }
      } else if (isEkonomi) {
          if (visibleDataSummary.desa_dengan_ekonomi_terburuk) {
            const d = visibleDataSummary.desa_dengan_ekonomi_terburuk;
            contextStr += `- Desa dengan ekonomi terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
            contextStr += `  • Skor: Kesejahteraan=${d.skor_kesejahteraan}, BUMDES=${d.skor_bumdes}, Total=${d.skor_ekonomi_total}\n`;
            contextStr += `  • Kluster: ${d.label_kluster}\n`;
          }
          if (visibleDataSummary.desa_dengan_ekonomi_terbaik) {
            const d = visibleDataSummary.desa_dengan_ekonomi_terbaik;
            contextStr += `- Desa dengan ekonomi terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
            contextStr += `  • Skor: Kesejahteraan=${d.skor_kesejahteraan}, BUMDES=${d.skor_bumdes}, Total=${d.skor_ekonomi_total}\n`;
            contextStr += `  • Kluster: ${d.label_kluster}\n`;
          }
      } else if (isDigital) {
          if (visibleDataSummary.desa_dengan_digital_terburuk) {
            const d = visibleDataSummary.desa_dengan_digital_terburuk;
            contextStr += `- Desa dengan digital terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
            contextStr += `  • Sinyal Internet: ${d.sinyal_internet}%, Warnet: ${d.warnet}, Komputer: ${d.komputer_desa}\n`;
            contextStr += `  • Kluster: ${d.label_kluster}\n`;
          }
          if (visibleDataSummary.desa_dengan_digital_terbaik) {
            const d = visibleDataSummary.desa_dengan_digital_terbaik;
            contextStr += `- Desa dengan digital terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan})\n`;
            contextStr += `  • Sinyal Internet: ${d.sinyal_internet}%, Warnet: ${d.warnet}, Komputer: ${d.komputer_desa}\n`;
            contextStr += `  • Kluster: ${d.label_kluster}\n`;
          }
      } else if (isTipologi) {
        if (visibleDataSummary.desa_dengan_konektivitas_terburuk) {
          const d = visibleDataSummary.desa_dengan_konektivitas_terburuk;
          contextStr += `- Desa dengan konektivitas terburuk: ${d.nama_desa} (Kec. ${d.nama_kecamatan}, Kab. ${d.nama_kabupaten})\n`;
          contextStr += `  • Skor: Konektivitas=${d.skor_konektivitas}, Akses Dasar=${d.skor_akses_dasar}\n`;
          contextStr += `  • Tipologi: ${d.final_label}\n`;
        }
        if (visibleDataSummary.desa_dengan_konektivitas_terbaik) {
          const d = visibleDataSummary.desa_dengan_konektivitas_terbaik;
          contextStr += `- Desa dengan konektivitas terbaik: ${d.nama_desa} (Kec. ${d.nama_kecamatan}, Kab. ${d.nama_kabupaten})\n`;
          contextStr += `  • Skor: Konektivitas=${d.skor_konektivitas}, Akses Dasar=${d.skor_akses_dasar}\n`;
          contextStr += `  • Tipologi: ${d.final_label}\n`;
        }
      }

      if (visibleDataSummary.top5_terbaik && visibleDataSummary.top5_terbaik.length > 0) {
        contextStr += `- 5 besar ${domain} terbaik di Jawa Timur:\n`;
        visibleDataSummary.top5_terbaik.forEach((item : any, i : any) => {
          contextStr += `  ${i + 1}. ${item.nama} (skor: ${item.skor.toFixed(1)})\n`;
        });
      }

      if (visibleDataSummary.top5_terburuk && visibleDataSummary.top5_terburuk.length > 0) {
        contextStr += `- 5 besar ${domain} terburuk di Jawa Timur:\n`;
        visibleDataSummary.top5_terburuk.forEach((item : any, i : any) => {
          contextStr += `  ${i + 1}. ${item.nama} (skor: ${item.skor.toFixed(1)})\n`;
        });
      }

      // === GLOBAL INSIGHTS (sama untuk semua halaman) ===
      if (visibleDataSummary.globalInsights) {
        const g = visibleDataSummary.globalInsights;
        const prefix = isInfrastruktur ? "infrastruktur" : isKesehatan ? "kesehatan" : "kinerja";
        
        if (g.kabupatenTerbaik) {
          contextStr += `- Kabupaten dengan ${prefix} terbaik di Jawa Timur: ${g.kabupatenTerbaik.nama_kab} (skor: ${g.kabupatenTerbaik.skor_rata_rata.toFixed(1)})\n`;
        }
        if (g.kabupatenTerburuk) {
          contextStr += `- Kabupaten dengan ${prefix} terburuk di Jawa Timur: ${g.kabupatenTerburuk.nama_kab} (skor: ${g.kabupatenTerburuk.skor_rata_rata.toFixed(1)})\n`;
        }
        if (g.kecamatanTerbaik) {
          contextStr += `- Kecamatan dengan ${prefix} terbaik di ${filters.kabupaten}: ${g.kecamatanTerbaik.nama_kec} (skor: ${g.kecamatanTerbaik.skor_rata_rata.toFixed(1)})\n`;
        }
        if (g.kecamatanTerburuk) {
          contextStr += `- Kecamatan dengan ${prefix} terburuk di ${filters.kabupaten}: ${g.kecamatanTerburuk.nama_kec} (skor: ${g.kecamatanTerburuk.skor_rata_rata.toFixed(1)})\n`;
        }
      }
    }

    // Instruksi kebijakan khusus per domain
    let kebijakanInstruksi = "";
    if (isInfrastruktur) {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan infrastruktur:
      - Fokus pada 6 komponen: listrik, sanitasi, air bersih, transportasi, digital, aksesibilitas.
      - Contoh: "Perbaiki jalan desa di wilayah dengan skor transportasi <50 melalui dana desa."
      - Prioritaskan desa dengan skor sanitasi atau air terendah.`;
    } else if (isKesehatan) {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan kesehatan:
      - Fokus pada: fasilitas (puskesmas/posyandu), tenaga kesehatan (dokter/bidan), gizi, KLB, dan program prioritas.
      - Contoh: "Tingkatkan rasio bidan per 1000 penduduk di desa X dari 0.5 menjadi 1.2 melalui program Nusantara Sehat."
      - Prioritaskan desa dengan skor gizi atau fasilitas terendah.`;
    } else if (isLingkungan) {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan lingkungan:
      - Fokus pada: pengelolaan sampah, kualitas lingkungan, ketahanan/mitigasi bencana, dan pelestarian alam.
      - Contoh: "Luncurkan program bank sampah di desa X yang skor pengelolaan sampahnya <40."
      - Prioritaskan desa dengan skor kualitas lingkungan atau ketahanan bencana terendah.`;
    } else if (isEkonomi) {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan ekonomi:
      - Fokus pada: BUMDES, koperasi, akses modal, infrastruktur ekonomi, dan sektor unggulan.
      - Contoh: "Dorong pendirian BUMDES di desa X yang skor bumdes-nya <30 melalui pelatihan APBDesa."
      - Prioritaskan desa dengan skor kesejahteraan atau akses modal terendah.`;
    } else if (isDigital) {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan digital:
      - Fokus pada: perluasan BTS, peningkatan sinyal internet, penyediaan komputer desa, dan pengaktifan SID.
      - Contoh: "Bangun 1 BTS di desa X yang sinyal internetnya <50%."
      - Prioritaskan desa tanpa warnet atau internet kantor desa.`;
    } else if (isTipologi) {
      kebijakanInstruksi = `Jika diminta rekomendasi kebijakan untuk tipologi desa:
      - Fokus pada pendekatan holistik dan lintas sektor berdasarkan final_label (misal: Desa Tertinggal Prioritas, Desa Agraris Berkembang, dsb.).
      - Gunakan data multidimensional dari akses dasar, konektivitas, kesejahteraan, lingkungan, ekonomi, kesehatan, pendidikan, dan digital.
      - Contoh: "Fokuskan intervensi di Desa X (final_label: Desa Tertinggal Prioritas) pada peningkatan akses dasar dan konektivitas untuk mempercepat pemerataan."
      - Prioritaskan desa dengan skor terendah di aspek kunci sesuai tipologinya.`;
    }else {
        kebijakanInstruksi = `Jika diminta rekomendasi kebijakan, berikan 3 rekomendasi konkret berbasis data yang relevan dengan konteks halaman ini.`;
    }

    const fullPrompt = `${contextStr}

    Pertanyaan pengguna: "${userMessage}"

    Instruksi khusus:
    1. Jawab dalam **bahasa Indonesia yang jelas, profesional, dan berbasis data**.
    2. ${kebijakanInstruksi}
    3. Sertakan **alasan berbasis data** (sebut skor, persentase, atau kluster).
    4. Hindari rekomendasi umum seperti "tingkatkan infrastruktur" atau "perbaiki layanan kesehatan".
    5. Jika data tidak mencukupi, jawab: "Maaf, data tidak tersedia untuk menjawab pertanyaan tersebut."
    6. Fokus pada **tindakan yang bisa diambil oleh pemerintah daerah** (Pemkab/Pemkem/Pemdes).
    `;

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt, // <-- KIRIM PROMPT LENGKAP, BUKAN HANYA userMessage
          sendHistory: messages.length > 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mendapatkan respons dari AI");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, timestamp: new Date() }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      setError(errorMessage);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Maaf, terjadi kesalahan: ${errorMessage}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("/api/gemini/reset", { method: "POST" })
      setMessages([
        {
          role: "assistant",
          content: "Percakapan telah direset. Silakan mulai pertanyaan baru.",
          timestamp: new Date(),
        },
      ])
      setError(null)
      setTimeout(scrollToBottom, 10)
    } catch (error) {
      setError("Gagal mereset percakapan")
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#385723] border-2 border-primary shadow-lg hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center z-40"
          title="Buka chat"
        >
          <svg className="w-7 h-7 text-primary" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-4h-8V8h8v2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-secondary/40 border-2 border-primary/30 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-sm">
          {/* Header dengan gradient hijau kalem */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-gradient-to-r from-primary/20 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-foreground text-sm">AI Assistant siDesa</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded transition-colors text-primary font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-primary/10 hover:bg-primary/20 rounded transition-colors text-black"
                title="Tutup chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-white/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-[#9AB283] text-black rounded-br-none shadow-md"
                      : "bg-white/80 text-foreground rounded-bl-none shadow-sm border border-primary/10"
                  }`}
                >
                  <ReactMarkdown className="prose prose-sm max-w-none">{msg.content}</ReactMarkdown>
                  <p className="text-xs mt-1 opacity-60">
                    {msg.timestamp.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/80 text-foreground px-3 py-2 rounded-lg text-sm rounded-bl-none shadow-sm border border-primary/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 bg-red-900/20 border-t border-red-700/30 text-red-600 text-xs">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="p-3 border-t border-primary/20 bg-white/40">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya AI..."
                className="flex-1 px-3 py-2 bg-white/80 border border-primary/20 rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 bg-[#9ab283] hover:bg-primary/90 disabled:bg-muted rounded-lg text-black text-sm transition-colors font-medium shadow-md hover:shadow-lg"
              >
                {loading ? "..." : "Kirim"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
