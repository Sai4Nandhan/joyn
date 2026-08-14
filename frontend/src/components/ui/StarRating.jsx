import { useState } from 'react';
import { Star } from 'lucide-react';

export function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-signal-400"
        >
          <Star size={size} fill={(hovered || value) >= n ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
