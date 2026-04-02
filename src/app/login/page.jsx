"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await login(email, password);
    } catch (err) {
      setError(err.message || "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Checking session...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Sign In</h1>
          <p className="text-slate-500 text-sm mt-1">Use an admin account to access the control panel.</p>
        </div>
        {error ? <div className="p-3 rounded-xl text-sm mb-4 border bg-rose-50 text-rose-600 border-rose-100">{error}</div> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold rounded-xl shadow-md transition-all mt-4">
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
