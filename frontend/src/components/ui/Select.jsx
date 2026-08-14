import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({ label, error, id, options, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-600 dark:text-ink-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={`w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none
            transition-colors dark:bg-ink-800 dark:text-ink-100
            ${error ? 'border-red-400' : 'border-ink-200 focus:border-signal-400 dark:border-ink-600'}
            ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';
