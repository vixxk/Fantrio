import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Camera, ChevronRight, HelpCircle,
  Phone, AlertTriangle, Check, Landmark
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../components/Toast/Toast';
import {
  SecurityModal,
  PayoutDetailsModal,
  BlockedUsersModal,
  AvatarModal,
  HelpModal,
  ContactSupportModal,
  ReportIssueModal
} from './CreatorSettingsModals';
import styles from './CreatorSettingsPage.module.css';

const DEFAULT_NOTIFICATIONS = [
  { id: 'newMessages', label: 'New Messages', enabled: true },
  { id: 'newSubscribers', label: 'New Subscribers', enabled: true },
  { id: 'tipsPayments', label: 'Tips & Payments', enabled: true },
  { id: 'streamReminders', label: 'Stream Reminders', enabled: true },
  { id: 'productPurchases', label: 'Product Purchases', enabled: false },
];

const DEFAULT_PRIVACY = [
  { id: 'profileVisibility', label: 'Profile Visibility', type: 'select', value: 'Public', options: ['Public', 'Private', 'Subscribers Only'] },
  { id: 'showOnlineStatus', label: 'Show Online Status', type: 'toggle', enabled: true },
  { id: 'allowDirectMessages', label: 'Allow Direct Messages', type: 'toggle', enabled: true },
  { id: 'blockedUsers', label: 'Blocked Users', type: 'link', value: '0' },
  { id: 'twoFactorAuth', label: 'Two-Factor Authentication', type: 'link', value: 'Disabled', highlight: false },
];

const DEFAULT_PREFERENCES = [
  { id: 'defaultStreamType', label: 'Default Stream Type', type: 'select', value: 'Live Video', options: ['Live Video', 'Audio Only'] },
  { id: 'defaultCallType', label: 'Default Call Type', type: 'select', value: 'Audio Call', options: ['Audio Call', 'Video Call'] },
  { id: 'contentLanguage', label: 'Content Language', type: 'select', value: 'English', options: ['English', 'Spanish', 'French', 'German'] },
  { id: 'timezone', label: 'Timezone', type: 'select', value: '(GMT-05:00) Eastern Time', options: ['(GMT-05:00) Eastern Time', '(GMT-06:00) Central Time', '(GMT-07:00) Pacific Time'] },
  { id: 'contentMaturity', label: 'Content Maturity', type: 'select', value: 'General Audience', options: ['General Audience', 'Mature Audience'] },
];

export const CreatorSettingsPage = () => {
  const { darkMode } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [payoutSavedMsg, setPayoutSavedMsg] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [accountStatus, setAccountStatus] = useState({ status: 'Active', memberSince: '—', accountType: 'Creator' });
  const [verificationProgress, setVerificationProgress] = useState({ verified: false, emailVerified: false, idVerified: false, profileVerified: false });
  const [securityScore, setSecurityScore] = useState({ score: 0, strength: '—', description: '', passwordStrength: '—', twoFactorAuth: 'Disabled', emailVerified: 'Unverified', activeSessions: '0 Recent' });
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');
  const [payoutCurrency, setPayoutCurrency] = useState('usd');
  const [minimumPayout, setMinimumPayout] = useState('');
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATIONS);
  const [privacyState, setPrivacyState] = useState(DEFAULT_PRIVACY);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [helpLinks, setHelpLinks] = useState([]);
  const [bioText, setBioText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const loadSettings = async () => {
    try {
      const d = await api.get('/creators/panel/settings');
      setProfileData(d.profileData);
      setAccountStatus(d.accountStatus);
      setVerificationProgress(d.verificationProgress);
      setSecurityScore(d.securityScore);
      setPayoutSettings(d.payoutSettings);
      setPayoutSchedule(d.payoutSettings?.payoutSchedule === 'biweekly' ? 'biweekly' : d.payoutSettings?.payoutSchedule === 'monthly' ? 'monthly' : 'weekly');
      setPayoutCurrency(d.payoutSettings?.currency === 'EUR — Euro' ? 'eur' : d.payoutSettings?.currency === 'GBP — British Pound' ? 'gbp' : 'usd');
      setMinimumPayout(d.payoutSettings?.minimumPayout ? String(d.payoutSettings.minimumPayout).replace(/[^0-9.]/g, '') : '100');
      setNotificationSettings(d.notifications || DEFAULT_NOTIFICATIONS);
      setPrivacyState(d.privacySettings || DEFAULT_PRIVACY);
      setPreferences(d.creatorPreferences || DEFAULT_PREFERENCES);
      setHelpLinks(d.helpLinks || []);
      setBioText(d.profileData.bio || '');
      setDisplayName(d.profileData.displayName || '');
      setUsername(d.profileData.username || '');
      setEmail(d.profileData.email || '');
      setAvatarUrl(d.profileData.avatar || '');
    } catch {
      setError('Could not load your settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadSettings());
  }, []);

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

  const savePayoutSettings = async () => {
    setPayoutSavedMsg('');
    setPayoutError('');
    try {
      await api.put('/creators/panel/settings', {
        payoutMethod: {
          payoutSchedule,
          currency: payoutCurrency,
          minimumPayout: minimumPayout || '100'
        }
      });
      setPayoutSavedMsg('Payout settings saved successfully');
      setTimeout(() => setPayoutSavedMsg(''), 3000);
    } catch (err) {
      setPayoutError(err.message || 'Could not save payout settings. Please try again.');
    }
  };

  const saveSettings = async () => {
    setSavedMsg('');
    setError('');
    try {
      const profileVisibility = privacyState.find((p) => p.id === 'profileVisibility');
      const showOnlineStatus = privacyState.find((p) => p.id === 'showOnlineStatus');
      const allowDirectMessages = privacyState.find((p) => p.id === 'allowDirectMessages');
      const contentLanguage = preferences.find((p) => p.id === 'contentLanguage');
      const defaultStreamType = preferences.find((p) => p.id === 'defaultStreamType');
      const defaultCallType = preferences.find((p) => p.id === 'defaultCallType');
      const timezone = preferences.find((p) => p.id === 'timezone');
      const contentMaturity = preferences.find((p) => p.id === 'contentMaturity');
      await api.put('/creators/panel/settings', {
        displayName,
        username,
        bio: bioText,
        avatarUrl,
        rateAudio: profileData?.rateAudio,
        rateVideo: profileData?.rateVideo,
        subscriptionPrice: profileData?.subscriptionPrice,
        notifications: notificationSettings,
        profileVisibility: profileVisibility ? profileVisibility.value : undefined,
        showOnlineStatus: showOnlineStatus ? showOnlineStatus.enabled : undefined,
        allowDirectMessages: allowDirectMessages ? allowDirectMessages.enabled : undefined,
        contentLanguage: contentLanguage ? contentLanguage.value : undefined,
        defaultStreamType: defaultStreamType ? defaultStreamType.value : undefined,
        defaultCallType: defaultCallType ? defaultCallType.value : undefined,
        timezone: timezone ? timezone.value : undefined,
        contentMaturity: contentMaturity ? contentMaturity.value : undefined,
        payoutMethod: {
          payoutSchedule,
          currency: payoutCurrency,
          minimumPayout: minimumPayout || '100'
        }
      });
      setSavedMsg('Settings saved successfully');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not save settings. Please try again.');
    }
  };

  const getHelpIcon = (iconType) => {
    switch (iconType) {
      case 'help': return <HelpCircle size={18} />;
      case 'support': return <Phone size={18} />;
      case 'report': return <AlertTriangle size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <section className={styles.settingsSection}>
              <ShimmerSkeleton variant="text" width="35%" height="18px" />
              <ShimmerSkeleton variant="text" width="60%" height="13px" marginTop="0.5rem" />
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <ShimmerSkeleton variant="avatar" width="72px" height="72px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <ShimmerSkeleton variant="text" width="45%" height="14px" />
                  <ShimmerSkeleton variant="text" width="30%" height="12px" />
                  <ShimmerSkeleton variant="text" width="35%" height="11px" />
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <ShimmerSkeleton variant="text" width="30%" height="10px" />
                      <ShimmerSkeleton variant="button" height="38px" />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <ShimmerSkeleton variant="text" width="30%" height="10px" />
                      <ShimmerSkeleton variant="button" height="38px" />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <ShimmerSkeleton variant="text" width="25%" height="10px" />
                  <ShimmerSkeleton variant="button" height="80px" />
                </div>
              </div>
            </section>

            <section className={styles.settingsSection}>
              <ShimmerSkeleton variant="text" width="30%" height="18px" />
              <ShimmerSkeleton variant="text" width="55%" height="13px" marginTop="0.5rem" />
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ShimmerSkeleton variant="row" height="48px" />
                <ShimmerSkeleton variant="row" height="48px" />
                <ShimmerSkeleton variant="row" height="48px" />
                <ShimmerSkeleton variant="row" height="48px" />
                <ShimmerSkeleton variant="row" height="48px" />
              </div>
            </section>

            <div className={styles.bottomGrid}>
              <section className={styles.settingsSection}>
                <ShimmerSkeleton variant="text" width="25%" height="16px" />
                <ShimmerSkeleton variant="text" width="50%" height="12px" marginTop="0.25rem" />
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ShimmerSkeleton variant="text" width="50%" height="12px" />
                      <ShimmerSkeleton variant="circle" width="36px" height="20px" />
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.settingsSection}>
                <ShimmerSkeleton variant="text" width="25%" height="16px" />
                <ShimmerSkeleton variant="text" width="55%" height="12px" marginTop="0.25rem" />
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ShimmerSkeleton variant="text" width="50%" height="12px" />
                      <ShimmerSkeleton variant="circle" width="36px" height="20px" />
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.settingsSection}>
                <ShimmerSkeleton variant="text" width="25%" height="16px" />
                <ShimmerSkeleton variant="text" width="55%" height="12px" marginTop="0.25rem" />
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ShimmerSkeleton variant="text" width="50%" height="12px" />
                      <ShimmerSkeleton variant="button" height="28px" width="80px" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className={styles.rightSidebar}>
            <div className={styles.sidebarCard}>
              <ShimmerSkeleton variant="text" width="40%" height="14px" />
              <ShimmerSkeleton variant="chip" width="80px" height="22px" marginTop="0.5rem" />
              <ShimmerSkeleton variant="text" width="80%" height="12px" marginTop="0.75rem" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <ShimmerSkeleton variant="text" width="45%" height="10px" />
                    <ShimmerSkeleton variant="text" width="30%" height="12px" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <ShimmerSkeleton variant="text" width="40%" height="14px" />
              <ShimmerSkeleton variant="chip" width="90px" height="22px" marginTop="0.5rem" />
              <ShimmerSkeleton variant="text" width="75%" height="12px" marginTop="0.75rem" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShimmerSkeleton variant="circle" width="16px" height="16px" />
                    <ShimmerSkeleton variant="text" width="55%" height="11px" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <ShimmerSkeleton variant="text" width="35%" height="14px" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                <ShimmerSkeleton variant="circle" width="60px" height="60px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <ShimmerSkeleton variant="text" width="40%" height="14px" />
                  <ShimmerSkeleton variant="text" width="60%" height="10px" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1rem' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ShimmerSkeleton variant="text" width="45%" height="10px" />
                    <ShimmerSkeleton variant="text" width="25%" height="12px" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <ShimmerSkeleton variant="text" width="25%" height="14px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShimmerSkeleton variant="circle" width="24px" height="24px" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <ShimmerSkeleton variant="text" width="55%" height="11px" />
                      <ShimmerSkeleton variant="text" width="40%" height="9px" />
                    </div>
                    <ShimmerSkeleton variant="text" width="16px" height="16px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
        <p className={styles.sectionSubtitle} style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

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
              <div className={styles.headerActions}>
                {savedMsg && <span className={styles.saveMsg}>{savedMsg}</span>}
                {error && <span className={styles.saveMsg} style={{ color: '#ef4444' }}>{error}</span>}
                <button className={styles.saveBtn} onClick={saveSettings}>
                  Save Changes
                </button>
                <button className={styles.changePasswordBtn} onClick={() => setActiveModal('security')}>
                  Change Password
                </button>
              </div>
            </div>
            <div className={styles.profileContent}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <img src={profileData.avatar} alt="Profile" className={styles.avatar} />
                  <button className={styles.cameraBtn} onClick={() => setActiveModal('avatar')} aria-label="Change profile picture">
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
                    <input
                      type="text"
                      className={styles.formInput}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Username</label>
                    <input
                      type="text"
                      className={`${styles.formInput} ${styles.usernameInput}`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input type="email" className={styles.formInput} defaultValue={email} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bio</label>
                    <textarea
                      className={styles.formTextarea}
                      value={bioText}
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
              <div className={styles.headerActions}>
                {payoutSavedMsg && <span className={styles.saveMsg}>{payoutSavedMsg}</span>}
                {payoutError && <span className={styles.saveMsg} style={{ color: '#ef4444' }}>{payoutError}</span>}
                <button className={`${styles.saveBtn} ${styles.payoutSaveBtn}`} onClick={savePayoutSettings}>
                  Save Changes
                </button>
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
                      <span className={styles.bankName}>{payoutSettings.bankName}</span>
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
                  <button className={styles.updatePayoutBtn} onClick={() => setActiveModal('payout')}>Update Payout Details</button>
                </div>
              </div>
              <div className={styles.payoutRight}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payout Schedule</label>
                  <div className={styles.selectWrapper}>
                    <select className={styles.formSelect} value={payoutSchedule} onChange={(e) => setPayoutSchedule(e.target.value)}>
                      <option value="weekly">Weekly (Every Monday)</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Minimum Payout Threshold</label>
                  <div className={styles.inputWithSuffix}>
                    <input type="text" className={styles.formInput} value={minimumPayout} onChange={(e) => setMinimumPayout(e.target.value.replace(/[^0-9.]/g, ''))} />
                    <span className={styles.inputSuffix}>USD</span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Currency</label>
                  <div className={styles.selectWrapper}>
                    <select className={styles.formSelect} value={payoutCurrency} onChange={(e) => setPayoutCurrency(e.target.value)}>
                      <option value="usd">USD — US Dollar</option>
                      <option value="eur">EUR — Euro</option>
                      <option value="gbp">GBP — British Pound</option>
                    </select>
                  </div>
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
                          value={item.value}
                          onChange={(e) => {
                            setPrivacyState(prev =>
                              prev.map(p => p.id === item.id ? { ...p, value: e.target.value } : p)
                            );
                          }}
                        >
                          {item.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {item.type === 'link' && (
                      <button
                        className={styles.settingLink}
                        onClick={() => {
                          if (item.id === 'blockedUsers') setActiveModal('blocked');
                          if (item.id === 'twoFactorAuth') setActiveModal('security');
                        }}
                      >
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

          {/* Bottom Settings Grid */}
        </div>

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
              <span className={styles.verifiedBadge}>
                {verificationProgress.verified ? 'Verified Creator' : 'Pending Verification'}
              </span>
            </div>
            <p className={styles.sidebarCardDescription}>
              {verificationProgress.verified
                ? "You're verified! Keep your profile updated."
                : 'Complete verification to get your verified badge.'}
            </p>
            <div className={styles.verificationSteps}>
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${verificationProgress.emailVerified ? styles.stepComplete : ''}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>Email Verified</span>
              </div>
              <div className={`${styles.stepConnector} ${verificationProgress.emailVerified && verificationProgress.idVerified ? styles.stepCompleteLine : ''}`} />
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${verificationProgress.idVerified ? styles.stepComplete : ''}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>ID Verified</span>
              </div>
              <div className={`${styles.stepConnector} ${verificationProgress.idVerified && verificationProgress.profileVerified ? styles.stepCompleteLine : ''}`} />
              <div className={styles.verificationStep}>
                <div className={`${styles.stepIcon} ${verificationProgress.profileVerified ? styles.stepComplete : ''}`}>
                  <Check size={12} />
                </div>
                <span className={styles.stepLabel}>Profile Verified</span>
              </div>
            </div>
            <button className={styles.viewDetailsBtn} onClick={() => toast.info('Verification details will be available soon.')}>
              View Verification Details
            </button>
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
                <p className={styles.scoreDescription}>{securityScore.description}</p>
                <div className={styles.scoreItems}>
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
            <button className={styles.manageSecurityBtn} onClick={() => setActiveModal('security')}>Manage Security</button>
          </div>

          {/* Need Help */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarCardTitle}>Need Help?</h3>
            <div className={styles.helpList}>
              {helpLinks.map((link) => (
                <button
                  key={link.id}
                  className={styles.helpItem}
                  onClick={() => {
                    if (link.id === 'helpCenter') setActiveModal('help');
                    else if (link.id === 'contactSupport') setActiveModal('contact');
                    else if (link.id === 'reportIssue') setActiveModal('report');
                  }}
                >
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

      {/* Settings Modals */}
      {activeModal === 'security' && (
        <SecurityModal
          darkMode={darkMode}
          onClose={() => setActiveModal(null)}
          onChanged={loadSettings}
        />
      )}
      {activeModal === 'payout' && (
        <PayoutDetailsModal
          darkMode={darkMode}
          payoutSettings={payoutSettings || {}}
          onClose={() => setActiveModal(null)}
          onSaved={loadSettings}
        />
      )}
      {activeModal === 'blocked' && (
        <BlockedUsersModal darkMode={darkMode} onClose={() => setActiveModal(null)} onChanged={loadSettings} />
      )}
      {activeModal === 'avatar' && (
        <AvatarModal
          darkMode={darkMode}
          currentAvatar={profileData?.avatar}
          onClose={() => setActiveModal(null)}
          onSaved={loadSettings}
        />
      )}
      {activeModal === 'help' && <HelpModal darkMode={darkMode} onClose={() => setActiveModal(null)} />}
      {activeModal === 'contact' && <ContactSupportModal darkMode={darkMode} onClose={() => setActiveModal(null)} />}
      {activeModal === 'report' && <ReportIssueModal darkMode={darkMode} onClose={() => setActiveModal(null)} />}
    </div>
  );
};
