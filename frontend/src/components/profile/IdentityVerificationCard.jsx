import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, Phone, Mail, UserCheck } from 'lucide-react';

export function IdentityVerificationCard({ user }) {
  const verification = user?.verification || {};
  const status = verification.status || (user?.isIdentityVerified ? 'VERIFIED' : 'NOT_STARTED');
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING' || status === 'REQUIRES_REVIEW';
  const isFailed = status === 'FAILED';

  return (
    <div className="rounded-2xl border border-ink-100 bg-white/80 p-6 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink-100 dark:border-ink-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-ink-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-500" /> Identity Verification
            </h3>
            {isVerified && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified
              </span>
            )}
            {isPending && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-3xs font-extrabold text-amber-700 dark:bg-amber-950/30 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> Pending Review
              </span>
            )}
            {isFailed && (
              <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-3xs font-extrabold text-red-600 dark:bg-red-950/30 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" /> Action Needed
              </span>
            )}
          </div>
          <p className="text-xs text-ink-400 dark:text-slate-400 mt-1">
            Verified members gain higher trust scores, host privileges, and faster activity approvals.
          </p>
        </div>

        <div>
          {!isVerified && !isPending && (
            <Link
              to="/verification"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition-all"
            >
              <UserCheck className="h-4 w-4" /> Verify Identity <ChevronRight className="h-4 w-4" />
            </Link>
          )}

          {isPending && (
            <Link
              to="/verification"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-all"
            >
              Check Status <ChevronRight className="h-4 w-4" />
            </Link>
          )}

          {isFailed && (
            <Link
              to="/verification"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all"
            >
              Retry Verification <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Verification Checklist Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-ink-50/50 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-ink-800 dark:text-white flex items-center gap-1">
              <Phone className="h-3 w-3 text-ink-400" /> Phone Verified
            </p>
            <p className="text-3xs text-ink-400 dark:text-slate-500">Security check complete</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-ink-50/50 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-ink-800 dark:text-white flex items-center gap-1">
              <Mail className="h-3 w-3 text-ink-400" /> Email Verified
            </p>
            <p className="text-3xs text-ink-400 dark:text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${
          isVerified
            ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20'
            : isPending
            ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20'
            : isFailed
            ? 'bg-red-50/40 border-red-200 dark:bg-red-950/20'
            : 'bg-ink-50/50 border-ink-150 dark:bg-slate-900/40'
        }`}>
          {isVerified ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          ) : isPending ? (
            <Clock className="h-4 w-4 text-amber-500 animate-pulse flex-shrink-0" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-ink-300 flex-shrink-0" />
          )}

          <div>
            <p className="text-xs font-bold text-ink-800 dark:text-white">
              {isVerified ? 'Identity Verified' : isPending ? 'Identity Pending' : isFailed ? 'Identity Failed' : 'Identity Unverified'}
            </p>
            <p className="text-3xs text-ink-400 dark:text-slate-500">
              {isVerified ? 'Live photo & face match confirmed' : isPending ? 'Selfie verification in review' : isFailed ? verification.rejectionReason || 'Requires resubmission' : 'Live selfie & photo match required'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
