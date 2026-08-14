import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { adminListVerifications, adminReviewVerification } from '../../services/verificationService.js';

import { getImageUrl } from '../../utils/imageUrl.js';

export function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVerifications();
  }, []);

  async function loadVerifications() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminListVerifications();
      setVerifications(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load identity verifications.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReview(userId, status) {
    setActingId(userId);
    setError(null);
    try {
      const reason = rejectionReasons[userId] || '';
      await adminReviewVerification(userId, status, reason);
      await loadVerifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setActingId(null);
    }
  }

  const filtered = verifications.filter((v) => {
    if (filter === 'PENDING') return v.status === 'PENDING' || v.status === 'REQUIRES_REVIEW';
    if (filter === 'VERIFIED') return v.status === 'VERIFIED';
    if (filter === 'FAILED') return v.status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" /> Identity Verifications Review
          </h2>
          <p className="text-xs text-ink-400 dark:text-slate-400">
            Review identity document submissions and manage identity verification statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-ink-100 dark:bg-slate-900 p-1">
            {['ALL', 'PENDING', 'VERIFIED', 'FAILED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === f ? 'bg-white dark:bg-slate-800 text-ink-900 dark:text-white shadow-sm' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={loadVerifications}
            title="Refresh list"
            className="p-2 rounded-xl border border-ink-200 dark:border-slate-800 hover:bg-ink-50 dark:hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-ink-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-ink-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent inline-block mb-2" />
          <p>Loading identity verifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 dark:border-slate-800 p-8 text-center text-ink-400 dark:text-slate-500 text-xs">
          No identity verification records found matching filter "{filter}".
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const isActing = actingId === v.userId;
            return (
              <div
                key={v.userId}
                className="rounded-2xl border border-ink-150 bg-white p-5 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={getImageUrl(v.avatarUrl, v.name)}
                    alt={v.name}
                    className="h-11 w-11 rounded-2xl object-cover border border-ink-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-ink-900 dark:text-white">{v.name}</h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        v.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : v.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400">{v.email}</p>
                    <p className="text-3xs text-ink-300 dark:text-slate-500 mt-0.5">
                      Submitted: {v.submittedAt ? new Date(v.submittedAt).toLocaleString() : 'N/A'} • Provider: {v.provider}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {v.status !== 'VERIFIED' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason if failing..."
                        value={rejectionReasons[v.userId] || ''}
                        onChange={(e) => setRejectionReasons({ ...rejectionReasons, [v.userId]: e.target.value })}
                        className="h-9 px-3 text-xs rounded-xl border border-ink-200 bg-white dark:bg-slate-900 text-ink-800 dark:text-white outline-none w-48"
                      />
                      <button
                        disabled={isActing}
                        onClick={() => handleReview(v.userId, 'FAILED')}
                        className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {v.status !== 'VERIFIED' ? (
                    <button
                      disabled={isActing}
                      onClick={() => handleReview(v.userId, 'VERIFIED')}
                      className="h-9 px-4 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-colors shadow-sm"
                    >
                      Approve & Verify
                    </button>
                  ) : (
                    <button
                      disabled={isActing}
                      onClick={() => handleReview(v.userId, 'FAILED')}
                      className="h-9 px-3 rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50 text-xs font-bold transition-colors"
                    >
                      Revoke Verification
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
