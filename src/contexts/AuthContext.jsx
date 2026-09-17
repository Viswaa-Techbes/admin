"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const AUTH_TIMEOUT_MS = 15000;

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
      throw new Error(data.message || 'Authentication request failed');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Unable to connect to the authentication service. Please try again.');
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
    const data = await authFetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (data.mfaRequired) {
      return {
        mfaRequired: true,
        tempToken: data.tempToken,
        email: data.email,
        message: data.message,
        devOtp: data.devOtp,
      };
    }

    setUser(data.user);
    router.push('/admin');
    return { success: true, user: data.user };
  };

  const verifyMfa = async (tempToken, otp, email) => {
    const data = await authFetch('/api/admin/mfa-verify', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ tempToken, otp, email }),
    });

    setUser(data.user);
    router.push('/admin');
    return { success: true, user: data.user };
  };

  const resendMfa = async (tempToken, email) => {
    return await authFetch('/api/admin/mfa-resend', {
      method: 'POST',
      body: JSON.stringify({ tempToken, email }),
    });
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
