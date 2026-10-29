import { createContext, useContext } from 'react';

export type ToastTone = 'default' | 'success' | 'error';

export interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
  clear: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside ToastProvider.');
  }
  return value;
}
