import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Camera, ChevronRight, HelpCircle,
  Phone, AlertTriangle, Check, Landmark
} from 'lucide-react';
import {
  profileData, accountStatus, verificationProgress, securityScore,
  payoutSettings, notifications, privacySettings, creatorPreferences,
  helpLinks
} from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './CreatorSettingsPage.module.css';

export const CreatorSettingsPage = () => {
  const { darkMode } = useApp();
  const [notificationSettings, setNotificationSettings] = useState(notifications);
  const [privacyState, setPrivacyState] = useState(privacySettings);
  const [preferences, setPreferences] = useState(creatorPreferences);
  const [bioText, setBioText] = useState(profileData.bio);

  const handleNotificationToggle = (id) => {
    setNotificationSettings(prev =>
      prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
    );
  };

  const handlePrivacyToggle = (id) => {
    setPrivacyState(prev =>
      prev.map(p => p.id === id && p.type === 'toggle' ? { ...p, enabled: !p.enabled } : p)
    );
  };

  const handlePreferenceChange = (id, value) => {
    setPreferences(prev =>
      prev.map(p => p.id === id ? { ...p, value } : p)
    );
  };

  const getHelpIcon = (iconType) => {
    switch (iconType) {
      case 'help': return <HelpCircle size={18} />;
      case 'support': return <Phone size={18} />;
      case 'report': return <AlertTriangle size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.mainGrid}>
        {/* Left Column - Main Content */}
        <div className={styles.leftColumn}>
          {/* Profile & Account Section */}
          <section className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Profile & Account</h2>
                <p className={styles.sectionSubtitle}>Update your personal information and account details.</p>
              </div>
              <button className={styles.changePasswordBtn}>Change Password</button>
            </div>
            <div className={styles.profileContent}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <img src={profileData.avatar} alt="Profile" className={styles.avatar} />
                  <button className={styles.cameraBtn}>
                    <Camera size={14} />
                  </button>
                </div>
                <div className={styles.profileNameInfo}>
                  <span className={styles.profileName}>{profileData.displayName}</span>
                  <span className={styles.profileUsername}>@{profileData.username}</span>
                  <span className={styles.profileSince}>Creator since {profileData.creatorSince}</span>
                </div>
              </div>
              <div className={styles.formFields}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Display Name</label>
                    <input type="text" className={styles.formInput} defaultValue={profileData.displayName} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Username</label>
                    <input type="text" className={`${styles.formInput} ${styles.usernameInput}`} defaultValue={profileData.username} />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input type="email" className={styles.formInput} defaultValue={profileData.email} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bio</label>
                    <textarea
                      className={styles.formTextarea}
                      defaultValue={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      maxLength={profileData.bioMaxLength}
                    />
                    <span className={styles.charCount}>{bioText.length} / {profileData.bioMaxLength}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payout & Payment Settings */}
          <section className={styles.settingsSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Payout & Payment Settings</h2>
                <p className={styles.sectionSubtitle}>Manage your payout methods and payment preferences.</p>
              </div>
            </div>
            <div className={styles.payoutContent}>
              <div className={styles.payoutLeft}>
                <div className={styles.connectedAccount}>
                  <div className={styles.bankInfo}>
                    <div className={styles.bankIcon}>
                      <Landmark size={28} />
                    </div>
                    <div className={styles.bankDetails}>
                      <div className={styles.connectedHeader}>
                        <span className={styles.connectedLabel}>Connected Account</span>
                        {payoutSettings.verified && (
                          <span className={styles.verifiedBadge}>Verified</span>
                        )}
                      </div>
                      <span className={styles.bankName}>Bank Transfer (**** 5678)</span>
                    </div>
                  </div>
                  <div className={styles.accountRows}>
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Account Holder</span>
                      <span className={styles.accountValue}>{payoutSettings.accountHolder}</span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Bank Name</span>
                      <span className={styles.accountValue}>{payoutSettings.bankName}</span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Routing Number</span>
                      <span className={styles.accountValue}>{payoutSettings.routingNumber}</span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.accountLabel}>Account Number</span>
                      <span className={styles.accountValue}>{payoutSettings.accountNumber}</span>
                    </div>
                  </div>
                  <button className={styles.updatePayoutBtn}>Update Payout Details</button>
                </div>
              </div>
              <div className={styles.payoutRight}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payout Schedule</label>
                  <div className={styles.selectWrapper}>
                    <select className={styles.formSelect} defaultValue="weekly">
                      <option value="weekly">Weekly (Every Monday)</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Minimum Payout Threshold</label>
                  <div className={styles.inputWithSuffix}>
                    <input type="text" className={styles.formInput} defaultValue={payoutSettings.minimumPayout} />
                    <span className={styles.inputSuffix}>USD</span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Currency</label>
                  <div className={styles.selectWrapper}>
                    <select className={styles.formSelect} defaultValue="usd">
                      <option value="usd">USD — US Dollar</option>
                      <option value="eur">EUR — Euro</option>
                      <option value="gbp">GBP — British Pound</option>
                    </select>
                  </div>
                </div>
                <div className={styles.payoutNote}>
                  <span className={styles.noteIcon}>ℹ️</span>
                  <span className={styles.noteText}>Payouts are processed every Monday. Ensure your payout details are accurate.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Settings Grid */}
          <div className={styles.bottomGrid}>
            {/* Notifications */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <p className={styles.sectionSubtitle}>Choose what you want to be notified about.</p>
              </div>
              <div className={styles.settingsList}>
                {notificationSettings.map((item) => (
                  <div key={item.id} className={styles.settingItem}>
                    <span className={styles.settingLabel}>{item.label}</span>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleNotificationToggle(item.id)}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy & Security */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Privacy & Security</h2>
                <p className={styles.sectionSubtitle}>Control your privacy and keep your account secure.</p>
              </div>
              <div className={styles.settingsList}>
                {privacyState.map((item) => (
                  <div key={item.id} className={styles.settingItem}>
                    <span className={styles.settingLabel}>{item.label}</span>
                    {item.type === 'toggle' && (
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={() => handlePrivacyToggle(item.id)}
                        />
                        <span className={styles.toggleSlider} />
                      </label>
                    )}
                    {item.type === 'select' && (
                      <div className={styles.selectWrapperSmall}>
                        <select
                          className={styles.formSelectSmall}
                          defaultValue={item.value}
                        >
                          {item.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {item.type === 'link' && (
                      <button className={styles.settingLink}>
                        <span className={item.highlight ? styles.linkHighlight : ''}>{item.value}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Creator Preferences */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>Creator Preferences</h2>
                <p className={styles.sectionSubtitle}>Customize your experience on Fantrio.</p>
              </div>
              <div className={styles.settingsList}>
                {preferences.map((item) => (
                  <div key={item.id} className={styles.settingItem}>
                    <span className={styles.settingLabel}>{item.label}</span>
                    <div className={styles.selectWrapperSmall}>
                      <select
                        className={styles.formSelectSmall}
                        value={item.value}
                        onChange={(e) => handlePreferenceChange(item.id, e.target.value)}
                      >
                        {item.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Account Status */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Account Status</h3>
              <span className={styles.statusBadgeActive}>{accountStatus.status}</span>
            </div>
            <p className={styles.sidebarCardDescription}>
              Your account is active and in good standing. Thank you for being part of Fantrio!
            </p>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusItemLabel}>Member Since</span>
                <span className={styles.statusItemValue}>{accountStatus.memberSince}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusItemLabel}>Account Type</span>
                <span className={styles.statusItemValue}>{accountStatus.accountType}</span>
              </div>
            </div>
          </div>

          {/* Verification Progress */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Verification Progress</h3>
              <span className={styles.verifiedBadge}>Verified Creator</span>
            </div>
            <p className={styles.sidebarCardDescription}>
              You're verified! Keep your profile updated.
            </p>
            <div className={styles.verificationSteps}>
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${styles.stepComplete}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>Email Verified</span>
              </div>
              <div className={`${styles.stepConnector} ${styles.stepCompleteLine}`} />
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${styles.stepComplete}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>ID Verified</span>
              </div>
              <div className={`${styles.stepConnector} ${styles.stepCompleteLine}`} />
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${styles.stepComplete}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>Profile Verified</span>
              </div>
            </div>
            <button className={styles.viewDetailsBtn}>View Verification Details</button>
          </div>

          {/* Security Score */}
          <div className={styles.sidebarCard}>
            <div className={styles.securityScoreHeader}>
              <h3 className={styles.sidebarCardTitle}>Security Score</h3>
            </div>
            <div className={styles.securityScoreContent}>
              <div className={styles.scoreCircle}>
                <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#e10075" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeDasharray="237.6 264" strokeLinecap="round" transform="rotate(-90 50 50)" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(securityScore.score / 100) * 237.6} 264`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" dy="0.35em" textAnchor="middle" className={styles.scoreValue}>{securityScore.score}%</text>
                </svg>
              </div>
              <div className={styles.scoreDetails}>
                <div className={styles.scoreTitleRow}>
                  <span className={styles.scoreStrength}>{securityScore.strength}</span>
                </div>
                <p className={styles.scoreDescription}>{securityScore.description}</p>                <div className={styles.scoreItems}>
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreItemIconWrap}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                    <span className={styles.scoreItemLabel}>Password Strength</span>
                    <span className={styles.scoreItemValue}>{securityScore.passwordStrength}</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreItemIconWrap}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                    <span className={styles.scoreItemLabel}>Two-Factor Auth</span>
                    <span className={styles.scoreItemValue}>{securityScore.twoFactorAuth}</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreItemIconWrap}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                    <span className={styles.scoreItemLabel}>Email Verified</span>
                    <span className={styles.scoreItemValue}>{securityScore.emailVerified}</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <div className={styles.scoreItemIconWrap}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                    <span className={styles.scoreItemLabel}>Active Sessions</span>
                    <span className={styles.scoreItemValue}>{securityScore.activeSessions}</span>
                  </div>
                </div>
              </div>
            </div>
            <button className={styles.manageSecurityBtn}>Manage Security</button>
          </div>

          {/* Need Help */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarCardTitle}>Need Help?</h3>
            <div className={styles.helpList}>
              {helpLinks.map((link) => (
                <button key={link.id} className={styles.helpItem}>
                  <div className={styles.helpIcon}>
                    {getHelpIcon(link.icon)}
                  </div>
                  <div className={styles.helpInfo}>
                    <span className={styles.helpLabel}>{link.label}</span>
                    <span className={styles.helpDescription}>{link.description}</span>
                  </div>
                  <ChevronRight size={16} className={styles.helpArrow} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
