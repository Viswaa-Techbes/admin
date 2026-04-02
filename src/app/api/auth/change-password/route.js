import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const token = getAuthToken(req);
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { response, payload } = await fetchBackend('/auth/change-password', {
      method: 'POST',
      token,
      body,
    });

    return NextResponse.json({ message: payload.message }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: 'Error changing password', error: error.message }, { status: 500 });
  }
}
