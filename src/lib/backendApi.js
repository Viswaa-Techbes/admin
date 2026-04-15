import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://10.246.194.196:5000';

export function getBackendUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(req) {
  return req.cookies.get('auth-token')?.value || '';
}

export async function fetchBackend(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(getBackendUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = { message: 'Invalid backend response' };
  }

  return { response, payload };
}

export function toNextJson(payload, status) {
  return NextResponse.json(payload, { status });
}
