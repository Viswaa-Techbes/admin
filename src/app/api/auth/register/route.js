import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response, payload } = await fetchBackend('/auth/register', {
      method: 'POST',
      body,
    });

    return NextResponse.json({ 
      message: payload.message || 'User created successfully', 
      user: payload.data?.user || payload.user
    }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Registration failed' }, { status: 500 });
  }
}
