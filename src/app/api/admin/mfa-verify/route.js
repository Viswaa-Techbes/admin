import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response: backendResponse, payload } = await fetchBackend('/admin/mfa-verify', {
      method: 'POST',
      body,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, message: payload.message || 'MFA verification failed' },
        { status: backendResponse.status }
      );
    }

    const { token, user } = payload.data || payload;
    const nextResponse = NextResponse.json({
      success: true,
      message: payload.message || 'MFA verified successfully',
      role: user.role,
      user,
    });

    nextResponse.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
