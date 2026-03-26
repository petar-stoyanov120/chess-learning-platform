'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string, options?: { duration?: number }) => void;
  error: (message: string, options?: { duration?: number }) => void;
  info: (message: string, options?: { duration?: number }) => void;
  warning: (message: string, options?: { duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration: number) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg, opts) => addToast(msg, 'success', opts?.duration ?? 3000),
      error: (msg, opts) => addToast(msg, 'error', opts?.duration ?? 5000),
      info: (msg, opts) => addToast(msg, 'info', opts?.duration ?? 4000),
      warning: (msg, opts) => addToast(msg, 'warning', opts?.duration ?? 4000),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={[
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
              'text-sm font-medium text-white cursor-pointer animate-fade-in-up',
              t.type === 'success' ? 'bg-green-600'
                : t.type === 'error' ? 'bg-red-600'
                : t.type === 'info' ? 'bg-blue-600'
                : 'bg-amber-600',
            ].join(' ')}
          >
            <span>{{ success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
