"use client";

import { Mail, Phone, MapPin, Globe, MessageCircle } from "lucide-react";

// =========================
// Interfaces
// =========================
interface ContactItem {
  icon: React.ElementType;
  title: string;
  details: string[];
}

interface TeamMember {
  name: string;
  role: string;
  email: string;
}

export default function AboutUs() {
  const whatsappNumber = "6285806940713";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Halo%20siDesa,%20saya%20ingin%20bertanya%20tentang%20layanan%20Anda.`;


  // =========================
  // Contact Data
  // =========================
  const contactDetails: ContactItem[] = [
    {
      icon: Mail,
      title: "Email",
      details: ["info@sidesa.go.id", "support@sidesa.go.id"],
    },
    {
      icon: Phone,
      title: "Telepon",
      details: ["+62 31 1234 5678", "+62 812 3456 7890"],
    },
    {
      icon: MapPin,
      title: "Alamat",
      details: [
        "Politeknik Elektronika Negeri Surabaya",
        "Jl. Raya ITS, Keputih, Sukolilo, Surabaya",
      ],
    },
    {
      icon: Globe,
      title: "Website",
      details: ["www.sidesa.go.id"],
    },
  ];

  // =========================
  // Team Data
  // =========================
  const teamMembers: TeamMember[] = [
    {
      name: "Rizky Diska Pratama",
      role: "Front End",
      email: "rizkydiskapratama@ds.student.pens.ac.id",
    },
    {
      name: "Daniar Priambodo",
      role: "Permodelan Machine Learning",
      email: "daniarpriambodo11@ds.student.pens.ac.id",
    },
    {
      name: "Naufal Aqil",
      role: "Back End",
      email: "naufalaqil@ds.student.pens.ac.id",
    },
  ];

  // =========================
  // Contact Item Component
  // =========================
  const ContactCard = ({ item }: { item: ContactItem }) => (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-teal-300/10 rounded-lg flex-shrink-0">
        <item.icon className="w-6 h-6 text-teal-300" />
      </div>
      <div>
        <h3 className="font-semibold text-white">{item.title}</h3>
        {item.details.map((detail, idx) => (
          <p key={idx} className="text-gray-300">
            {detail}
          </p>
        ))}
      </div>
    </div>
  );

  // =========================
  // Styled Card (Glass)
  // =========================
  const StyledCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`rounded-xl shadow-md overflow-hidden ${className}`}
      style={{
        background: "rgba(10, 31, 26, 0.7)",
        border: "1px solid rgba(34, 211, 238, 0.2)",
        boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)",
      }}
    >
      {children}
    </div>
  );

  // =========================
  // MAIN PAGE
  // =========================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Tentang Kami</h1>
        <p className="text-teal-300 text-lg">
          Dashboard Analitik siDesa - Sistem Informasi Desa Berbasis AI
        </p>
      </div>

      {/* About Section */}
      <StyledCard>
        <h2 className="text-2xl font-semibold text-teal-300 mb-4 p-6 pt-6 pb-2">
          Tentang Dashboard siDesa
        </h2>
        <div className="p-6 pt-2">
          <p className="text-gray-300 leading-relaxed mb-4">
            Dashboard Analitik siDesa adalah platform analisis data komprehensif
            yang dirancang untuk mendukung pengambilan keputusan di tingkat desa.
            Dengan teknologi Artificial Intelligence dan Machine Learning, kami
            menyediakan insights mendalam tentang infrastruktur, ekonomi, kesehatan,
            pendidikan, dan lingkungan di wilayah Jawa Timur.
          </p>

          <p className="text-gray-300 leading-relaxed">
            Platform ini mengintegrasikan data dari berbagai sumber untuk memberikan
            gambaran holistik sehingga pemerintah desa dapat merencanakan pembangunan
            yang lebih baik dan berkelanjutan.
          </p>
        </div>
      </StyledCard>

      {/* Contact Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact */}
        <StyledCard>
          <h2 className="text-2xl font-semibold text-teal-300 mb-6 p-6 pt-6 pb-2">
            Hubungi Kami
          </h2>
          <div className="p-6 pt-2 space-y-4">
            {contactDetails.map((item, index) => (
              <ContactCard key={index} item={item} />
            ))}

            {/* WhatsApp button */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-white">WhatsApp</h3>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </StyledCard>

        {/* Office Hours */}
        <StyledCard>
          <h2 className="text-2xl font-semibold text-teal-300 mb-6 p-6 pt-6 pb-2">
            Jam Operasional
          </h2>

          <div className="p-6 pt-2 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Hari Kerja</h3>
              <p className="text-gray-300">Senin - Jumat: 08:00 - 17:00 WIB</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Hari Sabtu</h3>
              <p className="text-gray-300">08:00 - 12:00 WIB</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                Minggu & Libur Nasional
              </h3>
              <p className="text-gray-300">Tutup</p>
            </div>

            <div className="pt-4 border-t border-gray-600/40 mt-6">
              <h3 className="font-semibold text-white mb-1">Dukungan Teknis</h3>
              <p className="text-gray-400 text-sm">
                Untuk pertanyaan teknis dan laporan bug, silakan hubungi tim support
                melalui email, telepon, atau WhatsApp selama jam operasional.
              </p>
            </div>
          </div>
        </StyledCard>
      </div>

      {/* Team Section */}
      <StyledCard>
        <h2 className="text-2xl font-semibold text-teal-300 mb-6 p-6 pt-6 pb-2">
          Tim Kami
        </h2>

        <div className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-teal-300/20 bg-white/5"
              >
                <h3 className="font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-teal-300 mb-2">{member.role}</p>
                <p className="text-gray-300 text-sm">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
      </StyledCard>
    </div>
  );
}
