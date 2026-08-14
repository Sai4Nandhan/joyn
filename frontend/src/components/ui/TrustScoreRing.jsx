function scoreColor(score) {
  if (score >= 75) return '#2E8B57'; // trustworthy green
  if (score >= 50) return '#FF8552'; // signal accent
  return '#D9531F';
}

export function TrustScoreRing({ score, size = 72 }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-ink-100 dark:text-ink-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute font-display text-sm font-semibold text-ink-800 dark:text-white">{score}</span>
    </div>
  );
}
