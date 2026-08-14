import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { ActivityCard } from '../../components/ui/ActivityCard.jsx';
import { getSavedActivitiesRequest } from '../../services/userService.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function Saved() {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    try {
      const activities = await getSavedActivitiesRequest();
      setSaved(activities || []);
    } catch (err) {
      console.error('Error loading saved activities', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved, user?.savedActivities?.length]);

  const handleSaveToggle = (activityId, isNowSaved) => {
    if (!isNowSaved) {
      setSaved((prev) => prev.filter((a) => (a.id || a._id).toString() !== activityId.toString()));
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-ink-800 mb-2 dark:text-white">Saved Activities</h1>
        <p className="text-sm text-ink-400 mb-6 dark:text-slate-400">
          Your bookmarked activities. Save activities to revisit or join them later.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20">
            <Bookmark className="h-10 w-10 text-ink-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-ink-400 dark:text-slate-400 mb-4">You haven't saved any activities yet.</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors gap-1.5"
            >
              <Compass className="h-4 w-4" />
              Discover Activities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {saved.map((activity) => (
              <ActivityCard
                key={activity.id || activity._id}
                activity={activity}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
