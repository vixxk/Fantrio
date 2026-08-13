import { GIFT_TIERS, getTierFromCoins, seededRand } from './giftCatalog';
import styles from './GiftOverlay.module.css';

const PARTICLE_BASE_COUNTS = { 1: 8, 2: 18, 3: 32, 4: 55, 5: 90 };
const PARTICLE_COLORS = ['#ff6ec7', '#ffd166', '#7ef9ff', '#ff9f43', '#a78bfa', '#34d399', '#f87171', '#ffffff'];

/** One animated gift (emoji + burst + sender label) that auto-expires. */
const GiftAnimation = ({ event, index }) => {
  const tier = event.tier || getTierFromCoins(event.coins);
  const meta = GIFT_TIERS[tier] || GIFT_TIERS[1];

  const baseCount = PARTICLE_BASE_COUNTS[tier] || 10;
  const extraCount = Math.min(30, Math.floor((event.coins || 0) / 200));
  const particleCount = baseCount + extraCount;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = seededRand(event.eventId, i) * Math.PI * 2;
    const distScale = tier >= 4 ? 220 : (tier >= 3 ? 160 : 110);
    const dist = 60 + seededRand(event.eventId, i + 100) * distScale;
    return {
      dx: `${(Math.cos(angle) * dist).toFixed(0)}px`,
      dy: `${(Math.sin(angle) * dist).toFixed(0)}px`,
      delay: `${(seededRand(event.eventId, i + 200) * 0.35).toFixed(2)}s`,
      size: `${(5 + seededRand(event.eventId, i + 300) * (tier >= 4 ? 12 : 8)).toFixed(0)}px`,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]
    };
  });

  // Confetti & Coin Rain items for Tier 4 and 5
  const confettiCount = tier === 5 ? 36 : (tier === 4 ? 20 : 0);
  const confettiItems = Array.from({ length: confettiCount }, (_, i) => {
    const isCoin = tier === 5 && i % 3 === 0;
    return {
      left: `${(seededRand(event.eventId, i + 400) * 96).toFixed(1)}vw`,
      delay: `${(seededRand(event.eventId, i + 500) * 1.4).toFixed(2)}s`,
      duration: `${(2.2 + seededRand(event.eventId, i + 600) * 1.8).toFixed(2)}s`,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      rotate: Math.floor(seededRand(event.eventId, i + 700) * 360),
      isCoin
    };
  });

  // Side-by-side stacking so rapid gifts don't perfectly overlap.
  const offsetX = ((index % 3) - 1) * 28;

  return (
    <div
      className={`${styles.giftAnim} ${styles[meta.cssClass]}`}
      style={{ marginLeft: offsetX }}
    >
      {/* Screen edge flash background pulse for Luxury+ gifts */}
      {tier >= 3 && <div className={`${styles.screenFlash} ${tier === 5 ? styles.screenFlashRainbow : ''}`} />}

      {/* Sunburst rotating rays for Royal & Ultra Legendary gifts */}
      {tier >= 4 && <div className={styles.rays} />}

      {/* Expanding shockwave rings */}
      {tier >= 2 && <div className={styles.ring} />}
      {tier >= 3 && <div className={styles.ringTwo} />}
      {tier >= 5 && <div className={styles.ringThree} />}

      {/* Confetti & Coin Rain for high tier gifts */}
      {confettiCount > 0 && (
        <div className={styles.confettiContainer}>
          {confettiItems.map((c, i) => (
            <span
              key={i}
              className={c.isCoin ? styles.fallingCoin : styles.confettiPiece}
              style={{
                left: c.left,
                animationDelay: c.delay,
                animationDuration: c.duration,
                backgroundColor: !c.isCoin ? c.color : undefined,
                transform: `rotate(${c.rotate}deg)`
              }}
            >
              {c.isCoin ? '🪙' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Radial Burst Particles */}
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

      {/* Emoji & Crown Badge */}
      <div className={styles.emojiWrap}>
        <span className={styles.emoji}>{event.emoji}</span>
        {tier >= 4 && <span className={styles.crownMini}>👑</span>}
      </div>

      {/* Supreme / Ultra Legendary Tag */}
      {tier === 5 && (
        <div className={styles.supremeTag}>
          <span>✨ LEGENDARY GIFT ✨</span>
        </div>
      )}

      {/* Sender & Coin Info Label */}
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
