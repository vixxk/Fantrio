import { Trash2, Loader2 } from 'lucide-react';
import styles from './ConfirmDeleteDialog.module.css';

/**
 * Reusable themed confirmation popup for destructive actions (delete, block, end).
 * Mirrors the logout-confirmation dialog styling used across the app.
 *
 * Props:
 *  - open         (bool)    whether the popup is visible
 *  - itemName     (string)  name of the item being acted on (used in the default message)
 *  - title        (string)  dialog heading, defaults to "Delete Content?"
 *  - confirmLabel (string)  confirm button text, defaults to "Delete"
 *  - busyLabel    (string)  text shown with the spinner while busy, defaults to "Deleting…"
 *  - message      (node)    optional custom body text; overrides the default message
 *  - icon         (node)    optional icon shown in the icon badge (defaults to Trash2)
 *  - variant      (string)  'danger' (red, default) or 'success' (green) — styles the confirm button + icon badge
 *  - deleting     (bool)    disables controls and shows a spinner while true
 *  - darkMode     (bool)    theme switch for the dialog colors
 *  - onCancel     (fn)      called when the user dismisses (Cancel / backdrop)
 *  - onConfirm    (fn)      called when the user confirms
 */
export const ConfirmDeleteDialog = ({
  open,
  itemName = '',
  title = 'Delete Content?',
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  message,
  icon = <Trash2 size={22} />,
  variant = 'danger',
  deleting = false,
  darkMode = true,
  onCancel,
  onConfirm
}) => {
  if (!open) return null;

  const isSuccess = variant === 'success';

  return (
    <div
      className={`${styles.overlay} ${!darkMode ? styles.light : ''}`}
      onClick={() => { if (!deleting) onCancel(); }}
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.iconWrap} ${isSuccess ? styles.iconWrapSuccess : ''}`}>
          {icon}
        </div>
        <h3 className={styles.title}>{title}</h3>
        {message !== undefined ? (
          <p className={styles.text}>{message}</p>
        ) : (
          <p className={styles.text}>
            Are you sure you want to delete <strong>"{itemName || 'this item'}"</strong>? This action cannot be undone.
          </p>
        )}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className={`${styles.confirmBtn} ${isSuccess ? styles.confirmBtnSuccess : ''}`} onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <span><Loader2 size={14} className={styles.spin} /> {busyLabel}</span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
