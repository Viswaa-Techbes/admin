"use client";
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Something went wrong' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900" />
      </div>
      <button type="submit" className="w-full py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-md transition-all mt-4">Reset Password</button>
      {status.msg && (
        <div className={`p-3 rounded-xl text-sm mt-4 border ${status.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {status.msg}
        </div>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
        </div>
        <Suspense fallback={<div className="text-center text-slate-500">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
