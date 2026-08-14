import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle2, Lock, ArrowRight, X, Sparkles, Target, Compass } from 'lucide-react';

export function ChallengeDetailModal({ challenge, isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !challenge) return null;

  const { title, description, instructions, current, target, isCompleted, status, badge, cta } = challenge;
  const progressPercent = Math.min(100, Math.round((current / target) * 100));

  const handleAction = () => {
    onClose();
    if (cta?.to) {
      navigate(cta.to);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0E1126] border border-ink-100 dark:border-purple-950/40 shadow-2xl p-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-purple-950/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Banner */}
          <div className="flex items-start gap-4 mb-5 pr-8">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner ${
              isCompleted 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-brand-500/10 border border-brand-500/20'
            }`}>
              {badge?.icon || (isCompleted ? '🏆' : '🎯')}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full tracking-wider ${
                  status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : status === 'IN_PROGRESS'
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {status === 'COMPLETED' ? 'Completed ✓' : status === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-white font-display leading-snug">
                {title}
              </h2>
              <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
          </div>

          {/* Progress Bar & Counter */}
          <div className="mb-6 p-4 rounded-xl bg-ink-50 dark:bg-purple-950/20 border border-ink-100 dark:border-purple-900/30">
            <div className="flex items-center justify-between text-xs font-bold text-ink-800 dark:text-white mb-2">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-brand-500" />
                <span>Challenge Progress</span>
              </span>
              <span>
                {current} / {target} ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-ink-200 dark:bg-purple-950/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-purple-600'
                }`}
              />
            </div>
          </div>

          {/* How to Complete Checklist */}
          {instructions && instructions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-ink-800 dark:text-white uppercase tracking-wider mb-2.5">
                How to Complete
              </h3>
              <div className="space-y-2">
                {instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-ink-700 dark:text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badge / Reward Section */}
          {badge && (
            <div className="mb-6 flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Reward Badge</p>
                  <p className="text-xs font-bold text-ink-900 dark:text-white">{badge.label}</p>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                isCompleted 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
              }`}>
                {isCompleted ? 'Unlocked 🔓' : 'Locked 🔒'}
              </span>
            </div>
          )}

          {/* Contextual Action Button */}
          {isCompleted ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Challenge Completed</span>
            </button>
          ) : (
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
            >
              <span>{cta?.label || 'Get Started'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
