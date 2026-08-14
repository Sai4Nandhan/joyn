import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Calendar, ArrowRight, User } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { getMyActivitiesRequest } from '../../services/activityService.js';
import { getMyRequests } from '../../services/joinRequestService.js';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyActivitiesRequest(), getMyRequests()])
      .then(([hosted, requests]) => {
        const hostedRooms = hosted.map((act) => ({
          id: act.id,
          title: act.title,
          category: act.category,
          role: 'Host',
          schedule: act.schedule,
        }));

        const attendingRooms = requests
          .filter((r) => r.status === 'approved' && r.activity)
          .map((r) => ({
            id: r.activity.id || r.activity._id,
            title: r.activity.title,
            category: r.activity.category,
            role: 'Participant',
            schedule: r.activity.schedule,
          }));

        // Merge and deduplicate
        const merged = [...hostedRooms, ...attendingRooms];
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
        setRooms(unique);
      })
      .catch((err) => console.error('Error fetching rooms', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-ink-800 mb-2">Activity Rooms</h1>
        <p className="text-sm text-ink-400 mb-6">
          Chat workspaces for the activities you are hosting or attending.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card">
            <MessageCircle className="h-10 w-10 text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-400 mb-3">You don't have access to any activity rooms yet.</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Explore Activities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-2xs font-semibold text-brand-600 capitalize">
                      {room.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold ${
                        room.role === 'Host'
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      <User className="h-3 w-3" />
                      {room.role}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink-900 leading-tight mb-2">
                    {room.title}
                  </h3>

                  {room.schedule?.startAt && (
                    <p className="text-xs text-ink-400 flex items-center gap-1 mb-4">
                      <Calendar className="h-3.5 w-3.5" />
                      Starts: {new Date(room.schedule.startAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                <Link
                  to={`/activities/${room.id}/room`}
                  className="w-full h-10 rounded-lg bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enter Chat
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
