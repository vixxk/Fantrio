import styles from './ProfilePage.module.css';

export const SubscribeSave = ({ isDark, subscribeSave }) => {
  const save = subscribeSave || { title: 'Subscribe & Save', subtitle: '', price: '' };
  return (
    <div className={`${styles.subscribeCard} ${!isDark ? styles.light : ''}`}>
      <h3 className={styles.subscribeTitle}>{save.title}</h3>
      <p className={styles.subscribeSubtitle}>{save.subtitle}</p>
      <button className={styles.subscribeNowBtn}>
        Subscribe Now
        <span className={styles.subscribePrice}>{save.price}</span>
      </button>
    </div>
  );
};
