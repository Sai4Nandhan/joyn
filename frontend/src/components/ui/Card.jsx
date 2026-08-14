export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/50 bg-white shadow-card transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
