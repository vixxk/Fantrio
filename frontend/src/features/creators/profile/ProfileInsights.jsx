import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './ProfilePage.module.css';

const periodOptions = ['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'All Time'];

export const ProfileInsights = ({ isDark, profileInsights, onPeriodChange }) => {
  const insights = profileInsights || { title: 'Profile Insights', period: 'All Time', stats: [] };
  const [period, setPeriod] = useState('All Time');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectPeriod = (opt) => {
    setPeriod(opt);
    setOpen(false);
    if (onPeriodChange) onPeriodChange(opt);
  };

  return (
    <div className={`${styles.insightsCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.insightsHeader}>
        <h3 className={styles.cardTitle}>{insights.title}</h3>

      </div>
      <div className={styles.insightsList}>
        {insights.stats.map((stat, index) => (
          <div key={index} className={styles.insightRow}>
            <span className={styles.insightLabel}>{stat.label}</span>
            <div className={styles.insightRight}>
              <span className={styles.insightValue}>{stat.value}</span>
              <span className={`${styles.insightChange} ${styles[stat.changeType] || ''}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
