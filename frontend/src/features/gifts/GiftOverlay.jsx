import { GIFT_TIERS, seededRand } from './giftCatalog';
import styles from './GiftOverlay.module.css';

const PARTICLE_COUNTS = { 1: 0, 2: 10, 3: 18, 4: 28 };
const PARTICLE_COLORS = ['#ff6ec7', '#ffd166', '#7ef9ff', '#ff9f43', '#a78bfa', '#34d399', '#f87171'];

/** One animated gift (emoji + burst + sender label) that auto-expires. */
const GiftAnimation = ({ event, index }) => {
  const meta = GIFT_TIERS[event.tier] || GIFT_TIERS[1];
  const particleCount = PARTICLE_COUNTS[event.tier] || 0;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = seededRand(event.eventId, i) * Math.PI * 2;
    const dist = 70 + seededRand(event.eventId, i + 100) * 130;
    return {
      dx: `${(Math.cos(angle) * dist).toFixed(0)}px`,
      dy: `${(Math.sin(angle) * dist).toFixed(0)}px`,
      delay: `${(seededRand(event.eventId, i + 200) * 0.3).toFixed(2)}s`,
      size: `${(5 + seededRand(event.eventId, i + 300) * 9).toFixed(0)}px`,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]
    };
  });

  // Side-by-side stacking so rapid gifts don't perfectly overlap.
  const offsetX = ((index % 3) - 1) * 26;

  return (
    <div
      className={`${styles.giftAnim} ${styles[meta.cssClass]}`}
      style={{ marginLeft: offsetX }}
    >
      {event.tier >= 3 && <div className={styles.rays} />}
      {event.tier >= 2 && <div className={styles.ring} />}
      {event.tier >= 3 && <div className={styles.ringTwo} />}

      <div className={styles.burstLayer}>
        {particles.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              '--dx': p.dx,
              '--dy': p.dy,
              animationDelay: p.delay,
              width: p.size,
              height: p.size,
              background: p.color
            }}
          />
        ))}
      </div>

      <div className={styles.emojiWrap}>
        <span className={styles.emoji}>{event.emoji}</span>
        {event.tier === 4 && <span className={styles.crownMini}>👑</span>}
      </div>

      <div className={styles.giftLabel}>
        {event.sender?.avatarUrl ? (
          <img src={event.sender.avatarUrl} alt="" className={styles.senderAvatar} />
        ) : (
          <span className={styles.senderAvatarFallback}>{event.sender?.displayName?.[0] || 'F'}</span>
        )}
        <span className={styles.senderName}>{event.sender?.displayName || 'Fan'}</span>
        <span className={styles.sentText}>sent</span>
        <span className={styles.giftName}>{event.name}</span>
        <span className={styles.coins}>+{event.coins} coins</span>
      </div>
    </div>
  );
};

/**
 * Full-screen, pointer-transparent layer that renders active gift animations.
 * Used on 1:1 call overlays and live stream watch screens — both parties (and
 * every viewer) see the same animation in real time via socket events.
 */
export const GiftOverlay = ({ events = [] }) => {
  if (!events || events.length === 0) return null;
  return (
    <div className={styles.overlay} aria-hidden="true">
      {events.map((event, i) => (
        <GiftAnimation key={event.eventId} event={event} index={i} />
      ))}
    </div>
  );
};

export default GiftOverlay;
