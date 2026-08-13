import { Trophy, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './StreamLeaderboardModal.module.css';

export const StreamLeaderboardModal = ({ leaderboard = [], onClose, darkMode: propDarkMode }) => {
  const { darkMode: appDarkMode } = useApp();
  const darkMode = propDarkMode !== undefined ? propDarkMode : appDarkMode;

  return (
    <div className={`${styles.backdrop} ${!darkMode ? styles.light : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Trophy size={18} className={styles.trophyIcon} />
            <h3 className={styles.title}>Top Supporters</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close leaderboard">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {!leaderboard || leaderboard.length === 0 ? (
            <div className={styles.emptyState}>
              No gifts sent yet. Be the first to top the leaderboard!
            </div>
          ) : (
            leaderboard.map((item, index) => {
              const rank = index + 1;
              const rankClass = rank === 1 ? styles.rank1 : rank === 2 ? styles.rank2 : rank === 3 ? styles.rank3 : '';
              return (
                <div key={item.userId || index} className={styles.row}>
                  <div className={`${styles.rankBadge} ${rankClass}`}>
                    #{rank}
                  </div>
                  <img
                    src={item.avatarUrl || '/Girl.png'}
                    alt={item.displayName || 'User'}
                    className={styles.avatar}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.name}>{item.displayName || 'Fan'}</span>
                    <span className={styles.subtext}>{item.count || 1} gifts sent</span>
                  </div>
                  <div className={styles.coinsBadge}>
                    <img src="/coin.png" alt="Coins" className={styles.coinImg} />
                    <span>{(item.totalCoins || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
