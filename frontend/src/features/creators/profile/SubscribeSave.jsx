import React from 'react';
import { subscribeSave } from './mockData';
import styles from './ProfilePage.module.css';

export const SubscribeSave = ({ isDark }) => {
  return (
    <div className={`${styles.subscribeCard} ${!isDark ? styles.light : ''}`}>
      <h3 className={styles.subscribeTitle}>{subscribeSave.title}</h3>
      <p className={styles.subscribeSubtitle}>{subscribeSave.subtitle}</p>
      <button className={styles.subscribeNowBtn}>
        Subscribe Now
        <span className={styles.subscribePrice}>{subscribeSave.price}</span>
      </button>
    </div>
  );
};
