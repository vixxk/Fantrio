import { useEffect, useRef, useState } from 'react';
import { Pencil, Coins, Loader2, X } from 'lucide-react';
import styles from './EditPriceDialog.module.css';

const QUICK_PRICES = [10, 25, 50, 100];

/**
 * Themed popup for editing a PPV content unlock price.
 *
 * Props:
 *  - item     (object|null) the PPV item being edited (drives visibility)
 *  - darkMode (bool)        theme switch
 *  - onClose  (fn)          called when the user dismisses
 *  - onSave   (fn)          async (price) => Promise — called with the new price;
 *                           resolves on success (dialog closes), rejects on failure
 */
export const EditPriceDialog = ({ item, darkMode = true, onClose, onSave }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // Reset the form whenever a new item is targeted
  useEffect(() => {
    if (item) {
      setValue(item.priceCoins != null ? String(item.priceCoins) : '');
      setError('');
      setSaving(false);
    }
  }, [item]);

  // Autofocus for fast editing (selection handled by onFocus so it reliably sticks)
  useEffect(() => {
    if (item && inputRef.current) inputRef.current.focus();
  }, [item]);

  // Esc to close, Enter to save
  useEffect(() => {
    const handleKey = (e) => {
      if (!item) return;
      if (e.key === 'Escape' && !saving) onClose();
      if (e.key === 'Enter' && !saving) handleSave();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, saving, value]);

  if (!item) return null;

  const parsed = Math.floor(Number(value));

  const handleSave = async () => {
    if (value.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid price above 0 coins.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(parsed);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update price. Please try again.');
      setSaving(false);
    }
  };

  const quickPick = (p) => {
    setValue(String(p));
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
        aria-label="Edit price"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close">
          <X size={16} />
        </button>

        <div className={styles.iconWrap}>
          <Pencil size={20} />
        </div>
        <h3 className={styles.title}>Edit Price</h3>
        <p className={styles.subtitle}>Set how many coins fans pay to unlock this content.</p>

        {/* Item preview */}
        <div className={styles.itemRow}>
          <img src={item.thumbnail} alt={item.title} className={styles.itemThumb} />
          <div className={styles.itemInfo}>
            <span className={styles.itemTitle}>{item.title}</span>
            <span className={styles.itemMeta}>
              {item.type} · <span className={styles.currentPrice}>Current: {item.priceCoins} coins</span>
            </span>
          </div>
        </div>

        {/* Price input */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="edit-price">New price</label>
          <div className={`${styles.inputWrap} ${error ? styles.inputError : ''}`}>
            <Coins size={16} className={styles.inputIcon} />
            <input
              id="edit-price"
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
            <span className={styles.inputSuffix}>coins</span>
          </div>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>

        {/* Quick-pick chips */}
        <div className={styles.quickRow}>
          {QUICK_PRICES.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.quickBtn} ${parsed === p ? styles.quickBtnActive : ''}`}
              onClick={() => quickPick(p)}
              disabled={saving}
            >
              {p}
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
              'Save Price'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
