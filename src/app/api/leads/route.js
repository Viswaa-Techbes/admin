import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response, payload } = await fetchBackend('/leads', {
      method: 'POST',
      token: getAuthToken(req),
      body,
    });
    return NextResponse.json(payload, { status: response.status });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { response, payload } = await fetchBackend('/leads', {
      token: getAuthToken(req),
    });
    return NextResponse.json(payload, { status: response.status });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}
