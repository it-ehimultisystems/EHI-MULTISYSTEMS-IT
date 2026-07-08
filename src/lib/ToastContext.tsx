import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast, type ToastProps } from '../components/Toast';

type ShowToast = (props: Omit<ToastProps, 'onClose'>) => void;

const ToastContext = createContext<ShowToast | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = useCallback<ShowToast>((props) => {
    setToast({ ...props, onClose: () => setToast(null) });
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <Toast {...toast} />}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) throw new Error('useToast must be used within a ToastProvider');
  return { showToast };
}
