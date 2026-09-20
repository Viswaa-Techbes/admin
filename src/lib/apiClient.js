/**
 * Client-side API helper — always sends auth cookies and CSRF headers to the Next.js proxy,
 * which forwards requests to the production backend.
 */

export const RENDER_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  'https://api.techbes.co.in';

function getClientToken() {
  if (typeof window === 'undefined') return '';
  try {
    const local = localStorage.getItem('auth-token') || localStorage.getItem('token');
    if (local) return local;
  } catch (_) {}
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)(?:auth-token|token)=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return '';
}

export async function apiFetch(path, options = {}) {
  const { body, headers = {}, method = 'GET', ...rest } = options;

  const clientToken = getClientToken();
  const authHeader = clientToken ? { Authorization: `Bearer ${clientToken}` } : {};

  // Self-heal cookie if present in localStorage but missing from cookies
  if (clientToken && typeof document !== 'undefined' && !document.cookie.includes('auth-token=')) {
    const isHttps = window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `auth-token=${encodeURIComponent(clientToken)}; path=/; max-age=604800; SameSite=Strict${secureFlag}`;
  }

  const res = await fetch(path, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Protection': '1',
      ...authHeader,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body:
      body !== undefined
        ? typeof body === 'string'
          ? body
          : JSON.stringify(body)
        : undefined,
    ...rest,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = { message: `Request failed (${res.status})` };
  }

  if (!res.ok) {
    const message =
      payload.message ||
      (res.status === 401
        ? 'Authentication required. Please log in again.'
        : res.status === 503
          ? 'Backend is waking up. Please wait and try again.'
          : `Request failed (${res.status})`);
    throw new Error(message);
  }

  return { res, payload, data: payload.data ?? payload };
}

/** Ping backend via the Next.js health proxy. */
export async function wakeBackend() {
  try {
    await fetch('/api/health', {
      credentials: 'include',
      cache: 'no-store',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    return true;
  } catch {
    return false;
  }
}
