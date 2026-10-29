import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext';
import type { ToastTone } from './ToastContext';
import styles from './ToastProvider.module.css';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => {
        const next = [...current, { id, message, tone }];
        if (next.length > 3) {
          const removed = next.shift();
          if (removed) {
            const timer = timers.current.get(removed.id);
            if (timer) {
              window.clearTimeout(timer);
              timers.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      const timer = window.setTimeout(
        () => dismiss(id),
        tone === 'error' ? 6000 : 4000,
      );
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      scheduled.forEach((timer) => window.clearTimeout(timer));
      scheduled.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notify, clear }}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon =
            toast.tone === 'success'
              ? CheckCircle2
              : toast.tone === 'error'
                ? CircleAlert
                : Info;

          return (
            <div
              key={toast.id}
              className={[styles.toast, styles[toast.tone]].join(' ')}
              role="status"
            >
              <Icon size={17} className={styles.icon} aria-hidden="true" />
              <p className={styles.message}>{toast.message}</p>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
