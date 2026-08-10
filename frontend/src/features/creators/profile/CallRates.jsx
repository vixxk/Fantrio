import { Phone, Video } from 'lucide-react';
import styles from './ProfilePage.module.css';

const rateIcons = {
  'Audio Call': Phone,
  'Video Call': Video,
};

export const CallRates = ({ isDark, callRates }) => {
  const rates = callRates || { title: 'Call Rates', subtitle: '', rates: [] };
  return (
    <div className={`${styles.callRatesCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.callRatesHeader}>
        <h3 className={styles.sectionTitle}>{rates.title}</h3>
        <p className={styles.sectionSubtitle}>{rates.subtitle}</p>
      </div>
      <div className={styles.callRatesGrid}>
        {rates.rates.map((rate, index) => {
          const Icon = rateIcons[rate.type] || Phone;
          return (
            <div key={index} className={styles.callRateCard}>
              <div className={styles.callRateIcon} style={{ background: `${rate.color}15` }}>
                <Icon size={24} style={{ color: rate.color }} />
              </div>
              <div className={styles.callRateInfo}>
                <span className={styles.callRateType}>{rate.type}</span>
                <div className={styles.callRatePrice}>
                  <span className={styles.callRateValue}>{rate.rate}</span>
                  <span className={styles.callRateUnit}>{rate.unit}</span>
                </div>
                <span className={styles.callRateDesc}>{rate.description}</span>
              </div>
              <button className={`${styles.callNowBtn}`} style={{ background: rate.color }}>
                Call Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
