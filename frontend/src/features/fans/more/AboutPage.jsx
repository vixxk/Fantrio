import { Info, Sparkles, Heart, Shield, Globe, Award } from 'lucide-react';
import styles from './MorePage.module.css';

export const AboutPage = () => {
  return (
    <div className={styles.subViewGrid}>
      <div className={styles.legalHeroCard}>
        <div className={styles.legalHeroIconWrap}>
          <Info size={28} />
        </div>
        <h3>About Fantrio</h3>
        <p>Connecting creators and fans through real-time interactive streams, 1:1 calls, and exclusive media experiences.</p>
      </div>

      <div className={styles.aboutContentCard}>
        <div className={styles.aboutPillarGrid}>
          <div className={styles.pillarBox}>
            <Sparkles size={22} className={styles.pillarIcon} />
            <h4>Real-time Monetization</h4>
            <p>Direct creator earnings through subscriptions, 1:1 audio/video calls, coin gifts, and exclusive digital stores.</p>
          </div>
          <div className={styles.pillarBox}>
            <Shield size={22} className={styles.pillarIcon} />
            <h4>Bank-Grade Security</h4>
            <p>End-to-end encrypted communication channels, PCI-DSS payment compliance, and strict 2FA account defenses.</p>
          </div>
          <div className={styles.pillarBox}>
            <Heart size={22} className={styles.pillarIcon} />
            <h4>Creator-First Platform</h4>
            <p>Designed to give creators total ownership over their content, subscriber relationships, and financial growth.</p>
          </div>
          <div className={styles.pillarBox}>
            <Globe size={22} className={styles.pillarIcon} />
            <h4>Global Community</h4>
            <p>Connecting creators and fans across borders with instant multi-currency top-ups and responsive streaming.</p>
          </div>
        </div>

        <div className={styles.versionMetaBanner}>
          <Award size={18} />
          <span>Fantrio Web Application Version 2.4.0 • Built with High-Performance React Engine</span>
        </div>
      </div>
    </div>
  );
};
