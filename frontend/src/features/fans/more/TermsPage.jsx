import { useEffect } from 'react';
import { Scale } from 'lucide-react';
import styles from './MorePage.module.css';

export const TermsPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const scrollables = document.querySelectorAll('main, .main-content, .subPageContainer, .moreContainer, .settingsContainer');
    scrollables.forEach((el) => {
      if (el) el.scrollTop = 0;
    });
  }, []);
  return (
    <div className={styles.subViewGrid}>
      <div className={styles.legalHeroCard}>
        <Scale size={120} className={styles.legalBannerWatermark} aria-hidden="true" />
        <div className={styles.legalHeroContent}>
          <h3>Terms of Service</h3>
          <p>Last updated: August 2026. Please read these terms carefully before using the Fantrio platform.</p>
        </div>
      </div>

      <div className={styles.legalDocCard}>
        <section className={styles.legalSection}>
          <h4>1. Acceptance of Terms</h4>
          <p>By creating an account or accessing Fantrio, you agree to comply with these Terms of Service, our Privacy Policy, and Community Guidelines.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>2. Account Registration & Security</h4>
          <p>You are responsible for maintaining the confidentiality of your credentials and for all activities occurring under your account.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>3. Virtual Currency & Purchases</h4>
          <p>Fantrio Coins are virtual items used exclusively within the platform. All coin purchases are final, non-refundable, and non-transferable unless mandated by applicable law.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>4. Content Rights & Conduct</h4>
          <p>Creators retain full ownership of their uploaded content. Users agree not to record, re-distribute, or reverse-engineer stream media or 1:1 call sessions.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>5. Termination</h4>
          <p>We reserve the right to suspend or terminate accounts that breach safety policies, engage in fraudulent transactions, or harass platform members.</p>
        </section>
      </div>
    </div>
  );
};
