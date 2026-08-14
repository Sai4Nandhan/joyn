import React from 'react';
import { MapPin } from 'lucide-react';

const pins = [
  { top: '22%', left: '18%', color: 'bg-accent-orange', label: 'sports' },
  { top: '38%', left: '72%', color: 'bg-accent-green', label: 'trips' },
  { top: '60%', left: '30%', color: 'bg-accent-purple', label: 'social' },
  { top: '28%', left: '55%', color: 'bg-accent-blue', label: 'travel' },
  { top: '70%', left: '65%', color: 'bg-accent-red', label: 'trekking' },
];

export function MapWidget({ onViewMap, onPinClick }) {
  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-ink-900">Explore Near You</h3>
        <button
          onClick={onViewMap}
          className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
        >
          View on Map &gt;
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="relative mx-4 mb-4 h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-100">
        {/* Abstract map lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 120 Q100 80 200 110 T400 90" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M0 160 Q150 130 250 150 T400 140" stroke="#94a3b8" strokeWidth="1" />
          <path d="M0 60 Q80 40 180 70 T400 50" stroke="#94a3b8" strokeWidth="1" />
          <path d="M100 0 Q110 60 90 120 T120 200" stroke="#94a3b8" strokeWidth="1" />
          <path d="M280 0 Q260 50 290 100 T270 200" stroke="#94a3b8" strokeWidth="1" />
        </svg>

        {/* Colored pin dots */}
        {pins.map((pin, i) => (
          <button
            key={i}
            onClick={() => onPinClick?.(pin.label)}
            className="absolute flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            style={{ top: pin.top, left: pin.left }}
            title={`View ${pin.label} pins`}
          >
            <span
              className={`${pin.color} h-6 w-6 flex items-center justify-center rounded-full text-white text-[10px] font-bold shadow-md ring-2 ring-white`}
            >
              {pin.label[0].toUpperCase()}
            </span>
          </button>
        ))}

        {/* Center pin */}
        <button
          onClick={onViewMap}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
        >
          <div className="rounded-full bg-brand-500 p-1.5 shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 opacity-40" />
        </button>

        {/* Subtle gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/60 to-transparent" />
      </div>
    </div>
  );
}

export default MapWidget;
