import React from 'react';
import { Layers, Mountain, Trophy, Users, Plane, ChevronDown } from 'lucide-react';

const pills = [
  { key: 'all', label: 'All', Icon: Layers },
  { key: 'trips', label: 'Trips', Icon: Mountain },
  { key: 'sports', label: 'Sports', Icon: Trophy },
  { key: 'social', label: 'Social', Icon: Users },
  { key: 'travel', label: 'Travel', Icon: Plane },
  { key: 'more', label: 'More', Icon: ChevronDown, isDropdown: true },
];

export function CategoryPills({ selected = 'all', onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      {pills.map(({ key, label, Icon, isDropdown }) => {
        const isActive = selected === key;

        return (
          <button
            key={key}
            onClick={() => onChange?.(key)}
            className={`category-pill ${isActive ? 'active' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryPills;
