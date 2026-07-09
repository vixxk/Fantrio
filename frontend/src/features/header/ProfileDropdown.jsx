import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Wallet, Star, Settings, LayoutGrid, Moon, Globe, CornerUpRight, BadgeCheck } from 'lucide-react';
import styles from './ProfileDropdown.module.css';

export const ProfileDropdown = ({ isOpen, onClose }) => {
  const { user, balance, darkMode, setDarkMode, logout, setActiveTab } = useApp();
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // If clicking on the trigger container, let its own handler toggle it
        if (!event.target.closest(`[class*="profileDropdown"]`)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (tabName) => {
    setActiveTab(tabName);
    onClose();
  };

  const handleLogoutClick = () => {
    logout();
    onClose();
  };

  return (
    <div 
      className={`${styles.dropdownContainer} ${darkMode ? '' : styles.lightTheme}`} 
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Profile Header section */}
      <div className={styles.profileHeader} onClick={() => handleItemClick('Settings')}>
        <div className={styles.avatarWrapper}>
          <img 
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
            alt="User avatar" 
            className={styles.avatar}
          />
        </div>
        <div className={styles.profileDetails}>
          <div className={styles.nameRow}>
            <span className={styles.displayName}>{user?.displayName || 'Jessica'}</span>
            {user?.role === 'creator' && <BadgeCheck className={styles.verifiedBadge} size={16} />}
          </div>
          <span className={styles.username}>@{user?.username || 'jessica_official'}</span>
          <span className={styles.viewProfile}>View My Profile</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Menu items */}
      <div className={styles.menuItems}>
        <button className={styles.menuItem} onClick={() => handleItemClick('Settings')}>
          <div className={styles.menuItemLeft}>
            <User size={18} className={styles.icon} />
            <span className={styles.label}>My Profile</span>
          </div>
          <ChevronRightIcon className={styles.chevron} />
        </button>

        <button className={styles.menuItem} onClick={() => handleItemClick('Buy Coins')}>
          <div className={styles.menuItemLeft}>
            <Wallet size={18} className={styles.icon} />
            <span className={styles.label}>My Wallet</span>
          </div>
          <div className={styles.menuItemRight}>
            <span className={styles.walletBalance}>{balance} Coins</span>
            <ChevronRightIcon className={styles.chevron} />
          </div>
        </button>

        <button className={styles.menuItem} onClick={() => handleItemClick('My Subscription')}>
          <div className={styles.menuItemLeft}>
            <Star size={18} className={styles.icon} />
            <span className={styles.label}>My Subscriptions</span>
          </div>
          <ChevronRightIcon className={styles.chevron} />
        </button>

        <div className={styles.divider} />

        <button className={styles.menuItem} onClick={() => handleItemClick('Settings')}>
          <div className={styles.menuItemLeft}>
            <Settings size={18} className={styles.icon} />
            <span className={styles.label}>Account Settings</span>
          </div>
          <ChevronRightIcon className={styles.chevron} />
        </button>

        <button className={styles.menuItem} onClick={() => handleItemClick('More')}>
          <div className={styles.menuItemLeft}>
            <LayoutGrid size={18} className={styles.icon} />
            <span className={styles.label}>More</span>
          </div>
          <ChevronRightIcon className={styles.chevron} />
        </button>

        <div className={styles.divider} />

        {/* Dark Mode toggle item */}
        <div className={styles.menuItemToggle}>
          <div className={styles.menuItemLeft}>
            <Moon size={18} className={styles.icon} />
            <span className={styles.label}>Dark Mode</span>
          </div>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={darkMode} 
              onChange={() => setDarkMode(!darkMode)} 
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <button className={styles.menuItem} onClick={() => alert('Language settings coming soon!')}>
          <div className={styles.menuItemLeft}>
            <Globe size={18} className={styles.icon} />
            <span className={styles.label}>Language</span>
          </div>
          <ChevronRightIcon className={styles.chevron} />
        </button>

        <div className={styles.divider} />

        {/* Logout item */}
        <button className={styles.logoutItem} onClick={handleLogoutClick}>
          <span className={styles.logoutLabel}>Logout</span>
          <CornerUpRight size={18} className={styles.logoutIcon} />
        </button>
      </div>
    </div>
  );
};

// Internal small ChevronRight component for styling
const ChevronRightIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    width="16" 
    height="16" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
