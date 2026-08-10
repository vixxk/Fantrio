import { Check } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorAccountStatusSidebar = ({
  accountStatus,
  verificationProgress,
  onViewVerificationDetails
}) => {
  return (
    <>
      {/* Account Status Card */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarCardHeader}>
          <h3 className={styles.sidebarCardTitle}>Account Status</h3>
          <span className={styles.statusBadgeActive}>{accountStatus?.status || 'Active'}</span>
        </div>
        <p className={styles.sidebarCardDescription}>
          Your creator account is active and in good standing on Fantrio.
        </p>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusItemLabel}>Member Since</span>
            <span className={styles.statusItemValue}>{accountStatus?.memberSince || '—'}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusItemLabel}>Account Type</span>
            <span className={styles.statusItemValue}>{accountStatus?.accountType || 'Creator'}</span>
          </div>
        </div>
      </div>

      {/* Verification Progress Card */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarCardHeader}>
          <h3 className={styles.sidebarCardTitle}>Verification Progress</h3>
          <span className={styles.verifiedBadge}>
            {verificationProgress?.verified ? 'Verified Creator' : 'Pending Verification'}
          </span>
        </div>
        <p className={styles.sidebarCardDescription}>
          {verificationProgress?.verified
            ? "You're verified! Enjoy high-tier creator features."
            : 'Complete verification to earn your official blue checkmark.'}
        </p>
        <div className={styles.verificationSteps}>
          <div className={styles.verificationStep}>
            <div className={`${styles.stepIcon} ${verificationProgress?.emailVerified ? styles.stepComplete : ''}`}>
              <Check size={12} />
            </div>
            <span className={styles.stepLabel}>Email Verified</span>
          </div>
          <div className={`${styles.stepConnector} ${verificationProgress?.emailVerified && verificationProgress?.idVerified ? styles.stepCompleteLine : ''}`} />
          <div className={styles.verificationStep}>
            <div className={`${styles.stepIcon} ${verificationProgress?.idVerified ? styles.stepComplete : ''}`}>
              <Check size={12} />
            </div>
            <span className={styles.stepLabel}>ID Verified</span>
          </div>
          <div className={`${styles.stepConnector} ${verificationProgress?.idVerified && verificationProgress?.profileVerified ? styles.stepCompleteLine : ''}`} />
          <div className={styles.verificationStep}>
            <div className={`${styles.stepIcon} ${verificationProgress?.profileVerified ? styles.stepComplete : ''}`}>
              <Check size={12} />
            </div>
            <span className={styles.stepLabel}>Profile Verified</span>
          </div>
        </div>
        <button className={styles.viewDetailsBtn} onClick={onViewVerificationDetails}>
          View Verification Details
        </button>
      </div>
    </>
  );
};
