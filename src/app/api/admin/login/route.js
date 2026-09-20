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
        { success: false, message: payload.message || 'Login failed' },
        { status: backendResponse.status }
      );
    }

    // Handle MFA Challenge
    if (payload.mfaRequired) {
      return NextResponse.json({
        success: true,
        mfaRequired: true,
        tempToken: payload.tempToken,
        email: payload.email,
        message: payload.message || 'Verification code sent to admin email.',
        devOtp: payload.devOtp,
      });
    }

    const { token, user } = payload.data || payload;
    const nextResponse = NextResponse.json({
      success: true,
      message: payload.message || 'Logged in successfully',
      role: user.role,
      user,
      token,
    });

    // Admin Session Cookie: 7 days maxAge, HttpOnly, SameSite=Lax, Secure in prod
    nextResponse.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days (backend enforces 30m inactivity via lastSeen)
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Login failed' }, { status: 500 });
  }
}
