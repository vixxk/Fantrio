import styles from './AuthBackground.module.css';

// Scattered four-pointed sparkles — position, size and twinkle timing per star
const SPARKLES = [
  { top: '10%', left: '7%', size: 18, delay: '0s', dur: '3.2s' },
  { top: '20%', left: '86%', size: 12, delay: '0.6s', dur: '2.8s' },
  { top: '36%', left: '3%', size: 9, delay: '1.2s', dur: '3.6s' },
  { top: '46%', left: '94%', size: 16, delay: '0.3s', dur: '3s' },
  { top: '58%', left: '8%', size: 8, delay: '1.8s', dur: '2.6s' },
  { top: '72%', left: '88%', size: 14, delay: '0.9s', dur: '3.4s' },
  { top: '8%', left: '46%', size: 9, delay: '2.1s', dur: '3.1s' },
  { top: '64%', left: '47%', size: 11, delay: '1.5s', dur: '2.9s' },
  { top: '84%', left: '18%', size: 12, delay: '2.4s', dur: '3.3s' },
];

export const AuthBackground = () => (
  <div className={styles.bg} aria-hidden="true">
    <div className={styles.aurora} />
    <div className={styles.orbOne} />
    <div className={styles.orbTwo} />
    <div className={styles.orbThree} />
    <div className={styles.gridOverlay} />
    <div className={styles.rings}>
      <span className={styles.ring} />
      <span className={styles.ringTwo} />
    </div>
    <div className={styles.sparkles}>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={styles.sparkle}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur
          }}
        />
      ))}
    </div>
  </div>
);

export default AuthBackground;
