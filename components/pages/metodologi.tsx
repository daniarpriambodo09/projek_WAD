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
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Metodologi</h1>
        <p className="text-gray-600">Metodologi pengembangan dashboard analitik berbasis AI</p>
      </div>

      {/* Methodology Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metodologi.map((step, idx) => (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6 hover:border-blue-500 transition-colors"
          >
            <div className="text-4xl mb-4">{step.icon}</div>
            <h3 className="text-lg font-semibold text-black mb-2">{step.title}</h3>
            <p className="text-black-400 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Tech Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-black-400 font-semibold mb-2">Frontend</h3>
            <ul className="text-balck-300 text-sm space-y-1">
              <li>• React.js / Next.js</li>
              <li>• Tailwind CSS</li>
              <li>• Recharts</li>
              <li>• React Markdown</li>
            </ul>
          </div>
          <div>
            <h3 className="text-black font-semibold mb-2">Backend</h3>
            <ul className="text-black-300 text-sm space-y-1">
              <li>• Node.js / Express</li>
              <li>• Google Gemini API</li>
              <li>• CORS</li>
              <li>• dotenv</li>
            </ul>
          </div>
          <div>
            <h3 className="text-black font-semibold mb-2">Machine Learning</h3>
            <ul className="text-black-300 text-sm space-y-1">
              <li>• K-Means Clustering</li>
              <li>• LSTM Neural Network</li>
              <li>• Scikit-learn</li>
            </ul>
          </div>
          <div>
            <h3 className="text-black font-semibold mb-2">Data Processing</h3>
            <ul className="text-black-300 text-sm space-y-1">
              <li>• CSV Data Loading</li>
              <li>• Data Normalization</li>
              <li>• Feature Engineering</li>
              <li>• Pandas / NumPy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-white/80 backdrop-blur-sm border border-[#c9ece7] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Workflow</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              1
            </div>
            <p className="text-black-300">Data diambil dari data BPS</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              2
            </div>
            <p className="text-black-300">Data dibersihkan dan divalidasi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              3
            </div>
            <p className="text-black-300">Analisis eksplorasi dilakukan</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              4
            </div>
            <p className="text-black-300">Model machine learning (Clustering) dikembangkan</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              5
            </div>
            <p className="text-black-300">Dashboard divisualisasikan dengan Recharts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white font-bold">
              6
            </div>
            <p className="text-black-300">AI Chatbot terintegrasi untuk interaksi pengguna</p>
          </div>
        </div>
      </div>
    </div>
  )
}
