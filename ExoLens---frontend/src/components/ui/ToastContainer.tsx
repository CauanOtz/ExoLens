import { useEffect, useState } from 'react';
import './ToastContainer.css';

type Toast = { id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onNotify = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || !detail.message) return;
      const t: Toast = { id: String(Date.now()) + Math.random().toString(36).slice(2, 8), type: detail.type || 'info', message: detail.message };
      setToasts((s) => [...s, t]);
      setTimeout(() => {
        setToasts((s) => s.filter(x => x.id !== t.id));
      }, detail.duration || 4500);
    };
    window.addEventListener('notify', onNotify as EventListener);
    return () => window.removeEventListener('notify', onNotify as EventListener);
  }, []);

  const dismiss = (id: string) => setToasts((s) => s.filter(t => t.id !== id));

  return (
    <div className="toast-root" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role="status">
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Close notification">×</button>
        </div>
      ))}
    </div>
  );
}
