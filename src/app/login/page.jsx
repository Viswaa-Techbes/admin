"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, verifyMfa, resendMfa } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // MFA states
  const [mfaStep, setMfaStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, router, user]);

  // Countdown timer for MFA resend cooldown
  useEffect(() => {
    let timer;
    if (mfaStep && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mfaStep, countdown]);

  async function handleCredentialsSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setInfoMessage("");

      const result = await login(email, password);

      if (result && result.mfaRequired) {
        setTempToken(result.tempToken);
        setMaskedEmail(result.email || email);
        setMfaStep(true);
        setCountdown(60);
        setCanResend(false);
        setInfoMessage(result.message || "A 6-digit verification code has been dispatched to your email.");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await verifyMfa(tempToken, otp, email);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendMfa() {
    if (!canResend) return;
    try {
      setSubmitting(true);
      setError("");
      const res = await resendMfa(tempToken, email);
      setInfoMessage(res.message || "New verification code dispatched.");
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackToLogin() {
    setMfaStep(false);
    setOtp("");
    setError("");
    setInfoMessage("");
    setTempToken("");
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-900 text-slate-300 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying security session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-800/80">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 mx-auto mb-3 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30">
            TB
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TechBes Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            {mfaStep ? "Second-Factor Verification (2FA)" : "Sign in to access control management"}
          </p>
        </div>

        {/* Status Alerts */}
        {error ? (
          <div role="alert" className="p-3.5 rounded-2xl text-sm mb-4 border bg-rose-950/50 text-rose-300 border-rose-800/60 flex items-start gap-2.5">
            <span className="text-rose-400 font-bold">✕</span>
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        ) : null}

        {infoMessage ? (
          <div role="status" className="p-3.5 rounded-2xl text-sm mb-4 border bg-cyan-950/50 text-cyan-200 border-cyan-800/60 flex items-start gap-2.5">
            <span className="text-cyan-400 font-bold">ℹ</span>
            <span className="flex-1 leading-snug">{infoMessage}</span>
          </div>
        ) : null}

        {!mfaStep ? (
          /* Step 1: Email & Password Form */
          <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@techbes.co.in"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-700 bg-slate-800/90 text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-semibold p-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-150 flex items-center justify-center gap-2 mt-6"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Continue to MFA →</span>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: MFA OTP Verification */
          <form onSubmit={handleMfaSubmit} className="space-y-5" noValidate>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl text-center">
              <p className="text-xs text-slate-400">Security code dispatched to:</p>
              <p className="text-sm font-bold text-indigo-300 mt-0.5 tracking-wide">{maskedEmail}</p>
            </div>

            <div>
              <label htmlFor="mfa-otp" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                Enter 6-Digit OTP
              </label>
              <input
                id="mfa-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                placeholder="123456"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800/90 text-white text-center tracking-[0.4em] font-mono text-xl placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify & Access Dashboard</span>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-slate-400 hover:text-slate-200 font-semibold transition-colors"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                disabled={!canResend || submitting}
                onClick={handleResendMfa}
                className={`font-semibold transition-colors ${
                  canResend ? "text-cyan-400 hover:text-cyan-300 cursor-pointer" : "text-slate-600 cursor-not-allowed"
                }`}
              >
                {canResend ? "Resend Code" : `Resend in ${countdown}s`}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <span>Protected by TechBes Security Control. All activities are audited.</span>
        </div>
      </div>
    </div>
  );
}
