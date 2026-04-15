import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function GET(req) {
  try {
    const { response, payload } = await fetchBackend('/admin/payment-requests', {
      token: getAuthToken(req),
    });

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
