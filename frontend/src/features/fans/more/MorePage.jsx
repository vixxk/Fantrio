import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { 
  ChevronRight, ArrowLeft, Ticket, Headphones, 
  HelpCircle, Gift, ShieldAlert, Megaphone, 
  Lightbulb, Info, CreditCard, FileText, Lock, Check, AlertTriangle,
  Scale, Share2, Award
} from 'lucide-react';
import styles from './MorePage.module.css';

import { ReferralPage } from './ReferralPage';
import { RewardsPage } from './RewardsPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { FeatureRequestsPage } from './FeatureRequestsPage';
import { AboutPage } from './AboutPage';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';
import { SupportTicketsPage } from '../settings/SupportTicketsPage';
import { ContactSupportPage } from '../settings/ContactSupportPage';
import { HelpCentrePage } from '../settings/HelpCentrePage';
import { ReportProblemPage } from '../settings/ReportProblemPage';

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

  const moreSections = [
    {
      group: 'Earning & Rewards',
      items: [
        { id: 'referral', Icon: Share2, title: 'Referral Program', desc: 'Invite friends and earn free bonus coins.', badge: 'Popular' },
        { id: 'rewards', Icon: Award, title: 'Rewards & Milestones', desc: 'Complete activities for instant coin rewards.', badge: 'Bonus' },
        { id: 'transactions', Icon: CreditCard, title: 'Transaction History', desc: 'View billing history, receipts & coin logs.' },
      ]
    },
    {
      group: 'Community & Feedback',
      items: [
        { id: 'announcements', Icon: Megaphone, title: 'Official Announcements', desc: 'Latest updates and platform feature releases.' },
        { id: 'features', Icon: Lightbulb, title: 'Feature Request Board', desc: 'Propose and vote on new platform ideas.' },
      ]
    },
    {
      group: 'Support & Safety',
      items: [
        { id: 'tickets', Icon: Ticket, title: 'Support Tickets', desc: 'Track your pending or resolved support requests.' },
        { id: 'contact', Icon: Headphones, title: 'Contact Support', desc: 'Chat or send a direct ticket to our 24/7 team.' },
        { id: 'faq', Icon: HelpCircle, title: 'Help Centre / FAQ', desc: 'Find instant answers to common questions.' },
        { id: 'report-creator', Icon: ShieldAlert, title: 'Report Creator or Content', desc: 'Report policy violations to Trust & Safety.' },
      ]
    },
    {
      group: 'Legal & Info',
      items: [
        { id: 'about', Icon: Info, title: 'About Fantrio', desc: 'Learn more about our mission and vision.' },
        { id: 'terms', Icon: Scale, title: 'Terms of Service', desc: 'Platform rules and legal guidelines.' },
        { id: 'privacy', Icon: Lock, title: 'Privacy Policy', desc: 'How we manage and protect your personal data.' },
      ]
    }
  ];

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
        return <SupportTicketsPage setStatus={setStatusMsg} onContact={() => handleNavigateSubView('contact')} />;
      case 'contact':
        return <ContactSupportPage setStatus={setStatusMsg} />;
      case 'faq':
        return <HelpCentrePage setStatus={setStatusMsg} onContact={() => handleNavigateSubView('contact')} />;
      case 'report-creator':
      case 'report-content':
        return <ReportProblemPage setStatus={setStatusMsg} />;
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

  return (
    <div className={`${styles.moreContainer} ${!darkMode ? styles.light : ''}`}>
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
          <div className={styles.mainFeed}>
            {/* Header */}
            <div className={styles.feedHeader}>
              <div className={styles.headerTitleBlock}>
                <h1 className={styles.pageTitle}>More Resources & Features</h1>
                <p className={styles.pageSubtitle}>Rewards, platform announcements, support, and legal information.</p>
              </div>
            </div>

            {/* Main Sections */}
            <div className={styles.sectionsContainer}>
              {moreSections.map((sec, idx) => (
                <div key={idx} className={styles.sectionGroup}>
                  <h3 className={styles.groupTitle}>{sec.group}</h3>
                  <div className={styles.gridRow}>
                    {sec.items.map((item) => {
                      const IconComp = item.Icon;
                      return (
                        <div
                          key={item.id}
                          className={styles.moreCard}
                          onClick={() => handleNavigateSubView(item.id)}
                        >
                          <div className={styles.cardHeader}>
                            <div className={styles.iconWrap}>
                              <IconComp size={22} />
                            </div>
                            {item.badge && <span className={styles.badgePill}>{item.badge}</span>}
                          </div>
                          <h4 className={styles.cardTitle}>{item.title}</h4>
                          <p className={styles.cardDesc}>{item.desc}</p>
                          <div className={styles.cardFooter}>
                            <span>Explore</span>
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
