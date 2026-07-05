import React from 'react';
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
  Settings, 
  LayoutGrid, 
  LogOut, 
  Moon, 
  Sun 
} from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const { 
    balance, 
    activeTab, 
    setActiveTab, 
    darkMode, 
    setDarkMode, 
    logout,
    addCoins
  } = useApp();

  const menuItems = [
    { name: 'Discover Feed', icon: Home, badge: null },
    { name: 'All Creators', icon: Users, badge: null },
    { name: 'Live Streams', icon: Radio, badge: 'Live' },
    { name: '1:1 Audio Calls', icon: Phone, badge: null },
    { name: '1:1 Video Calls', icon: Video, badge: null },
    { name: 'My Subscription', icon: Star, badge: null },
    { name: 'Messages', icon: MessageCircle, badge: 12 },
    { name: 'Buy Coins', icon: Landmark, badge: null },
    { name: 'Settings', icon: Settings, badge: null },
    { name: 'More', icon: LayoutGrid, badge: null }
  ];

  const handleAddCoins = async () => {
    try {
      await addCoins(100);
      alert('100 mock coins successfully added!');
    } catch (e) {
      alert('Failed to add coins: ' + e.message);
    }
  };

  const formattedBalance = balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const usdValue = (balance / 100).toFixed(2);

  return (
    <aside className={`${styles.sidebar} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.logoContainer}>
        <img src="/Fantrio Logo.png" alt="Fantrio Logo" className={styles.logoIcon} />
        <span className={styles.logoText}>
          Fant<span className={styles.logoTextPink}>rio</span>
        </span>
      </div>

      <nav className={styles.navMenu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveTab(item.name)}
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
            Get <span className={styles.highlight}>20% bonus</span> on Coin Packs!
          </p>
          <img 
            src="/Gift & Coins.png" 
            alt="Gift and Coins promo" 
            className={styles.promoImage} 
          />
          <button className={styles.promoButton} onClick={handleAddCoins}>
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
              <span className={styles.balanceUsd}>(${usdValue} USD)</span>
            </div>
          </div>
          <button className={styles.addCoinsButton} onClick={handleAddCoins}>
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

        <button className={styles.logoutButton} onClick={logout}>
          <span>Logout</span>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
