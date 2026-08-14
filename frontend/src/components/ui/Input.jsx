import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, id, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-600 dark:text-ink-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none
          transition-colors placeholder:text-ink-300 dark:bg-ink-800 dark:text-ink-100
          ${error ? 'border-red-400' : 'border-ink-200 focus:border-signal-400 dark:border-ink-600'}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
