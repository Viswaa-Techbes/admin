import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(req) {
  const token = req.cookies.get('auth-token')?.value;
  const path = req.nextUrl.pathname;

  const publicApiPrefixes = [
    '/api/auth',
    '/api/health',
    '/api/admin/login',
    '/api/admin/mfa-verify',
    '/api/admin/mfa-resend',
    '/api/admin/forgot-password',
    '/api/admin/reset-password',
  ];

  const isPublicApi = publicApiPrefixes.some((prefix) => path.startsWith(prefix));

  // Protect all internal API routes except public/auth endpoints
  if (path.startsWith('/api') && !isPublicApi) {
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
