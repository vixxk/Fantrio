import { useEffect, useRef, useState } from 'react';
import { Loader2, Phone, Video, X } from 'lucide-react';
import styles from './CallRateDialog.module.css';

const QUICK_RATES = [20, 50, 100, 200];

const TYPE_CONFIG = {
  audio: {
    label: 'Audio Call',
    icon: Phone,
    accent: '#10b981',
    note: 'Your per-minute rate for private 1:1 audio calls.'
  },
  video: {
    label: 'Video Call',
    icon: Video,
    accent: '#3b82f6',
    note: 'Your per-minute rate for private 1:1 video calls.'
  }
};

/**
 * Themed popup for editing a creator's audio/video call rate.
 *
 * Props:
 *  - callType  ('audio' | 'video' | null) drives visibility + accent theme
 *  - currentRate (number) current per-minute rate
 *  - darkMode  (bool) theme switch
 *  - onClose   (fn) called when the user dismisses
 *  - onSave    (async (rate) => Promise) called with the new rate;
 *              resolves on success (dialog closes), rejects on failure
 */
export const CallRateDialog = ({ callType = null, currentRate = 0, darkMode = true, onClose, onSave }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const config = TYPE_CONFIG[callType] || null;

  // Reset the form whenever a new call type is targeted
  useEffect(() => {
    if (callType) {
      setValue(currentRate != null ? String(currentRate) : '');
      setError('');
      setSaving(false);
    }
  }, [callType, currentRate]);

  // Autofocus for fast editing (select all so typing replaces the value)
  useEffect(() => {
    if (callType && inputRef.current) inputRef.current.focus();
  }, [callType]);

  // Esc to close, Enter to save
  useEffect(() => {
    const handleKey = (e) => {
      if (!callType || saving) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleSave();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType, saving, value]);

  if (!config) return null;

  const Icon = config.icon;
  const accent = config.accent;
  const parsed = Math.floor(Number(value));

  const handleSave = async () => {
    if (value.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid rate above 0 coins.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(parsed);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update rate. Please try again.');
      setSaving(false);
    }
  };

  const quickPick = (r) => {
    setValue(String(r));
    setError('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div
      className={`${styles.overlay} ${!darkMode ? styles.light : ''}`}
      onClick={() => { if (!saving) onClose(); }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${config.label.toLowerCase()} rate`}
        style={{ '--accent': accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close">
          <X size={16} />
        </button>

        <div className={styles.iconWrap}>
          <Icon size={20} />
        </div>
        <h3 className={styles.title}>Edit {config.label} Rate</h3>
        <p className={styles.subtitle}>{config.note}</p>

        {/* Current rate summary */}
        <div className={styles.currentRow}>
          <span className={styles.currentLabel}>Current rate</span>
          <span className={styles.currentValue}>
            {currentRate != null ? currentRate : 0} <span className={styles.currentUnit}>coins / min</span>
          </span>
        </div>

        {/* Rate input */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="call-rate-input">New rate</label>
          <div className={`${styles.inputWrap} ${error ? styles.inputError : ''}`}>
            <Icon size={16} className={styles.inputIcon} />
            <input
              id="call-rate-input"
              ref={inputRef}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={styles.input}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Enter coins"
              disabled={saving}
            />
            <span className={styles.inputSuffix}>coins / min</span>
          </div>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>

        {/* Quick-pick chips */}
        <div className={styles.quickRow}>
          {QUICK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.quickBtn} ${parsed === r ? styles.quickBtnActive : ''}`}
              onClick={() => quickPick(r)}
              disabled={saving}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? (
              <span><Loader2 size={14} className={styles.spin} /> Saving…</span>
            ) : (
              'Save Rate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
