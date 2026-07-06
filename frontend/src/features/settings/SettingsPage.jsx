import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronRight, 
  Settings,
  HelpCircle,
  BookOpen,
  Headphones,
  Ticket,
  MessageSquare,
  Heart,
  AlertOctagon
} from 'lucide-react';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
  const { darkMode } = useApp();
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
    alert(`Opening ${id} settings...`);
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
            <div className={styles.supportCard} onClick={() => alert('Opening support...')}>
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

            <div className={styles.supportCard} onClick={() => alert('Opening FAQ...')}>
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

        {/* ================= RIGHT SIDEBAR ================= */}
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
                  onClick={() => alert(`Opening ${link.title}...`)}
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
            <div className={styles.supportCard} onClick={() => alert('Opening support...')}>
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

            <div className={styles.supportCard} onClick={() => alert('Opening FAQ...')}>
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

      </div>
    </div>
  );
};
