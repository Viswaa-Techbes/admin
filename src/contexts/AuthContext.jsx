"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const AUTH_TIMEOUT_MS = 30000;
const DIRECT_BACKEND_URL = 'https://api.techbes.co.in';

function setAuthTokenCookie(token) {
  if (typeof document !== 'undefined' && token) {
    const isHttps = window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    // 7 days expiration (604800 seconds) matching backend 7d JWT validity
    document.cookie = `auth-token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Strict${secureFlag}`;
    try {
      localStorage.setItem('auth-token', token);
    } catch (_) {}
  }
}

async function authFetch(url, options = {}, timeoutMs = AUTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers || {}),
      },
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = { message: res.ok ? 'Invalid response' : `Authentication server error (${res.status})` };
    }

    if (!res.ok) {
      const err = new Error(data.message || 'Authentication request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Authentication request timed out. Please try again.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user?.role === 'admin' ? data.user : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const login = async (email, password) => {
    let data;
    try {
      // Primary: Route through Next.js proxy
      data = await authFetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      }, 15000);
    } catch (proxyErr) {
      console.warn('[Auth] Next.js login proxy attempt encountered issue, attempting direct backend connection:', proxyErr.message);
      // Secondary: Fall back directly to backend API via CORS
      try {
        data = await authFetch(`${DIRECT_BACKEND_URL}/admin/login`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }, AUTH_TIMEOUT_MS);
      } catch (directErr) {
        // Prefer the most descriptive error message
        const finalMsg = directErr.message || proxyErr.message || 'Unable to connect to the authentication service. Please try again.';
        throw new Error(finalMsg);
      }
    }

    if (data.mfaRequired) {
      return {
        mfaRequired: true,
        tempToken: data.tempToken,
        email: data.email,
        message: data.message,
        devOtp: data.devOtp,
      };
    }

    const adminUser = data.user || data.data?.user;
    const token = data.token || data.data?.token;
    if (token) {
      setAuthTokenCookie(token);
    }
    setUser(adminUser);
    router.push('/admin');
    return { success: true, user: adminUser };
  };

  const verifyMfa = async (tempToken, otp, email) => {
    let data;
    try {
      // Primary: Route through Next.js proxy
      data = await authFetch('/api/admin/mfa-verify', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ tempToken, otp, email }),
      }, 15000);
    } catch (proxyErr) {
      console.warn('[Auth] Next.js MFA proxy attempt encountered issue, attempting direct backend verification:', proxyErr.message);
      // Secondary: Fall back directly to backend API via CORS
      try {
        data = await authFetch(`${DIRECT_BACKEND_URL}/admin/mfa-verify`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ tempToken, otp, email }),
        }, AUTH_TIMEOUT_MS);
      } catch (directErr) {
        const finalMsg = directErr.message || proxyErr.message || 'MFA verification failed. Please try again.';
        throw new Error(finalMsg);
      }
    }

    const adminUser = data.user || data.data?.user;
    const token = data.token || data.data?.token;
    if (token) {
      setAuthTokenCookie(token);
    }
    setUser(adminUser);
    router.push('/admin');
    return { success: true, user: adminUser };
  };

  const resendMfa = async (tempToken, email) => {
    try {
      return await authFetch('/api/admin/mfa-resend', {
        method: 'POST',
        body: JSON.stringify({ tempToken, email }),
      }, 15000);
    } catch (proxyErr) {
      return await authFetch(`${DIRECT_BACKEND_URL}/admin/mfa-resend`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ tempToken, email }),
      }, AUTH_TIMEOUT_MS);
    }
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      return true;
    }
    const data = await res.json();
    throw new Error(data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyMfa,
        resendMfa,
        register,
        logout,
        refreshUser: checkUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
