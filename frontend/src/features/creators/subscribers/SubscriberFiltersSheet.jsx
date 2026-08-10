import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  DEFAULT_SUBSCRIBER_FILTERS,
  countActiveSubscriberFilters,
} from './subscriberFilters';
import styles from './SubscriberFiltersSheet.module.css';

const Chip = ({ label, count, active, onClick, dot }) => (
  <button type="button" className={`${styles.chip} ${active ? styles.chipActive : ''}`} onClick={onClick}>
    {dot && <span className={styles.chipDot} style={{ background: dot }} />}
    {label}
    {count !== undefined && <span className={styles.chipCount}>{count}</span>}
  </button>
);

const Toggle = ({ label, hint, checked, onChange }) => (
  <div className={styles.toggleRow}>
    <div>
      <div className={styles.toggleLabel}>{label}</div>
      {hint && <div className={styles.toggleHint}>{hint}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`${styles.knob} ${checked ? styles.knobOn : ''}`} />
    </button>
  </div>
);

const PLAN_META = {
  Basic: { color: '#10b981' },
  Premium: { color: '#3b82f6' },
  VIP: { color: '#f59e0b' },
};

export const SubscriberFiltersSheet = ({
  open,
  onClose,
  onApply,
  initialFilters = DEFAULT_SUBSCRIBER_FILTERS,
  dark = false,
  desktop = false,
  getResultCount = null, // async (draftFilters) => number | null
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [resultCount, setResultCount] = useState(null);

  // Reset the draft back to the currently applied filters each time the sheet opens
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setFilters(initialFilters || DEFAULT_SUBSCRIBER_FILTERS);
      setResultCount(null);
    }
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Live count of matching subscribers (debounced server-side count)
  useEffect(() => {
    if (!open || !getResultCount) {
      setResultCount(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const n = await getResultCount(filters);
        setResultCount(typeof n === 'number' ? n : null);
      } catch (err) {
        setResultCount(null);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filters]);

  if (!open) return null;

  const activeCount = countActiveSubscriberFilters(filters);
  const set = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  // Sort is not part of these filters — it lives in the toolbar dropdown,
  // so resetting filters never touches it.
  const reset = () => setFilters(DEFAULT_SUBSCRIBER_FILTERS);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <>
      <div className={`${styles.backdrop} ${dark ? styles.backdropDark : ''}`} onClick={onClose} />
      <div
        className={`${styles.sheet} ${desktop ? styles.dialog : ''} ${dark ? styles.dark : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter subscribers"
      >
        <div className={styles.dragHandle} />

        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <SlidersHorizontal size={17} className={styles.titleIcon} />
            Filter subscribers
            {activeCount > 0 && <span className={styles.headerCount}>{activeCount}</span>}
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.resetBtn} onClick={reset}>
              <RotateCcw size={13} /> Reset
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {/* Plan */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Plan</div>
            <div className={styles.chipRow}>
              <Chip label="All plans" active={filters.plan === 'all'} onClick={() => set({ plan: 'all' })} />
              {Object.entries(PLAN_META).map(([name, meta]) => (
                <Chip
                  key={name}
                  label={name}
                  dot={meta.color}
                  active={filters.plan === name.toLowerCase()}
                  onClick={() => set({ plan: name.toLowerCase() })}
                />
              ))}
            </div>
          </div>

          {/* Spend range */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Total spent (coins)</div>
            <div className={styles.chipRow}>
              <Chip label="Any amount" active={filters.spend === 'all'} onClick={() => set({ spend: 'all' })} />
              <Chip label="Up to 49" active={filters.spend === 'under50'} onClick={() => set({ spend: 'under50' })} />
              <Chip label="50 – 149" active={filters.spend === '50to150'} onClick={() => set({ spend: '50to150' })} />
              <Chip label="150+" active={filters.spend === 'over150'} onClick={() => set({ spend: 'over150' })} />
            </div>
          </div>

          {/* Toggles */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Show only</div>
            <Toggle
              label="Online now"
              hint="Only subscribers who are currently online"
              checked={filters.onlineOnly}
              onChange={(v) => set({ onlineOnly: v })}
            />
            <Toggle
              label="Verified"
              hint="Only subscribers with a verified account"
              checked={filters.verifiedOnly}
              onChange={(v) => set({ verifiedOnly: v })}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.resetAllBtn} onClick={reset}>
            Clear all
          </button>
          <button type="button" className={styles.applyBtn} onClick={handleApply}>
            {resultCount !== null
              ? `Show ${resultCount} ${resultCount === 1 ? 'subscriber' : 'subscribers'}`
              : 'Apply filters'}
          </button>
        </div>
      </div>
    </>
  );
};
