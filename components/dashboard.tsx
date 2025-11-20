//siDesa/components/dashboard.tsx
"use client"
import Overview from "./pages/overview"
import Infrastruktur from "./pages/infrastruktur"
import Ekonomi from "./pages/ekonomi"
import Kesehatan from "./pages/kesehatan"
import Pendidikan from "./pages/pendidikan"
import Lingkungan from "./pages/lingkungan"
import Clustering from "./pages/clustering"
import Digital from "./pages/digital"
import DataMentah from "./pages/data-mentah"
import Metodologi from "./pages/metodologi"
import AboutUs from "./pages/about-us"
import AnimatedBackground from "./pages/AnimatedBackground" // 👈 tambahkan ini

interface DashboardProps {
  activePage: string
}

export default function Dashboard({ activePage }: DashboardProps) {
  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <Overview />
      case "infrastruktur":
        return <Infrastruktur />
      case "ekonomi":
        return <Ekonomi />
      case "kesehatan":
        return <Kesehatan />
      case "pendidikan":
        return <Pendidikan />
      case "lingkungan":
        return <Lingkungan />
      case "clustering":
        return <Clustering />
      case "digital":
        return <Digital />
      case "data-mentah":
        return <DataMentah />
      case "metodologi":
        return <Metodologi />
      case"about-us":
        return <AboutUs />
      default:
        return <Overview />

    }
  }

  return (
    <main className="flex-1 overflow-y-auto dashboard-light relative">
      {/* Background animasi DI DALAM main */}
      <AnimatedBackground />
      
      {/* Konten utama */}
      <div className="p-6 relative z-10">{renderPage()}</div>
    </main>
  )
}
