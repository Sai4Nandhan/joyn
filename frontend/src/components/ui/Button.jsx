import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-gradient-to-r from-[#7c3aed] via-[#db2777] to-[#ea580c] text-white hover:opacity-95 active:scale-[0.98] transition-all font-semibold shadow-md shadow-brand-550/15 rounded-xl border-0 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 dark:bg-ink-700 dark:text-ink-100 dark:hover:bg-ink-600',
  ghost:
    'bg-transparent text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
  danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
};

export const Button = forwardRef(
  ({ variant = 'primary', isLoading = false, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium
          transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
