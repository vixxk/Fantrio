import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, MessageCircle, Landmark, ChevronDown, Plus } from 'lucide-react';
import styles from './Header.module.css';

export const Header = () => {
  const { user, balance, darkMode, setActiveTab } = useApp();

  const handleAddCoinsClick = () => {
    setActiveTab('Buy Coins');
  };

  const formattedBalance = balance.toLocaleString();

  return (
    <header className={`${styles.header} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search creators, posts, streams..." 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.rightActions}>
        <button className={styles.iconButton}>
          <div className={styles.iconWrapper}>
            <Bell size={20} />
            <span className={styles.badge}>3</span>
          </div>
        </button>

        <button className={styles.iconButton}>
          <div className={styles.iconWrapper}>
            <MessageCircle size={20} />
            <span className={styles.badge}>6</span>
          </div>
        </button>

        {/* Coins indicator */}
        <div className={styles.coinsIndicator} onClick={handleAddCoinsClick}>
          <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
          <span className={styles.coinsText}>{formattedBalance} Coins</span>
          <button className={styles.plusButton}>
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>

        {/* User Profile dropdown */}
        <div className={styles.profileDropdown}>
          <img 
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
            alt="User profile" 
            className={styles.avatar} 
          />
          <span className={styles.username}>{user?.displayName || 'Johnn'}</span>
          <ChevronDown size={16} className={styles.caret} />
        </div>
      </div>
    </header>
  );
};
