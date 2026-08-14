import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, Calendar, Check, X, MessageCircle, ListChecks, ArrowLeft, CheckCircle2, Heart, AlertTriangle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { JoynLogo } from '../LandingPage.jsx';
import { getActivityRequest, cancelActivityRequest, CATEGORY_OPTIONS } from '../../services/activityService.js';
import {
  createJoinRequest,
  getRequestsForActivity,
  getMyRequests,
  approveRequest,
  rejectRequest,
  cancelRequest,
} from '../../services/joinRequestService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { completeActivity } from '../../services/ratingService.js';
import { RatingPrompt } from '../../components/workspace/RatingPrompt.jsx';
import ReportModal from '../../components/ui/ReportModal.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

const BADGE_CLASSES = {
  sports: 'bg-emerald-500 text-white',
  trips: 'bg-orange-500 text-white',
  social: 'bg-violet-600 text-white',
  travel: 'bg-blue-500 text-white',
  trekking: 'bg-amber-600 text-white',
};

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value;
}

function getCategoryBadgeClass(category) {
  return BADGE_CLASSES[category] || 'bg-ink-400 text-white';
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-ink-50 text-ink-500 border border-ink-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function HostRequestPanel({ activityId }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    getRequestsForActivity(activityId)
      .then(setRequests)
      .finally(() => setIsLoading(false));
  }, [activityId]);

  async function handle(action, requestId) {
    setActingId(requestId);
    try {
      const updated = action === 'approve' ? await approveRequest(requestId) : await rejectRequest(requestId);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)));
    } finally {
      setActingId(null);
    }
  }

  if (isLoading) return <p className="text-sm text-ink-400">Loading requests…</p>;
  if (requests.length === 0) return <p className="text-sm text-ink-400">No join requests yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      {requests.map((r) => {
        const req = r.requester || {};
        const comp = req.stats?.completedActivities || 0;
        const hosted = req.stats?.activitiesHosted || 0;
        const noShow = req.stats?.noShows || 0;
        const cancel = req.stats?.cancellations || 0;
        const total = comp + noShow + cancel;
        const attendance = total > 0 ? Math.round((comp / total) * 100) : 100;
        const cancelRate = total > 0 ? Math.round((cancel / total) * 100) : 0;
        const isVerified = !!(req.isIdentityVerified || req.verificationStatus === 'VERIFIED');
        const trustScore = req.trustScore ?? 50;

        return (
          <div key={r.id} className="flex flex-col gap-4 rounded-2xl border border-ink-150 bg-white p-5 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20">
            {/* Header with avatar, name, verification & trust score */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={getImageUrl(req.avatarUrl, req.name || 'User')}
                  alt={req.name}
                  className="h-12 w-12 rounded-2xl object-cover border border-ink-200 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/users/${req.id || req._id}`} className="text-base font-extrabold text-ink-900 hover:text-brand-500 transition-colors dark:text-white">
                      {req.name}
                    </Link>
                    {isVerified ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 flex items-center gap-1">
                        ✓ Identity Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 text-3xs font-bold text-ink-400 dark:bg-slate-900">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-black text-purple-700 dark:bg-purple-950/40">
                      🛡️ Trust Score {trustScore}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Accept/Decline CTA */}
              {r.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    disabled={actingId === r.id}
                    onClick={() => handle('reject', r.id)}
                    className="flex h-9 px-3.5 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    disabled={actingId === r.id}
                    onClick={() => handle('approve', r.id)}
                    className="flex h-9 px-4 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 text-xs font-bold transition-colors shadow-sm"
                  >
                    Accept
                  </button>
                </div>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                  r.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {r.status}
                </span>
              )}
            </div>

            {r.message && (
              <p className="text-xs text-ink-600 italic bg-ink-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-ink-100 dark:border-slate-800">
                "{r.message}"
              </p>
            )}

            {/* Complete Trust & Activity Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-ink-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-ink-50/40 dark:bg-slate-900/30">
                <p className="text-3xs text-ink-400 font-bold uppercase">Completed</p>
                <p className="text-xs font-black text-ink-800 dark:text-white mt-0.5">{comp} activities</p>
              </div>
              <div className="p-2 rounded-xl bg-ink-50/40 dark:bg-slate-900/30">
                <p className="text-3xs text-ink-400 font-bold uppercase">Hosted</p>
                <p className="text-xs font-black text-ink-800 dark:text-white mt-0.5">{hosted} hosted</p>
              </div>
              <div className="p-2 rounded-xl bg-ink-50/40 dark:bg-slate-900/30">
                <p className="text-3xs text-ink-400 font-bold uppercase">Attendance</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">{attendance}% rate</p>
              </div>
              <div className="p-2 rounded-xl bg-ink-50/40 dark:bg-slate-900/30">
                <p className="text-3xs text-ink-400 font-bold uppercase">Cancellation</p>
                <p className="text-xs font-black text-amber-600 mt-0.5">{cancelRate}% rate</p>
              </div>
              <div className="p-2 rounded-xl bg-ink-50/40 dark:bg-slate-900/30">
                <p className="text-3xs text-ink-400 font-bold uppercase">No-Shows</p>
                <p className="text-xs font-black text-ink-800 dark:text-white mt-0.5">{noShow} no-shows</p>
              </div>
            </div>

            {/* Badges preview */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {attendance >= 90 && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-3xs font-extrabold text-blue-600 border border-blue-200 dark:bg-blue-950/30">
                  Reliable Member
                </span>
              )}
              {isVerified && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-extrabold text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30">
                  Trusted Traveller
                </span>
              )}
              {hosted >= 5 && (
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-3xs font-extrabold text-purple-600 border border-purple-200 dark:bg-purple-950/30">
                  Top Host
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ParticipantJoinPanel({ activityId, onApproved }) {
  const [myRequest, setMyRequest] = useState(undefined);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyRequests()
      .then((requests) => {
        const mine = requests.find((r) => r.activity?._id === activityId || r.activity?.id === activityId);
        setMyRequest(mine || null);
      })
      .catch(() => setMyRequest(null));
  }, [activityId]);

  async function handleRequest() {
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await createJoinRequest(activityId, message);
      setMyRequest(created);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setIsSubmitting(true);
    try {
      const updated = await cancelRequest(myRequest.id);
      setMyRequest(updated);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (myRequest && myRequest.status === 'approved') {
      onApproved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRequest?.status]);

  if (myRequest === undefined) return <p className="text-sm text-ink-400">Checking your request status…</p>;

  if (myRequest && ['pending', 'approved'].includes(myRequest.status)) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-white border border-ink-100 p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-600">Your request is</span>
          <StatusBadge status={myRequest.status} />
        </div>
        <button
          disabled={isSubmitting}
          onClick={handleCancel}
          className="text-sm font-medium text-ink-400 hover:text-red-500 transition-colors"
        >
          {myRequest.status === 'approved' ? 'Leave activity' : 'Cancel request'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white border border-ink-100 p-5 shadow-card">
      <Textarea
        id="join-message"
        label="Message to host (optional)"
        placeholder="Tell them why you'd like to join…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        onClick={handleRequest}
        disabled={isSubmitting}
        className="h-11 w-full rounded-lg bg-brand-500 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        Request to join
      </button>
    </div>
  );
}

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [hasRoomAccess, setHasRoomAccess] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCompletePanel, setShowCompletePanel] = useState(false);
  const [approvedParticipants, setApprovedParticipants] = useState([]);
  const [noShowUserIds, setNoShowUserIds] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleToggleNoShow = (userId) => {
    setNoShowUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleStartComplete = async () => {
    try {
      const reqs = await getRequestsForActivity(activity.id);
      const approved = reqs.filter(r => r.status === 'approved').map(r => r.requester);
      setApprovedParticipants(approved);
      setShowCompletePanel(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelActivity = async () => {
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }
    try {
      const updated = await cancelActivityRequest(activity.id);
      setActivity(updated);
      setShowCancelConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  function reload() {
    getActivityRequest(id)
      .then(setActivity)
      .catch((err) => setError(err.response?.data?.message || 'Could not load this activity'));
  }

  useEffect(reload, [id]);

  useEffect(() => {
    if (activity && user && activity.host?._id === user.id) {
      setHasRoomAccess(true);
    }
  }, [activity, user]);

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-red-500">{error}</p>
          <Link to="/" className="mt-4 text-sm font-medium text-brand-500 hover:text-brand-600">← Back to discover</Link>
        </div>
      </Layout>
    );
  }

  if (!activity) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        </div>
      </Layout>
    );
  }

  const isHost = user && activity.host?._id === user.id;
  const spotsLeft = activity.capacity.max - activity.participantsCount;
  const hostAvatar = getImageUrl(activity.host?.avatarUrl, activity.host?.name || 'Host');

  return (
    <Layout clean={!user}>
      {!user && (
        <header className="bg-slate-950 px-6 py-4 text-white mb-8">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <JoynLogo />
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-xs font-bold text-white hover:text-pink-500 transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-joyn-gradient rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03]">
                Sign Up
              </Link>
            </div>
          </div>
        </header>
      )}
      <div className={`max-w-3xl ${!user ? 'mx-auto px-6 pb-20' : ''}`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-brand-500 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Hero section with cover image */}
        {activity.coverImageUrl && (
          <div className="relative h-56 rounded-2xl overflow-hidden mb-6">
            <img src={activity.coverImageUrl} alt={activity.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeClass(activity.category)}`}>
              {categoryLabel(activity.category)}
            </span>
          </div>
        )}

        {!activity.coverImageUrl && (
          <span className={`mb-4 inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeClass(activity.category)}`}>
            {categoryLabel(activity.category)}
          </span>
        )}

        {/* Title & Host */}
        <h1 className="text-2xl font-bold text-ink-800 mb-2">{activity.title}</h1>
        <p className="text-sm text-ink-500 mb-5 whitespace-pre-line">{activity.description}</p>

        {/* About Your Host Box */}
        <div className="rounded-xl border border-purple-100 bg-purple-50/15 p-5 mb-6 dark:border-purple-950/20 dark:bg-purple-950/5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <p className="text-2xs font-extrabold uppercase tracking-wider text-purple-655">About Your Host</p>
            {!isHost && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-400 hover:text-red-500 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Report Activity
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link to={`/users/${activity.host?._id}`} className="shrink-0">
              <img src={hostAvatar} alt={activity.host?.name} className="h-12 w-12 rounded-full border-2 border-white dark:border-ink-800 shadow-md hover:scale-105 transition-transform" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <Link to={`/users/${activity.host?._id}`} className="font-extrabold text-ink-800 hover:text-brand-500 transition-colors dark:text-white">
                  {activity.host?.name}
                </Link>
                {activity.host?.isIdentityVerified && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/25">
                    ✓ Verified
                  </span>
                )}
              </div>
              
              {/* Trust badges grid */}
              <div className="flex flex-wrap gap-2 text-2xs text-ink-500 dark:text-slate-400">
                <span className="rounded bg-white border border-ink-150 px-2 py-1 font-semibold dark:bg-[#0D1026] dark:border-purple-950/20">
                  🛡️ Trust Score: <strong className="text-brand-500">{activity.host?.trustScore || 50}</strong>
                </span>
                <span className="rounded bg-white border border-ink-150 px-2 py-1 font-semibold dark:bg-[#0D1026] dark:border-purple-950/20">
                  🎉 Completed: <strong>{activity.host?.stats?.completedActivities || 0}</strong>
                </span>
                <span className="rounded bg-white border border-ink-150 px-2 py-1 font-semibold dark:bg-[#0D1026] dark:border-purple-950/20">
                  📢 Hosted: <strong>{activity.host?.stats?.activitiesHosted || 0}</strong>
                </span>
                <span className="rounded bg-white border border-ink-150 px-2 py-1 font-semibold dark:bg-[#0D1026] dark:border-purple-950/20">
                  ⚠️ Cancellation Rate: <strong>{
                    activity.host?.stats
                      ? Math.round((activity.host.stats.cancellations / (Math.max(1, (activity.host.stats.completedActivities + activity.host.stats.noShows + activity.host.stats.cancellations)))) * 100)
                      : 0
                  }%</strong>
                </span>
                <span className="rounded bg-white border border-ink-150 px-2 py-1 font-semibold dark:bg-[#0D1026] dark:border-purple-950/20">
                  ★ Rating: <strong>{
                    activity.host?.stats?.ratingCount > 0
                      ? (activity.host.stats.ratingSum / activity.host.stats.ratingCount).toFixed(1)
                      : '5.0'
                  } / 5</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {activity.status === 'cancelled' && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>This activity has been cancelled by the host.</span>
          </div>
        )}

        {/* Details Card */}
        <div className="rounded-xl bg-white border border-ink-100 shadow-card p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 flex-shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-ink-400 font-medium">When</p>
                <p className="text-sm text-ink-700">{new Date(activity.schedule.startAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-ink-400">{new Date(activity.schedule.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(activity.schedule.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green-light text-accent-green flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-400 font-medium">Where</p>
                <p className="text-sm text-ink-700 font-semibold truncate" title={activity.approxLocation.placeName}>{activity.approxLocation.placeName}</p>
                {activity.exactLocation ? (
                  <div className="mt-1 rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 text-[10px] text-emerald-800">
                    <p className="font-bold flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600 flex-shrink-0" /> Exact Location Revealed:
                    </p>
                    <p className="mt-0.5 font-medium">{activity.exactLocation.meetingPoint || 'No specific meeting point'}</p>
                    {activity.exactLocation.address && (
                      <p className="text-emerald-600 mt-0.5 break-words">{activity.exactLocation.address}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-ink-400 mt-1 italic flex items-center gap-1">
                    🔒 Exact location hidden until approved
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange-light text-accent-orange flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-ink-400 font-medium">Participants</p>
                <p className="text-sm text-ink-700">{activity.participantsCount} / {activity.capacity.max} joined</p>
                <p className="text-xs text-ink-400">{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</p>
              </div>
            </div>
          </div>

          {activity.status === 'completed' && (
            <div className="mt-4 pt-4 border-t border-ink-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3 w-3" /> Completed
              </span>
            </div>
          )}
        </div>

        {/* Who is Joining Section */}
        {activity.participants && activity.participants.length > 0 && (
          <div className="rounded-xl bg-white border border-ink-100 shadow-card p-5 mb-6 dark:bg-[#0D1026] dark:border-purple-950/20">
            <h3 className="text-sm font-extrabold text-ink-800 mb-3.5 dark:text-white flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-brand-500" /> Who is Joining?
            </h3>
            <div className="flex flex-wrap gap-4">
              {activity.participants.map((p) => (
                <Link key={p._id || p.id} to={`/users/${p._id || p.id}`} className="flex items-center gap-2.5 rounded-xl border border-ink-50 bg-slate-50/30 p-2.5 hover:border-brand-300 hover:bg-slate-55 transition-all">
                  <img
                    src={getImageUrl(p.avatarUrl, p.name)}
                    alt={p.name}
                    className="h-8 w-8 rounded-full border border-white shadow-sm object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-ink-800 dark:text-white leading-none">{p.name}</p>
                      {p.isIdentityVerified && (
                        <span className="text-[10px] text-emerald-550 leading-none">✓</span>
                      )}
                    </div>
                    <p className="text-[10px] text-brand-550 font-extrabold mt-0.5 leading-none">🛡️ {p.trustScore || 50}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showCompletePanel ? (
          <div className="mb-6 p-5 border border-emerald-200 bg-emerald-50/10 rounded-2xl">
            <h3 className="text-sm font-semibold text-ink-800 mb-2">Mark Activity Attendance</h3>
            <p className="text-xs text-ink-400 mb-4">Uncheck anyone who DID NOT show up. They will receive a no-show penalty.</p>
            
            {approvedParticipants.length === 0 ? (
              <p className="text-xs text-ink-400 italic mb-4">No participants joined this activity.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {approvedParticipants.map((p) => {
                  const isPresent = !noShowUserIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPresent}
                        onChange={() => handleToggleNoShow(p.id)}
                        className="h-4.5 w-4.5 text-brand-500 rounded border-ink-300 focus:ring-brand-400"
                      />
                      <img
                        src={p.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm text-ink-700 font-medium">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCompletePanel(false)}
                className="flex-1 h-10 border border-ink-200 bg-white hover:bg-ink-50 rounded-xl text-xs font-semibold text-ink-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const updated = await completeActivity(activity.id, noShowUserIds);
                  setActivity(updated);
                  setShowCompletePanel(false);
                }}
                className="flex-1 h-10 bg-accent-green hover:bg-emerald-600 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        ) : (
          isHost && activity.status === 'published' && new Date(activity.schedule.endAt) <= new Date() && (
            <button
              className="mb-6 w-full h-11 rounded-xl bg-accent-green text-sm font-semibold text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 border-0 shadow-md shadow-emerald-500/10"
              onClick={handleStartComplete}
            >
              <Check className="h-4 w-4" /> Mark activity as completed
            </button>
          )
        )}

        {isHost && activity.status === 'published' && new Date(activity.schedule.startAt) > new Date() && (
          <button
            onClick={handleCancelActivity}
            className={`mb-6 w-full h-11 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold border-0
              ${showCancelConfirm 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/10' 
                : 'border border-red-200 text-red-500 hover:bg-red-50'}`}
          >
            {showCancelConfirm ? (
              <>
                <Check className="h-4 w-4" /> Confirm Cancel (Will lower your Trust Score)
              </>
            ) : (
              <>
                <X className="h-4 w-4" /> Cancel Activity
              </>
            )}
          </button>
        )}

        {activity.status === 'completed' && <RatingPrompt activityId={activity.id} />}

        {hasRoomAccess && activity.status !== 'cancelled' && (
          <div className="flex gap-3 mb-6">
            <Link to={`/activities/${activity.id}/room`} className="flex-1">
              <button className="w-full h-11 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4 text-brand-500" /> Activity Room
              </button>
            </Link>
            <Link to={`/activities/${activity.id}/workspace`} className="flex-1">
              <button className="w-full h-11 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors flex items-center justify-center gap-2">
                <ListChecks className="h-4 w-4 text-brand-500" /> Trip Workspace
              </button>
            </Link>
          </div>
        )}

        {/* Join Requests Section */}
        <div className="mt-2">
          <h2 className="text-lg font-semibold text-ink-800 mb-4">
            {isHost ? 'Join Requests' : 'Join this Activity'}
          </h2>
          {user ? (
            isHost ? (
              <HostRequestPanel activityId={activity.id} />
            ) : (
              <ParticipantJoinPanel
                activityId={activity.id}
                onApproved={() => {
                  reload();
                  setHasRoomAccess(true);
                }}
              />
            )
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              <p className="text-sm font-semibold text-slate-800 mb-2">Want to join this activity?</p>
              <p className="text-xs text-slate-500 mb-4">You need an account to participate in conversations and request to join activities.</p>
              <div className="flex gap-3 justify-center">
                <Link to="/login" className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Log in
                </Link>
                <Link to="/register" className="bg-joyn-gradient text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-95">
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="activity"
        targetId={activity.id}
        targetName={activity.title}
        targetUserId={activity.host?._id}
      />
    </Layout>
  );
}
