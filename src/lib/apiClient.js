/**
 * Client-side API helper — always sends auth cookies to the Next.js proxy,
 * which forwards requests to the production backend.
 */

export const RENDER_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  'https://api.techbes.co.in';

export async function apiFetch(path, options = {}) {
  const { body, headers = {}, method = 'GET', ...rest } = options;

  const res = await fetch(path, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: {
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
    await fetch('/api/health', { credentials: 'include', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}
