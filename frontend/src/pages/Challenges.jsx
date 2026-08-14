import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock, ShieldCheck, Sparkles, Trophy, ChevronRight, ArrowRight } from 'lucide-react';
import { getMyChallengeProgress } from '../services/challenge.service.js';
import { ChallengeDetailModal } from '../components/ui/ChallengeDetailModal.jsx';

export function Challenges() {
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
      .catch((err) => console.error('Error fetching challenges:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 animate-pulse">
        <div className="h-32 rounded-3xl bg-ink-200" />
        <div className="h-64 rounded-3xl bg-ink-150" />
      </div>
    );
  }

  if (!data) return null;

  const { completionPercentage, userLevel, completedCount, totalChallenges, groups } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-[#0D1026] via-[#161A3D] to-[#251A54] p-6 md:p-8 text-white shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
              <Trophy className="h-4 w-4" />
              <span>{userLevel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              JOYN Challenges & Achievements
            </h1>
            <p className="text-xs md:text-sm text-purple-200/80 max-w-xl leading-relaxed">
              Complete real-world JOYN milestones, host genuine activities, and build your reliable community track record to earn badges.
            </p>
          </div>

          {/* Progress Circular Widget */}
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
            <div className="text-center">
              <span className="text-3xl font-black text-white">{completionPercentage}%</span>
              <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider mt-0.5">
                Completed
              </p>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="text-xl font-bold text-amber-300">{completedCount} / {totalChallenges}</span>
              <p className="text-[11px] text-purple-200">Challenges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Groups */}
      <div className="space-y-6">
        {groups?.map((group) => (
          <div key={group.id} className="rounded-2xl border border-ink-200/80 dark:border-purple-950/30 bg-white dark:bg-[#0E1126] p-5 md:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white font-display">{group.title}</h2>
              <p className="text-xs text-ink-500 dark:text-slate-400">{group.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.challenges.map((ch) => {
                const progressPct = Math.min(100, Math.round((ch.current / ch.target) * 100));
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChallenge(ch)}
                    className={`group relative flex items-start justify-between gap-4 rounded-xl p-4 transition-all border cursor-pointer ${
                      ch.isCompleted
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-400'
                        : 'bg-ink-50/50 dark:bg-[#151936] border-ink-200/60 dark:border-purple-900/30 hover:border-brand-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {ch.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-ink-300 dark:border-purple-800 group-hover:border-brand-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-xs ${ch.isCompleted ? 'text-emerald-950 dark:text-emerald-300' : 'text-ink-900 dark:text-white'} group-hover:text-brand-500 transition-colors`}>
                            {ch.title}
                          </h3>
                          {ch.isCompleted && (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 shrink-0">
                              Completed ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-600 dark:text-slate-400 mt-1 line-clamp-2">{ch.description}</p>
                        
                        {/* Progress Bar & Counter */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 dark:text-slate-400 mb-1">
                            <span>Progress</span>
                            <span className={ch.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-800 dark:text-white'}>
                              {ch.current} / {ch.target}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-ink-200 dark:bg-purple-950/60 overflow-hidden">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                ch.isCompleted ? 'bg-emerald-500' : 'bg-brand-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {ch.badge && (
                      <div
                        className={`flex flex-col items-center justify-center shrink-0 rounded-xl p-2.5 text-center min-w-[70px] ${
                          ch.isCompleted ? 'bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/40' : 'bg-ink-150/60 dark:bg-purple-950/30 opacity-50'
                        }`}
                        title={`Badge: ${ch.badge.label}`}
                      >
                        <span className="text-xl">{ch.badge.icon}</span>
                        <span className="text-[9px] font-extrabold text-amber-950 dark:text-amber-300 mt-0.5 line-clamp-1">
                          {ch.badge.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Challenge Details Modal */}
      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={Boolean(selectedChallenge)}
        onClose={() => setSelectedChallenge(null)}
      />
    </div>
  );
}
