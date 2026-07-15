import { ArrowLeft } from "lucide-react";

// Every view screen used to hand-roll its own back button -- 27 separate
// copies with icon sizes ranging 12-20px and inconsistent (often
// nonexistent) padding, several small enough that users reported struggling
// to see or tap them. One shared, deliberately larger touch target instead.
export const BackButton = ({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) => (
  <button
    onClick={onClick}
    aria-label="Back"
    className={`flex items-center gap-1.5 p-2.5 -m-2.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer border-none bg-transparent shrink-0 ${className}`}
  >
    <ArrowLeft size={22} strokeWidth={2} />
    {label && <span className="text-[11px] font-mono font-bold">{label}</span>}
  </button>
);
