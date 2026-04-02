import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function GET(req) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { response, payload } = await fetchBackend('/auth/me', { token });
    return NextResponse.json(
      { user: payload.data, message: payload.message },
      { status: response.status }
    );
  } catch {
    return NextResponse.json({ message: 'Token invalid' }, { status: 401 });
  }
}
