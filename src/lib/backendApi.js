import { NextResponse } from 'next/server';

export const RENDER_BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  'https://api.techbes.co.in';

const API_BASE_URL = RENDER_BACKEND_URL;
const FETCH_TIMEOUT_MS = 90000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2500;

export function getBackendUrl(path) {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(req) {
  return req.cookies.get('auth-token')?.value || '';
}

async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(error, response) {
  if (error?.name === 'AbortError') return true;
  if (error?.message?.includes('fetch failed')) return true;
  if (error?.message?.includes('ECONNRESET')) return true;
  if (error?.message?.includes('ETIMEDOUT')) return true;
  if (response && (response.status === 502 || response.status === 503 || response.status === 504)) {
    return true;
  }
  return false;
}

export async function fetchBackend(
  path,
  { method = 'GET', body, token, retries = MAX_RETRIES } = {}
) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(getBackendUrl(path), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {
          message: response.ok
            ? 'Invalid backend response'
            : `Backend error (${response.status})`,
        };
      }

      if (!response.ok && isRetryable(null, response) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }

      return { response, payload };
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }

      if (err.name === 'AbortError') {
        throw new Error(
          'Backend request timed out. The server may be restarting — please wait and try again.'
        );
      }

      throw new Error(
        err.message ||
          `Failed to reach backend (${RENDER_BACKEND_URL}). Check your connection and try again.`
      );
    }
  }

  throw lastError || new Error('Failed to reach Render backend');
}

export async function wakeBackend() {
  try {
    await fetchBackend('/api/health', { retries: 2 });
    return true;
  } catch {
    return false;
  }
}

export function toNextJson(payload, status) {
  return NextResponse.json(payload, { status });
}
