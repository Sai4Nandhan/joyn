import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  ThumbsUp, 
  CheckCircle, 
  AlertOctagon, 
  UserCheck, 
  MessageSquare,
  Clock,
  Compass,
  User
} from 'lucide-react';
import { TrustScoreRing } from './TrustScoreRing.jsx';

function getScoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20' };
  if (score >= 60) return { label: 'Good', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
  if (score >= 40) return { label: 'Fair', color: 'text-orange-500 bg-amber-50 dark:bg-amber-950/20' };
  return { label: 'Needs Work', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' };
}

export function TrustProfileCard({ trustProfile, score = 90 }) {
  if (!trustProfile) return null;

  const {
    identityVerified,
    completedActivities,
    activitiesHosted,
    attendanceRate,
    noShowRate,
    cancellationRate,
    communityReputation,
    hostReliability,
    accountAge,
    reportsCount,
    behavioralScores,
    timeline,
    badges,
  } = trustProfile;

  const displayScore = score || 50;
  const scoreInfo = getScoreLabel(displayScore);
  
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview Block */}
      <div className="rounded-2xl border border-ink-100 bg-white/70 backdrop-blur-md p-6 shadow-lifted dark:bg-[#0D1026] dark:border-purple-950/20">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-ink-100 dark:border-ink-700">
          <div className="relative">
            <TrustScoreRing score={displayScore} size={84} />
            {identityVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white shadow">
                ✓
              </span>
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-1.5">
              <h3 className="text-lg font-black text-ink-900 dark:text-white">JOYN Trust Profile</h3>
              {identityVerified ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/25">
                  <UserCheck className="h-3 w-3" /> Identity Verified
                </span>
              ) : (
                <span className="rounded-full bg-ink-50 px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider text-ink-400 dark:bg-ink-900">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-ink-400 dark:text-slate-500">
              Verified behavioral credentials based on <strong>{completedActivities + activitiesHosted}</strong> interactions.
            </p>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Attendance Rate</p>
            <p className="text-xl font-extrabold text-ink-900 dark:text-white mt-1">{attendanceRate}%</p>
          </div>
          
          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">No-show Rate</p>
            <p className={`text-xl font-extrabold mt-1 ${noShowRate > 5 ? 'text-red-500' : 'text-ink-900 dark:text-white'}`}>{noShowRate}%</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Cancellation Rate</p>
            <p className={`text-xl font-extrabold mt-1 ${cancellationRate > 10 ? 'text-orange-500' : 'text-ink-900 dark:text-white'}`}>{cancellationRate}%</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Host Reliability</p>
            <p className="text-xl font-extrabold text-ink-900 dark:text-white mt-1">{hostReliability}%</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Community Rep</p>
            <p className="text-sm font-extrabold text-brand-500 mt-2">{communityReputation > 0 ? `★ ${communityReputation}` : 'New Member'}</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Completed</p>
            <p className="text-xl font-extrabold text-ink-900 dark:text-white mt-1">{completedActivities}</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Hosted</p>
            <p className="text-xl font-extrabold text-ink-900 dark:text-white mt-1">{activitiesHosted}</p>
          </div>

          <div className="rounded-xl bg-ink-50/50 p-4 dark:bg-slate-900/40 border border-transparent dark:border-purple-950/10">
            <p className="text-3xs font-bold uppercase tracking-wider text-ink-400">Account Age</p>
            <p className="text-xs font-bold text-ink-700 dark:text-slate-350 mt-2.5">{accountAge}</p>
          </div>
        </div>
      </div>

      {/* Behavioral Rep and Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Behavioral Ratings */}
        <div className="rounded-2xl border border-ink-100 bg-white/70 backdrop-blur-md p-6 shadow-lifted dark:bg-[#0D1026] dark:border-purple-950/20">
          <h4 className="text-sm font-extrabold text-ink-800 dark:text-white mb-4 flex items-center gap-1.5">
            <ThumbsUp className="h-4.5 w-4.5 text-brand-500" /> Behavioral Feedback
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Reliability</span>
                <span>{behavioralScores.reliability}%</span>
              </div>
              <div className="w-full h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${behavioralScores.reliability}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" /> Punctuality</span>
                <span>{behavioralScores.punctuality}%</span>
              </div>
              <div className="w-full h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${behavioralScores.punctuality}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Communication</span>
                <span>{behavioralScores.communication}%</span>
              </div>
              <div className="w-full h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${behavioralScores.communication}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-indigo-500" /> Respectfulness</span>
                <span>{behavioralScores.respect}%</span>
              </div>
              <div className="w-full h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${behavioralScores.respect}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-ink-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><Compass className="h-3.5 w-3.5 text-rose-500" /> Hosting Satisfaction</span>
                <span>{behavioralScores.hosting}%</span>
              </div>
              <div className="w-full h-2 bg-ink-100 dark:bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${behavioralScores.hosting}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Badges and Milestones */}
        <div className="flex flex-col gap-6">
          {/* Earned Badges */}
          <div className="rounded-2xl border border-ink-100 bg-white/70 backdrop-blur-md p-6 shadow-lifted dark:bg-[#0D1026] dark:border-purple-950/20 flex-1">
            <h4 className="text-sm font-extrabold text-ink-800 dark:text-white mb-3 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-brand-500" /> Earned Badges
            </h4>
            
            {badges.length === 0 ? (
              <p className="text-xs text-ink-400 dark:text-slate-500 py-4 text-center">No badges earned yet. Complete activities to build reputation!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <div key={b.id} className="group relative flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-bold text-purple-700 dark:bg-purple-950/20 dark:border-purple-950/40 dark:text-purple-300">
                    <Award className="h-3.5 w-3.5" />
                    {b.label}
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded bg-ink-900 px-2.5 py-1.5 text-3xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-ink-900">
                      {b.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Warning if unverified */}
          {reportsCount > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:bg-rose-950/10 dark:border-rose-950/25 flex items-center gap-3">
              <AlertOctagon className="h-5 w-5 text-rose-500 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-300">Active Flags Detected</p>
                <p className="text-rose-600/90 dark:text-rose-400/80">This account has {reportsCount} flagged report(s) which limits certain host approvals.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trust Timeline */}
      <div className="rounded-2xl border border-ink-100 bg-white/70 backdrop-blur-md p-6 shadow-lifted dark:bg-[#0D1026] dark:border-purple-950/20">
        <h4 className="text-sm font-extrabold text-ink-800 dark:text-white mb-5 flex items-center gap-1.5">
          <Calendar className="h-4.5 w-4.5 text-brand-500" /> Reputation Milestones
        </h4>
        <div className="relative border-l-2 border-ink-150 pl-5 ml-2.5 space-y-5 dark:border-ink-700">
          {timeline.map((event, idx) => (
            <div key={idx} className="relative">
              <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-[#0D1026]" />
              <div className="text-xs">
                <p className="font-extrabold text-ink-850 dark:text-white">{event.title}</p>
                <p className="text-ink-400 dark:text-slate-500 mt-0.5">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
