import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, LogOut } from 'lucide-react';
import styles from './AdminPage.module.css';

const AdminUIContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminUI = () => {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error('useAdminUI must be used within AdminUIProvider');
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

export const AdminUIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => removeToast(id), 4200);
  }, [removeToast]);

  const toast = {
    success: (m) => pushToast('success', m),
    error: (m) => pushToast('error', m),
    warning: (m) => pushToast('warning', m),
    info: (m) => pushToast('info', m)
  };

  const confirm = useCallback((opts) => {
    const {
      title = 'Are you sure?',
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      danger = false,
      variant = 'default'
    } = opts || {};
    return new Promise((resolve) => {
      setConfirmState({ title, message, confirmText, cancelText, danger, variant, resolve });
    });
  }, []);

  const closeConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  return (
    <AdminUIContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast notifications */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles['toast' + capitalize(t.type)]}`} role="status">
            <div className={styles.toastIcon}>{iconFor(t.type)}</div>
            <div className={styles.toastBody}>
              <div className={styles.toastMsg}>{t.message}</div>
              <div className={styles.toastProgress} />
            </div>
            <button className={styles.toastClose} onClick={() => removeToast(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {confirmState && (() => {
        const v = confirmState.variant === 'logout'
          ? 'logout'
          : (confirmState.danger ? 'danger' : 'default');
        const Icon = v === 'logout' ? LogOut : (v === 'danger' ? AlertTriangle : Info);
        const badge = v === 'logout'
          ? styles.confirmBadgeLogout
          : (v === 'danger' ? styles.confirmBadgeDanger : styles.confirmBadgeInfo);
        const confirmBtn = v === 'danger'
          ? styles.btnDanger
          : (v === 'logout' ? styles.btnWarningSolid : styles.btnSolid);

        return (
          <div className={styles.customModalOverlay} onClick={() => closeConfirm(false)}>
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
              <div className={styles.confirmHead}>
                <div className={`${styles.confirmBadge} ${badge}`}>
                  <Icon size={20} />
                </div>
                <h3 className={styles.confirmTitle}>{confirmState.title}</h3>
              </div>
              {confirmState.message && (
                <div className={styles.confirmBody}>
                  <p className={styles.confirmText}>{confirmState.message}</p>
                </div>
              )}
              <div className={styles.confirmActions}>
                <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => closeConfirm(false)}>
                  {confirmState.cancelText}
                </button>
                <button className={`${styles.buttonControl} ${confirmBtn}`} onClick={() => closeConfirm(true)}>
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AdminUIContext.Provider>
  );
};

export default AdminUIProvider;
