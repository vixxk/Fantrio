import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const iconFor = (type) => {
  switch (type) {
    case 'success': return <CheckCircle2 size={18} />;
    case 'error': return <XCircle size={18} />;
    case 'warning': return <AlertTriangle size={18} />;
    default: return <Info size={18} />;
  }
};

export const ToastProvider = ({ children }) => {
  const { darkMode } = useApp();
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const pushToast = useCallback((type, message, duration = 3500, onClick) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, type, message, onClick }]);
    timers.current[id] = setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  // Clean up pending timers on unmount
  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const toast = useMemo(() => ({
    success: (m, d, onClick) => pushToast('success', m, d, onClick),
    error: (m, d, onClick) => pushToast('error', m, d, onClick),
    warning: (m, d, onClick) => pushToast('warning', m, d, onClick),
    info: (m, d, onClick) => pushToast('info', m, d, onClick)
  }), [pushToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast notifications */}
      <div className={`${styles.toastContainer} ${!darkMode ? styles.light : ''}`} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles['toast' + capitalize(t.type)]} ${t.onClick ? styles.clickable : ''}`}
            role="status"
            onClick={() => {
              if (t.onClick) {
                t.onClick();
                removeToast(t.id);
              }
            }}
          >
            <span className={styles.toastIcon}>{iconFor(t.type)}</span>
            <span className={styles.toastMsg}>{t.message}</span>
            <button className={styles.toastClose} onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
