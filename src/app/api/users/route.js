import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function GET(req) {
  try {
    const { response, payload } = await fetchBackend('/admin/users', {
      token: getAuthToken(req),
    });

    return NextResponse.json(
      { users: payload.data || [], message: payload.message },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
  }
}
