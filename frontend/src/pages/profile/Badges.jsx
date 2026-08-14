import React, { useEffect, useState } from 'react';
import { Award, ShieldCheck, Heart, Info, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { getMyProfile } from '../../services/userService.js';

export default function Badges() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch((err) => console.error('Error fetching profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const trustScore = profile?.trustScore ?? 50;

  const ALL_BADGES = [
    {
      id: 'identity_verified',
      label: 'Verified Identity',
      description: 'Your official government ID is verified. Assures others you are who you say you are.',
      unlocked: profile?.isIdentityVerified,
    },
    {
      id: 'five_activities',
      label: 'Regular Participant',
      description: 'Successfully completed 5 or more activities. Shows consistent platform engagement.',
      unlocked: (profile?.stats?.completedActivities || 0) >= 5,
    },
    {
      id: 'twenty_activities',
      label: 'Veteran Explorer',
      description: 'Completed 20+ activities. Highlights a seasoned community member.',
      unlocked: (profile?.stats?.completedActivities || 0) >= 20,
    },
    {
      id: 'highly_rated',
      label: 'Highly Rated Host',
      description: 'Maintained an average rating of 4.5+ stars across 5+ host reviews.',
      unlocked: (profile?.stats?.ratingCount || 0) >= 5 && (profile?.stats?.ratingSum / profile?.stats?.ratingCount) >= 4.5,
    },
    {
      id: 'trusted',
      label: 'Trusted Member',
      description: 'Achieved an overall trust score of 85 or above.',
      unlocked: trustScore >= 85,
    },
    {
      id: 'reliable',
      label: 'Reliable Attendee',
      description: 'Zero cancellations or no-shows across 3+ completed activities.',
      unlocked: (profile?.stats?.completedActivities || 0) >= 3 && (profile?.stats?.cancellations || 0) === 0 && (profile?.stats?.noShows || 0) === 0,
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-ink-800 mb-2">Trust Badges & Score</h1>
        <p className="text-sm text-ink-400 mb-6">
          Understand how the trust system works, view your badges, and learn how to improve your status.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trust Score summary */}
            <div className="md:col-span-1 rounded-2xl bg-white border border-ink-100 p-6 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-brand-500" />
                  Your Trust Rating
                </h3>

                <div className="text-center py-4 bg-ink-50 rounded-xl mb-4">
                  <span className="text-4xl font-extrabold text-brand-600">{trustScore}</span>
                  <span className="text-sm text-ink-400 font-semibold"> / 100</span>
                  <p className={`text-xs font-bold mt-1 ${
                    trustScore >= 80 ? 'text-trust-high' : trustScore >= 50 ? 'text-trust-medium' : 'text-trust-low'
                  }`}>
                    {trustScore >= 80 ? 'Excellent' : trustScore >= 50 ? 'Good Standing' : 'Needs Work'}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-ink-500">
                  <div className="flex justify-between">
                    <span>Completions:</span>
                    <strong className="text-ink-800">{profile.stats?.completedActivities || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellations:</span>
                    <strong className="text-ink-800">{profile.stats?.cancellations || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>No-shows:</span>
                    <strong className="text-ink-800">{profile.stats?.noShows || 0}</strong>
                  </div>
                </div>
              </div>

              <a
                href="/profile"
                className="mt-6 h-9 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors flex items-center justify-center gap-1"
              >
                Go to Profile
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Badges details grid */}
            <div className="md:col-span-2 space-y-6">
              {/* Trust System FAQ */}
              <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
                <h3 className="text-sm font-bold text-brand-800 flex items-center gap-1.5 mb-2">
                  <Info className="h-4.5 w-4.5" />
                  How is my trust score calculated?
                </h3>
                <p className="text-xs text-brand-700 leading-relaxed">
                  The trust score is an algorithmic value between 0 and 100. It starts at a baseline of 50. It goes up when you successfully host or complete activities, receive high ratings from other members, and verify your identity (+5 points). It decreases when you cancel activities, fail to show up, or have reports filed against you.
                </p>
              </div>

              {/* Badges List */}
              <div>
                <h3 className="text-base font-bold text-ink-900 mb-4">Earned & Available Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ALL_BADGES.map((badge) => (
                    <div
                      key={badge.id}
                      className={`rounded-xl border p-4 shadow-sm transition-all flex flex-col justify-between ${
                        badge.unlocked
                          ? 'border-purple-200 bg-purple-50/20'
                          : 'border-ink-100 bg-white opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                            badge.unlocked ? 'bg-purple-100 text-purple-600' : 'bg-ink-100 text-ink-400'
                          }`}>
                            <Award className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-bold ${
                            badge.unlocked ? 'text-purple-900' : 'text-ink-800'
                          }`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-2xs text-ink-500 leading-relaxed mb-3">
                          {badge.description}
                        </p>
                      </div>

                      <span className={`inline-block self-start text-3xs font-semibold px-2 py-0.5 rounded-full uppercase border ${
                        badge.unlocked
                          ? 'bg-purple-100 border-purple-200 text-purple-700'
                          : 'bg-ink-50 border-ink-150 text-ink-400'
                      }`}>
                        {badge.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
