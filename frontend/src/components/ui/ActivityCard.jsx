import { Link } from 'react-router-dom';
import { MapPin, Calendar, Shield, Bookmark, CheckCircle2 } from 'lucide-react';
import { AvatarStack } from './AvatarStack.jsx';
import { CATEGORY_OPTIONS } from '../../services/activityService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { saveActivityRequest, unsaveActivityRequest } from '../../services/userService.js';
import { getImageUrl } from '../../utils/imageUrl.js';

const BADGE_CLASSES = {
  sports: 'badge-sports',
  trips: 'badge-trips',
  social: 'badge-social',
  travel: 'badge-travel',
  trekking: 'badge-trekking',
};

const GRADIENT_FALLBACKS = {
  sports: 'from-green-400 to-emerald-600',
  trips: 'from-amber-400 to-orange-600',
  social: 'from-purple-400 to-violet-600',
  travel: 'from-blue-400 to-cyan-600',
  trekking: 'from-amber-600 to-amber-800',
};

function getCategoryBadgeClass(category) {
  return BADGE_CLASSES[category] || 'badge-default';
}

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  }
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${timeStr}`;
}

function formatDateRange(startAt, endAt) {
  if (!startAt) return '';
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  // If multi-day
  if (end && end.toDateString() !== start.toDateString()) {
    const startStr = start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  }

  return formatDate(startAt);
}

export function ActivityCard({ activity, onSaveToggle }) {
  const { user, setUser } = useAuth();
  const actId = activity?.id || activity?._id;
  const isSaved = actId && user?.savedActivities?.some((id) => {
    const sid = id?.id || id?._id || id;
    return sid?.toString() === actId.toString();
  });

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !actId) return;
    try {
      if (isSaved) {
        const updatedUser = await unsaveActivityRequest(actId);
        setUser(updatedUser);
        onSaveToggle?.(actId, false);
      } else {
        const updatedUser = await saveActivityRequest(actId);
        setUser(updatedUser);
        onSaveToggle?.(actId, true);
      }
    } catch (err) {
      console.error('Bookmark error', err);
    }
  }

  const participantAvatars = (activity.participants || []).map((p, i) => ({
    name: p.name || `User${i}`,
    url: getImageUrl(p.avatarUrl, p.name),
  }));

  // Add some default avatars if participants data is sparse
  if (participantAvatars.length === 0) {
    for (let i = 0; i < Math.min(activity.participantsCount || 3, 5); i++) {
      participantAvatars.push({ name: `Participant${i + 1}`, url: null });
    }
  }

  const dateDisplay = formatDateRange(activity.schedule?.startAt, activity.schedule?.endAt);
  const hostAvatar = getImageUrl(activity.host?.avatarUrl, activity.host?.name || 'Host');

  return (
    <Link to={`/activities/${actId}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white border border-ink-200/50 shadow-card transition-all duration-300 group-hover:shadow-lifted group-hover:-translate-y-1 dark:bg-[#0D1026] dark:border-purple-950/20">
        {/* Cover Image */}
        <div className="relative h-36 sm:h-44 overflow-hidden">
          {activity.coverImageUrl ? (
            <img
              src={activity.coverImageUrl}
              alt={activity.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${GRADIENT_FALLBACKS[activity.category] || 'from-gray-400 to-gray-600'}`} />
          )}

          {/* Category Badge */}
          <span className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-2xs sm:text-xs font-semibold ${getCategoryBadgeClass(activity.category)}`}>
            {categoryLabel(activity.category)}
          </span>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm text-ink-500 hover:bg-white hover:text-brand-500 transition-all"
          >
            <Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm sm:text-base text-ink-800 truncate dark:text-white">{activity.title}</h3>

          {/* Date & Location */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 dark:text-slate-400">
            {dateDisplay && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dateDisplay}
              </span>
            )}
            {activity.approxLocation?.placeName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {activity.approxLocation.placeName}
              </span>
            )}
          </div>

          {/* Participants */}
          <div className="mt-3 flex items-center gap-2">
            <AvatarStack avatars={participantAvatars} max={4} />
            <span className="text-xs text-ink-400 dark:text-slate-400">
              {activity.participantsCount} / {activity.capacity?.max} joined
            </span>
          </div>

          {/* Host & Trust Score */}
          <div className="mt-3 flex items-center justify-between border-t border-ink-100 dark:border-purple-950/20 pt-3">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={hostAvatar}
                alt={activity.host?.name}
                className="h-6 w-6 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-xs text-ink-500 dark:text-slate-450 truncate">
                {activity.host?.name}
              </span>
              {activity.host?.isIdentityVerified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 flex-shrink-0 dark:bg-emerald-950/20">
                  ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Shield className="h-3.5 w-3.5 text-brand-500" />
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {activity.host?.trustScore || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-ink-200/50 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20">
      <div className="h-44 animate-pulse bg-ink-100 dark:bg-purple-950/10" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded bg-ink-100 dark:bg-purple-950/10" />
        <div className="h-3 w-full animate-pulse rounded bg-ink-100 dark:bg-purple-950/10" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-purple-950/10" />
        <div className="flex items-center gap-2 pt-3 border-t border-ink-100 dark:border-purple-950/20">
          <div className="h-6 w-6 animate-pulse rounded-full bg-ink-100 dark:bg-purple-950/10" />
          <div className="h-3 w-24 animate-pulse rounded bg-ink-100 dark:bg-purple-950/10" />
        </div>
      </div>
    </div>
  );
}
