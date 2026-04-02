import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function GET(req) {
  try {
    const { response, payload } = await fetchBackend('/admin/jobs', {
      token: getAuthToken(req),
    });

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { response, payload } = await fetchBackend('/admin/jobs', {
      method: 'POST',
      token: getAuthToken(req),
      body,
    });

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
