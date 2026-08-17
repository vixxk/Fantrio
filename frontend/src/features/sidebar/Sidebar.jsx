import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Users,
  Radio,
  Phone,
  Video,
  Star,
  MessageCircle,
  Landmark,
  History,
  Settings,
  LayoutGrid,
  Menu,
  LayoutDashboard
} from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar = ({ onClose }) => {
  const { 
    user,
    balance, 
    activeTab, 
    setActiveTab, 
    darkMode, 
    setDarkMode, 
    logout,
    navigateTo,
    unreadConversations
  } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { name: 'Discover Feed', icon: Home, badge: null },
    { name: 'All Creators', icon: Users, badge: null },
    { name: 'Live Streams', icon: Radio, badge: 'Live' },
    { name: '1:1 Audio Calls', icon: Phone, badge: null },
    { name: '1:1 Video Calls', icon: Video, badge: null },
    { name: 'My Subscription', icon: Star, badge: null },
    { name: 'Messages', icon: MessageCircle, badge: unreadConversations },
    { name: 'Buy Coins', icon: Landmark, badge: null },
    { name: 'Transaction History', icon: History, badge: null },
    { name: 'Settings', icon: Settings, badge: null },
    { name: 'More', icon: LayoutGrid, badge: null }
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ name: 'Admin Panel', icon: LayoutDashboard, badge: 'Admin' });
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const formattedBalance = balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <aside className={`${styles.sidebar} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.logoContainer}>
        <div className={styles.logoInfo} onClick={() => { setActiveTab('Discover Feed'); if (onClose) onClose(); }}>
          <img src="/Fantrio Logo.png" alt="Fantrio Logo" className={styles.logoIcon} />
          <span className={styles.logoText}>
            Fant<span className={styles.logoTextPink}>rio</span>
          </span>
        </div>
        {onClose && (
          <button className={styles.closeMenuBtn} onClick={onClose}>
            <Menu size={20} />
          </button>
        )}
      </div>

      <nav className={styles.navMenu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          
          if (item.href) {
            return (
              <a
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''} ${styles.creatorLink}`}
                onClick={() => { if (onClose) onClose(); }}
              >
                <div className={styles.navItemLeft}>
                  <Icon size={20} className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.name}</span>
                </div>
                {item.badge && (
                  <span 
                    className={
                      item.badge === 'Live' 
                        ? styles.liveBadge 
                        : item.badge === 'New'
                        ? styles.newBadge
                        : styles.countBadge
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            );
          }
          
          return (
            <button
              key={item.name}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => { setActiveTab(item.name); if (onClose) onClose(); }}
            >
              <div className={styles.navItemLeft}>
                {item.name === 'Buy Coins' ? (
                  <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
                ) : (
                  <Icon size={20} className={styles.navIcon} />
                )}
                <span className={styles.navLabel}>{item.name}</span>
              </div>
              {item.badge && (
                <span 
                  className={
                    item.badge === 'Live' 
                      ? styles.liveBadge 
                      : styles.countBadge
                  }
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={styles.promotions}>
        {/* Bonus box */}
        <div className={styles.promoCard}>
          <p className={styles.promoText}>
            Get <span className={styles.highlight}>20% bonus</span><br />on Coin Packs!
          </p>
          <img 
            src="/Gift & Coins.png" 
            alt="Gift and Coins promo" 
            className={styles.promoImage} 
          />
          <button className={styles.promoButton} onClick={() => setActiveTab('Buy Coins')}>
            Buy Coins Now
          </button>
        </div>

        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <p className={styles.balanceLabel}>Your Balance</p>
          <div className={styles.balanceValueContainer}>
            <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
            <div className={styles.balanceInfo}>
              <span className={styles.balanceAmount}>{formattedBalance} Coins</span>
            </div>
          </div>
          <button className={styles.addCoinsButton} onClick={() => setActiveTab('Buy Coins')}>
            Add Coins
          </button>
        </div>
      </div>

      <div className={styles.footerActions}>
        <div className={styles.themeToggleContainer}>
          <span className={styles.themeLabel}>Dark Mode</span>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={() => setDarkMode(!darkMode)} 
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          <span>Logout</span>
          <img src="/arrow.png" alt="Logout" className={styles.logoutIcon} />
        </button>

      {showLogoutConfirm && (
        <div className={styles.logoutConfirmOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.logoutConfirmDialog} onClick={e => e.stopPropagation()}>
            <h3 className={styles.logoutConfirmTitle}>Confirm Logout</h3>
            <p className={styles.logoutConfirmText}>Are you sure you want to logout from Fantrio?</p>
            <div className={styles.logoutConfirmActions}>
              <button 
                className={styles.logoutCancelBtn} 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
               <button 
                 className={styles.logoutConfirmBtn} 
                 onClick={() => {
                   setShowLogoutConfirm(false);
                   logout();
                   navigateTo('/login');
                 }}
               >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </aside>
  );
};
