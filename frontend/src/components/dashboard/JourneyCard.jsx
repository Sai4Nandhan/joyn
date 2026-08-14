import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { getMyChallengeProgress } from '../../services/challenge.service.js';
import { ChallengeDetailModal } from '../ui/ChallengeDetailModal.jsx';

export function JourneyCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getMyChallengeProgress()
      .then((res) => {
        if (isMounted && res?.data) {
          setData(res.data);
        }
      })
      .catch((err) => console.error('Error loading challenge progress:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-md animate-pulse">
        <div className="h-4 w-1/3 bg-ink-200 rounded mb-4"></div>
        <div className="h-3 w-full bg-ink-150 rounded mb-3"></div>
        <div className="h-10 w-full bg-ink-100 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  const { completionPercentage, userLevel, completedCount, totalChallenges, groups } = data;
  const onboardingGroup = groups?.[0]?.challenges || [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0D1026] via-[#15193B] to-[#1E1646] p-5 text-white shadow-xl">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-purple-500 text-white shadow-md">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide font-display">Your JOYN Journey</h3>
              <p className="text-[11px] font-semibold text-purple-200/80">{userLevel}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-purple-200 backdrop-blur-md border border-white/10">
            {completedCount} / {totalChallenges} completed
          </span>
        </div>

        {/* Gradient Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-purple-200 mb-1.5">
            <span>Overall Progress</span>
            <span className="font-bold text-white">{completionPercentage}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5 backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Interactive Quick Challenge List */}
        <div className="space-y-2 mb-4">
          {onboardingGroup.slice(0, 4).map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChallenge(ch)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer group text-left ${
                ch.isCompleted
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-purple-100/90 border border-white/10 hover:border-purple-400/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {ch.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-purple-300/40 shrink-0 group-hover:border-brand-400" />
                )}
                <span className={`truncate ${ch.isCompleted ? 'line-through opacity-80' : 'font-semibold text-white group-hover:text-amber-200'}`}>
                  {ch.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {ch.badge && (
                  <span className="text-xs" title={ch.badge.label}>
                    {ch.badge.icon}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-200" />
              </div>
            </button>
          ))}
        </div>

        <Link
          to="/challenges"
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 py-2.5 px-4 text-xs font-bold text-white transition-all border border-white/10 shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>View All Challenges & Badges</span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </Link>
      </div>

      {/* Challenge Detail Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={Boolean(selectedChallenge)}
        onClose={() => setSelectedChallenge(null)}
      />
    </div>
  );
}
