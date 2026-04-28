import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req) {
  const token = req.cookies.get('auth-token')?.value;
  const path = req.nextUrl.pathname;

  // Protect all API routes except auth
  if (path.startsWith('/api') && !path.startsWith('/api/auth') && path !== '/api/admin/login') {
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Role-based logic can be added here
    // Example: if (req.nextUrl.pathname.startsWith('/api/admin') && payload.role !== 'admin') ...
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
