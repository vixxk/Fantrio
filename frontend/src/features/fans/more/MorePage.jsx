import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronRight, ArrowLeft, Ticket, Headphones, 
  HelpCircle, Gift, ShieldAlert, Megaphone, 
  Lightbulb, Info, CreditCard, Lock, Check, AlertTriangle,
  Scale, LayoutGrid, User, UserPlus, Trophy, Plus
} from 'lucide-react';
import styles from './MorePage.module.css';
// The sub-view components (tickets/contact/faq/report) are styled by
// SettingsPage.module.css, so their light-theme overrides need that module's
// hashed `.light` class applied too — otherwise they keep dark styles on light mode.
import settingsStyles from '../settings/SettingsPage.module.css';

import { ReferralPage } from './ReferralPage';
import { RewardsPage } from './RewardsPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { FeatureRequestsPage } from './FeatureRequestsPage';
import { AboutPage } from './AboutPage';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';
import { ContactSupportPage } from '../settings/ContactSupportPage';
import { HelpCentrePage } from '../settings/HelpCentrePage';
import { ReportProblemPage } from '../settings/ReportProblemPage';
import { MyIssuesPage } from '../settings/MyIssuesPage';

export const MorePage = () => {
  const { darkMode, setActiveTab, currentPath, navigateTo } = useApp();

  const getSubViewFromPath = (path) => {
    if (!path) return null;
    const pathname = path.split('?')[0];
    if (pathname === '/support-tickets' || pathname === '/tickets') return 'tickets';
    if (pathname === '/contact-support' || pathname === '/contact') return 'contact';
    if (pathname === '/faq' || pathname === '/help-centre') return 'faq';
    if (pathname.startsWith('/more/')) {
      const sub = pathname.replace('/more/', '').split('/')[0];
      if (!sub) return null;
      if (sub === 'support-tickets') return 'tickets';
      if (sub === 'contact-support') return 'contact';
      if (sub === 'help-centre') return 'faq';
      return sub;
    }
    return null;
  };

  const subView = getSubViewFromPath(currentPath);

  const handleNavigateSubView = (sub) => {
    if (sub === 'transactions') {
      setActiveTab('Transaction History');
    } else if (sub === 'buy-coins') {
      setActiveTab('Buy Coins');
    } else {
      navigateTo(`/more/${sub}`);
    }
  };

  const handleBack = () => {
    navigateTo('/more');
  };

  // Status messages
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const clearStatus = () => setStatusMsg({ type: '', text: '' });

  const leftColumn = [
    {
      group: 'Contact Support',
      icon: Headphones,
      items: [
        { id: 'tickets', Icon: Ticket, title: 'Support Tickets', desc: 'View and track your support requests.' },
        { id: 'contact', Icon: Headphones, title: 'Contact Support', desc: 'Get help from our support team.' },
        { id: 'faq', Icon: HelpCircle, title: 'Help Centre / FAQ', desc: 'Browse articles and find answers.' },
      ]
    },
    {
      group: 'Safety & Reporting',
      icon: ShieldAlert,
      items: [
        { id: 'report-creator', Icon: User, title: 'Report A Creator', desc: 'Report an inappropriate creator.' },
        { id: 'report-content', Icon: AlertTriangle, title: 'Report Content', desc: 'Report inappropriate creator content.' },
      ]
    },
    {
      group: 'Legal & Policies',
      icon: Scale,
      items: [
        { id: 'terms', Icon: Scale, title: 'Terms of Service', desc: 'Read our terms and conditions.' },
        { id: 'privacy', Icon: Lock, title: 'Privacy Policy', desc: 'Learn how we protect your data.' },
      ]
    }
  ];

  const rightColumn = [
    {
      group: 'Community & Rewards',
      icon: Trophy,
      items: [
        { id: 'referral', Icon: UserPlus, title: 'Referral Program', desc: 'Invite friends and earn rewards.' },
        { id: 'rewards', Icon: Gift, title: 'Rewards Program', desc: 'Check your rewards and benefits.' },
      ]
    },
    {
      group: 'Billing & Transactions',
      icon: CreditCard,
      items: [
        { id: 'transactions', Icon: CreditCard, title: 'Transaction History', desc: 'View your coin purchases and transactions.' },
      ]
    },
    {
      group: 'Platform',
      icon: LayoutGrid,
      items: [
        { id: 'announcements', Icon: Megaphone, title: 'Announcements', desc: 'Latest updates and news.' },
        { id: 'features', Icon: Lightbulb, title: 'Feature Requests', desc: 'Suggest new features.' },
        { id: 'about', Icon: Info, title: 'About Fantrio', desc: 'Learn more about Fantrio.' },
      ]
    }
  ];

  const renderSubViewContent = () => {
    switch (subView) {
      case 'referral':
        return <ReferralPage setStatusMsg={setStatusMsg} />;
      case 'rewards':
        return <RewardsPage setStatusMsg={setStatusMsg} />;
      case 'announcements':
        return <AnnouncementsPage setStatusMsg={setStatusMsg} />;
      case 'features':
        return <FeatureRequestsPage setStatusMsg={setStatusMsg} />;
      case 'tickets':
      case 'my-issues':
      case 'issues':
        return <MyIssuesPage setStatus={setStatusMsg} onNavigate={(path) => navigateTo(`/settings/${path}`)} />;
      case 'contact':
        return <ContactSupportPage setStatus={setStatusMsg} />;
      case 'faq':
        return <HelpCentrePage setStatus={setStatusMsg} onContact={() => handleNavigateSubView('contact')} />;
      case 'report-creator':
      case 'report-content':
        return <ReportProblemPage setStatus={setStatusMsg} initialTargetType={subView === 'report-content' ? 'content' : 'creator'} />;
      case 'about':
        return <AboutPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      default:
        return null;
    }
  };

  const getSubViewTitle = (key) => {
    switch (key) {
      case 'referral': return { title: 'Referral Program', desc: 'Invite friends and earn bonus coins together.' };
      case 'rewards': return { title: 'Rewards & Milestones', desc: 'Track your community activity rewards.' };
      case 'announcements': return { title: 'Announcements', desc: 'Official platform news and updates.' };
      case 'features': return { title: 'Feature Requests', desc: 'Vote and suggest platform enhancements.' };
      case 'tickets': return { title: 'Support Tickets', desc: 'View your support ticket status.' };
      case 'contact': return { title: 'Contact Support Desk', desc: 'Direct access to our 24/7 help desk.' };
      case 'faq': return { title: 'Help Centre & FAQ', desc: 'Instant solutions to common inquiries.' };
      case 'report-creator': return { title: 'Report Problem', desc: 'Report safety concerns or violations.' };
      case 'report-content': return { title: 'Report Content', desc: 'Report specific media or posts.' };
      case 'about': return { title: 'About Fantrio', desc: 'Empowering creator-fan connections.' };
      case 'terms': return { title: 'Terms of Service', desc: 'Legal terms and usage policies.' };
      case 'privacy': return { title: 'Privacy Policy', desc: 'Data privacy and security practices.' };
      default: return { title: 'More Options', desc: 'Explore extra settings and resources.' };
    }
  };

  return (
    <div className={`${styles.moreContainer} ${!darkMode ? `${styles.light} ${settingsStyles.light}` : ''}`}>
      {/* SVG Gradient Definition for Icons */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="more-page-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.moreShell}>
        {subView ? (
          <div className={styles.subPageContainer}>
            <div className={styles.subPageHeader}>
              <button className={styles.backBtn} onClick={handleBack}>
                <ArrowLeft size={22} />
              </button>
              <div className={styles.subPageTitleBlock}>
                <h2 className={styles.subPageTitle}>{getSubViewTitle(subView).title}</h2>
                <p className={styles.subPageDesc}>{getSubViewTitle(subView).desc}</p>
              </div>
              {(subView === 'my-issues' || subView === 'tickets' || subView === 'issues') && (
                <div className={styles.issueHeaderActions}>
                  <button className={styles.actionBtn} onClick={() => navigateTo('/settings/contact')}>
                    <Plus size={15} /> New Ticket
                  </button>
                  <button className={styles.actionBtnOutline} onClick={() => navigateTo('/settings/report')}>
                    <ShieldAlert size={15} /> Report Problem
                  </button>
                </div>
              )}
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

            {renderSubViewContent()}
          </div>
        ) : (
          <div className={styles.mainLayout}>
            {/* Left & Center Main Feed */}
            <div className={styles.centerFeed}>
              {/* Header */}
              <div className={styles.feedHeader}>
                <div className={styles.headerTitleBlock}>
                  <div className={styles.titleRow}>
                    <LayoutGrid size={32} className={styles.headerIcon} style={{ stroke: 'url(#more-page-gradient)' }} />
                    <h1 className={styles.pageTitle}>More</h1>
                  </div>
                  <p className={styles.pageSubtitle}>All the important links and Information in one place.</p>
                </div>
              </div>

              {/* 2-Column Dashboard Grid */}
              <div className={styles.dashboardGrid}>
                {/* Column 1 */}
                <div className={styles.dashboardColumn}>
                  {leftColumn.map((sec, idx) => {
                    const GroupIcon = sec.icon;
                    return (
                      <div key={idx} className={styles.categorySection}>
                        <div className={styles.sectionHeader}>
                          <GroupIcon size={22} className={styles.sectionIcon} style={{ stroke: 'url(#more-page-gradient)' }} />
                          <h3>{sec.group}</h3>
                        </div>
                        <div className={styles.sectionCards}>
                          {sec.items.map((item) => {
                            const ItemIcon = item.Icon;
                            return (
                              <div
                                key={item.id}
                                className={styles.menuCard}
                                onClick={() => handleNavigateSubView(item.id)}
                              >
                                <div className={styles.cardLeft}>
                                  <ItemIcon size={20} className={styles.cardIcon} />
                                  <div className={styles.cardText}>
                                    <h4 className={styles.cardTitle}>{item.title}</h4>
                                    <p className={styles.cardDesc}>{item.desc}</p>
                                  </div>
                                </div>
                                <ChevronRight size={17} className={styles.chevron} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column 2 */}
                <div className={styles.dashboardColumn}>
                  {rightColumn.map((sec, idx) => {
                    const GroupIcon = sec.icon;
                    return (
                      <div key={idx} className={styles.categorySection}>
                        <div className={styles.sectionHeader}>
                          <GroupIcon size={22} className={styles.sectionIcon} style={{ stroke: 'url(#more-page-gradient)' }} />
                          <h3>{sec.group}</h3>
                        </div>
                        <div className={styles.sectionCards}>
                          {sec.items.map((item) => {
                            const ItemIcon = item.Icon;
                            return (
                              <div
                                key={item.id}
                                className={styles.menuCard}
                                onClick={() => handleNavigateSubView(item.id)}
                              >
                                <div className={styles.cardLeft}>
                                  <ItemIcon size={20} className={styles.cardIcon} />
                                  <div className={styles.cardText}>
                                    <h4 className={styles.cardTitle}>{item.title}</h4>
                                    <p className={styles.cardDesc}>{item.desc}</p>
                                  </div>
                                </div>
                                <ChevronRight size={17} className={styles.chevron} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className={styles.rightSidebar}>
              {/* Promo Card */}
              <div className={styles.promoCard}>
                <div className={styles.promoHeaderRow}>
                  <div className={styles.promoTitleArea}>
                    <span className={styles.promoLabel}>Get More With</span>
                    <span className={styles.promoTitle}>Fantrio Coins</span>
                  </div>
                  <img src="/Gift & Coins.png" alt="Coins Offer" className={styles.promoImage} />
                </div>
                <p className={styles.promoDesc}>
                  Unlock exclusive content, tip your favourite creator and enjoy premium features.
                </p>
                <button
                  className={styles.buyCoinsBtn}
                  onClick={() => handleNavigateSubView('buy-coins')}
                >
                  Buy Coins
                </button>
              </div>

              {/* Need Help Card */}
              <div className={styles.helpCard}>
                <div className={styles.helpHeaderRow}>
                  <h3 className={styles.helpTitle}>Need Help?</h3>
                  <Headphones size={42} className={styles.helpHeaderIcon} style={{ stroke: 'url(#more-page-gradient)' }} />
                </div>
                <p className={styles.helpDesc}>
                  Our support team is available 24/7 to assist you with any questions or issues.
                </p>
                <div className={styles.miniMenuList}>
                  <div className={styles.miniMenuItem} onClick={() => handleNavigateSubView('contact')}>
                    <div className={styles.miniItemLeft}>
                      <Headphones size={17} className={styles.miniIconPink} style={{ stroke: 'url(#more-page-gradient)' }} />
                      <span>Contact Support</span>
                    </div>
                    <div className={styles.miniItemRight}>
                      <span>We're here to help</span>
                      <ChevronRight size={15} />
                    </div>
                  </div>

                  <div className={styles.miniMenuItem} onClick={() => handleNavigateSubView('faq')}>
                    <div className={styles.miniItemLeft}>
                      <HelpCircle size={17} className={styles.miniIconPink} style={{ stroke: 'url(#more-page-gradient)' }} />
                      <span>Help Centre / FAQ</span>
                    </div>
                    <div className={styles.miniItemRight}>
                      <span>Find Answer Fast</span>
                      <ChevronRight size={15} />
                    </div>
                  </div>

                  <div className={styles.miniMenuItem} onClick={() => handleNavigateSubView('tickets')}>
                    <div className={styles.miniItemLeft}>
                      <Ticket size={17} className={styles.miniIconPink} style={{ stroke: 'url(#more-page-gradient)' }} />
                      <span>Support Tickets</span>
                    </div>
                    <div className={styles.miniItemRight}>
                      <span>Track Your Requests.</span>
                      <ChevronRight size={15} />
                    </div>
                  </div>
                </div>

                <div className={styles.helpFooter}>
                  <span className={styles.footerLabel}>Average Response Time</span>
                  <span className={styles.footerStatus}>
                    <span className={styles.greenDot}>•</span> Within 24 Hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
