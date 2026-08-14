import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, X, ShieldCheck, Mail, Phone, Key, ArrowLeft, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { sendOtpRequest } from '../../services/authService.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  // Form State
  const [step, setStep] = useState(1); // 1 = Details & Method, 2 = Enter OTP
  const [verificationMethod, setVerificationMethod] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({
    name: '',
    email: prefillEmail,
    phone: '',
    password: '',
    otp: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [demoOtp, setDemoOtp] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [activeMetric, setActiveMetric] = useState(null);

  // Resend Countdown Effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Request OTP (Step 1 -> Step 2)
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanName = (form.name || '').trim();
    const cleanEmail = (form.email || '').trim().toLowerCase();
    const cleanPhone = (form.phone || '').trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (verificationMethod === 'email') {
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      if (!cleanPhone || !/^\+?[0-9]{10,15}$/.test(cleanPhone.replace(/[\s\-\(\)]/g, ''))) {
        setError('Please enter a valid 10+ digit mobile phone number (e.g. +91 9876543210).');
        return;
      }
    }

    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendOtpRequest({
        verificationMethod,
        email: cleanEmail,
        phone: cleanPhone,
      });

      setInfoMessage(res.message || 'Verification code sent!');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send verification code. Please check details.';
      setError(errMsg);

      // Extract wait seconds if 60s cooldown is active on backend
      const waitMatch = errMsg.match(/wait (\d+) seconds/i);
      if (waitMatch && waitMatch[1]) {
        const secs = parseInt(waitMatch[1], 10);
        setResendCooldown(secs);
        setStep(2);
      }
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Complete Registration with OTP (Step 2)
  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    const cleanName = (form.name || '').trim();
    const cleanEmail = (form.email || '').trim().toLowerCase();
    const cleanPhone = (form.phone || '').trim();
    const cleanOtp = (form.otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit numeric verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        verificationMethod,
        password: form.password,
        otp: cleanOtp,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordChecks = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(form.password) },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0D1026]">
        {/* Glow Effects */}
        <div className="absolute -left-10 -top-10 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#ea580c]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-[#db2777]/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <svg viewBox="0 0 100 100" className="h-10 w-10 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="joynRegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="25" r="14" fill="#ea580c" />
              <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynRegGrad)" />
              <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="text-2xl font-black tracking-wider text-white font-display">JOYN</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 font-display">
            Find Your People.<br />Do More Together.
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Discover, create and join real-world activities with verified people nearby.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '12K+', label: 'Completed' },
              { value: '45K+', label: 'Verified Users' },
              { value: '120+', label: 'Cities' },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveMetric(label)}
                className="flex flex-col items-start hover:bg-white/5 p-2 rounded-xl border border-transparent hover:border-white/10 active:scale-[0.98] transition-all text-left w-full select-none"
              >
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-white/60">{label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-ink-50 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <svg viewBox="0 0 100 100" className="h-8 w-8 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="25" r="14" fill="#ea580c" />
              <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynRegGrad)" />
              <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="font-display text-lg font-black tracking-wider text-ink-800">JOYN</span>
          </div>

          {step === 1 ? (
            /* STEP 1: Details & Method Selection */
            <div>
              <h1 className="text-2xl font-bold text-ink-800 mb-1">Create your account</h1>
              <p className="text-sm text-ink-400 mb-6">
                Choose your preferred verification method to get started.
              </p>

              {/* Verification Method Toggle */}
              <div className="mb-3 rounded-xl bg-ink-150 p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationMethod('email');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    verificationMethod === 'email'
                      ? 'bg-white text-ink-900 shadow-sm ring-1 ring-emerald-500/30'
                      : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Mail className="h-4 w-4 text-brand-500" />
                  <span>Email Verification</span>
                  <span className="ml-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Active
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationMethod('phone');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    verificationMethod === 'phone'
                      ? 'bg-white text-ink-900 shadow-sm border border-amber-300'
                      : 'text-ink-400 hover:text-ink-600 opacity-80'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                  <span>WhatsApp</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
                    Soon
                  </span>
                </button>
              </div>

              {/* Highlighted Bended Arrow Pointer Callout — Displayed ONLY when WhatsApp is selected */}
              {verificationMethod === 'phone' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-start gap-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 p-3 text-xs text-amber-900 shadow-sm"
                >
                  <svg
                    className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    title="Pointer arrow to WhatsApp option"
                  >
                    <path d="M9 14L4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                  </svg>
                  <div>
                    <p className="font-bold text-amber-950">
                      WhatsApp verification is currently unavailable — we are working on it!
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      ✅ <strong className="text-emerald-700 font-bold">Email Verification is 100% active.</strong> Please select Email Verification above to register instantly.
                    </p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
                  <input
                    id="reg-name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 w-full rounded-lg border border-ink-200 bg-white px-4 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Arjun Sharma"
                  />
                </div>

                {verificationMethod === 'email' ? (
                  <div>
                    <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-ink-700">Email Address</label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-11 w-full rounded-lg border border-ink-200 bg-white px-4 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      placeholder="you@example.com"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="reg-phone" className="text-sm font-medium text-ink-700">WhatsApp Mobile Phone Number</label>
                      <span className="text-2xs font-semibold text-amber-600">Not available now — working on this</span>
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-11 w-full rounded-lg border border-ink-200 bg-white px-4 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      placeholder="+91 9876543210"
                    />
                    <p className="mt-1 text-3xs text-ink-400 font-medium">Verification code will be dispatched directly to your WhatsApp app.</p>
                  </div>
                )}

                <div>
                  <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-11 w-full rounded-lg border border-ink-200 bg-white px-4 pr-11 text-sm text-ink-800 placeholder-ink-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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

                  {form.password.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {passwordChecks.map(({ label, met }) => (
                        <span key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-accent-green' : 'text-ink-300'}`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp || resendCooldown > 0}
                  className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  {resendCooldown > 0 ? `Resend Code Available in ${resendCooldown}s` : 'Send Verification Code (OTP)'}
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: Enter OTP Code */
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to details
              </button>

              <h1 className="text-2xl font-bold text-ink-800 mb-1">Enter Verification Code</h1>
              <p className="text-sm text-ink-500 mb-6">
                We sent a 6-digit verification code to{' '}
                <strong className="text-ink-900">
                  {verificationMethod === 'email' ? form.email : form.phone}
                </strong>
              </p>

              {infoMessage && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
                  ✔ {infoMessage}
                </div>
              )}

              <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="reg-otp" className="mb-1.5 block text-sm font-medium text-ink-700">
                    6-Digit Verification OTP
                  </label>
                  <input
                    id="reg-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/[^0-9]/g, '') })}
                    className="h-12 w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-lg border border-ink-200 bg-white px-4 text-ink-900 placeholder-ink-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="000000"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || form.otp.length !== 6}
                  className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  Verify & Create Account
                </button>

                <div className="text-center mt-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingOtp}
                    onClick={handleSendOtp}
                    className={`inline-flex items-center gap-2 text-xs font-bold transition-all px-4 py-2 rounded-xl ${
                      resendCooldown > 0
                        ? 'bg-ink-150 text-ink-500 cursor-not-allowed border border-ink-200'
                        : 'text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 shadow-xs'
                    }`}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend OTP Code'}
                  </button>
                  {resendCooldown > 0 && (
                    <span className="text-3xs text-ink-400 font-medium">
                      Next verification request available after timer completes
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-ink-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Metric Details Modal */}
      {activeMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-[2rem] bg-white border border-slate-200 shadow-2xl p-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                {activeMetric === 'Completed' && '12,000+ Activities Completed'}
                {activeMetric === 'Verified Users' && '45,000+ Verified Members'}
                {activeMetric === 'Cities' && 'Available in 120+ Cities'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveMetric(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">
              {activeMetric === 'Completed' && (
                <p>
                  JOYN is an active community! Over 12,000 group gatherings, sports matches, road trips, and social meetups have been successfully completed by our members. Every completed activity builds trust scores and expands the local neighborhood network.
                </p>
              )}
              {activeMetric === 'Verified Users' && (
                <p>
                  We prioritize safety and authenticity. Over 45,000 members have securely verified their official government-issued identity documents. Verified profiles help eliminate catfish profiles, spam, and fraud, making it safe to meet offline.
                </p>
              )}
              {activeMetric === 'Cities' && (
                <p>
                  From metropolitan hubs to local college campuses, JOYN operates in over 120 cities across the region, connecting people with similar vibes, hobbies, and sports interests wherever they travel.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveMetric(null)}
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
