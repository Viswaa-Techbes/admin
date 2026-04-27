import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response: backendResponse, payload } = await fetchBackend('/admin/login', {
      method: 'POST',
      body,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload.message || 'Login failed' },
        { status: backendResponse.status }
      );
    }

    const { token, user } = payload.data;
    const nextResponse = NextResponse.json({
      message: payload.message || 'Logged in successfully',
      role: user.role,
      user,
    });

    nextResponse.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ message: error.message || 'Login failed' }, { status: 500 });
  }
}
