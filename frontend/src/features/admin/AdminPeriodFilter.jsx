import { useState } from 'react';
import styles from './AdminPage.module.css';

const PERIOD_PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
  { key: '90d', label: 'Last 90d' }
];

// First four presets fit on one line; the last one shares the next line
// with the custom date range inputs.
const MAIN_PRESETS = PERIOD_PRESETS.slice(0, -1);
const LAST_PRESET = PERIOD_PRESETS[PERIOD_PRESETS.length - 1];

const OFFSET_DAYS = { today: 0, '7d': 6, '30d': 29, '90d': 89 };

const formatYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => formatYMD(new Date());

const presetRange = (key) => {
  const from = new Date();
  from.setDate(from.getDate() - (OFFSET_DAYS[key] || 0));
  return { from: formatYMD(from), to: todayStr() };
};

/**
 * Admin period filter: preset chips (Today / Last 7d / Last 30d / Last 90d)
 * plus a custom start/end date range. Emits { preset, from, to } where
 * from/to are YYYY-MM-DD strings ('' when cleared). Clicking the active chip
 * again clears the filter (back to all time).
 *
 * Layout: the first four presets sit on one line; the last preset ('Last 90d')
 * shares the next line with the compact custom date range inputs.
 */
export const AdminPeriodFilter = ({ value, onChange }) => {
  const activePreset = value?.preset && value.preset !== 'custom' ? value.preset : null;
  const hasCustomRange = !!(value?.from || value?.to);
  const [customFrom, setCustomFrom] = useState(value?.from || '');
  const [customTo, setCustomTo] = useState(value?.to || '');

  const handlePreset = (key) => {
    setCustomFrom('');
    setCustomTo('');
    // 'all' (all time) always clears the range; clicking the active chip also clears it
    if (key === 'all' || activePreset === key) {
      onChange({ preset: null, from: '', to: '' });
      return;
    }
    onChange({ preset: key, ...presetRange(key) });
  };

  const handleCustom = (from, to) => {
    setCustomFrom(from);
    setCustomTo(to);
    if (from || to) {
      onChange({ preset: 'custom', from, to });
    } else {
      onChange({ preset: null, from: '', to: '' });
    }
  };

  const renderChip = (p) => {
    // 'all' is highlighted whenever no preset chip and no custom range is active
    const isActive = p.key === 'all'
      ? activePreset === null && !hasCustomRange
      : activePreset === p.key;
    return (
      <button
        key={p.key}
        type="button"
        className={`${styles.periodChip} ${isActive ? styles.periodChipActive : ''}`}
        onClick={() => handlePreset(p.key)}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div className={styles.periodBar}>
      <span className={styles.periodLabel}>Period:</span>
      <div className={styles.periodChips}>
        {MAIN_PRESETS.map((p) => renderChip(p))}
      </div>
      <div className={styles.periodChipDateRow}>
        {renderChip(LAST_PRESET)}
        <div className={styles.periodDateRange}>
          <input
            type="date"
            className={styles.periodDateInput}
            value={customFrom}
            onChange={(e) => handleCustom(e.target.value, customTo)}
            placeholder="Start date"
          />
          <span className={styles.periodSep}>to</span>
          <input
            type="date"
            className={styles.periodDateInput}
            value={customTo}
            onChange={(e) => handleCustom(customFrom, e.target.value)}
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  );
};
