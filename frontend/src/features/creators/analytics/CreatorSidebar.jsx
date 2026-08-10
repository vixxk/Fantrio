
import { BadgeCheck } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

export const CreatorSidebar = ({ isDark, creatorProfile = {} }) => {
  if (!creatorProfile || !creatorProfile.name) return null;
  return (
    <div className={`${styles.creatorSidebar} ${!isDark ? styles.light : ''}`}>
      <div className={styles.creatorProfile}>
        <img src={creatorProfile.avatar} alt={creatorProfile.name} className={styles.creatorAvatar} />
        <div className={styles.creatorInfo}>
          <div className={styles.creatorNameRow}>
            <span className={styles.creatorName}>{creatorProfile.name}</span>
            {creatorProfile.isVerified && <BadgeCheck size={16} className={styles.verifiedBadge} />}
          </div>
          <span className={styles.creatorHandle}>{creatorProfile.handle}</span>
          {creatorProfile.isOnline && (
            <span className={styles.onlineStatus}>
              <span className={styles.onlineDot} /> Online
            </span>
          )}
        </div>
      </div>
      <button className={styles.viewProfileBtn}>View Profile</button>
    </div>
  );
};
