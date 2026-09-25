// Text wordmark until the Western City Run logo asset is supplied — swap for an
// <img> then.
export default function ThemeLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex flex-col leading-none shrink-0 font-display font-extrabold uppercase tracking-tight ${className}`}
      aria-label="Western City Run"
    >
      <span className="text-[10px] md:text-xs text-sky-700 tracking-[0.2em]">Western City</span>
      <span className="text-lg md:text-2xl text-foreground">Run</span>
    </span>
  );
}
