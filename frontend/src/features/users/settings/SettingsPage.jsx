import { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { 
  ChevronRight, 
  Settings,
  ArrowLeft,
  BookOpen,
  Headphones,
  Ticket,
  MessageSquare,
  Heart,
  AlertOctagon,
  User,
  Shield,
  Bell,
  CreditCard,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  KeyRound,
  Smartphone,
  Laptop,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Star,
  Loader,
  BadgeCheck
} from 'lucide-react';
import styles from './SettingsPage.module.css';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'];

export const SettingsPage = () => {
  const { darkMode, user, updateUser } = useApp();
  const [activeSection, setActiveSection] = useState(null);

  const settingsRows = [
    {
      id: 'profile',
      iconUrl: '/profile.png',
      title: 'Profile Settings',
      desc: 'Update your profile information, profile picture and bio.',
    },
    {
      id: 'security',
      iconUrl: '/shield.png',
      title: 'Security',
      desc: 'Manage your password, 2FA and login activity.',
    },
    {
      id: 'notifications',
      iconUrl: '/bell.png',
      title: 'Notifications',
      desc: 'Choose what notifications you want to receive.',
    },
    {
      id: 'payment',
      iconUrl: '/cards.png',
      title: 'Payment Methods',
      desc: 'Add or manage your payment methods and billings.',
    },
  ];

  const helpLinks = [
    {
      id: 'help-centre',
      Icon: BookOpen,
      title: 'Help Centre',
      desc: 'Browse articles and guides.',
    },
    {
      id: 'support-tickets',
      Icon: Ticket,
      title: 'My Support Tickets',
      desc: 'View your existing tickets.',
    },
    {
      id: 'contact-support-link',
      Icon: MessageSquare,
      title: 'Contact Support',
      desc: 'Chat or email us directly.',
    },
    {
      id: 'community',
      Icon: Heart,
      title: 'Community Guidelines',
      desc: 'Stay safe and have fun',
    },
    {
      id: 'report',
      iconUrl: '/report.png',
      title: 'Report Problem',
      desc: 'Report content and behaviour',
    },
  ];

  const handleRowClick = (id) => {
    setActiveSection(id);
  };

  const renderMain = () => {
    return (
      <>
        {/* Header */}
        <div className={styles.feedHeader}>
          <div className={styles.headerTitleBlock}>
            <div className={styles.titleRow}>
              <Settings className={styles.headerSettingsIcon} size={28} style={{ stroke: 'url(#brand-gradient)' }} />
              <h1 className={styles.pageTitle}>Account Settings</h1>
            </div>
            <p className={styles.pageSubtitle}>Manage your account preferences and settings.</p>
          </div>
        </div>

        {/* Settings Rows */}
        <div className={styles.settingsRows}>
          {settingsRows.map((row) => {
            return (
              <div
                key={row.id}
                className={styles.settingRow}
                onClick={() => handleRowClick(row.id)}
              >
                <div className={styles.settingRowLeft}>
                  <div className={styles.settingIconWrap}>
                    <img src={row.iconUrl} alt={row.title} className={styles.settingIconImg} />
                  </div>
                  <div className={styles.settingTextCol}>
                    <h3 className={styles.settingTitle}>{row.title}</h3>
                    <p className={styles.settingDesc}>{row.desc}</p>
                  </div>
                </div>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            );
          })}
        </div>

        {/* Contact & FAQ Cards (Desktop Only) */}
        <div className={`${styles.supportCardsRow} ${styles.desktopOnly}`}>
          <div className={styles.supportCard} onClick={() => setActiveSection('contact-support-link')}>
            <div className={styles.supportCardIconWrap}>
              <Headphones className={styles.supportCardIcon} size={22} />
            </div>
            <div className={styles.supportCardContent}>
              <h3 className={styles.supportCardTitle}>Contact Support</h3>
              <p className={styles.supportCardDesc}>Get help from our support team.</p>
              <button className={styles.supportBtn}>
                Contact Support
              </button>
            </div>
          </div>

          <div className={styles.supportCard} onClick={() => setActiveSection('help-centre')}>
            <div className={styles.supportCardIconWrap}>
              <svg 
                width="26" 
                height="26" 
                viewBox="0 0 24 24" 
                fill="none" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={styles.supportCardIcon}
              >
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="1.4" fill="url(#brand-gradient)" style={{ stroke: 'none' }} />
              </svg>
            </div>
            <div className={styles.supportCardContent}>
              <h3 className={styles.supportCardTitle}>FAQ</h3>
              <p className={styles.supportCardDesc}>Find answers to common questions.</p>
              <button className={styles.supportBtn}>
                View FAQ
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`${styles.settingsContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Gradient SVG for header icon */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.settingsShell}>

        {/* ================= LEFT MAIN SECTION ================= */}
        <div className={styles.mainSection}>

          {activeSection ? (
            <SubPage
              section={activeSection}
              user={user}
              onBack={() => setActiveSection(null)}
              onNavigate={setActiveSection}
              updateUser={updateUser}
            />
          ) : (
            renderMain()
          )}

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        {!activeSection && (
          <div className={styles.rightSidebar}>

            {/* Hero Help Card */}
            <div className={styles.helpHeroCard}>
              <div className={styles.helpHeroIconWrap}>
                <img src="/contact big.png" alt="Help support" className={styles.helpHeroIconImg} />
              </div>
              <h2 className={styles.helpHeroTitle}>We're Here To Help!</h2>
              <p className={styles.helpHeroDesc}>
                Our support team is available 24/7 to assist you with any questions or issues.
              </p>
            </div>

            {/* Help Links */}
            <div className={styles.helpLinksCard}>
              {helpLinks.map((link) => {
                return (
                  <div
                    key={link.id}
                    className={styles.helpLinkRow}
                    onClick={() => setActiveSection(link.id)}
                  >
                    <div className={styles.helpLinkLeft}>
                      <div className={styles.helpLinkIconWrap}>
                        {link.iconUrl ? (
                          <img src={link.iconUrl} alt={link.title} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        ) : (
                          <link.Icon className={styles.helpLinkIcon} size={18} />
                        )}
                      </div>
                      <div className={styles.helpLinkTextCol}>
                        <h4 className={styles.helpLinkTitle}>{link.title}</h4>
                        <p className={styles.helpLinkDesc}>{link.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className={styles.helpLinkChevron} />
                  </div>
                );
              })}
            </div>

            {/* Contact & FAQ Cards (Mobile Only - Bottom of DOM) */}
            <div className={`${styles.supportCardsRow} ${styles.mobileOnly}`}>
              <div className={styles.supportCard} onClick={() => setActiveSection('contact-support-link')}>
                <div className={styles.supportCardIconWrap}>
                  <Headphones className={styles.supportCardIcon} size={22} />
                </div>
                <div className={styles.supportCardContent}>
                  <h3 className={styles.supportCardTitle}>Contact Support</h3>
                  <p className={styles.supportCardDesc}>Get help from our support team.</p>
                  <button className={styles.supportBtn}>
                    Contact Support
                  </button>
                </div>
              </div>

              <div className={styles.supportCard} onClick={() => setActiveSection('help-centre')}>
                <div className={styles.supportCardIconWrap}>
                  <svg 
                    width="26" 
                    height="26" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={styles.supportCardIcon}
                  >
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r="1.4" fill="url(#brand-gradient)" style={{ stroke: 'none' }} />
                  </svg>
                </div>
                <div className={styles.supportCardContent}>
                  <h3 className={styles.supportCardTitle}>FAQ</h3>
                  <p className={styles.supportCardDesc}>Find answers to common questions.</p>
                  <button className={styles.supportBtn}>
                    View FAQ
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

const SubPage = ({ section, user, onBack, onNavigate, updateUser }) => {
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const clearStatus = () => setStatusMsg({ type: '', text: '' });

  const titles = {
    profile: { title: 'Profile Settings', desc: 'Update your profile information, profile picture and bio.' },
    security: { title: 'Security', desc: 'Manage your password, two-factor authentication and login activity.' },
    notifications: { title: 'Notifications', desc: 'Choose what notifications you want to receive.' },
    payment: { title: 'Payment Methods', desc: 'Add or manage your payment methods and billing.' },
    'help-centre': { title: 'Help Centre', desc: 'Browse articles and guides to get the most out of Fantrio.' },
    'support-tickets': { title: 'My Support Tickets', desc: 'View and track your support requests.' },
    'contact-support-link': { title: 'Contact Support', desc: 'Get help from our support team.' },
    community: { title: 'Community Guidelines', desc: 'Stay safe and have fun.' },
    report: { title: 'Report Problem', desc: 'Report content and behaviour that violates our guidelines.' },
  };

  const renderContent = () => {
    switch (section) {
      case 'profile':
        return <ProfileSection user={user} updateUser={updateUser} setStatus={setStatusMsg} />;
      case 'security':
        return <SecuritySection setStatus={setStatusMsg} />;
      case 'notifications':
        return <NotificationsSection setStatus={setStatusMsg} />;
      case 'payment':
        return <PaymentSection setStatus={setStatusMsg} />;
      case 'help-centre':
        return <HelpCentreSection setStatus={setStatusMsg} onContact={() => onNavigate('contact-support-link')} />;
      case 'support-tickets':
        return <TicketsSection setStatus={setStatusMsg} onContact={() => onNavigate('contact-support-link')} />;
      case 'contact-support-link':
        return <ContactSection setStatus={setStatusMsg} />;
      case 'community':
        return <GuidelinesSection />;
      case 'report':
        return <ReportSection setStatus={setStatusMsg} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.subPageContainer}>
      <div className={styles.subPageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={22} />
        </button>
        <div className={styles.subPageTitleBlock}>
          <h2 className={styles.subPageTitle}>{titles[section]?.title}</h2>
          <p className={styles.subPageDesc}>{titles[section]?.desc}</p>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`${styles.statusAlert} ${styles[statusMsg.type]}`}>
          {statusMsg.type === 'success' ? (
            <Check size={18} className={styles.alertIcon} />
          ) : (
            <AlertTriangle size={18} className={styles.alertIcon} />
          )}
          <span>{statusMsg.text}</span>
          <button className={styles.alertCloseBtn} onClick={clearStatus}>&times;</button>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

// ================= PROFILE =================
const ProfileSection = ({ user, updateUser, setStatus }) => {
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.patch('/settings/profile', form);
      if (res.status === 'success') {
        updateUser({
          displayName: res.user.displayName,
          username: res.user.username,
          avatarUrl: res.user.avatarUrl,
          bio: res.user.bio,
        });
        setForm({
          displayName: res.user.displayName || '',
          username: res.user.username || '',
          bio: res.user.bio || '',
          avatarUrl: res.user.avatarUrl || '',
        });
        setStatus({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.subPageBody}>
      <div className={styles.profilePreview}>
        <div className={styles.profileAvatarWrap}>
          <img src={form.avatarUrl || '/profile.png'} alt="Profile" className={styles.profileAvatar} />
        </div>
        <div className={styles.profilePreviewText}>
          <h3>{form.displayName || 'Your name'}</h3>
          <p>@{form.username || 'username'}</p>
          <span className={styles.emailVerifiedBadge}>
            <BadgeCheck size={14} /> {user?.email}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Display Name</label>
          <input
            type="text"
            className={styles.formInput}
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Your display name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Username</label>
          <input
            type="text"
            className={styles.formInput}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="username"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Profile Picture URL</label>
          <input
            type="url"
            className={styles.formInput}
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email</label>
          <input
            type="email"
            className={`${styles.formInput} ${styles.inputDisabled}`}
            value={user?.email || ''}
            disabled
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Bio</label>
          <textarea
            rows={4}
            className={styles.formTextarea}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us a little about yourself..."
            maxLength={500}
          />
          <span className={styles.charCount}>{form.bio.length}/500</span>
        </div>

        <button type="submit" disabled={saving} className={styles.submitBtn}>
          {saving ? <><Loader size={16} className={styles.spin} /> Saving...</> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

// ================= SECURITY =================
const SecuritySection = ({ setStatus }) => {
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  // 2FA flow state
  const [twoFaStep, setTwoFaStep] = useState('idle'); // idle | sent | enabled
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const loadSecurity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/security');
      if (res.status === 'success') {
        setSecurity(res.security);
        setTwoFaStep(res.security.twoFactorEnabled ? 'enabled' : 'idle');
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load security settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadSecurity();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setStatus({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await api.patch('/auth/update-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Password updated successfully!' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/enable', {});
      if (res.status === 'success') {
        setTwoFaStep('sent');
        setTwoFaCode('');
        setStatus({ type: 'success', text: res.message || 'Verification code sent to your email.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to send verification code.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/verify', { code: twoFaCode });
      if (res.status === 'success') {
        setTwoFaStep('enabled');
        setTwoFaCode('');
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        setStatus({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/disable', { currentPassword: disablePwd });
      if (res.status === 'success') {
        setTwoFaStep('idle');
        setDisablePwd('');
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false }));
        setStatus({ type: 'success', text: 'Two-factor authentication disabled.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to disable 2FA.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  if (loading) {
    return <SkeletonRows />;
  }

  const deviceIcon = (device) => {
    if (/mobile|android|iphone|ipad/i.test(device)) return <Smartphone size={16} />;
    if (/apple|mac/i.test(device)) return <Monitor size={16} />;
    if (/linux/i.test(device)) return <Laptop size={16} />;
    return <Laptop size={16} />;
  };

  return (
    <div className={styles.subPageBody}>
      {/* 2FA */}
      <div className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={styles.securityIconBox}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className={styles.securityCardTitle}>Two-Factor Authentication</h3>
              <p className={styles.securityCardDesc}>
                Add an extra layer of security to your account. We'll send a one-time code to your email when you sign in.
              </p>
            </div>
          </div>
          <span className={`${styles.securityStatusBadge} ${twoFaStep === 'enabled' ? styles.enabled : ''}`}>
            {twoFaStep === 'enabled' ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {twoFaStep === 'enabled' ? (
          <form onSubmit={handleDisable2FA} className={styles.twoFaForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Enter your current password to disable 2FA</label>
              <input
                type="password"
                className={styles.formInput}
                placeholder="Current password"
                value={disablePwd}
                onChange={(e) => setDisablePwd(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={twoFaBusy} className={styles.dangerBtn}>
              {twoFaBusy ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </form>
        ) : twoFaStep === 'sent' ? (
          <form onSubmit={handleVerify2FA} className={styles.twoFaForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Enter the 6-digit code from your email</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={styles.formInput}
                placeholder="123456"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                required
              />
            </div>
            <div className={styles.twoFaActions}>
              <button type="submit" disabled={twoFaBusy} className={styles.submitBtn}>
                {twoFaBusy ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setTwoFaStep('idle')} disabled={twoFaBusy}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={handleEnable2FA} disabled={twoFaBusy} className={styles.submitBtn}>
            {twoFaBusy ? 'Sending code...' : 'Enable 2FA'}
          </button>
        )}
      </div>

      {/* Change password */}
      <div className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={styles.securityIconBox}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className={styles.securityCardTitle}>Change Password</h3>
              <p className={styles.securityCardDesc}>Use a strong password that you don't use anywhere else.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Current Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>New Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirm New Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={savingPwd} className={styles.submitBtn}>
            {savingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Login activity */}
      <div className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={styles.securityIconBox}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className={styles.securityCardTitle}>Login Activity</h3>
              <p className={styles.securityCardDesc}>Recently used devices and locations for your account.</p>
            </div>
          </div>
        </div>

        {!security?.loginActivity || security.loginActivity.length === 0 ? (
          <div className={styles.emptyBox}>
            <Shield size={40} className={styles.emptyBoxIcon} />
            <p>No recent login activity recorded.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {security.loginActivity.map((a, idx) => (
              <div key={idx} className={styles.activityRow}>
                <div className={styles.activityIconWrap}>{deviceIcon(a.device)}</div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityDevice}>{a.device}</span>
                  <span className={styles.activityMeta}>
                    {a.ip || 'Unknown IP'}{a.location && a.location !== '—' ? ` • ${a.location}` : ''}
                  </span>
                </div>
                <span className={styles.activityTime}>
                  {new Date(a.loggedInAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================= NOTIFICATIONS =================
const NotificationsSection = ({ setStatus }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      if (res.status === 'success') setPreferences(res.preferences);
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load notification preferences.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadPrefs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificationItems = [
    { key: 'newMessages', title: 'New Messages', desc: 'Get notified when someone sends you a message.' },
    { key: 'newSubscribers', title: 'New Subscribers', desc: 'Get notified when someone subscribes to you.' },
    { key: 'tipsAndPayments', title: 'Tips & Payments', desc: 'Get notified when you receive tips or payments.' },
    { key: 'liveStreamReminders', title: 'Live Stream Reminders', desc: 'Get notified when a creator you follow goes live.' },
    { key: 'productPurchases', title: 'Product Purchases', desc: 'Get notified when someone purchases your products.' },
    { key: 'announcements', title: 'Platform Announcements', desc: 'Receive product updates and important announcements.' },
  ];

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(true);
    try {
      const res = await api.patch('/settings/notifications', { [key]: next[key] });
      if (res.status === 'success') setPreferences(res.preferences);
    } catch (err) {
      setPreferences(preferences);
      setStatus({ type: 'error', text: err.message || 'Failed to update notification preference.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.notifIntro}>
        <Bell size={20} />
        <span>Choose which notifications you want to receive. Changes are saved automatically.</span>
      </div>

      <div className={styles.notifList}>
        {notificationItems.map((item) => (
          <div key={item.key} className={styles.notifRow}>
            <div className={styles.notifTextCol}>
              <h4 className={styles.notifTitle}>{item.title}</h4>
              <p className={styles.notifDesc}>{item.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!preferences?.[item.key]}
              className={`${styles.toggle} ${preferences?.[item.key] ? styles.toggleOn : ''}`}
              onClick={() => togglePreference(item.key)}
              disabled={saving}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= PAYMENT METHODS =================
const PaymentSection = ({ setStatus }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cardBrand: 'Visa',
    holderName: '',
    last4: '',
    expMonth: '',
    expYear: '',
    billingAddress: '',
  });

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/payment-methods');
      if (res.status === 'success') setMethods(res.paymentMethods || []);
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load payment methods.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMethods();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/payment-methods', {
        ...form,
        expMonth: parseInt(form.expMonth, 10),
        expYear: parseInt(form.expYear, 10),
      });
      if (res.status === 'success') {
        setMethods(prev => [res.paymentMethod, ...prev]);
        setForm({ cardBrand: 'Visa', holderName: '', last4: '', expMonth: '', expYear: '', billingAddress: '' });
        setShowForm(false);
        setStatus({ type: 'success', text: 'Payment method added successfully!' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to add payment method.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.patch(`/settings/payment-methods/${id}`, { isDefault: true });
      if (res.status === 'success') {
        setMethods(prev => prev.map(m => ({ ...m, isDefault: m._id === id })));
        setStatus({ type: 'success', text: 'Default payment method updated.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to set default payment method.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/settings/payment-methods/${id}`);
      if (res.status === 'success') {
        setMethods(prev => prev.filter(m => m._id !== id));
        setStatus({ type: 'success', text: 'Payment method removed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to remove payment method.' });
    }
  };

  const brandColor = (brand) => styles[`brand_${brand.toLowerCase()}`] || '';

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.payHeaderRow}>
        <p className={styles.payIntro}>
          Manage the cards you use for coin purchases. Card numbers are stored securely — we never save your full card number.
        </p>
        <button className={styles.actionBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Card'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.payForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Card Brand</label>
              <select className={styles.formSelect} value={form.cardBrand} onChange={(e) => setForm({ ...form, cardBrand: e.target.value })}>
                {CARD_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cardholder Name</label>
              <input type="text" className={styles.formInput} value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} required placeholder="Name on card" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last 4 Digits</label>
              <input type="text" inputMode="numeric" maxLength={4} className={styles.formInput} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })} required placeholder="4242" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiry Month</label>
              <input type="number" min="1" max="12" className={styles.formInput} value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} required placeholder="08" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiry Year</label>
              <input type="number" min="2025" max="2100" className={styles.formInput} value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} required placeholder="2028" />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Billing Address</label>
            <input type="text" className={styles.formInput} value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} placeholder="Street, City, ZIP" />
          </div>

          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? 'Adding...' : 'Add Payment Method'}
          </button>
        </form>
      )}

      {methods.length === 0 ? (
        <div className={styles.emptyBox}>
          <CreditCard size={44} className={styles.emptyBoxIcon} />
          <p>No payment methods saved yet.</p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {methods.map((m) => (
            <div key={m._id} className={`${styles.cardItem} ${brandColor(m.cardBrand)}`}>
              <div className={styles.cardItemTop}>
                <div className={styles.cardBrandRow}>
                  <CreditCard size={20} />
                  <span className={styles.cardBrand}>{m.cardBrand}</span>
                  {m.isDefault && <span className={styles.defaultBadge}>Default</span>}
                </div>
                <span className={styles.cardNumber}>•••• {m.last4}</span>
              </div>
              <div className={styles.cardItemBottom}>
                <span className={styles.cardHolder}>{m.holderName}</span>
                <span className={styles.cardExpiry}>{m.expMonth}/{m.expYear}</span>
              </div>
              <div className={styles.cardActions}>
                {!m.isDefault && (
                  <button className={styles.cardActionBtn} onClick={() => handleSetDefault(m._id)}>
                    <Star size={14} /> Set Default
                  </button>
                )}
                <button className={`${styles.cardActionBtn} ${styles.cardDeleteBtn}`} onClick={() => handleDelete(m._id)}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================= HELP CENTRE (FAQ) =================
const HelpCentreSection = ({ setStatus, onContact }) => {
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const loadFaqs = async () => {
    try {
      const res = await api.get('/settings/faqs');
      if (res.status === 'success') setFaqs(res.faqs || []);
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load FAQ.' });
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadFaqs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.subPageBody}>
      <div className={styles.helpCentreHero}>
        <BookOpen size={28} />
        <div>
          <h3>How can we help?</h3>
          <p>Browse the most common questions below.</p>
        </div>
      </div>

      {faqs.length === 0 ? (
        <div className={styles.emptyBox}>
          <BookOpen size={44} className={styles.emptyBoxIcon} />
          <p>No articles published yet.</p>
        </div>
      ) : (
        <div className={styles.accordionContainer}>
          {faqs.map((faq, idx) => (
            <div key={faq._id} className={styles.accordionItem}>
              <button
                className={styles.accordionTrigger}
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <span>{faq.question}</span>
                <ChevronRight size={18} className={`${styles.accordionChevron} ${expanded === idx ? styles.chevronRotated : ''}`} />
              </button>
              {expanded === idx && (
                <div className={styles.accordionPanel}>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.helpCta}>
        <Headphones size={18} />
        <span>Can't find what you're looking for?</span>
        <button className={styles.supportBtn} onClick={onContact}>Contact Support</button>
      </div>
    </div>
  );
};

// ================= SUPPORT TICKETS =================
const TicketsSection = ({ setStatus, onContact }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/tickets');
      if (res.status === 'success') setTickets(res.tickets || []);
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load tickets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadTickets();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.payHeaderRow}>
        <p className={styles.payIntro}>Track the status of your support requests.</p>
        <button className={styles.actionBtn} onClick={onContact}>Contact Support</button>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.emptyBox}>
          <Ticket size={44} className={styles.emptyBoxIcon} />
          <p>You have not submitted any support tickets yet.</p>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {tickets.map(t => (
            <div key={t._id} className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <span className={styles.ticketSubject}>{t.subject}</span>
                <span className={`${styles.statusBadge} ${styles[t.status]}`}>{t.status}</span>
              </div>
              <p className={styles.ticketMessage}>{t.message}</p>
              {t.reply ? (
                <div className={styles.ticketReplyBox}>
                  <strong>Support Response:</strong>
                  <p>{t.reply}</p>
                </div>
              ) : null}
              <div className={styles.ticketFooter}>
                <span>Category: {t.category}</span>
                <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================= CONTACT SUPPORT =================
const ContactSection = ({ setStatus }) => {
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setSubmitting(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/more/tickets', form);
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Support ticket submitted successfully! Our team will get back to you soon.' });
        setForm({ subject: '', category: 'general', message: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to submit ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.subPageBody}>
      <div className={styles.contactHero}>
        <div className={styles.helpHeroIconWrap}>
          <img src="/contact big.png" alt="Help support" className={styles.helpHeroIconImg} />
        </div>
        <h3>We're here to help!</h3>
        <p>Our support team is available 24/7. Submit a ticket and we'll respond as soon as possible.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Subject</label>
          <input
            type="text"
            className={styles.formInput}
            required
            placeholder="Summarize your issue..."
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Category</label>
          <select className={styles.formSelect} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General Inquiry</option>
            <option value="billing">Billing & Purchases</option>
            <option value="technical">Technical Issues</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Message Details</label>
          <textarea
            rows={6}
            required
            className={styles.formTextarea}
            placeholder="Describe your issue or question in detail..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? 'Submitting...' : 'Submit Support Ticket'}
        </button>
      </form>
    </div>
  );
};

// ================= COMMUNITY GUIDELINES =================
const GuidelinesSection = () => {
  const guidelineSections = [
    {
      title: 'Be Respectful',
      desc: 'Treat everyone with kindness. Harassment, hate speech, bullying, and discrimination of any kind are not tolerated on Fantrio.',
    },
    {
      title: 'No Illegal or Non-Consensual Content',
      desc: 'Posting illegal content, non-consensual material, or content that exploits anyone is strictly prohibited and will result in immediate suspension.',
    },
    {
      title: 'Protect Your Privacy',
      desc: 'Never share personal or financial information publicly. Be cautious about what you share with others on the platform.',
    },
    {
      title: 'Respect Intellectual Property',
      desc: 'Only share content you own or have permission to use. Do not upload material that infringes on anyone\'s copyrights or trademarks.',
    },
    {
      title: 'No Scams or Spam',
      desc: 'Do not engage in fraudulent activity, phishing, or spam. Anyone caught doing so will be removed from the platform.',
    },
    {
      title: 'Report Violations',
      desc: 'See something that violates these guidelines? Use the Report Problem feature so our moderation team can review it quickly.',
    },
  ];

  return (
    <div className={styles.subPageBody}>
      <div className={styles.guidelinesHero}>
        <Heart size={30} />
        <h3>Keeping Fantrio Safe & Fun</h3>
        <p>These guidelines help us maintain a safe, welcoming community for everyone.</p>
      </div>

      <div className={styles.guidelinesGrid}>
        {guidelineSections.map((g, idx) => (
          <div key={idx} className={styles.guidelineCard}>
            <span className={styles.guidelineNumber}>{String(idx + 1).padStart(2, '0')}</span>
            <h4>{g.title}</h4>
            <p>{g.desc}</p>
          </div>
        ))}
      </div>

      <div className={styles.guidelinesFooter}>
        <AlertOctagon size={18} />
        <span>Failure to follow these guidelines may result in content removal, suspension, or account termination.</span>
      </div>
    </div>
  );
};

// ================= REPORT PROBLEM =================
const ReportSection = ({ setStatus }) => {
  const [targetType, setTargetType] = useState('creator');
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [contentRef, setContentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetType === 'creator' && creators.length === 0) {
      api.get('/creators')
        .then(res => { if (res.status === 'success') setCreators(res.creators || []); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (targetType === 'creator' && !creatorId) {
      setStatus({ type: 'error', text: 'Please select a creator to report.' });
      return;
    }
    if (targetType === 'content' && !contentRef.trim()) {
      setStatus({ type: 'error', text: 'Please provide a content reference or post ID.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/more/reports', {
        targetType,
        targetId: targetType === 'creator' ? creatorId : contentRef.trim(),
        reason,
        description,
      });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Report submitted successfully. Our safety team will review it.' });
        setReason('Inappropriate Content');
        setDescription('');
        setCreatorId('');
        setContentRef('');
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.subPageBody}>
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>What would you like to report?</label>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${targetType === 'creator' ? styles.segmentActive : ''}`}
              onClick={() => setTargetType('creator')}
            >
              <User size={15} /> Creator
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${targetType === 'content' ? styles.segmentActive : ''}`}
              onClick={() => setTargetType('content')}
            >
              <CreditCard size={15} /> Content / Post
            </button>
          </div>
        </div>

        {targetType === 'creator' ? (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Creator</label>
            <select className={styles.formSelect} value={creatorId} onChange={(e) => setCreatorId(e.target.value)}>
              <option value="">-- Choose Creator --</option>
              {creators.map(c => (
                <option key={c._id} value={c.userId || c._id}>
                  {c.displayName} (@{c.username})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Post ID / Content Reference</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Enter the post ID or describe the location of the content"
              value={contentRef}
              onChange={(e) => setContentRef(e.target.value)}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Violation Reason</label>
          <select className={styles.formSelect} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Harassment/Bullying">Harassment / Bullying</option>
            <option value="Scam/Fraud">Scam / Fraud</option>
            <option value="Impersonation">Impersonation</option>
            <option value="Copyright Infringement">Copyright Infringement</option>
            <option value="Violence/Hate Speech">Violence / Hate Speech</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description / Evidence</label>
          <textarea
            rows={4}
            className={styles.formTextarea}
            placeholder="Provide details or timestamps of the inappropriate behavior..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

const SkeletonRows = () => (
  <div className={styles.subPageBody}>
    <div className="skeleton-card" style={{ height: '60px', padding: '1rem', marginBottom: '1.5rem' }}>
      <div className="skeleton-box skeleton-title" style={{ width: '200px', height: '100%' }} />
    </div>
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="skeleton-card" style={{ padding: '1.2rem', marginBottom: '1rem', gap: '0.8rem' }}>
        <div className="skeleton-box skeleton-title" style={{ width: '150px' }} />
        <div className="skeleton-box skeleton-content-line" />
        <div className="skeleton-box skeleton-content-line short" />
      </div>
    ))}
  </div>
);
