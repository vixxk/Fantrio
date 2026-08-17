import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import styles from './MorePage.module.css';

export const PrivacyPage = () => {
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
        <Lock size={120} className={styles.legalBannerWatermark} aria-hidden="true" />
        <div className={styles.legalHeroContent}>
          <h3>Privacy Policy</h3>
          <p>Last updated: August 2026. How Fantrio collects, uses, and safeguards your personal data.</p>
        </div>
      </div>

      <div className={styles.legalDocCard}>
        <section className={styles.legalSection}>
          <h4>1. Information We Collect</h4>
          <p>We collect information you provide directly (such as account name, email, profile details) and technical usage metrics required to render video calls and process transactions safely.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>2. How We Use Your Data</h4>
          <p>Your data is used to provide streaming services, facilitate 1:1 call connections, deliver security alerts (2FA), and prevent fraud across our payment processors.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>3. Data Sharing & Security</h4>
          <p>We never sell your personal information. Data is shared with payment gateways (Segpay/CCBill) and infrastructure services strictly to fulfill requested services.</p>
        </section>

        <section className={styles.legalSection}>
          <h4>4. Your Privacy Rights</h4>
          <p>You have the right to request access to, correction of, or permanent deletion of your personal data at any time via your account settings.</p>
        </section>
      </div>
    </div>
  );
};
