import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Users, ChevronRight, MessageCircle, ListChecks } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { getMyActivitiesRequest } from '../../services/activityService.js';
import { getMyRequests } from '../../services/joinRequestService.js';

export default function MyActivities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'hosting';

  const setActiveTab = (newTab) => {
    const params = new URLSearchParams(searchParams);
    if (newTab && newTab !== 'hosting') {
      params.set('tab', newTab);
    } else {
      params.delete('tab');
    }
    setSearchParams(params, { replace: false });
  };
  const [hosted, setHosted] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyActivitiesRequest(), getMyRequests()])
      .then(([hostedData, requestsData]) => {
        setHosted(hostedData);
        setRequests(requestsData);
      })
      .catch((err) => console.error('Error fetching my activities', err))
      .finally(() => setIsLoading(false));
  }, []);

  const attending = requests
    .filter((r) => r.status === 'approved')
    .map((r) => r.activity);

  const pending = requests.filter((r) => r.status === 'pending');

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const tabClass = (tab) =>
    `flex-1 py-3 text-center border-b-2 text-sm font-semibold transition-all ${
      activeTab === tab
        ? 'border-brand-500 text-brand-600'
        : 'border-transparent text-ink-400 hover:text-ink-700'
    }`;

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-ink-800 mb-2">My Activities</h1>
        <p className="text-sm text-ink-400 mb-6">
          Track the activities you are hosting, attending, or have requested to join.
        </p>

        {/* Tab Headers */}
        <div className="flex border-b border-ink-100 mb-6">
          <button onClick={() => setActiveTab('hosting')} className={tabClass('hosting')}>
            Hosting ({hosted.length})
          </button>
          <button onClick={() => setActiveTab('attending')} className={tabClass('attending')}>
            Attending ({attending.length})
          </button>
          <button onClick={() => setActiveTab('pending')} className={tabClass('pending')}>
            Pending Requests ({pending.length})
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeTab === 'hosting' && hosted.length === 0 && (
              <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card">
                <p className="text-sm text-ink-400 mb-3">You haven't hosted any activities yet.</p>
                <Link
                  to="/activities/new"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Create an Activity
                </Link>
              </div>
            )}

            {activeTab === 'hosting' &&
              hosted.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-2xs font-semibold text-brand-600 capitalize">
                        {act.category}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-2xs font-semibold uppercase ${
                          act.status === 'published'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : act.status === 'completed'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-ink-900 truncate mb-1">{act.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(act.schedule?.startAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {act.approxLocation?.placeName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {act.participantsCount} / {act.capacity?.max} joined
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <Link
                      to={`/activities/${act.id}/room`}
                      className="flex-1 md:flex-none h-9 rounded-lg border border-ink-200 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-brand-500" />
                      Chat
                    </Link>
                    <Link
                      to={`/activities/${act.id}/workspace`}
                      className="flex-1 md:flex-none h-9 rounded-lg border border-ink-200 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <ListChecks className="h-3.5 w-3.5 text-brand-500" />
                      Workspace
                    </Link>
                    <Link
                      to={`/activities/${act.id}`}
                      className="flex-1 md:flex-none h-9 rounded-lg bg-brand-500 px-4 flex items-center justify-center gap-1 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                    >
                      Manage
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

            {activeTab === 'attending' && attending.length === 0 && (
              <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card">
                <p className="text-sm text-ink-400 mb-3">You aren't attending any activities yet.</p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Explore Activities
                </Link>
              </div>
            )}

            {activeTab === 'attending' &&
              attending.map((act) => {
                if (!act) return null;
                return (
                  <div
                    key={act._id || act.id}
                    className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-2xs font-semibold text-brand-600 capitalize">
                          {act.category}
                        </span>
                        {act.status === 'completed' && (
                          <span className="inline-block rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 text-2xs font-semibold uppercase">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-ink-900 truncate mb-1">{act.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(act.schedule?.startAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {act.approxLocation?.placeName}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <Link
                        to={`/activities/${act._id || act.id}/room`}
                        className="flex-1 md:flex-none h-9 rounded-lg border border-ink-200 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-brand-500" />
                        Chat
                      </Link>
                      <Link
                        to={`/activities/${act._id || act.id}/workspace`}
                        className="flex-1 md:flex-none h-9 rounded-lg border border-ink-200 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
                      >
                        <ListChecks className="h-3.5 w-3.5 text-brand-500" />
                        Workspace
                      </Link>
                      <Link
                        to={`/activities/${act._id || act.id}`}
                        className="flex-1 md:flex-none h-9 rounded-lg bg-brand-500 px-4 flex items-center justify-center gap-1 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        Details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'pending' && pending.length === 0 && (
              <div className="text-center py-12 rounded-xl bg-white border border-ink-100 shadow-card">
                <p className="text-sm text-ink-400">No pending join requests.</p>
              </div>
            )}

            {activeTab === 'pending' &&
              pending.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="inline-block rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-2xs font-semibold text-amber-600 uppercase mb-1.5">
                      Pending Host Approval
                    </span>
                    <h3 className="text-base font-bold text-ink-900 truncate mb-1">
                      {req.activity?.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Requested on {formatDate(req.createdAt)}
                      </span>
                    </div>
                    {req.message && (
                      <p className="mt-2 text-xs text-ink-500 bg-ink-50 rounded-lg p-2.5 border border-ink-100">
                        " {req.message} "
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/activities/${req.activity?._id || req.activity?.id}`}
                    className="w-full md:w-auto h-9 rounded-lg bg-ink-100 px-4 flex items-center justify-center gap-1 text-xs font-semibold text-ink-700 hover:bg-ink-200 transition-colors"
                  >
                    View Activity
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
