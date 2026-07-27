import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  MessageSquare, 
  FileText, 
  Users, 
  Film, 
  Phone, 
  Video, 
  DollarSign, 
  BarChart3, 
  ShoppingBag, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  BadgeCheck,
  Menu,
  Mic,
  Camera,
} from 'lucide-react';
import styles from './CreatorSidebar.module.css';

export const CreatorSidebar = ({ onClose }) => {
  const { 
    activeTab, 
    setActiveTab, 
    darkMode,
    setDarkMode
  } = useApp();

  const [liveCallsExpanded, setLiveCallsExpanded] = useState(true);

  // Automatically expand Live Calls if we are on the overview or call pages
  useEffect(() => {
    if (
      activeTab === 'Creator Live Calls' ||
      activeTab === 'Creator Audio Calls' ||
      activeTab === 'Creator Video Calls'
    ) {
      setLiveCallsExpanded(true);
    }
  }, [activeTab]);

  const menuItems = [
    { name: 'Creator Dashboard', label: 'Dashboard', icon: Home, tab: 'Creator Dashboard' },
    { name: 'Creator Messages', label: 'Messages', icon: MessageSquare, tab: 'Creator Messages', badge: 24 },
    { name: 'Creator Content', label: 'Content', icon: FileText, tab: 'Creator Content' },
    { name: 'Creator Subscribers', label: 'Subscribers', icon: Users, tab: 'Creator Subscribers' },
    { name: 'Creator PPV Content', label: 'PPV Content', icon: Film, tab: 'Creator PPV Content' },
    { 
      name: 'Live Calls Group', 
      label: 'Live Calls', 
      icon: Phone, 
      isGroup: true,
      subItems: [
        { name: 'Creator Audio Calls', label: 'Audio Calls', tab: 'Creator Audio Calls', icon: Mic },
        { name: 'Creator Video Calls', label: 'Video Calls', tab: 'Creator Video Calls', icon: Camera }
      ]
    },
    { name: 'Creator Live Streams', label: 'Live Streams', icon: Video, tab: 'Creator Live Streams' },
    { name: 'Creator Earnings', label: 'Earnings', icon: DollarSign, tab: 'Creator Earnings' },
    { name: 'Creator Analytics', label: 'Analytics', icon: BarChart3, tab: 'Creator Analytics' },
    { name: 'Creator Store', label: 'Store', icon: ShoppingBag, tab: 'Creator Store' },
    { name: 'Creator Settings', label: 'Settings', icon: Settings, tab: 'Creator Settings' }
  ];

  const handleItemClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const isLiveCallsActive =
    activeTab === 'Creator Live Calls' ||
    activeTab === 'Creator Audio Calls' ||
    activeTab === 'Creator Video Calls';

  return (
    <aside className={`${styles.sidebar} ${darkMode ? styles.dark : styles.light}`}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoInfo} onClick={() => handleItemClick('Creator Analytics')}>
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

      {/* Navigation Menu */}
      <nav className={styles.navMenu}>
        {menuItems.map((item) => {
          if (item.isGroup) {
            const GroupIcon = item.icon;
            return (
              <div key={item.label} className={styles.groupContainer}>
                <button
                  className={`${styles.navItem} ${isLiveCallsActive ? styles.groupActive : ''}`}
                  onClick={() => setLiveCallsExpanded(!liveCallsExpanded)}
                >
                  <div className={styles.navItemLeft}>
                    <GroupIcon size={20} className={styles.navIcon} />
                    <span className={styles.navLabel}>{item.label}</span>
                  </div>
                  {liveCallsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {liveCallsExpanded && (
                  <div className={styles.subItemsContainer}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = activeTab === subItem.tab;
                      const SubIcon = subItem.icon;
                      return (
                        <button
                          key={subItem.tab}
                          className={`${styles.subNavItem} ${isSubActive ? styles.subActive : ''}`}
                          onClick={() => handleItemClick(subItem.tab)}
                        >
                          <SubIcon size={16} className={styles.subNavIcon} />
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => handleItemClick(item.tab)}
            >
              <div className={styles.navItemLeft}>
                <Icon size={20} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </div>
              {item.badge && (
                <span className={styles.countBadge}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Card Footer */}
      <div className={styles.sidebarFooter}>
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
        <div className={styles.creatorProfile}>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Bella Rose"
            className={styles.creatorAvatar}
          />
          <div className={styles.creatorInfo}>
            <div className={styles.creatorNameRow}>
              <span className={styles.creatorName}>Bella Rose</span>
              <BadgeCheck size={16} className={styles.verifiedBadge} />
            </div>
            <span className={styles.creatorHandle}>@bellarose_official</span>
            <div className={styles.onlineStatus}>
              <span className={styles.onlineDot} />
              <span>Online</span>
            </div>
          </div>
        </div>
        <button 
          className={`${styles.viewProfileBtn} ${activeTab === 'Creator Profile' ? styles.viewProfileActive : ''}`}
          onClick={() => handleItemClick('Creator Profile')}
        >
          View Profile
        </button>
      </div>
    </aside>
  );
};
