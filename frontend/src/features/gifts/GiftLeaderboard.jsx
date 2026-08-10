import { Trophy } from 'lucide-react';
import styles from './GiftLeaderboard.module.css';

const RANK_CLASSES = { 1: styles.rank1, 2: styles.rank2, 3: styles.rank3 };

/**
 * Pinned "Top Gifters" strip shown above the stream chat. Totals are live —
 * updated from every gift event (and seeded from the backend ledger when a
 * viewer joins mid-stream). Only renders when at least one gift exists.
 *
 * @param {Array} leaderboard - [{ userId, displayName, avatarUrl, totalCoins, count }] sorted desc
 */
export const GiftLeaderboard = ({ leaderboard = [] }) => {
  const top = leaderboard.slice(0, 3);
  const hiddenCount = Math.max(0, leaderboard.length - top.length);
  if (top.length === 0) return null;

  return (
    <div className={styles.strip}>
      <div className={styles.titleRow}>
        <Trophy size={12} className={styles.trophy} />
        <span className={styles.title}>Top Gifters</span>
        {hiddenCount > 0 && <span className={styles.moreCount}>+{hiddenCount} more</span>}
      </div>
      <div className={styles.ranks}>
        {top.map((entry, i) => {
          const rank = i + 1;
          return (
            <div key={String(entry.userId)} className={styles.entry}>
              <span className={`${styles.rank} ${RANK_CLASSES[rank] || ''}`}>{rank}</span>
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatarFallback}>{entry.displayName?.[0] || 'F'}</span>
              )}
              <div className={styles.info}>
                <span className={styles.name}>{entry.displayName}</span>
                <span className={styles.coins}>
                  <img src="/coin.png" alt="" className={styles.coinImg} />
                  {Number(entry.totalCoins).toLocaleString()}
                  {Number(entry.count) > 1 && <span className={styles.giftCount}>×{entry.count}</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GiftLeaderboard;
