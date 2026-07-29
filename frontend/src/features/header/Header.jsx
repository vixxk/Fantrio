import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, MessageCircle, Plus, Menu, ChevronDown, HelpCircle } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import styles from './Header.module.css';

export const Header = ({ onMenuToggle }) => {
  const { user, balance, darkMode, activeTab, setActiveTab } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAddCoinsClick = (e) => {
    e.stopPropagation();
    setActiveTab('Buy Coins');
  };

  const isCreatorPage = activeTab.startsWith('Creator');
  const formattedBalance = balance.toLocaleString();

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'Creator Live Calls':
        return {
          title: "Live Calls Overview",
          subtitle: "Manage your audio calls and video calls, track performance, and maximize your earnings."
        };
      case 'Creator Analytics':
        return {
          title: "Analytics",
          subtitle: "Track your performance, engagement metrics, and revenue insights."
        };
      case 'Creator Dashboard':
        return {
          title: "Welcome Back! Bella 👋",
          subtitle: "Here's what's happening with your account today."
        };
      case 'Creator Audio Calls':
        return {
          title: "Audio Call Management",
          subtitle: "Manage your audio call settings, view call history, and track performance."
        };
      case 'Creator Video Calls':
        return {
          title: "Video Call Management",
          subtitle: "Manage your video calls and grow your earnings."
        };
      case 'Creator Content':
        return {
          title: "Content",
          subtitle: "Manage your posts, videos, and stories. Track performance and engage with your audience."
        };
      case 'Creator PPV Content':
        return {
          title: "PPV Content",
          subtitle: "Manage your locked content and pay-per-view pricing."
        };
      case 'Creator Subscribers':
        return {
          title: "Subscribers",
          subtitle: "Manage your subscribers, view analytics, and track subscription growth."
        };
      case 'Creator Live Streams':
        return {
          title: "Live Streams",
          subtitle: "Start, schedule, and manage your live streaming sessions."
        };
      case 'Creator Earnings':
        return {
          title: "Earnings",
          subtitle: "Track your revenue, payouts, and financial performance."
        };
      case 'Creator Store':
        return {
          title: "Store",
          subtitle: "Set up and manage your merchandise and digital products."
        };
      case 'Creator Settings':
        return {
          title: "Settings",
          subtitle: "Configure your account, notifications, and creator preferences."
        };
      case 'Creator Profile':
        return {
          title: "Profile Settings",
          subtitle: "Here's your public profile as your fans see it."
        };
      case 'Creator Messages':
        return {
          title: "Messages",
          subtitle: "Manage your creator inbox and engage with your community."
        };
      case 'Discover Feed':
        return {
          title: "Discover",
          subtitle: "Explore creators, trending content, and live streams."
        };
      case 'All Creators':
        return {
          title: "All Creators",
          subtitle: "Browse and discover talented creators."
        };
      case 'Live Streams':
        return {
          title: "Live Streams",
          subtitle: "Watch live broadcasts and connect with creators in real time."
        };
      case '1:1 Audio Calls':
        return {
          title: "Audio Calls",
          subtitle: "Connect with creators through private audio calls."
        };
      case '1:1 Video Calls':
        return {
          title: "Video Calls",
          subtitle: "Connect face-to-face through private video calls."
        };
      case 'My Subscription':
        return {
          title: "My Subscriptions",
          subtitle: "Manage your subscriptions and exclusive content."
        };
      case 'Messages':
        return {
          title: "Messages",
          subtitle: "Your private conversations and notifications."
        };
      case 'Buy Coins':
        return {
          title: "Buy Coins",
          subtitle: "Purchase coins to support your favorite creators."
        };
      case 'Settings':
        return {
          title: "Settings",
          subtitle: "Manage your account, privacy, and preferences."
        };
      case 'More':
        return {
          title: "More",
          subtitle: "Additional features and resources."
        };
      case 'Admin Panel':
        return {
          title: "Admin Panel",
          subtitle: "Manage the platform, users, and content."
        };
      default:
        return {
          title: "Welcome Back! Bella 👋",
          subtitle: "Here's what's happening with your account today."
        };
    }
  };

  const { title, subtitle } = getHeaderMeta();
  const avatarUrl = isCreatorPage 
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' 
    : (user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');
  const displayName = isCreatorPage ? 'Bella Rose' : (user?.displayName || 'Johnn');

  return (
    <header className={`${styles.header} ${darkMode ? styles.dark : styles.light} ${isCreatorPage ? styles.creatorHeader : ''}`}>
      {onMenuToggle && (
        <button className={styles.mobileMenuToggle} onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
      )}

      {isCreatorPage ? (
        <div className={styles.creatorHeaderTitleArea}>
          <h1 className={styles.creatorHeaderTitle}>{title}</h1>
          <p className={styles.creatorHeaderSubtitle}>{subtitle}</p>
        </div>
      ) : (
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search creators, posts, streams..." 
            className={styles.searchInput}
          />
        </div>
      )}

      <div className={styles.rightActions}>
        {isCreatorPage && (
          <button className={styles.helpCenterBtn} onClick={() => alert('Help Center coming soon!')}>
            <HelpCircle size={18} />
            <span>HelpCentre</span>
          </button>
        )}

        <button className={styles.iconButton}>
          <div className={styles.iconWrapper}>
            <Bell size={20} />
            <span className={styles.badge}>3</span>
          </div>
        </button>

        {!isCreatorPage && (
          <button className={styles.iconButton}>
            <div className={styles.iconWrapper}>
              <MessageCircle size={20} />
              <span className={styles.badge}>6</span>
            </div>
          </button>
        )}

        {/* Coins indicator */}
        {!isCreatorPage && (
          <div className={styles.coinsIndicator} onClick={handleAddCoinsClick}>
            <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
            <span className={styles.coinsText}>{formattedBalance}</span>
            <button className={styles.plusButton}>
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* User Profile dropdown */}
        <div 
          className={`${styles.profileDropdown} ${isCreatorPage ? styles.creatorProfileDropdown : ''}`} 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img 
            src={avatarUrl} 
            alt="User profile" 
            className={styles.avatar} 
          />
          {isCreatorPage ? (
            <div className={styles.profileMeta}>
              <span className={styles.profileName}>{displayName}</span>
              <span className={styles.profileRole}>Creator</span>
            </div>
          ) : (
            <span className={styles.username}>{displayName}</span>
          )}
          <ChevronDown 
            size={16} 
            className={`${styles.caret} ${dropdownOpen ? styles.rotated : ''}`} 
          />
          
          <ProfileDropdown isOpen={dropdownOpen} onClose={() => setDropdownOpen(false)} />
        </div>
      </div>
    </header>
  );
};
