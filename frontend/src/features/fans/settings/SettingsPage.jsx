import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronRight, 
  Settings,
  ArrowLeft,
  BookOpen,
  Headphones,
  Ticket,
  MessageSquare,
  Heart,
  Check,
  AlertTriangle
} from 'lucide-react';
import styles from './SettingsPage.module.css';

import { ProfilePage } from './ProfilePage';
import { SecurityPage } from './SecurityPage';
import { NotificationsPage } from './NotificationsPage';
import { PaymentMethodsPage } from './PaymentMethodsPage';
import { HelpCentrePage } from './HelpCentrePage';
import { SupportTicketsPage } from './SupportTicketsPage';
import { ContactSupportPage } from './ContactSupportPage';
import { CommunityGuidelinesPage } from './CommunityGuidelinesPage';
import { ReportProblemPage } from './ReportProblemPage';

export const SettingsPage = () => {
  const { darkMode, currentPath, navigateTo } = useApp();

  const getSectionFromPath = (path) => {
    if (!path) return null;
    const pathname = path.split('?')[0];
    if (pathname === '/help-centre' || pathname === '/faq' || pathname === '/settings/help-centre' || pathname === '/settings/faq') return 'help-centre';
    if (pathname === '/support-tickets' || pathname === '/settings/support-tickets' || pathname === '/settings/tickets') return 'support-tickets';
    if (pathname === '/contact-support' || pathname === '/settings/contact-support' || pathname === '/settings/contact' || pathname === '/settings/contact-support-link') return 'contact-support-link';
    if (pathname === '/community-guidelines' || pathname === '/settings/community') return 'community';
    if (pathname === '/settings/report') return 'report';
    if (pathname.startsWith('/settings/')) {
      const sub = pathname.replace('/settings/', '').split('/')[0];
      if (!sub) return null;
      if (sub === 'contact') return 'contact-support-link';
      if (sub === 'tickets') return 'support-tickets';
      if (sub === 'faq' || sub === 'help') return 'help-centre';
      return sub;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('section') || null;
  };

  const activeSection = getSectionFromPath(currentPath);

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
    navigateTo(`/settings/${id}`);
  };

  const handleNavigate = (id) => {
    const target = id === 'contact-support-link' ? 'contact' : id;
    navigateTo(`/settings/${target}`);
  };

  const handleBack = () => {
    navigateTo('/settings');
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
          <div className={styles.supportCard} onClick={() => handleNavigate('contact-support-link')}>
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

          <div className={styles.supportCard} onClick={() => handleNavigate('help-centre')}>
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
              onBack={handleBack}
              onNavigate={handleNavigate}
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
                    onClick={() => handleNavigate(link.id)}
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
              <div className={styles.supportCard} onClick={() => handleNavigate('contact-support-link')}>
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

              <div className={styles.supportCard} onClick={() => handleNavigate('help-centre')}>
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

const SubPage = ({ section, onBack, onNavigate }) => {
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
        return <ProfilePage setStatus={setStatusMsg} />;
      case 'security':
        return <SecurityPage setStatus={setStatusMsg} />;
      case 'notifications':
        return <NotificationsPage setStatus={setStatusMsg} />;
      case 'payment':
        return <PaymentMethodsPage setStatus={setStatusMsg} />;
      case 'help-centre':
        return <HelpCentrePage setStatus={setStatusMsg} onContact={() => onNavigate('contact-support-link')} />;
      case 'support-tickets':
        return <SupportTicketsPage setStatus={setStatusMsg} onContact={() => onNavigate('contact-support-link')} />;
      case 'contact-support-link':
        return <ContactSupportPage setStatus={setStatusMsg} />;
      case 'community':
        return <CommunityGuidelinesPage />;
      case 'report':
        return <ReportProblemPage setStatus={setStatusMsg} />;
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
