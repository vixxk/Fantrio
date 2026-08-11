import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminCreators } from './AdminCreators';
import { AdminPosts } from './AdminPosts';
import { AdminFinance } from './AdminFinance';
import { AdminPromoCodes } from './AdminPromoCodes';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminFeatures } from './AdminFeatures';
import { AdminTickets } from './AdminTickets';
import { AdminChats } from './AdminChats';
import { AdminCalls } from './AdminCalls';
import { AdminLiveStreams } from './AdminLiveStreams';
import { AdminUIProvider, useAdminUI } from './AdminUI';
import {
  BarChart,
  Users,
  Video,
  Image,
  DollarSign,
  LifeBuoy,
  MessageSquare,
  PhoneCall,
  Radio,
  BadgePercent,
  Megaphone,
  Lightbulb,
  Menu,
  LogOut
} from 'lucide-react';
import styles from './AdminPage.module.css';

export const AdminPage = () => {
  return (
    <AdminUIProvider>
      <AdminShell />
    </AdminUIProvider>
  );
};

const AdminShell = () => {
  const { darkMode, navigateTo, logout, currentPath } = useApp();
  const { confirm } = useAdminUI();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const tabs = [
    { name: 'Overview', slug: 'overview', icon: BarChart, component: AdminOverview },
    { name: 'Fans', slug: 'users', icon: Users, component: AdminUsers },
    { name: 'Creators', slug: 'creators', icon: Video, component: AdminCreators },
    { name: 'Posts', slug: 'posts', icon: Image, component: AdminPosts },
    { name: 'Finance', slug: 'finance', icon: DollarSign, component: AdminFinance },
    { name: 'Promo Codes', slug: 'promo-codes', icon: BadgePercent, component: AdminPromoCodes },
    { name: 'Announcements', slug: 'announcements', icon: Megaphone, component: AdminAnnouncements },
    { name: 'Feature Requests', slug: 'features', icon: Lightbulb, component: AdminFeatures },
    { name: 'Chats', slug: 'chats', icon: MessageSquare, component: AdminChats },
    { name: 'Calls', slug: 'calls', icon: PhoneCall, component: AdminCalls },
    { name: 'Live Streams', slug: 'streams', icon: Radio, component: AdminLiveStreams },
    { name: 'Support', slug: 'support', icon: LifeBuoy, component: AdminTickets }
  ];

  const getSectionFromPath = (path) => {
    const segments = path.split('/').filter(Boolean);
    return segments[1] || 'overview';
  };

  const activeSlug = getSectionFromPath(currentPath);
  const activeTab = tabs.find((t) => t.slug === activeSlug);
  const ActiveComponent = activeTab?.component || AdminOverview;

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of admin?',
      message: 'You will be returned to the main site and lose admin access until you sign back in.',
      confirmText: 'Log Out',
      cancelText: 'Stay',
      variant: 'logout'
    });
     if (!ok) return;
     await logout();
     navigateTo('/login');
  };

  const goToSection = (slug) => {
    navigateTo(`/admin/${slug}`);
    setShowMobileMenu(false);
  };

  const renderNavItem = (tab) => {
    const Icon = tab.icon;
    const isActive = activeSlug === tab.slug;
    return (
      <button
        key={tab.slug}
        className={`${styles.navButton} ${isActive ? styles.activeNavButton : ''}`}
        onClick={() => goToSection(tab.slug)}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={18} />
        <span>{tab.name}</span>
      </button>
    );
  };

  const renderLogout = () => (
    <button className={`${styles.navButton} ${styles.navLogout}`} onClick={handleLogout} aria-label="Log out of admin">
      <LogOut size={18} />
      <span>Logout</span>
    </button>
  );

  return (
    <div className={`${styles.adminWrapper} ${!darkMode ? styles.light : ''}`}>

      {/* Top Header Bar */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <button
            className={styles.menuToggle}
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className={styles.logoMark}>
            <img src="/favicon-v4.png" alt="Fantrio" className={styles.logoImg} />
          </div>
          <span className={styles.brandName}>Fantrio <span>Admin</span></span>
        </div>
        <h2 className={styles.headerPageTitle}>{activeTab?.name || 'Overview'}</h2>
      </header>

      {/* Grid Content Layout */}
      <div className={styles.mainGrid}>

        {/* Desktop Sidebar Navigation */}
        <aside className={styles.navSidebar}>
          <div className={styles.navLabel}>Management</div>
          {tabs.slice(0, 8).map((tab) => renderNavItem(tab))}
          <div className={styles.navLabel}>Engagement</div>
          {tabs.slice(8).map((tab) => renderNavItem(tab))}
          {renderLogout()}
        </aside>

        {/* Mobile Navigation Drawer */}
        {showMobileMenu && (
          <>
            <div className={styles.mobileBackdrop} onClick={() => setShowMobileMenu(false)} />
            <div className={styles.mobileNavDrawer}>
              <div className={styles.drawerHead}>
                <div className={styles.drawerBrand}>
                  <img src="/favicon-v4.png" alt="Fantrio" className={styles.drawerLogo} />
                  <span className={styles.brandName}>Fantrio Admin</span>
                </div>
                <button className={styles.drawerClose} onClick={() => setShowMobileMenu(false)} aria-label="Close navigation">
                  <Menu size={18} />
                </button>
              </div>
              {tabs.map((tab) => renderNavItem(tab))}
              {renderLogout()}
            </div>
          </>
        )}

        {/* Panel Main Window */}
        <main className={styles.contentArea}>
          <ActiveComponent />
        </main>

      </div>
    </div>
  );
};

export default AdminPage;
