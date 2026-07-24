import React from 'react';
import { useApp } from '../../../context/AppContext';
import styles from './Banner.module.css';

export const Banner = () => {
  const { darkMode, setActiveTab } = useApp();

  return (
    <div className={`${styles.bannerCard} ${darkMode ? '' : styles.lightBanner}`}>
      <div className={styles.bannerContent}>
        <h1 className={styles.bannerTitle}>Connect, Chat, Enjoy</h1>
        <h2 className={styles.bannerSubtitle}>Exclusive Moments.</h2>
        <p className={styles.bannerText}>
          Live calls, streams, and premium content<br />from your favourite creators.
        </p>
        <button 
          className={styles.exploreBtn} 
          onClick={() => setActiveTab('All Creators')}
        >
          Explore Creators
        </button>
      </div>
      <div className={styles.bannerImageWrapper}>
        <img 
          src="/Girl.png" 
          alt="Featured Creator" 
          className={styles.bannerImg}
        />
      </div>
    </div>
  );
};
