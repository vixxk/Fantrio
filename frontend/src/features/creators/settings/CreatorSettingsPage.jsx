import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { api } from '../../../services/api';
import { useToast } from '../../../components/Toast/Toast';

import { CreatorProfileSection } from './CreatorProfileSection';
import { CreatorRatesSection } from './CreatorRatesSection';
import { CreatorPayoutSection } from './CreatorPayoutSection';
import { CreatorNotificationsSection } from './CreatorNotificationsSection';
import { CreatorPrivacySection } from './CreatorPrivacySection';
import { CreatorPreferencesSection } from './CreatorPreferencesSection';

import { CreatorAccountStatusSidebar } from './CreatorAccountStatusSidebar';
import { CreatorSecurityScoreSidebar } from './CreatorSecurityScoreSidebar';
import { CreatorHelpSidebar } from './CreatorHelpSidebar';

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
  const { darkMode, refreshProfile } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [ratesSavedMsg, setRatesSavedMsg] = useState('');
  const [ratesError, setRatesError] = useState('');
  const [payoutSavedMsg, setPayoutSavedMsg] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  // Profile fields
  const [profileData, setProfileData] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioText, setBioText] = useState('');

  // Monetization & Rates fields
  const [rateAudio, setRateAudio] = useState('10');
  const [rateVideo, setRateVideo] = useState('25');
  const [subscriptionPrice, setSubscriptionPrice] = useState('9.99');

  // Sidebar / Status metrics
  const [accountStatus, setAccountStatus] = useState({ status: 'Active', memberSince: '—', accountType: 'Creator' });
  const [verificationProgress, setVerificationProgress] = useState({ verified: false, emailVerified: false, idVerified: false, profileVerified: false });
  const [securityScore, setSecurityScore] = useState({ score: 0, strength: '—', description: '', passwordStrength: '—', twoFactorAuth: 'Disabled', emailVerified: 'Unverified', activeSessions: '0 Recent' });

  // Payout settings
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');
  const [payoutCurrency, setPayoutCurrency] = useState('usd');
  const [minimumPayout, setMinimumPayout] = useState('100');

  // Preferences & Toggles
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATIONS);
  const [privacyState, setPrivacyState] = useState(DEFAULT_PRIVACY);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [helpLinks, setHelpLinks] = useState([]);

  const loadSettings = async () => {
    try {
      const d = await api.get('/creators/panel/settings');
      setProfileData(d.profileData);
      setDisplayName(d.profileData?.displayName || '');
      setUsername(d.profileData?.username || '');
      setEmail(d.profileData?.email || '');
      setAvatarUrl(d.profileData?.avatar || '');
      setBioText(d.profileData?.bio || '');

      setRateAudio(d.profileData?.rateAudio !== undefined ? String(d.profileData.rateAudio) : '10');
      setRateVideo(d.profileData?.rateVideo !== undefined ? String(d.profileData.rateVideo) : '25');
      setSubscriptionPrice(d.profileData?.subscriptionPrice !== undefined ? String(d.profileData.subscriptionPrice) : '9.99');

      setAccountStatus(d.accountStatus || { status: 'Active', memberSince: '2026', accountType: 'Creator' });
      setVerificationProgress(d.verificationProgress || { verified: true, emailVerified: true, idVerified: true, profileVerified: true });
      setSecurityScore(d.securityScore || { score: 85, strength: 'Strong', description: 'Your creator account is well protected.', passwordStrength: 'Strong', twoFactorAuth: 'Enabled', emailVerified: 'Verified', activeSessions: '1 Active' });

      setPayoutSettings(d.payoutSettings);
      setPayoutSchedule(d.payoutSettings?.payoutSchedule === 'biweekly' ? 'biweekly' : d.payoutSettings?.payoutSchedule === 'monthly' ? 'monthly' : 'weekly');
      setPayoutCurrency(d.payoutSettings?.currency === 'EUR — Euro' ? 'eur' : d.payoutSettings?.currency === 'GBP — British Pound' ? 'gbp' : 'usd');
      setMinimumPayout(d.payoutSettings?.minimumPayout ? String(d.payoutSettings.minimumPayout).replace(/[^0-9.]/g, '') : '100');

      setNotificationSettings(d.notifications || DEFAULT_NOTIFICATIONS);
      setPrivacyState(d.privacySettings || DEFAULT_PRIVACY);
      setPreferences(d.creatorPreferences || DEFAULT_PREFERENCES);
      setHelpLinks(d.helpLinks || []);
    } catch {
      setError('Could not load your creator settings. Please try again.');
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

  const saveProfileSettings = async () => {
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
        rateAudio: parseFloat(rateAudio) || 0,
        rateVideo: parseFloat(rateVideo) || 0,
        subscriptionPrice: parseFloat(subscriptionPrice) || 0,
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
      setSavedMsg('Profile updated successfully!');
      if (refreshProfile) refreshProfile();
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Could not save profile settings.');
    }
  };

  const saveRates = async () => {
    setRatesSavedMsg('');
    setRatesError('');
    try {
      await api.put('/creators/panel/settings', {
        rateAudio: parseFloat(rateAudio) || 0,
        rateVideo: parseFloat(rateVideo) || 0,
        subscriptionPrice: parseFloat(subscriptionPrice) || 0,
      });
      setRatesSavedMsg('Rates saved successfully!');
      setTimeout(() => setRatesSavedMsg(''), 3000);
    } catch (err) {
      setRatesError(err.message || 'Could not save rates.');
    }
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
      setPayoutSavedMsg('Payout settings saved successfully!');
      setTimeout(() => setPayoutSavedMsg(''), 3000);
    } catch (err) {
      setPayoutError(err.message || 'Could not save payout settings.');
    }
  };

  if (loading) {
    return (
      <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            {/* Profile Section Skeleton */}
            <div className={styles.settingsSection} style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <ShimmerSkeleton variant="text" width="35%" height="20px" marginBottom="0.5rem" />
              <ShimmerSkeleton variant="text" width="60%" height="13px" marginBottom="1.5rem" />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem' }}>
                <ShimmerSkeleton variant="avatar" width="64px" height="64px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <ShimmerSkeleton variant="text" width="40%" height="16px" />
                  <ShimmerSkeleton variant="text" width="25%" height="12px" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ShimmerSkeleton variant="text" width="100%" height="40px" borderRadius="8px" />
                <ShimmerSkeleton variant="text" width="100%" height="70px" borderRadius="8px" />
              </div>
            </div>

            {/* Monetization Rates Skeleton */}
            <div className={styles.settingsSection} style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <ShimmerSkeleton variant="text" width="30%" height="18px" marginBottom="0.5rem" />
              <ShimmerSkeleton variant="text" width="55%" height="13px" marginBottom="1.2rem" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <ShimmerSkeleton variant="card" height="65px" borderRadius="10px" />
                <ShimmerSkeleton variant="card" height="65px" borderRadius="10px" />
                <ShimmerSkeleton variant="card" height="65px" borderRadius="10px" />
              </div>
            </div>

            {/* Bottom Settings Grid Skeleton */}
            <div className={styles.bottomGrid}>
              <div className={styles.settingsSection} style={{ padding: '1.5rem' }}>
                <ShimmerSkeleton variant="text" width="45%" height="18px" marginBottom="1rem" />
                <ShimmerSkeleton variant="text" height="38px" marginBottom="0.6rem" borderRadius="8px" />
                <ShimmerSkeleton variant="text" height="38px" marginBottom="0.6rem" borderRadius="8px" />
                <ShimmerSkeleton variant="text" height="38px" borderRadius="8px" />
              </div>
              <div className={styles.settingsSection} style={{ padding: '1.5rem' }}>
                <ShimmerSkeleton variant="text" width="45%" height="18px" marginBottom="1rem" />
                <ShimmerSkeleton variant="text" height="38px" marginBottom="0.6rem" borderRadius="8px" />
                <ShimmerSkeleton variant="text" height="38px" marginBottom="0.6rem" borderRadius="8px" />
                <ShimmerSkeleton variant="text" height="38px" borderRadius="8px" />
              </div>
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className={styles.rightSidebar}>
            <div className={styles.sidebarCard} style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <ShimmerSkeleton variant="text" width="50%" height="18px" marginBottom="1rem" />
              <ShimmerSkeleton variant="text" height="42px" borderRadius="8px" marginBottom="0.75rem" />
              <ShimmerSkeleton variant="text" height="42px" borderRadius="8px" />
            </div>
            <div className={styles.sidebarCard} style={{ padding: '1.5rem' }}>
              <ShimmerSkeleton variant="text" width="50%" height="18px" marginBottom="1rem" />
              <ShimmerSkeleton variant="text" height="110px" borderRadius="12px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.mainGrid}>
        {/* Left Column - Sub-page Sections */}
        <div className={styles.leftColumn}>
          {/* Profile & Account Section */}
          <CreatorProfileSection
            profileData={profileData}
            displayName={displayName}
            setDisplayName={setDisplayName}
            username={username}
            setUsername={setUsername}
            email={email}
            bioText={bioText}
            setBioText={setBioText}
            savedMsg={savedMsg}
            error={error}
            onSave={saveProfileSettings}
            onOpenSecurityModal={() => setActiveModal('security')}
            onOpenAvatarModal={() => setActiveModal('avatar')}
          />

          {/* Monetization & Call Rates Section */}
          <CreatorRatesSection
            rateAudio={rateAudio}
            setRateAudio={setRateAudio}
            rateVideo={rateVideo}
            setRateVideo={setRateVideo}
            subscriptionPrice={subscriptionPrice}
            setSubscriptionPrice={setSubscriptionPrice}
            onSave={saveRates}
            savedMsg={ratesSavedMsg}
            error={ratesError}
          />

          {/* Payout & Payment Settings Section */}
          <CreatorPayoutSection
            payoutSettings={payoutSettings}
            payoutSchedule={payoutSchedule}
            setPayoutSchedule={setPayoutSchedule}
            payoutCurrency={payoutCurrency}
            setPayoutCurrency={setPayoutCurrency}
            minimumPayout={minimumPayout}
            setMinimumPayout={setMinimumPayout}
            onSavePayout={savePayoutSettings}
            onOpenPayoutModal={() => setActiveModal('payout')}
            payoutSavedMsg={payoutSavedMsg}
            payoutError={payoutError}
          />

          {/* Bottom Settings Grid: Notifications, Privacy, Preferences */}
          <div className={styles.bottomGrid}>
            <CreatorNotificationsSection
              notificationSettings={notificationSettings}
              onToggle={handleNotificationToggle}
            />

            <CreatorPrivacySection
              privacyState={privacyState}
              setPrivacyState={setPrivacyState}
              onTogglePrivacy={handlePrivacyToggle}
              onOpenModal={(m) => setActiveModal(m)}
            />

            <CreatorPreferencesSection
              preferences={preferences}
              onChangePreference={handlePreferenceChange}
            />
          </div>
        </div>

        {/* Right Sidebar - Status, Security Score, Help */}
        <div className={styles.rightSidebar}>
          <CreatorAccountStatusSidebar
            accountStatus={accountStatus}
            verificationProgress={verificationProgress}
            onViewVerificationDetails={() => toast.info('Verification details: Email, ID, and Profile are active.')}
          />

          <CreatorSecurityScoreSidebar
            securityScore={securityScore}
            onManageSecurity={() => setActiveModal('security')}
          />

          <CreatorHelpSidebar
            helpLinks={helpLinks}
            onOpenModal={(m) => setActiveModal(m)}
          />
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
        <BlockedUsersModal
          darkMode={darkMode}
          onClose={() => setActiveModal(null)}
          onChanged={loadSettings}
        />
      )}
      {activeModal === 'avatar' && (
        <AvatarModal
          darkMode={darkMode}
          currentAvatar={profileData?.avatar}
          onClose={() => setActiveModal(null)}
          onSaved={() => {
            loadSettings();
            if (refreshProfile) refreshProfile();
          }}
        />
      )}
      {activeModal === 'help' && (
        <HelpModal
          darkMode={darkMode}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'contact' && (
        <ContactSupportModal
          darkMode={darkMode}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'report' && (
        <ReportIssueModal
          darkMode={darkMode}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
