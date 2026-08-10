import { Loader2 } from 'lucide-react';
import styles from './ConfirmToggleDialog.module.css';

/**
 * Reusable themed confirmation popup for toggling call availability
 * (Go Live Now / Go Offline).
 * Mirrors the logout-confirmation dialog styling used across the app.
 *
 * Props:
 *  - open         (bool)    whether the popup is visible
 *  - title        (string)  dialog heading, e.g. "Go Offline?"
 *  - message      (node)    body text below the heading
 *  - confirmLabel (string)  confirm button label, e.g. "Go Offline"
 *  - busyLabel    (string)  text shown with the spinner while busy, defaults to "Updating…"
 *  - icon         (node)    optional icon shown in the icon badge
 *  - accent       (string)  CSS color used on the icon + confirm button
 *  - busy         (bool)    disables controls and shows a spinner while true
 *  - darkMode     (bool)    theme switch for the dialog colors
 *  - onCancel     (fn)      called when the user dismisses (Cancel / backdrop)
 *  - onConfirm    (fn)      called when the user confirms
 */
export const ConfirmToggleDialog = ({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  busyLabel = 'Updating…',
  icon,
  accent = '#e10075',
  busy = false,
  darkMode = true,
  onCancel,
  onConfirm
}) => {
  if (!open) return null;

  return (
    <div
      className={`${styles.overlay} ${!darkMode ? styles.light : ''}`}
      onClick={() => { if (!busy) onCancel(); }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ '--accent': accent }}
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div className={styles.iconWrap}>
            {icon}
          </div>
        )}
        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.text}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={busy}>
            {busy ? (
              <span><Loader2 size={14} className={styles.spin} /> {busyLabel}</span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
