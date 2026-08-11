import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Award, Sparkles, CheckCircle2, Clock, Coins, CreditCard, User, PhoneCall } from 'lucide-react';
import styles from './MorePage.module.css';

export const RewardsPage = ({ setStatusMsg }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/rewards');
      if (res.status === 'success') setRewards(res.rewards || []);
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to load rewards.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadRewards();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRewardIcon = (icon) => {
    if (icon === 'card') return <CreditCard size={22} />;
    if (icon === 'user') return <User size={22} />;
    if (icon === 'call') return <PhoneCall size={22} />;
    return <Coins size={22} />;
  };

  if (loading) {
    return <SkeletonGrid />;
  }

  return (
    <div className={styles.subViewGrid}>
      <div className={styles.rewardsHero}>
        <Award size={120} className={styles.legalBannerWatermark} aria-hidden="true" />
        <div className={styles.legalHeroContent}>
          <h3>Fantrio Fan Rewards & Milestones</h3>
          <p>Complete simple community activities to unlock free bonus coins. Coins are credited automatically upon completion.</p>
        </div>
      </div>

      <div className={styles.rewardsList}>
        {rewards.map((r) => (
          <div key={r.type} className={`${styles.rewardCard} ${r.claimed ? styles.claimedReward : ''}`}>
            <div className={styles.rewardIconCol}>
              {getRewardIcon(r.icon)}
            </div>
            <div className={styles.rewardContentCol}>
              <div className={styles.rewardTitleRow}>
                <h4>{r.title}</h4>
                <span className={`${styles.rewardCoinsBadge} ${styles.desktopCoinsBadge}`}>
                  <Coins size={14} /> +{r.coins} Coins
                </span>
              </div>
              <p>{r.description}</p>
            </div>
            <div className={styles.rewardStatusCol}>
              <span className={`${styles.rewardCoinsBadge} ${styles.mobileCoinsBadge}`}>
                <Coins size={14} /> +{r.coins} Coins
              </span>
              {r.claimed ? (
                <span className={styles.statusGranted}>
                  <CheckCircle2 size={16} /> Claimed
                </span>
              ) : r.completed ? (
                <span className={styles.statusCompleted}>
                  <Sparkles size={16} /> Unlocked
                </span>
              ) : (
                <span className={styles.statusPending}>
                  <Clock size={16} /> In Progress
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className={styles.subViewGrid}>
    <div className="skeleton-card" style={{ height: '160px', borderRadius: '16px' }} />
    <div className="skeleton-card" style={{ height: '80px', borderRadius: '16px' }} />
  </div>
);
