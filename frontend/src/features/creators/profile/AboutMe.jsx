import { MapPin, Globe, Calendar, Clock, BadgeCheck } from 'lucide-react';
import styles from './ProfilePage.module.css';

export const AboutMe = ({ isDark, creatorProfile }) => {
  return (
    <div className={`${styles.aboutCard} ${!isDark ? styles.light : ''}`}>
      <h3 className={styles.cardTitle}>About Me</h3>
      <p className={styles.aboutBio}>{creatorProfile.bio || 'No bio yet.'}</p>
      <div className={styles.aboutDetails}>
        <div className={styles.aboutItem}>
          <MapPin size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Location</span>
          <span className={styles.aboutValue}>{creatorProfile.location || '—'}</span>
        </div>
        <div className={styles.aboutItem}>
          <Globe size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Languages</span>
          <span className={styles.aboutValue}>{creatorProfile.languages || '—'}</span>
        </div>
        <div className={styles.aboutItem}>
          <Calendar size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Member Since</span>
          <span className={styles.aboutValue}>{creatorProfile.memberSince || '—'}</span>
        </div>
        <div className={styles.aboutItem}>
          <Clock size={16} className={styles.aboutIcon} />
          <span className={styles.aboutLabel}>Response Time</span>
          <span className={styles.aboutValue}>{creatorProfile.responseTime || '—'}</span>
        </div>
      </div>
    </div>
  );
};

export const CreatorPanel = ({ isDark, creatorProfile }) => {
  return (
    <div className={`${styles.creatorSidebar} ${!isDark ? styles.light : ''}`}>
      <div className={styles.creatorProfile}>
        <img
          src={creatorProfile.avatar}
          alt={creatorProfile.name}
          className={styles.sidebarAvatar}
        />
        <div className={styles.sidebarInfo}>
          <div className={styles.sidebarNameRow}>
            <span className={styles.sidebarName}>{creatorProfile.name}</span>
            {creatorProfile.isVerified && (
              <BadgeCheck size={16} className={styles.verifiedIcon} />
            )}
          </div>
          <span className={styles.sidebarHandle}>{creatorProfile.handle}</span>
          {creatorProfile.isOnline && (
            <div className={styles.sidebarOnline}>
              <span className={styles.onlineDot} /> Online
            </div>
          )}
        </div>
      </div>
      <button className={styles.viewProfileBtn}>View Profile</button>
    </div>
  );
};
