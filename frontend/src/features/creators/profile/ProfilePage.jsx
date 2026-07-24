import React from 'react';
import { useApp } from '../../../context/AppContext';
import { ProfileHero } from './ProfileHero';
import { AboutMe } from './AboutMe';
import { ProfileInsights } from './ProfileInsights';
import { FanSpotlight } from './FanSpotlight';
import { SubscriptionPlans } from './SubscriptionPlans';
import { CallRates } from './CallRates';
import { RecentContent } from './RecentContent';
import { SubscribeSave } from './SubscribeSave';
import { creatorProfile } from './mockData';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const { darkMode } = useApp();

  return (
    <div className={`${styles.profileContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Profile Preview Section */}
      <div className={styles.previewSection}>
        <h2 className={styles.previewTitle}>Profile Preview</h2>
        <p className={styles.previewSubtitle}>This is how your profile appears to fans on Fantrio.</p>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Profile Hero Card */}
          <ProfileHero isDark={darkMode} />

          {/* Bottom Grid: Plans + Call Rates */}
          <div className={styles.bottomGrid}>
            <SubscriptionPlans isDark={darkMode} />
            <CallRates isDark={darkMode} />
          </div>

          {/* Recent Content */}
          <RecentContent isDark={darkMode} />
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          <AboutMe isDark={darkMode} />
          <ProfileInsights isDark={darkMode} />
          <FanSpotlight isDark={darkMode} />
          <SubscribeSave isDark={darkMode} />
        </div>
      </div>
    </div>
  );
};
