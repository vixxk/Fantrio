import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, Coins, Loader2, X, Send } from 'lucide-react';
import styles from './PpvMediaDialog.module.css';

const QUICK_PRICES = [10, 25, 50, 100];
// Standard platform commission applied on PPV unlocks (see wallet.service.js)
const PLATFORM_FEE_RATE = 0.2;

/**
 * Popup shown to creators when they attach media in chat. Lets them send the
 * media free, or lock it behind a coin price (PPV) — the fan pays the price to
 * unlock and the creator receives it (minus the platform fee).
 *
 * Props:
 *  - open      (bool)   whether the popup is visible
 *  - file      (File|null) the media file the creator picked (drives the preview)
 *  - darkMode  (bool)   theme switch for the dialog colors
 *  - onCancel  (fn)     called when the user dismisses (Cancel / backdrop / Esc)
 *  - onConfirm (fn)     async (price) => Promise — called with the chosen price
 *                       (0 = free send, > 0 = PPV). Resolves on success (the
 *                       dialog closes), rejects on failure (error is shown).
 */
export const PpvMediaDialog = ({ open, file, darkMode = true, onCancel, onConfirm }) => {
  const [mode, setMode] = useState('free'); // 'free' | 'ppv'
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const inputRef = useRef(null);

  // Reset the form and build a preview whenever a new file is picked
  useEffect(() => {
    if (!open || !file) return;
    const url = URL.createObjectURL(file);
    Promise.resolve().then(() => {
      setMode('free');
      setPrice('');
      setError('');
      setSending(false);
      setPreviewUrl(url);
    });
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  // Autofocus the price input when switching to PPV
  useEffect(() => {
    if (open && mode === 'ppv' && inputRef.current) {
      const t = setTimeout(() => inputRef.current.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, mode]);

  const parsed = Math.floor(Number(price));
  const isPpv = mode === 'ppv';
  const earnings = isPpv && parsed > 0 && !Number.isNaN(parsed)
    ? Math.max(0, Math.floor(parsed * (1 - PLATFORM_FEE_RATE)))
    : 0;

  const handleSend = useCallback(async () => {
    if (isPpv) {
      if (price.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
        setError('Please enter a price above 0 coins.');
        return;
      }
    }
    setSending(true);
    setError('');
    try {
      await onConfirm(isPpv ? parsed : 0);
    } catch (err) {
      setError(err?.message || 'Failed to send media. Please try again.');
      setSending(false);
    }
  }, [isPpv, price, parsed, onConfirm]);

  const quickPick = (p) => {
    setPrice(String(p));
    setError('');
    if (inputRef.current) inputRef.current.focus();
  };

  // Esc to cancel, Enter to send
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !sending) onCancel();
      if (e.key === 'Enter' && !sending) handleSend();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, sending, isPpv, price, onCancel, onConfirm, handleSend]);

  if (!open || !file) return null;

  const isVideo = file.type.startsWith('video/');

  return (
    <div
      className={`${styles.overlay} ${!darkMode ? styles.light : ''}`}
      onClick={() => { if (!sending) onCancel(); }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Send media"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onCancel} disabled={sending} aria-label="Close">
          <X size={16} />
        </button>

        <div className={styles.iconWrap}>
          <Lock size={20} />
        </div>
        <h3 className={styles.title}>Send Media</h3>
        <p className={styles.subtitle}>Send this media free, or lock it behind a coin price (PPV).</p>

        {/* Media preview */}
        <div className={styles.previewWrap}>
          {isVideo ? (
            <video src={previewUrl} controls muted playsInline className={styles.preview} />
          ) : (
            <img src={previewUrl} alt="Media preview" className={styles.preview} />
          )}
        </div>

        {/* Free / PPV toggle */}
        <div className={styles.modeRow} role="radiogroup" aria-label="Delivery mode">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'free'}
            className={`${styles.modeBtn} ${mode === 'free' ? styles.modeActive : ''}`}
            onClick={() => { setMode('free'); setError(''); }}
            disabled={sending}
          >
            <Send size={15} />
            Free
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'ppv'}
            className={`${styles.modeBtn} ${mode === 'ppv' ? styles.modeActive : ''}`}
            onClick={() => { setMode('ppv'); setError(''); }}
            disabled={sending}
          >
            <Lock size={15} />
            Pay to View
          </button>
        </div>

        {isPpv ? (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="ppv-media-price">Unlock price</label>
              <div className={`${styles.inputWrap} ${error ? styles.inputError : ''}`}>
                <Coins size={16} className={styles.inputIcon} />
                <input
                  id="ppv-media-price"
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  className={styles.input}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter coins"
                  disabled={sending}
                />
                <span className={styles.inputSuffix}>coins</span>
              </div>
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            <div className={styles.quickRow}>
              {QUICK_PRICES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.quickBtn} ${parsed === p ? styles.quickBtnActive : ''}`}
                  onClick={() => quickPick(p)}
                  disabled={sending}
                >
                  {p}
                </button>
              ))}
            </div>

            {earnings > 0 && (
              <div className={styles.breakdown}>
                <span className={styles.breakdownItem}>
                  Fan pays <strong>{parsed.toLocaleString()} coins</strong>
                </span>
                <span className={styles.breakdownItem}>
                  You earn <strong>~{earnings.toLocaleString()} coins</strong>
                </span>
              </div>
            )}
          </>
        ) : (
          <p className={styles.freeNote}>The fan will see this media instantly at no charge.</p>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={sending}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSend} disabled={sending}>
            {sending ? (
              <span><Loader2 size={14} className={styles.spin} /> Sending…</span>
            ) : isPpv ? (
              parsed > 0 ? `Send for ${parsed.toLocaleString()} Coins` : 'Send PPV'
            ) : (
              'Send Free'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PpvMediaDialog;
