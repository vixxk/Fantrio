import { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import styles from './AdminPage.module.css';

/**
 * Mobile-only filter launcher for admin pages.
 *
 * Renders a filter icon button next to the page search bar (hidden on desktop)
 * that opens a bottom-sheet popup. The popup always contains the Period section
 * plus any page-specific filter sections passed as `children` (e.g. media type,
 * stream status chips).
 *
 * Props:
 *  - period / onPeriodChange : bound to the page's existing period state.
 *  - onReset                 : optional — clears page-specific filters.
 *  - activeCount             : number of active filters shown as a badge.
 *  - children                : optional extra <FilterSection> blocks.
 */
export const AdminFilterButton = ({
  period,
  onPeriodChange,
  onReset,
  activeCount = 0,
  children
}) => {
  const [open, setOpen] = useState(false);

  // Close on Escape + lock body scroll while the sheet is open
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleReset = () => {
    onPeriodChange({ preset: null, from: '', to: '' });
    if (onReset) onReset();
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.filterIconBtn} ${activeCount > 0 ? styles.filterIconBtnActive : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open filters"
        aria-expanded={open}
      >
        <SlidersHorizontal size={17} />
      </button>

      {open && (
        <div className={styles.filterSheetOverlay} onClick={() => setOpen(false)}>
          <div className={styles.filterSheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filters">
            <div className={styles.filterSheetHandle} />
            <div className={styles.filterSheetHead}>
              <div className={styles.filterSheetHeadIcon}>
                <SlidersHorizontal size={16} />
              </div>
              <h3 className={styles.filterSheetTitle}>Filters</h3>
              <button className={styles.modalCloseBtn} onClick={() => setOpen(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>

            <div className={styles.filterSheetBody}>
              <div className={styles.filterSheetSection}>
                <AdminPeriodFilter value={period} onChange={onPeriodChange} />
              </div>
              {children}
            </div>

            <div className={styles.filterSheetFoot}>
              <button
                type="button"
                className={`${styles.buttonControl} ${styles.btnGhost}`}
                onClick={handleReset}
                disabled={activeCount === 0}
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                type="button"
                className={`${styles.buttonControl} ${styles.btnSolid}`}
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
