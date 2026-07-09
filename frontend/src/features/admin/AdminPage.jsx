import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminCreators } from './AdminCreators';
import { AdminPosts } from './AdminPosts';
import { AdminFinance } from './AdminFinance';
import { AdminTickets } from './AdminTickets';
import { AdminChats } from './AdminChats';
import { AdminCalls } from './AdminCalls';
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
    { name: 'Users', slug: 'users', icon: Users, component: AdminUsers },
    { name: 'Creators', slug: 'creators', icon: Video, component: AdminCreators },
    { name: 'Posts', slug: 'posts', icon: Image, component: AdminPosts },
    { name: 'Finance', slug: 'finance', icon: DollarSign, component: AdminFinance },
    { name: 'Chats', slug: 'chats', icon: MessageSquare, component: AdminChats },
    { name: 'Calls & Streams', slug: 'calls', icon: PhoneCall, component: AdminCalls },
    { name: 'Support', slug: 'support', icon: LifeBuoy, component: AdminTickets }
  ];

  const getSectionFromPath = (path) => {
    const segments = path.split('/').filter(Boolean);
    return segments[1] || 'overview';
  };

  const activeSlug = getSectionFromPath(currentPath);
  const ActiveComponent = tabs.find((t) => t.slug === activeSlug)?.component || AdminOverview;

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of admin?',
      message: 'You will be returned to the user site and lose admin access until you sign back in.',
      confirmText: 'Log Out',
      cancelText: 'Stay',
      variant: 'logout'
    });
    if (!ok) return;
    await logout();
    navigateTo('/discover');
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

        <div className={styles.actionGroup}>
          <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={handleLogout}>
            <LogOut size={16} />
            <span className={styles.btnLabel}>Logout</span>
          </button>
        </div>
      </header>

      {/* Grid Content Layout */}
      <div className={styles.mainGrid}>

        {/* Desktop Sidebar Navigation */}
        <aside className={styles.navSidebar}>
          <div className={styles.navLabel}>Management</div>
          {tabs.slice(0, 7).map((tab) => renderNavItem(tab))}
          <div className={styles.navLabel}>Engagement</div>
          {tabs.slice(7).map((tab) => renderNavItem(tab))}
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
