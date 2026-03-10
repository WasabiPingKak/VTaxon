import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  }, []);

  const addToast = useCallback((message, { duration = 5000, type = 'info' } = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    const timerId = setTimeout(() => {
      timersRef.current.delete(timerId);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    timersRef.current.add(timerId);
  }, []);

  const dismiss = useCallback((id) => {
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
            const bg = t.type === 'success' ? '#2e7d32'
              : t.type === 'error' ? '#c62828'
              : '#1a73e8';
            return (
            <div key={t.id} style={{
              background: bg, color: '#fff', padding: '12px 16px',
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '0.9em', lineHeight: '1.4',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              animation: 'toast-in 0.3s ease-out',
            }}>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{
                background: 'none', border: 'none', color: '#fff',
                cursor: 'pointer', fontSize: '1.1em', padding: 0,
                lineHeight: 1, opacity: 0.7, flexShrink: 0,
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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
