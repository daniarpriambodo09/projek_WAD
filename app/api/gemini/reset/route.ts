// siDesa/app/api/gemini/reset/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = await fetch('http://localhost:3001/api/reset', {
      method: 'POST',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Reset failed' }, { status: res.status });
    }

    return NextResponse.json({ message: 'Reset successful' });
  } catch (error) {
    return NextResponse.json({ error: 'Reset error' }, { status: 500 });
  }
}