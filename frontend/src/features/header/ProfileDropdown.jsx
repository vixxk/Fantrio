import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/Toast/Toast';
import { User, Wallet, Star, Settings, LayoutGrid, Moon, Globe, CornerUpRight, BadgeCheck } from 'lucide-react';
import styles from './ProfileDropdown.module.css';

export const ProfileDropdown = ({ isOpen, onClose }) => {
  const { user, balance, darkMode, setDarkMode, logout, setActiveTab, navigateTo } = useApp();
  const { toast } = useToast();
  const dropdownRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    setShowLogoutConfirm(true);
  };

   const handleLogoutConfirm = () => {
     logout();
     setShowLogoutConfirm(false);
     onClose();
     navigateTo('/login');
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
            src={user?.avatarUrl && !user.avatarUrl.includes('unsplash.com') ? user.avatarUrl : '/profile.png'} 
            alt="User avatar" 
            className={styles.avatar}
          />
        </div>
        <div className={styles.profileDetails}>
          <div className={styles.nameRow}>
            <span className={styles.displayName}>{user?.displayName || user?.username || 'User'}</span>
            {user?.role === 'creator' && <BadgeCheck className={styles.verifiedBadge} size={16} />}
          </div>
          <span className={styles.username}>@{user?.username || 'user'}</span>
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

        <button className={styles.menuItem} onClick={() => toast.info('Language settings coming soon!')}>
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
                  onClick={handleLogoutConfirm}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
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
