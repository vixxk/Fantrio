import React from 'react';
import { BadgeCheck, ChevronRight } from 'lucide-react';
import { fanSpotlight } from './mockData';
import styles from './ProfilePage.module.css';

export const FanSpotlight = ({ isDark }) => {
  const { fan } = fanSpotlight;

  return (
    <div className={`${styles.fanCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.fanHeader}>
        <h3 className={styles.cardTitle}>{fanSpotlight.title}</h3>
        <button className={styles.viewAllBtn}>View All</button>
      </div>
      <div className={styles.fanContent}>
        <div className={styles.fanInfo}>
          <img src={fan.avatar} alt={fan.name} className={styles.fanAvatar} />
          <div className={styles.fanDetails}>
            <span className={styles.fanLabel}>{fan.label}</span>
            <div className={styles.fanNameRow}>
              <span className={styles.fanName}>{fan.name}</span>
              {fan.isVerified && <BadgeCheck size={14} className={styles.fanVerified} />}
            </div>
            <span className={styles.fanSpent}>{fan.spent}</span>
          </div>
        </div>
        <p className={styles.fanMessage}>{fan.message}</p>
        <div className={styles.fanDots}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${styles.dot} ${i === 0 ? styles.activeDot : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
