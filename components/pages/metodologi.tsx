"use client";

import React, { PropsWithChildren } from "react";

// =====================================
// GLOBAL CARD STYLE (Dark Glass Theme)
// =====================================
const cardStyle: React.CSSProperties = {
  background: "rgba(10, 31, 26, 0.7)",
  border: "1px solid rgba(34, 211, 238, 0.2)",
  boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)",
};

// =====================================
// REUSABLE CARD COMPONENT
// =====================================
type CardProps = PropsWithChildren<{
  className?: string;
}>;

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`rounded-xl shadow-md overflow-hidden p-6 ${className}`} style={cardStyle}>
    {children}
  </div>
);

// =====================================
// METODOLOGI PAGE
// =====================================
export default function Metodologi() {
  const metodologi = [
    {
      title: "Data Collection",
      desc: "Pengumpulan data dari berbagai sumber desa menggunakan survei dan API",
      icon: "📊",
    },
    {
      title: "Data Cleaning",
      desc: "Pembersihan dan validasi data untuk memastikan kualitas data",
      icon: "🧹",
    },
    {
      title: "Exploratory Data Analysis",
      desc: "Analisis eksplorasi untuk memahami pola dan distribusi data",
      icon: "🔍",
    },
    {
      title: "Feature Engineering",
      desc: "Pembuatan fitur baru dari data yang ada untuk meningkatkan model",
      icon: "⚙️",
    },
    {
      title: "Model Development",
      desc: "Pengembangan model machine learning (Clustering dan PCA)",
      icon: "🤖",
    },
    {
      title: "Validation & Testing",
      desc: "Validasi dan pengujian model untuk memastikan akurasi",
      icon: "✓",
    },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold text-white">Metodologi</h1>
        <p className="text-teal-300">
          Metodologi pengembangan dashboard analitik berbasis AI
        </p>
      </header>

      {/* =============================================
          METHOD STEPS
      ============================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metodologi.map((step, idx) => (
          <Card key={idx} className="text-white">
            <div className="text-4xl mb-4">{step.icon}</div>
            <h3 className="text-lg font-semibold text-teal-300 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-200 text-sm">{step.desc}</p>
          </Card>
        ))}
      </div>

      {/* =============================================
          TECH STACK
      ============================================== */}
      <Card>
        <h2 className="text-lg font-semibold text-teal-300 mb-4">Tech Stack</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FRONTEND */}
          <div>
            <h3 className="text-white font-semibold mb-2">Frontend</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• React.js / Next.js</li>
              <li>• Tailwind CSS</li>
              <li>• Recharts</li>
              <li>• React Markdown</li>
            </ul>
          </div>

          {/* BACKEND */}
          <div>
            <h3 className="text-white font-semibold mb-2">Backend</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Node.js / Express</li>
              <li>• Google Gemini API</li>
              <li>• CORS</li>
              <li>• dotenv</li>
            </ul>
          </div>

          {/* MACHINE LEARNING */}
          <div>
            <h3 className="text-white font-semibold mb-2">Machine Learning</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• K-Means Clustering</li>
              <li>• LSTM Neural Network</li>
              <li>• Scikit-learn</li>
            </ul>
          </div>

          {/* DATA PROCESSING */}
          <div>
            <h3 className="text-white font-semibold mb-2">Data Processing</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• CSV Data Loading</li>
              <li>• Data Normalization</li>
              <li>• Feature Engineering</li>
              <li>• Pandas / NumPy</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* =============================================
          WORKFLOW
      ============================================== */}
      <Card>
        <h2 className="text-lg font-semibold text-teal-300 mb-4">Workflow</h2>

        <div className="space-y-4">
          {[
            "Data diambil dari data BPS",
            "Data dibersihkan dan divalidasi",
            "Analisis eksplorasi dilakukan",
            "Pengembangan model Clustering",
            "Dashboard divisualisasikan dengan Recharts",
            "AI Chatbot terintegrasi untuk interaksi pengguna",
          ].map((text, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <p className="text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
