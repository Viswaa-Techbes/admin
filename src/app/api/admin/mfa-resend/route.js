import { NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backendApi';

export async function POST(req) {
  try {
    const body = await req.json();
    const { response: backendResponse, payload } = await fetchBackend('/admin/mfa-resend', {
      method: 'POST',
      body,
    });

    return NextResponse.json(
      {
        success: backendResponse.ok,
        message: payload.message || (backendResponse.ok ? 'Code resent successfully' : 'Resend failed'),
        devOtp: payload.devOtp,
      },
      { status: backendResponse.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Resend request failed' },
      { status: 500 }
    );
  }
}
