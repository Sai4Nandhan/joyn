import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, Calendar, ListChecks, DollarSign, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { getMyActivitiesRequest } from '../../services/activityService.js';
import { getMyRequests } from '../../services/joinRequestService.js';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyActivitiesRequest(), getMyRequests()])
      .then(([hosted, requests]) => {
        const hostedTrips = hosted
          .filter((act) => ['trips', 'travel', 'trekking'].includes(act.category))
          .map((act) => ({
            id: act.id,
            title: act.title,
            category: act.category,
            role: 'Organizer',
            schedule: act.schedule,
            location: act.approxLocation.placeName,
            status: act.status,
          }));

        const attendingTrips = requests
          .filter(
            (r) =>
              r.status === 'approved' &&
              r.activity &&
              ['trips', 'travel', 'trekking'].includes(r.activity.category)
          )
          .map((r) => ({
            id: r.activity.id || r.activity._id,
            title: r.activity.title,
            category: r.activity.category,
            role: 'Traveler',
            schedule: r.activity.schedule,
            location: r.activity.approxLocation.placeName,
            status: r.activity.status,
          }));

        const merged = [...hostedTrips, ...attendingTrips];
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
        setTrips(unique);
      })
      .catch((err) => console.error('Error fetching trips', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-ink-800 mb-2">Trip Workspaces</h1>
        <p className="text-sm text-ink-400 mb-6">
          Shared plan lists and split expense ledgers for your trips, travels, and excursions.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card">
            <MapIcon className="h-10 w-10 text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-400 mb-3">You don't have active Trip Workspaces yet.</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Explore Trips & Travel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-2xs font-semibold text-brand-600 capitalize">
                      {trip.category}
                    </span>
                    <span className="text-2xs font-semibold text-ink-500 capitalize px-2 py-0.5 bg-ink-100 rounded">
                      {trip.role}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink-900 leading-tight mb-2">
                    {trip.title}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-ink-500 flex items-center gap-1">
                      <MapIcon className="h-3.5 w-3.5 text-ink-300" />
                      {trip.location}
                    </p>
                    <p className="text-xs text-ink-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-ink-300" />
                      {new Date(trip.schedule.startAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Summary indicators */}
                  <div className="grid grid-cols-2 gap-2 bg-ink-50 rounded-lg p-2.5 mb-4 text-center">
                    <div>
                      <ListChecks className="h-4 w-4 text-brand-500 mx-auto mb-1" />
                      <p className="text-2xs text-ink-400 font-semibold uppercase">Plans</p>
                      <p className="text-xs font-bold text-ink-700">Checklist</p>
                    </div>
                    <div>
                      <DollarSign className="h-4 w-4 text-accent-green mx-auto mb-1" />
                      <p className="text-2xs text-ink-400 font-semibold uppercase">Ledger</p>
                      <p className="text-xs font-bold text-ink-700">Split Bills</p>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/activities/${trip.id}/workspace`}
                  className="w-full h-10 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex items-center justify-center gap-1"
                >
                  Open Workspace
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
