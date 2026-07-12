import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastStack, type ToastData, type ToastType } from '../components/Toast';

type ShowToastInput = { message: string; type: ToastType; title?: string };
type ShowToast = (props: ShowToastInput) => void;

const ToastContext = createContext<ShowToast | null>(null);

// Keep the stack bounded so a burst of rapid failures (e.g. several
// background syncs erroring at once) can't cover the whole screen --
// the oldest toast is dropped first, newest always wins a slot.
const MAX_TOASTS = 4;

// Plain (non-component) builder functions -- PDF/receipt generators like
// CargoTagPDF/CargoReceipt/ValueJetReceipt -- can't call useToast() since
// they aren't inside the React tree and are called from many different
// screens. Rather than threading a return value or callback through every
// one of those call sites, they dispatch this window event instead; the
// single listener below (mounted once, always present since ToastProvider
// wraps the whole app) turns it into a normal toast. Same pattern this
// codebase already uses for main.tsx's 'vite:preloadError' listener.
const SILENT_ERROR_EVENT = 'ehi:silent-error';

export function notifySilentError(message: string, type: ToastType = 'warning') {
  window.dispatchEvent(new CustomEvent(SILENT_ERROR_EVENT, { detail: { message, type } }));
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const showToast = useCallback<ShowToast>((props) => {
    counter.current += 1;
    const id = `toast-${Date.now()}-${counter.current}`;
    setToasts((prev) => {
      const next = [...prev, { id, ...props }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ShowToastInput>).detail;
      if (detail?.message) showToast(detail);
    };
    window.addEventListener(SILENT_ERROR_EVENT, handler);
    return () => window.removeEventListener(SILENT_ERROR_EVENT, handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useToast must be used within a ToastProvider');
  return { showToast };
}
