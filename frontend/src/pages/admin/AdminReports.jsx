import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  UserMinus,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Ban,
  X,
  Heart
} from 'lucide-react';
import { adminListReportsRequest, adminModerateReportRequest } from '../../services/reportService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

const REASON_LABELS = {
  spam: 'Spam or Misleading',
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment or Abuse',
  fake_activity: 'Fake/Scam Activity',
  no_show: 'No-Show / Unreliability',
  other: 'Other',
};

const ACTION_LABELS = {
  none: 'No action taken',
  warned: 'User warned',
  suspended: 'User suspended',
  activity_deleted: 'Activity deleted',
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [resolvingReport, setResolvingReport] = useState(null); 
  const [selectedActionTaken, setSelectedActionTaken] = useState('warned');

  function load() {
    setIsLoading(true);
    adminListReportsRequest({ status, page, limit: 10 })
      .then((data) => {
        setReports(data.reports);
        setTotal(data.total);
      })
      .catch((err) => console.error('Failed to load reports', err))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [status, page]);

  async function handleDismiss(reportId) {
    if (!confirm('Are you sure you want to dismiss this report? The user\'s trust score penalty will be reverted.')) {
      return;
    }
    setActioningId(reportId);
    try {
      await adminModerateReportRequest(reportId, { action: 'dismiss' });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to moderate report');
    } finally {
      setActioningId(null);
    }
  }

  async function handleResolveSubmit(e) {
    e.preventDefault();
    if (!resolvingReport) return;
    const reportId = resolvingReport._id;
    setActioningId(reportId);
    try {
      await adminModerateReportRequest(reportId, { action: 'resolve', actionTaken: selectedActionTaken });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      setResolvingReport(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to moderate report');
    } finally {
      setActioningId(null);
    }
  }

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-ink-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-ink-800">Moderation Queue</h2>
          <p className="text-xs text-ink-400">Review flagged activities or user profiles and manage trust compliance</p>
        </div>
        <div className="flex gap-1.5 rounded-lg bg-ink-100 p-1">
          {['pending', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-all
                ${status === s ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white border border-ink-100 rounded-2xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-accent-green mb-3" />
          <p className="text-sm font-semibold text-ink-800">Clear queue!</p>
          <p className="text-xs text-ink-400">No {status} reports are currently in the queue.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((r) => (
            <Card key={r._id} className="p-5 border-ink-100 relative overflow-hidden">
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                r.targetType === 'activity' ? 'bg-accent-orange' : 'bg-brand-500'
              }`} />

              <div className="pl-2 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-3.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-ink-700">
                      Report #{r._id.substring(r._id.length - 6).toUpperCase()}
                    </span>
                    <span className="text-ink-300">•</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full uppercase text-3xs border ${
                      r.targetType === 'activity' 
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}>
                      Flagged {r.targetType}
                    </span>
                    <span className="text-ink-300">•</span>
                    <span className="text-ink-400">
                      Filed on {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-ink-50 p-4 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-ink-450 mb-1">REPORTER</p>
                      <p className="font-bold text-ink-800">{r.reporter?.name}</p>
                      <p className="text-ink-400 text-3xs">{r.reporter?.email} (Score: {r.reporter?.trustScore})</p>
                    </div>
                    <div>
                      <p className="font-semibold text-ink-450 mb-1">TARGET MEMBER</p>
                      <p className="font-bold text-ink-800">
                        {r.targetUser?.name} {r.targetUser?.isSuspended && <span className="text-red-500 text-3xs font-bold">(Suspended)</span>}
                      </p>
                      <p className="text-ink-400 text-3xs">{r.targetUser?.email} (Score: {r.targetUser?.trustScore})</p>
                    </div>
                  </div>

                  {r.targetType === 'activity' && r.targetActivity && (
                    <div className="border border-ink-100 rounded-lg p-3 flex items-center justify-between text-xs bg-white">
                      <div>
                        <p className="font-semibold text-ink-450">FLAGGED ACTIVITY</p>
                        <p className="font-bold text-ink-700">{r.targetActivity.title}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-3xs font-semibold uppercase ${
                        r.targetActivity.status === 'cancelled' || r.targetActivity.status === 'deleted' ? 'bg-red-50 text-red-650' : 'bg-green-50 text-green-650'
                      }`}>
                        {r.targetActivity.status}
                      </span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-ink-800 mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                      {REASON_LABELS[r.reason] || r.reason}
                    </h4>
                    {r.description ? (
                      <p className="text-xs text-ink-600 leading-relaxed bg-red-50/20 border border-red-100 rounded-lg p-3 whitespace-pre-wrap">
                        {r.description}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-400 italic">No description provided.</p>
                    )}
                  </div>

                  {status !== 'pending' && (
                    <div className="border-t border-ink-100 pt-3 text-2xs text-ink-500">
                      <p>
                        Moderated by <strong className="text-ink-700">{r.resolvedBy?.name || 'Admin'}</strong> on{' '}
                        {new Date(r.resolvedAt).toLocaleString()}
                      </p>
                      <p className="mt-1">
                        Action Taken:{' '}
                        <span className="font-bold text-brand-600 uppercase">
                          {ACTION_LABELS[r.actionTaken] || r.actionTaken}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {status === 'pending' && (
                  <div className="flex gap-2 self-end md:self-start md:flex-col flex-wrap w-full md:w-36">
                    <Button
                      variant="ghost"
                      className="flex-1 md:w-full h-9 text-xs"
                      onClick={() => handleDismiss(r._id)}
                      disabled={actioningId === r._id}
                    >
                      Dismiss
                    </Button>
                    <Button
                      className="flex-1 md:w-full h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        setResolvingReport(r);
                        setSelectedActionTaken(r.targetType === 'activity' ? 'activity_deleted' : 'warned');
                      }}
                      disabled={actioningId === r._id}
                    >
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 pt-4">
              <span className="text-xs text-ink-400">
                Showing page {page} of {totalPages} ({total} reports)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-ink-200 p-2 hover:bg-ink-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-ink-200 p-2 hover:bg-ink-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-lifted border border-ink-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <div className="flex items-center gap-2 text-red-650">
                <Ban className="h-4.5 w-4.5" />
                <h3 className="text-base font-bold text-ink-900">Resolve Report</h3>
              </div>
              <button
                onClick={() => setResolvingReport(null)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 flex flex-col gap-4">
              <p className="text-xs text-ink-500">
                Choose an action to resolve the report filed by <strong className="text-ink-700">{resolvingReport.reporter?.name}</strong>.
              </p>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-ink-600 block">Actions to take:</label>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 rounded-lg border border-ink-150 p-3 hover:bg-ink-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="resolve-action"
                      value="warned"
                      checked={selectedActionTaken === 'warned'}
                      onChange={(e) => setSelectedActionTaken(e.target.value)}
                      className="text-brand-500 focus:ring-brand-400"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-ink-800">Issue Warning</p>
                      <p className="text-ink-400">Keep report on file. The host gets a standard warning alert.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border border-ink-150 p-3 hover:bg-ink-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="resolve-action"
                      value="suspended"
                      checked={selectedActionTaken === 'suspended'}
                      onChange={(e) => setSelectedActionTaken(e.target.value)}
                      className="text-brand-500 focus:ring-brand-400"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-red-600 flex items-center gap-1">
                        <UserMinus className="h-3.5 w-3.5" /> Suspend Member Profile
                      </p>
                      <p className="text-ink-400">Lock the member out of the platform and cancel their access.</p>
                    </div>
                  </label>

                  {resolvingReport.targetType === 'activity' && (
                    <label className="flex items-center gap-2.5 rounded-lg border border-ink-150 p-3 hover:bg-ink-50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="resolve-action"
                        value="activity_deleted"
                        checked={selectedActionTaken === 'activity_deleted'}
                        onChange={(e) => setSelectedActionTaken(e.target.value)}
                        className="text-brand-500 focus:ring-brand-400"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-red-650 flex items-center gap-1">
                          <Ban className="h-3.5 w-3.5" /> Cancel & Delete Flagged Activity
                        </p>
                        <p className="text-ink-400">Remove the activity immediately and set its status to cancelled.</p>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-2.5 rounded-lg border border-ink-150 p-3 hover:bg-ink-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="resolve-action"
                      value="none"
                      checked={selectedActionTaken === 'none'}
                      onChange={(e) => setSelectedActionTaken(e.target.value)}
                      className="text-brand-500 focus:ring-brand-400"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-ink-800">Close without action</p>
                      <p className="text-ink-400">Mark report resolved. Keep current trust score penalty without further action.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setResolvingReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
