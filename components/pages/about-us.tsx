"use client"

import { Mail, Phone, MapPin, Globe, MessageCircle } from "lucide-react"

export default function AboutUs() {
  const whatsappNumber = "6285806940713"
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Halo%20siDesa,%20saya%20ingin%20bertanya%20tentang%20layanan%20Anda.`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Tentang Kami</h1>
        <p className="text-muted-foreground text-lg">Dashboard Analitik siDesa - Sistem Informasi Desa Berbasis AI</p>
      </div>

      {/* About Section */}
      <div className="bg-card rounded-lg p-8 border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Tentang Dashboard siDesa</h2>
        <p className="text-foreground leading-relaxed mb-4">
          Dashboard Analitik siDesa adalah platform analisis data komprehensif yang dirancang khusus untuk mendukung
          pengambilan keputusan di tingkat desa. Dengan memanfaatkan teknologi Artificial Intelligence dan Machine
          Learning, kami menyediakan insights mendalam tentang infrastruktur, ekonomi, kesehatan, pendidikan, dan
          lingkungan di wilayah Jawa Timur.
        </p>
        <p className="text-foreground leading-relaxed">
          Platform ini mengintegrasikan data dari berbagai sumber untuk memberikan gambaran holistik tentang kondisi
          desa, membantu pemerintah desa dalam merencanakan pembangunan yang lebih baik dan berkelanjutan.
        </p>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <div className="bg-card rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Hubungi Kami</h2>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-muted-foreground">info@sidesa.go.id</p>
                <p className="text-muted-foreground">support@sidesa.go.id</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Telepon</h3>
                <p className="text-muted-foreground">+62 31 1234 5678</p>
                <p className="text-muted-foreground">+62 812 3456 7890</p>
              </div>
            </div>

            {/* WhatsApp Button */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-foreground">WhatsApp</h3>
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

            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Alamat</h3>
                <p className="text-muted-foreground">Politeknik Elektronika Negeri Surabaya</p>
                <p className="text-muted-foreground">Jl. Raya ITS, Keputih, Sukolilo, Surabaya</p>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Website</h3>
                <p className="text-muted-foreground">www.sidesa.go.id</p>
              </div>
            </div>
          </div>
        </div>

        {/* Office Hours & Additional Info */}
        <div className="bg-card rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Jam Operasional</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Hari Kerja</h3>
              <p className="text-muted-foreground">Senin - Jumat: 08:00 - 17:00 WIB</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Hari Sabtu</h3>
              <p className="text-muted-foreground">08:00 - 12:00 WIB</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Hari Minggu & Libur Nasional</h3>
              <p className="text-muted-foreground">Tutup</p>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <h3 className="font-semibold text-foreground mb-2">Dukungan Teknis</h3>
              <p className="text-muted-foreground text-sm">
                Untuk pertanyaan teknis dan laporan bug, silakan hubungi tim support kami melalui email, telepon, atau
                WhatsApp selama jam operasional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-card rounded-lg p-8 border border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Tim Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
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
          ].map((member, index) => (
            <div key={index} className="p-4 bg-secondary rounded-lg border border-border">
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-sm text-primary mb-2">{member.role}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
