import { Check } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorSecurityScoreSidebar = ({ securityScore, onManageSecurity }) => {
  const score = securityScore?.score || 0;

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.securityScoreHeader}>
        <h3 className={styles.sidebarCardTitle}>Security Score</h3>
      </div>
      <div className={styles.securityScoreContent}>
        <div className={styles.scoreCircle}>
          <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
            <defs>
              <linearGradient id="scoreGradientCreator" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#e10075" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeDasharray="237.6 264" strokeLinecap="round" transform="rotate(-90 50 50)" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="url(#scoreGradientCreator)"
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 237.6} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="50" dy="0.35em" textAnchor="middle" className={styles.scoreValue}>{score}%</text>
          </svg>
        </div>
        <div className={styles.scoreDetails}>
          <div className={styles.scoreTitleRow}>
            <span className={styles.scoreStrength}>{securityScore?.strength || '—'}</span>
          </div>
          <p className={styles.scoreDescription}>{securityScore?.description || 'Keep your creator account secure with 2FA and strong passwords.'}</p>
          <div className={styles.scoreItems}>
            <div className={styles.scoreItem}>
              <div className={styles.scoreItemIconWrap}>
                <Check size={8} strokeWidth={3} />
              </div>
              <span className={styles.scoreItemLabel}>Password Strength</span>
              <span className={styles.scoreItemValue}>{securityScore?.passwordStrength || 'Good'}</span>
            </div>
            <div className={styles.scoreItem}>
              <div className={styles.scoreItemIconWrap}>
                <Check size={8} strokeWidth={3} />
              </div>
              <span className={styles.scoreItemLabel}>Two-Factor Auth</span>
              <span className={styles.scoreItemValue}>{securityScore?.twoFactorAuth || 'Disabled'}</span>
            </div>
            <div className={styles.scoreItem}>
              <div className={styles.scoreItemIconWrap}>
                <Check size={8} strokeWidth={3} />
              </div>
              <span className={styles.scoreItemLabel}>Email Verified</span>
              <span className={styles.scoreItemValue}>{securityScore?.emailVerified || 'Verified'}</span>
            </div>
            <div className={styles.scoreItem}>
              <div className={styles.scoreItemIconWrap}>
                <Check size={8} strokeWidth={3} />
              </div>
              <span className={styles.scoreItemLabel}>Active Sessions</span>
              <span className={styles.scoreItemValue}>{securityScore?.activeSessions || '1 Active'}</span>
            </div>
          </div>
        </div>
      </div>
      <button className={styles.manageSecurityBtn} onClick={onManageSecurity}>
        Manage Security
      </button>
    </div>
  );
};
