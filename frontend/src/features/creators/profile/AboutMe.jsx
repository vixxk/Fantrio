import React from 'react';
import { MapPin, Globe, Calendar, Clock } from 'lucide-react';
import { creatorProfile } from './mockData';
import styles from './ProfilePage.module.css';

export const AboutMe = ({ isDark }) => {
  return (
    <div className={`${styles.aboutCard} ${!isDark ? styles.light : ''}`}>
      <h3 className={styles.cardTitle}>About Me</h3>
      <p className={styles.aboutBio}>{creatorProfile.bio}</p>
      <div className={styles.aboutDetails}>
        <div className={styles.aboutItem}>
          <MapPin size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Location</span>
          <span className={styles.aboutValue}>{creatorProfile.location}</span>
        </div>
        <div className={styles.aboutItem}>
          <Globe size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Languages</span>
          <span className={styles.aboutValue}>{creatorProfile.languages}</span>
        </div>
        <div className={styles.aboutItem}>
          <Calendar size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Member Since</span>
          <span className={styles.aboutValue}>{creatorProfile.memberSince}</span>
        </div>
        <div className={styles.aboutItem}>
          <Clock size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Response Time</span>
          <span className={styles.aboutValue}>{creatorProfile.responseTime}</span>
        </div>
      </div>
    </div>
  );
};
