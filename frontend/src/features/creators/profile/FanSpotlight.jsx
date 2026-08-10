import { BadgeCheck } from 'lucide-react';
import styles from './ProfilePage.module.css';

export const FanSpotlight = ({ isDark, fanSpotlight }) => {
  const spotlight = fanSpotlight || { title: 'Fan Spotlight', fan: null };
  const { fan } = spotlight;

  return (
    <div className={`${styles.fanCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.fanHeader}>
        <h3 className={styles.cardTitle}>{spotlight.title}</h3>
        <button className={styles.viewAllBtn}>View All</button>
      </div>
      {fan ? (
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
      ) : (
        <p className={styles.fanMessage}>No supporter activity yet. Share your profile to grow!</p>
      )}
    </div>
  );
};
