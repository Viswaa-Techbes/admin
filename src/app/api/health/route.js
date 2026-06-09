import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function GET() {
  try {
    const { response, payload } = await fetchBackend('/api/health', { retries: 2 });
    return NextResponse.json(
      { ...payload, backend: 'render', proxy: 'ok' },
      { status: response.status }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Backend unreachable',
        backend: 'render',
      },
      { status: 503 }
    );
  }
}
