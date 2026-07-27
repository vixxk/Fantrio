import React from 'react';
import { trafficSources } from './mockData';
import { PeriodDropdown } from './PeriodDropdown';
import styles from './AnalyticsPage.module.css';

export const TrafficSources = ({ isDark }) => {
  return (
    <div className={`${styles.trafficCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.trafficHeader}>
        <h3 className={styles.trafficTitle}>Top Traffic Sources</h3>
        <PeriodDropdown variant="text" />
      </div>
      <div className={styles.trafficTable}>
        <div className={styles.trafficTableRow}>
          <span className={styles.trafficLabel}>Source</span>
          <span className={styles.trafficLabel}>Views</span>
          <span className={styles.trafficLabel}>%</span>
        </div>
        {trafficSources.map((source, index) => (
          <div key={index} className={styles.trafficItem}>
            <span className={styles.trafficSourceName}>{source.source}</span>
            <div className={styles.trafficSourceRow}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${source.percentage}%`,
                    background: source.color,
                  }}
                />
              </div>
              <span className={styles.trafficViews} style={{ marginLeft: 'auto' }}>{source.views}</span>
              <span className={styles.trafficPercentage}>{source.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
