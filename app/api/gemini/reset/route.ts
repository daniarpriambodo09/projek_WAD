// siDesa/app/api/gemini/reset/route.ts
import { NextResponse } from 'next/server';

let conversationHistory: any[] = [];

export async function POST() {
  try {
    conversationHistory = [];
    return NextResponse.json({ message: "History reset successfully." });
  } catch (error) {
    console.error("Error resetting history:", error);
    return NextResponse.json({ error: "Reset error" }, { status: 500 });
  }
}