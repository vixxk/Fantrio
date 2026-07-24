import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

const periodOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];

export const PeriodDropdown = ({ variant = 'btn' }) => {
  const [period, setPeriod] = useState('Today');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.periodDropdown} ref={ref}>
      {variant === 'btn' ? (
        <button className={styles.periodBtn} onClick={() => setOpen(!open)}>
          {period} <ChevronDown size={14} />
        </button>
      ) : (
        <button className={styles.periodTextBtn} onClick={() => setOpen(!open)}>
          {period} <ChevronDown size={12} />
        </button>
      )}
      {open && (
        <div className={styles.periodMenu}>
          {periodOptions.map((opt) => (
            <button
              key={opt}
              className={`${styles.periodOption} ${opt === period ? styles.periodOptionActive : ''}`}
              onClick={() => { setPeriod(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
