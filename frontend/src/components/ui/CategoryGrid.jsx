import React from 'react';
import { Mountain, Trophy, Users, Plane, Footprints, MoreHorizontal } from 'lucide-react';

const categories = [
  { key: 'trips', label: 'Trips', Icon: Mountain, bg: 'bg-brand-50', text: 'text-brand-500' },
  { key: 'sports', label: 'Sports', Icon: Trophy, bg: 'bg-accent-green-light', text: 'text-accent-green' },
  { key: 'social', label: 'Social', Icon: Users, bg: 'bg-accent-purple-light', text: 'text-accent-purple' },
  { key: 'travel', label: 'Travel', Icon: Plane, bg: 'bg-accent-blue-light', text: 'text-accent-blue' },
  { key: 'trekking', label: 'Trekking', Icon: Footprints, bg: 'bg-accent-orange-light', text: 'text-accent-orange' },
  { key: 'more', label: 'More', Icon: MoreHorizontal, bg: 'bg-ink-100', text: 'text-ink-500' },
];

export function CategoryGrid({ onSelect }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-ink-900">Popular Categories</h3>

      <div className="grid grid-cols-3 gap-2">
        {categories.map(({ key, label, Icon, bg, text }) => (
          <button
            key={key}
            onClick={() => onSelect?.(key)}
            className={`${bg} flex flex-col items-center gap-1.5 rounded-xl p-3 transition-transform hover:scale-105 active:scale-95`}
          >
            <Icon className={`h-6 w-6 ${text}`} />
            <span className="text-xs font-medium text-ink-600">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryGrid;
