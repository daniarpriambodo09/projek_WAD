# siDesa Dashboard - Analitik Berbasis AI

Dashboard analitik komprehensif untuk Sistem Informasi Desa (siDesa) Jawa Timur dengan integrasi AI Gemini.

## Fitur Utama

- **Dashboard Analitik**: Visualisasi data desa dengan 12 halaman analisis berbeda
- **Machine Learning**: Clustering, PCA, dan Prediction models
- **AI Chatbot**: Asisten AI berbasis Gemini untuk menjawab pertanyaan tentang data
- **Real-time Data**: Data mentah dan analisis real-time
- **Responsive Design**: Desain responsif untuk semua perangkat

## Tech Stack

### Frontend
- **Framework**: Next.js 14 + React 18
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Markdown**: React Markdown

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI**: Google Gemini API
- **CORS**: Cross-Origin Resource Sharing

### Machine Learning
- K-Means Clustering
- Principal Component Analysis (PCA)
- LSTM Neural Networks
- Data Normalization & Feature Scaling

## Instalasi

### Prerequisites
- Node.js 18+
- npm atau yarn
- API Key Gemini (dari Google AI Studio)

### Setup Frontend

\`\`\`bash
# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dengan konfigurasi Anda

# Run development server
npm run dev
\`\`\`

Frontend akan berjalan di `http://localhost:3000`

### Setup Backend

\`\`\`bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan GEMINI_API_KEY Anda

# Run backend server
npm start
\`\`\`

Backend akan berjalan di `http://localhost:3000` (atau port yang dikonfigurasi)

## Struktur Folder

\`\`\`
siDesa-Dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── sidebar.tsx
│   ├── dashboard.tsx
│   ├── chatbot.tsx
│   └── pages/
│       ├── overview.tsx
│       ├── infrastruktur.tsx
│       ├── ekonomi.tsx
│       ├── kesehatan.tsx
│       ├── pendidikan.tsx
│       ├── lingkungan.tsx
│       ├── clustering.tsx
│       ├── pca.tsx
│       ├── prediction.tsx
│       ├── digital.tsx
│       ├── data-mentah.tsx
│       └── metodologi.tsx
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── public/
├── package.json
├── tsconfig.json
└── next.config.mjs
\`\`\`

## Halaman Dashboard

1. **Overview** - Ringkasan data dan statistik utama
2. **Infrastruktur** - Analisis kondisi infrastruktur desa
3. **Ekonomi** - Data sektor ekonomi dan UMKM
4. **Kesehatan** - Statistik kesehatan masyarakat
5. **Pendidikan** - Data pendidikan dan siswa
6. **Lingkungan** - Kualitas lingkungan dan penghijauan
7. **Clustering** - Analisis pengelompokan desa
8. **PCA** - Analisis komponen utama
9. **Prediction** - Model prediksi data
10. **Digital** - Transformasi digital desa
11. **Data Mentah** - Data mentah sebelum diproses
12. **Metodologi** - Metodologi pengembangan dashboard

## API Endpoints

### Chat Endpoint
\`\`\`
POST /api/chat
Content-Type: application/json

{
  "prompt": "Pertanyaan Anda",
  "sendHistory": true
}

Response:
{
  "response": "Jawaban dari AI"
}
\`\`\`

### Reset Endpoint
\`\`\`
POST /api/reset

Response:
{
  "message": "History reset successfully."
}
\`\`\`

## Environment Variables

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=siDesa Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
\`\`\`

### Backend (.env)
\`\`\`
GEMINI_API_KEY=your_api_key_here
PORT=3000
\`\`\`

## Penggunaan

1. Buka browser dan akses `http://localhost:3000`
2. Navigasi menggunakan sidebar untuk melihat berbagai analisis
3. Gunakan chatbot AI di kanan bawah untuk bertanya tentang data
4. Klik "Reset" untuk memulai percakapan baru

## Fitur Chatbot

- Menjawab pertanyaan tentang data desa
- Memberikan insights dan rekomendasi
- Mendukung markdown formatting
- Menyimpan history percakapan
- Real-time response dari Gemini API

## Performance

- Optimized rendering dengan React
- Lazy loading untuk halaman
- Efficient data fetching
- Responsive charts dengan Recharts
- Server-side caching untuk API responses

## Security

- CORS configuration untuk API
- Environment variables untuk sensitive data
- Input validation di backend
- Error handling yang proper
- XSS protection headers

## Troubleshooting

### Backend tidak terhubung
- Pastikan backend server berjalan di `http://localhost:3000`
- Cek GEMINI_API_KEY di file `.env`
- Lihat console untuk error messages

### Chatbot tidak merespons
- Verifikasi API key Gemini valid
- Cek koneksi internet
- Lihat network tab di browser developer tools

### Data tidak muncul
- Refresh halaman
- Cek console untuk error messages
- Verifikasi data CSV tersedia

## Kontribusi

Untuk kontribusi, silakan buat pull request dengan deskripsi perubahan yang jelas.

## Lisensi

MIT License - Silakan gunakan untuk keperluan komersial maupun non-komersial.

## Support

Untuk pertanyaan atau masalah, silakan buka issue di repository ini.

---

**Dibuat dengan ❤️ untuk siDesa Jawa Timur**
"# projek_WAD" 
