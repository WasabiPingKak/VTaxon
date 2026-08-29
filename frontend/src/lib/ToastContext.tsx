import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastOptions {
  duration?: number;
  type?: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  }, []);

  const addToast = useCallback((message: string, { duration = 5000, type = 'info' }: ToastOptions = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    timersRef.current.add(timerId);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px',
          zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
          maxWidth: '400px',
        }}>
          {toasts.map(t => {
            // 狀態色沿用全站語彙：成功 #4ade80、錯誤 #f87171、資訊 #38bdf8
            const accent = t.type === 'success' ? { dot: '#4ade80', border: 'rgba(34,197,94,0.3)' }
              : t.type === 'error' ? { dot: '#f87171', border: 'rgba(239,68,68,0.3)' }
              : { dot: '#38bdf8', border: 'rgba(56,189,248,0.3)' };
            return (
            <div key={t.id} style={{
              background: 'rgba(20,28,40,0.92)', backdropFilter: 'blur(8px)',
              color: '#e2e8f0', padding: '12px 16px',
              border: `1px solid ${accent.border}`,
              borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              fontSize: '0.9em', lineHeight: '1.4',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              animation: 'toast-in 0.3s ease-out',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: accent.dot,
                flexShrink: 0, marginTop: 6,
              }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: '1.1em', padding: 0,
                lineHeight: 1, flexShrink: 0,
              }}>✕</button>
            </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
