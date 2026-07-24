import React from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { profileInsights } from './mockData';
import styles from './ProfilePage.module.css';

export const ProfileInsights = ({ isDark }) => {
  return (
    <div className={`${styles.insightsCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.insightsHeader}>
        <h3 className={styles.cardTitle}>{profileInsights.title}</h3>
        <button className={styles.periodBtn}>
          {profileInsights.period} <ChevronDown size={14} />
        </button>
      </div>
      <div className={styles.insightsList}>
        {profileInsights.stats.map((stat, index) => (
          <div key={index} className={styles.insightRow}>
            <span className={styles.insightLabel}>{stat.label}</span>
            <div className={styles.insightRight}>
              <span className={styles.insightValue}>{stat.value}</span>
              <span className={`${styles.insightChange} ${styles[stat.changeType]}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
