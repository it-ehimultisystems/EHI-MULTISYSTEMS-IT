import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmOptions } from '../components/ConfirmDialog';

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  const handleClose = (result: boolean) => {
    // A fast double-click can register as two separate click events before
    // React re-renders the dialog out of the DOM -- resolveRef is cleared
    // on the first call, so a second one (Confirm-then-Confirm, or
    // Confirm-then-Cancel landing in the same frame) is a no-op instead of
    // running whatever the caller does after the promise resolves twice.
    if (!resolveRef.current) return;
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOptions(null);
    resolve(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog
          {...options}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider');
  return confirm;
}
