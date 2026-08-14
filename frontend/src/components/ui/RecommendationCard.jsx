import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Bookmark } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { saveActivityRequest, unsaveActivityRequest } from '../../services/userService.js';

export function RecommendationCard({ id, image, title, date, location, reason }) {
  const { user, setUser } = useAuth();
  const isSaved = id && user?.savedActivities?.some(sid => {
    const s = sid?.id || sid?._id || sid;
    return s?.toString() === id.toString();
  });

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !id) return;
    try {
      if (isSaved) {
        const updatedUser = await unsaveActivityRequest(id);
        setUser(updatedUser);
      } else {
        const updatedUser = await saveActivityRequest(id);
        setUser(updatedUser);
      }
    } catch (err) {
      console.error('Bookmark error', err);
    }
  }

  return (
    <Link to={`/activities/${id}`} className="group block">
      <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-card hover:shadow-md transition-shadow">
        {/* Image */}
        <img
          src={image}
          alt={title}
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink-900 truncate group-hover:text-brand-500 transition-colors">{title}</h4>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {date && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
          </div>

          {reason && (
            <p className="mt-1 text-[10px] leading-tight text-ink-400 italic truncate">
              {reason}
            </p>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className="flex-shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-ink-50 hover:text-brand-500 transition-colors"
          aria-label="Save"
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
        </button>
      </div>
    </Link>
  );
}

export default RecommendationCard;
