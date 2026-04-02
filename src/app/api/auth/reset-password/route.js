import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response, payload } = await fetchBackend('/auth/reset-password', {
      method: 'POST',
      body,
    });

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: 'Error resetting password', error: error.message }, { status: 500 });
  }
}
