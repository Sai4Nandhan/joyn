import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { forgotPasswordRequest, verifyResetOtpRequest, resetPasswordRequest } from '../../services/authService.js';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step 1: Request OTP | Step 2: Verify OTP | Step 3: Set New Password | Step 4: Success
  const [step, setStep] = useState(1);

  // Form states
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Countdown timer for OTP resend (60s)
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Paste full OTP code
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6 && /^[0-9]$/.test(char)) {
          newOtp[i] = char;
        }
      });
      setOtp(newOtp);
      const nextInput = document.getElementById(`otp-input-${Math.min(pasted.length, 5)}`);
      if (nextInput) nextInput.focus();
      return;
    }

    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setError(method === 'email' ? 'Please enter your registered email address.' : 'Please enter your registered phone number.');
      return;
    }

    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await forgotPasswordRequest({ contact: trimmedContact, method });
      setInfoMessage(res.message || 'If an account is associated with that contact, a verification code has been sent.');
      setStep(2);
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyResetOtpRequest({
        contact: contact.trim(),
        method,
        otp: fullOtp,
      });

      if (res.data?.resetToken || res.resetToken) {
        setResetToken(res.data?.resetToken || res.resetToken);
        setStep(3);
      } else {
        setError('Verification failed. Invalid reset token returned.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('New password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordRequest({
        resetToken,
        newPassword,
      });
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please request a new verification code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-0 bottom-0 w-96 h-96 rounded-full bg-rose-600/15 blur-[140px]" />
      </div>

      <div className="relative z-10 flex w-full flex-col justify-center items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <span className="text-xs font-bold text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
              Step {step} of 3
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 text-white shadow-lg shadow-violet-500/20">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-xs text-slate-400">
              {step === 1 && 'Where should we send your verification code?'}
              {step === 2 && 'Enter the 6-digit code sent to your contact.'}
              {step === 3 && 'Create a new secure password for your JOYN account.'}
              {step === 4 && 'Your password has been successfully reset!'}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex gap-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && step === 2 && (
            <div className="mb-6 rounded-xl bg-violet-500/10 border border-violet-500/30 p-4 flex gap-3 text-xs text-violet-300">
              <CheckCircle2 className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT METHOD & ENTER CONTACT */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setMethod('email'); setError(null); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    method === 'email'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="h-4 w-4 text-violet-400" />
                  Email OTP
                </button>

                <button
                  type="button"
                  onClick={() => { setMethod('phone'); setError(null); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    method === 'phone'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Phone className="h-4 w-4 text-rose-400" />
                  Mobile SMS OTP
                </button>
              </div>

              {/* Contact Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {method === 'email' ? 'Registered Email Address' : 'Registered Mobile Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type={method === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={(e) => { setContact(e.target.value); setError(null); }}
                    placeholder={method === 'email' ? 'you@example.com' : '+91 9876543210'}
                    className="h-12 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-3 text-center">
                  Verification Code (6-digit)
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-12 w-12 text-center rounded-xl bg-slate-950 border border-slate-800 text-lg font-bold text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Didn't receive code?</span>
                {cooldown > 0 ? (
                  <span className="text-slate-500 font-mono">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                    placeholder="At least 8 chars with 1 number"
                    className="h-12 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 pr-11 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Re-enter new password"
                  className="h-12 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been reset successfully. All active sessions have been invalidated for your security. You can now log in using your new password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-600/20"
              >
                Proceed to Login
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
