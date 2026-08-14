import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key, Info, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function Login() {
  const { login, sessionExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/';
  const isSessionExpired = location.state?.sessionExpired || sessionExpiredNotice;

  // --- Client-side validation ---
  function validate(credentials) {
    const errs = {};
    const inputTrimmed = credentials.email.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputTrimmed);
    const isPhone = /^\+?[0-9]{10,15}$/.test(inputTrimmed.replace(/[\s\-\(\)]/g, ''));

    if (!inputTrimmed) {
      errs.email = 'Email or mobile phone number is required.';
    } else if (!isEmail && !isPhone) {
      errs.email = 'Please enter a valid email address or 10+ digit mobile number.';
    }

    if (!credentials.password) {
      errs.password = 'Password is required.';
    } else if (credentials.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    return errs;
  }

  async function handleSubmit(e, credentials = form) {
    if (e) e.preventDefault();

    // Reset previous errors
    setError(null);
    setErrorCode(null);
    setInfoMessage(null);
    setFieldErrors({});

    // BUG 8: Validate before making API request
    const errs = validate(credentials);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return; // No API call for invalid input
    }

    // BUG 7: Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await login({ email: credentials.email.trim(), password: credentials.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // BUG 1, 2, 4, 5: Categorised error handling — always stops loading
      const responseData = err.response?.data;
      const code = responseData?.errorCode || null;
      const message = responseData?.message;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK';
      const isNetworkError = !err.response && !isTimeout;

      if (isTimeout || isNetworkError) {
        // BUG 4 & 5: Network/timeout — never keep spinning
        setError('Unable to connect to JOYN. Please check your connection and try again.');
        setErrorCode('network_error');
      } else if (code === 'account_not_found') {
        // BUG 1: Account doesn't exist — show Create Account CTA
        setError(message || 'No account found with this email.');
        setErrorCode('account_not_found');
      } else if (code === 'invalid_credentials' || err.response?.status === 401) {
        // BUG 2: Wrong password — stay on login, no redirect to signup
        setError(message || 'Incorrect email or password.');
        setErrorCode('invalid_credentials');
      } else if (err.response?.status === 403) {
        // BUG 10: Suspended account
        setError(message || 'Your account has been suspended. Please contact support.');
        setErrorCode('suspended');
      } else {
        setError(message || 'Something went wrong. Please try again.');
        setErrorCode(null);
      }
    } finally {
      // BUG 5 & 7: GUARANTEED to stop loading no matter what happens
      setIsSubmitting(false);
    }
  }

  const handleForgotPassword = () => {
    setError(null);
    setInfoMessage('If an account with that email exists, password reset instructions have been sent to your email address.');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0D1026]">
        {/* Glow Effects */}
        <div className="absolute -left-10 -top-10 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#ea580c]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-[#db2777]/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to="/" className="flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity self-start">
            <svg viewBox="0 0 100 100" className="h-10 w-10 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="joynLoginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="25" r="14" fill="#ea580c" />
              <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynLoginGrad)" />
              <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="text-2xl font-black tracking-wider text-white font-display">JOYN</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 font-display">
            Find Your People.<br />Do More Together.
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Discover, create and join real-world activities with verified people nearby.
          </p>

          {/* Feature badges */}
          <div className="mt-10 flex flex-wrap gap-3">
            {['Verified Users', 'Trust Scores', 'Safe Meetups', 'Activity Rooms'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFeature(f)}
                className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/5 hover:bg-white/20 transition-all active:scale-[0.98] select-none"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-ink-50 px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md my-auto"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden hover:opacity-90 transition-opacity">
            <svg viewBox="0 0 100 100" className="h-8 w-8 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="joynLoginGradMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="25" r="14" fill="#ea580c" />
              <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynLoginGradMobile)" />
              <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="font-display text-lg font-black tracking-wider text-ink-800">JOYN</span>
          </Link>

          <h1 className="text-2xl font-bold text-ink-800 mb-1">Welcome back</h1>
          <p className="text-sm text-ink-400 mb-6">
            Log in to find and join activities near you.
          </p>

          {isSessionExpired && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start text-amber-800">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Session Expired</p>
                <p className="text-sm font-medium text-amber-900 mt-0.5">
                  Your session has expired. Please log in again.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink-700">Email or Mobile Phone Number</label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: null })); }}
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'
                }`}
                placeholder="you@example.com or +91 9876543210"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-ink-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: null })); }}
                  className={`h-11 w-full rounded-lg border bg-white px-4 pr-11 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* BUG 1 — Account not found: show Create Account CTA with pre-filled email */}
            {errorCode === 'account_not_found' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Account not found</p>
                <p className="text-xs text-amber-700 mb-3">{error}</p>
                <Link
                  to={`/register?email=${encodeURIComponent(form.email.trim())}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* BUG 4 — Network / timeout error with Try Again */}
            {errorCode === 'network_error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800 mb-1">Cannot connect</p>
                <p className="text-xs text-red-700 mb-3">{error}</p>
                <button
                  type="button"
                  onClick={() => handleSubmit(null, form)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* BUG 10 — Suspended or other generic errors */}
            {error && errorCode !== 'account_not_found' && errorCode !== 'network_error' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="rounded-lg bg-brand-50 border border-brand-100 p-4 flex gap-2.5 text-xs text-brand-700 leading-relaxed">
                <Info className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
                <p>{infoMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              Log in
            </button>
          </form>



          <p className="mt-8 text-center text-sm text-ink-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Feature Explainer Modal */}
      {activeFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-[2rem] bg-white border border-slate-200 shadow-2xl p-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                {activeFeature}
              </h3>
              <button
                type="button"
                onClick={() => setActiveFeature(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed space-y-3">
              {activeFeature === 'Verified Users' && (
                <p>
                  We secure our community by verifying all member identities. Verification is voluntary but highly recommended! We cross-verify government-issued IDs, and immediately destroy the verification documents once identity is confirmed. Verified members receive the green Shield Check badge, reassuring others of their authenticity.
                </p>
              )}
              {activeFeature === 'Trust Scores' && (
                <p>
                  To encourage reliable participation, JOYN implements a community trust score from 0 to 100. It starts at a baseline of 50. Successful activity completions and positive ratings from others increase your score. Last-minute cancellations, no-shows, and reports filed against your profile cause significant penalties. High-trust scores yield better request approval rates!
                </p>
              )}
              {activeFeature === 'Safe Meetups' && (
                <p>
                  Safety is our priority. Always meet in well-lit, public locations (such as public turfs, popular cafes, or civic spaces). Avoid private/isolated settings for initial meetings. Keep friends/family informed of your plans, check other members' trust scores before joining, and instantly report any guidelines violations.
                </p>
              )}
              {activeFeature === 'Activity Rooms' && (
                <p>
                  Every approved activity opens a private room for group communication. Confirmed participants also unlock a shared Trip Workspace featuring transparent expense splitting (automatically calculated), shared collaborative checklists, and interactive scheduling polls.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveFeature(null)}
              className="mt-6 w-full h-10 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
