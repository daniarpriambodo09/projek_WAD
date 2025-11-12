// siDesa/app/api/gemini/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Gunakan variabel global untuk menyimpan history (bukan persisten, hanya per sesi serverless)
let conversationHistory: any[] = [];

export async function POST(req: Request) {
  try {
    const { prompt, sendHistory = true } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let chat;
    if (sendHistory && conversationHistory.length > 0) {
      chat = model.startChat({ history: conversationHistory });
    } else {
      chat = model.startChat({ history: [] });
      conversationHistory = []; // Reset jika tidak kirim history
    }

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Update history
    conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });
    conversationHistory.push({ role: 'model', parts: [{ text: text }] });

    // Batasi history agar tidak terlalu panjang
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Internal Server Error calling AI model." },
      { status: 500 }
    );
  }
}