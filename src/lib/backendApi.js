import { NextResponse } from 'next/server';

// Production primary backend domain
const PRODUCTION_BACKEND_DOMAIN = 'https://api.techbes.co.in';

export function getPrimaryBackendUrl() {
  const envUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (process.env.NODE_ENV === 'production') {
    // If production environment was configured with localhost, ignore it and use production domain
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return PRODUCTION_BACKEND_DOMAIN;
    }
    return envUrl;
  }

  return envUrl || PRODUCTION_BACKEND_DOMAIN;
}

export const RENDER_BACKEND_URL = getPrimaryBackendUrl();
const FETCH_TIMEOUT_MS = 90000;
const AUTH_FETCH_TIMEOUT_MS = 35000; // 35s to comfortably accommodate SMTP email dispatch
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2500;

export function getBackendUrl(path, overrideBaseUrl) {
  const baseUrl = (overrideBaseUrl || getPrimaryBackendUrl()).replace(/\/$/, '');
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
  if (error?.message?.includes('ECONNREFUSED')) return true;
  if (error?.message?.includes('ETIMEDOUT')) return true;
  if (response && (response.status === 502 || response.status === 503 || response.status === 504)) {
    return true;
  }
  return false;
}

export async function fetchBackend(
  path,
  { method = 'GET', body, token, retries, timeoutMs } = {}
) {
  const isAuthRoute = path.includes('/login') || path.includes('/mfa') || path.includes('/forgot-password') || path.includes('/reset-password');
  const effectiveTimeout = timeoutMs !== undefined ? timeoutMs : (isAuthRoute ? AUTH_FETCH_TIMEOUT_MS : FETCH_TIMEOUT_MS);
  const effectiveRetries = retries !== undefined ? retries : (isAuthRoute ? 1 : MAX_RETRIES);

  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Define candidate base URLs for dual-target resilience (production domain + internal loopback)
  const primaryUrl = getPrimaryBackendUrl();
  const candidateBases = [primaryUrl];
  if (primaryUrl.startsWith('https://')) {
    candidateBases.push('http://127.0.0.1:5000');
  } else if (!primaryUrl.includes('api.techbes.co.in')) {
    candidateBases.push(PRODUCTION_BACKEND_DOMAIN);
  }

  let lastError = null;

  for (const baseUrl of candidateBases) {
    for (let attempt = 1; attempt <= effectiveRetries; attempt++) {
      try {
        const targetUrl = getBackendUrl(path, baseUrl);
        const response = await fetchWithTimeout(targetUrl, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          cache: 'no-store',
        }, effectiveTimeout);

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

        if (!response.ok && isRetryable(null, response) && attempt < effectiveRetries) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }

        return { response, payload };
      } catch (err) {
        lastError = err;
        if (attempt < effectiveRetries && isRetryable(err)) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }

        // If this base URL failed and we have another candidate, break inner loop and try next candidate
        if (candidateBases.indexOf(baseUrl) < candidateBases.length - 1) {
          console.warn(`[backendApi] Call to ${baseUrl}${path} failed (${err.message}). Trying failover candidate...`);
          break;
        }

        if (err.name === 'AbortError') {
          throw new Error(
            'Backend request timed out. The server may be restarting — please wait and try again.'
          );
        }

        throw new Error(
          err.message ||
            `Failed to reach backend (${primaryUrl}). Check your connection and try again.`
        );
      }
    }
  }

  throw lastError || new Error('Failed to reach backend');
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
