import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastCardProps extends ToastData {
  onDismiss: (id: string) => void;
}

// Errors and warnings stay up longer than success/info -- the whole point of
// this component is that a failure should give the user enough time to
// actually read it, not flash past in the same 4s a "Saved!" gets.
const TOAST_CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle; label: string; color: string; bg: string; border: string; glow: string; duration: number }
> = {
  success: { icon: CheckCircle, label: 'Success', color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', glow: 'var(--glow-success)', duration: 3500 },
  error: { icon: AlertCircle, label: 'Error', color: 'var(--color-error)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', glow: 'var(--glow-error)', duration: 7000 },
  warning: { icon: AlertTriangle, label: 'Warning', color: 'var(--color-accent-amber)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', glow: 'var(--glow-amber)', duration: 5000 },
  info: { icon: Info, label: 'Notice', color: 'var(--color-accent-cobalt)', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', glow: 'var(--glow-cobalt)', duration: 4000 },
};

const ToastCard = ({ id, message, type, title, onDismiss }: ToastCardProps) => {
  const [leaving, setLeaving] = useState(false);
  const cfg = TOAST_CONFIG[type];
  const Icon = cfg.icon;

  const dismiss = () => {
    setLeaving(true);
    // Let the exit animation play before actually removing it from the stack.
    setTimeout(() => onDismiss(id), 180);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, cfg.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="alert"
      className={`w-full pointer-events-auto overflow-hidden rounded-[var(--radius-md)] border backdrop-blur-md ${
        leaving
          ? 'animate-out fade-out slide-out-to-top-2 duration-150'
          : 'animate-in fade-in slide-in-from-top-4 duration-300'
      }`}
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderColor: cfg.border,
        boxShadow: `var(--shadow-card), 0 8px 24px -8px ${cfg.glow}`,
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div
          className="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon size={15} color={cfg.color} strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div
            className="text-[10.5px] font-bold font-sans uppercase tracking-wider mb-0.5"
            style={{ color: cfg.color }}
          >
            {title || cfg.label}
          </div>
          <div className="text-[13px] font-sans leading-snug text-[var(--color-foreground)] break-words">
            {message}
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-full text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-[3px] w-full" style={{ backgroundColor: cfg.bg }}>
        <div
          className="h-full"
          style={{
            backgroundColor: cfg.color,
            animation: leaving ? 'none' : `ehi-toast-shrink ${cfg.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

export const ToastStack = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <div className="w-full max-w-sm flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
