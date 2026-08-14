import React from 'react';

const sizeClasses = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-xs',
};

export function AvatarStack({ avatars = [], max = 4, size = 'sm' }) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  const getFallbackUrl = (name) =>
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-center">
      {visible.map((avatar, index) => (
        <img
          key={index}
          src={avatar.url || getFallbackUrl(avatar.name)}
          alt={avatar.name}
          title={avatar.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getFallbackUrl(avatar.name);
          }}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white ${
            index === 0 ? 'ml-0' : '-ml-2'
          }`}
        />
      ))}

      {overflow > 0 && (
        <div
          className={`${sizeClass} -ml-2 flex items-center justify-center rounded-full bg-ink-100 font-medium text-ink-500 ring-2 ring-white`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default AvatarStack;
