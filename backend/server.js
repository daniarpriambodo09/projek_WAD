// AI-WEB-GEMINI/backend/server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

// Izinkan origin dari Next.js (dev dan production)
app.use(cors({
  origin: [
    'http://localhost:3000',   // Next.js dev default
    'http://127.0.0.1:3000',
    // Tambahkan domain production di sini nanti
  ],
  credentials: true,
}));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("FATAL ERROR: GEMINI_API_KEY not found in .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let conversationHistory = [];

app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.prompt;
    const sendHistory = req.body.sendHistory !== false;

    if (!userMessage) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    let chat;
    if (sendHistory && conversationHistory.length > 0) {
      chat = model.startChat({ history: conversationHistory });
    } else {
      chat = model.startChat({ history: [] });
      conversationHistory = [];
    }

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    conversationHistory.push({ role: 'model', parts: [{ text: text }] });

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    res.json({ response: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Internal Server Error calling AI model." });
  }
});

app.post('/api/reset', (req, res) => {
  conversationHistory = [];
  res.json({ message: "History reset successfully." });
});

// Jalankan di port 3001 agar tidak bentrok dengan Next.js
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server berjalan di http://localhost:${PORT}`);
});