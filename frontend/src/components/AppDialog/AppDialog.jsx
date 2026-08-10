import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { HelpCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AppDialog.module.css';

/**
 * Themed dialog system for the user panel — replaces the native
 * alert() / confirm() / prompt() popups with branded dialogs that match
 * the logout-confirmation popup used across the app.
 *
 * Usage (inside any component wrapped by <AppDialogProvider>):
 *   const { confirm, info, warning, prompt } = useAppDialog();
 *
 *   // Confirmation → resolves with true/false
 *   const ok = await confirm({ title: 'Block Creator?', message: '...', confirmLabel: 'Block' });
 *
 *   // Information → resolves with true when dismissed
 *   await info({ title: 'Copied!', message: 'Profile link copied to clipboard.' });
 *
 *   // Input prompt → resolves with the entered string (or null if cancelled)
 *   const reason = await prompt({ title: 'Report Creator', placeholder: 'Why are you reporting?', confirmLabel: 'Submit' });
 */
const AppDialogContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAppDialog = () => {
  const ctx = useContext(AppDialogContext);
  if (!ctx) throw new Error('useAppDialog must be used within AppDialogProvider');
  return ctx;
};

const MODE_ICONS = {
  confirm: <HelpCircle size={22} />,
  info: <Info size={22} />,
  warning: <AlertTriangle size={22} />
};

const MODE_ACCENTS = {
  confirm: '#e10075',
  info: '#7e00f3',
  warning: '#eab308'
};

export const AppDialogProvider = ({ children }) => {
  const { darkMode } = useApp();
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const dialogRef = useRef(null);

  const resolveAndClose = useCallback((result) => {
    setDialog((prev) => {
      if (prev && prev.resolve) prev.resolve(result);
      return null;
    });
    dialogRef.current = null;
    setInputValue('');
  }, []);

  const open = useCallback((mode, opts) => new Promise((resolve) => {
    // If a dialog is already open, settle its promise first so no caller
    // awaits forever (e.g. a rapid double-click on a Report button).
    if (dialogRef.current && dialogRef.current.resolve) {
      dialogRef.current.resolve(mode === 'prompt' ? null : false);
    }
    dialogRef.current = { resolve };
    setDialog({ mode, resolve, ...opts });
    setInputValue(opts.initialValue !== undefined ? opts.initialValue : '');
  }), []);

  const confirm = useCallback((opts) => open('confirm', opts), [open]);
  const info = useCallback((opts) => open('info', opts), [open]);
  const warning = useCallback((opts) => open('warning', opts), [open]);
  const prompt = useCallback((opts) => open('prompt', opts), [open]);

  // Keyboard handling: Escape cancels, Enter submits the prompt / confirms
  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Info/warning dismiss resolves true (same as clicking OK);
        // confirm resolves false (cancelled); prompt resolves null.
        if (dialog.mode === 'prompt') resolveAndClose(null);
        else if (dialog.mode === 'confirm') resolveAndClose(false);
        else resolveAndClose(true);
      } else if (e.key === 'Enter' && dialog.mode === 'prompt') {
        e.preventDefault();
        resolveAndClose(inputValue);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, inputValue, resolveAndClose]);

  // Focus the right control when a dialog opens: the text input for prompts,
  // the cancel button for confirmations (safe default), and OK for info.
  useEffect(() => {
    if (!dialog) return undefined;
    const t = setTimeout(() => {
      if (dialog.mode === 'prompt') {
        inputRef.current?.focus();
      } else if (dialog.mode === 'confirm') {
        cancelBtnRef.current?.focus();
      } else {
        cancelBtnRef.current?.focus();
      }
    }, 60);
    return () => clearTimeout(t);
  }, [dialog]);

  const value = { confirm, info, warning, prompt };

  if (!dialog) {
    return <AppDialogContext.Provider value={value}>{children}</AppDialogContext.Provider>;
  }

  const isPrompt = dialog.mode === 'prompt';
  const isInfo = dialog.mode === 'info' || dialog.mode === 'warning';
  const accent = dialog.accent || MODE_ACCENTS[dialog.mode] || '#e10075';
  const accentEnd = dialog.accentEnd || '#7e00f3';

  return (
    <AppDialogContext.Provider value={value}>
      {children}

      <div
        className={`${styles.overlay} ${!darkMode ? styles.light : ''}`}
        onClick={() => resolveAndClose(isPrompt ? null : false)}
      >
        <div
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-label={dialog.title || 'Dialog'}
          onClick={(e) => e.stopPropagation()}
        >
          {!isPrompt && (
            <div
              className={styles.iconWrap}
              style={{ color: accent, borderColor: `${accent}40`, background: `${accent}1a` }}
            >
              {dialog.icon || MODE_ICONS[dialog.mode] || <Info size={22} />}
            </div>
          )}

          <h3 className={styles.title}>{dialog.title || 'Notice'}</h3>

          {dialog.message && <p className={styles.text}>{dialog.message}</p>}

          {isPrompt && (
            <div className={styles.inputWrap}>
              <input
                ref={inputRef}
                className={styles.input}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialog.placeholder || ''}
                maxLength={dialog.maxLength || 500}
                autoFocus
              />
            </div>
          )}

          <div className={styles.actions}>
            {isInfo ? (
              <button
                ref={cancelBtnRef}
                className={styles.confirmBtn}
                style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)` }}
                onClick={() => resolveAndClose(true)}
              >
                {dialog.confirmLabel || 'OK'}
              </button>
            ) : (
              <>
                <button
                  ref={isPrompt ? null : cancelBtnRef}
                  className={styles.cancelBtn}
                  onClick={() => resolveAndClose(isPrompt ? null : false)}
                >
                  {dialog.cancelLabel || 'Cancel'}
                </button>
                <button
                  className={styles.confirmBtn}
                  style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)` }}
                  onClick={() => resolveAndClose(isPrompt ? inputValue : true)}
                >
                  {dialog.confirmLabel || (isPrompt ? 'Submit' : 'Confirm')}
                </button>
              </>
            )}
          </div>

          {isPrompt && (
            <button
              className={styles.closeBtn}
              aria-label="Close"
              onClick={() => resolveAndClose(null)}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </AppDialogContext.Provider>
  );
};

export default AppDialogProvider;
