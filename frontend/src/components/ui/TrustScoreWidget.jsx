import { ShieldCheck } from 'lucide-react';

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

function getScoreColor(score) {
  if (score >= 80) return { text: 'text-trust-high', bg: 'bg-trust-high' };
  if (score >= 60) return { text: 'text-trust-medium', bg: 'bg-trust-medium' };
  return { text: 'text-trust-low', bg: 'bg-trust-low' };
}

export function TrustScoreWidget({ score = 92 }) {
  const label = getScoreLabel(score);
  const colors = getScoreColor(score);

  return (
    <div className="px-4 py-4">
      <p className="text-xs font-medium text-ink-400 mb-3">Trust Score</p>
      <div className="flex items-center gap-3">
        <ShieldCheck className={`h-8 w-8 ${colors.text}`} />
        <div>
          <p className={`text-2xl font-bold ${colors.text}`}>{score}</p>
          <p className="text-xs text-ink-400">{label}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bg} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <button className="mt-2 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
        View Details &rsaquo;
      </button>
    </div>
  );
}
