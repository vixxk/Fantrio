import { useState } from 'react';
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
  Settings, 
  ChevronDown, 
  ChevronUp, 
  BadgeCheck,
  Menu,
  Mic,
  Camera
} from 'lucide-react';
import styles from './CreatorSidebar.module.css';

export const CreatorSidebar = ({ onClose }) => {
  const { 
    user,
    activeTab, 
    setActiveTab, 
    darkMode,
    setDarkMode,
    logout,
    navigateTo,
    unreadConversations
  } = useApp();

  const displayName = user?.displayName || user?.username || 'Creator';
  const username = user?.username || 'creator';
  const hasAvatar = user?.avatarUrl && user.avatarUrl.trim() !== '' && !user.avatarUrl.includes('unsplash.com');
  const avatarUrl = hasAvatar ? user.avatarUrl : '/profile.png';

  const [liveCallsExpanded, setLiveCallsExpanded] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Automatically expand Live Calls if we are on the overview or call pages
  // Auto-expand live-calls group when a call tab is active — adjusted during render
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    if (
      activeTab === 'Creator Live Calls' ||
      activeTab === 'Creator Audio Calls' ||
      activeTab === 'Creator Video Calls'
    ) {
      setLiveCallsExpanded(true);
    }
  }

  const menuItems = [
    { name: 'Creator Dashboard', label: 'Dashboard', icon: Home, tab: 'Creator Dashboard' },
    { name: 'Creator Messages', label: 'Messages', icon: MessageSquare, tab: 'Creator Messages', badge: unreadConversations },
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
    { name: 'Creator Settings', label: 'Settings', icon: Settings, tab: 'Creator Settings' }
  ];

  const handleItemClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const isLiveCallsActive =
    activeTab === 'Creator Live Calls';

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
                <div className={`${styles.groupHeader} ${isLiveCallsActive ? styles.groupActive : ''}`}>
                  <button
                    className={styles.navItem}
                    onClick={() => handleItemClick('Creator Live Calls')}
                  >
                    <div className={styles.navItemLeft}>
                      <GroupIcon size={20} className={styles.navIcon} />
                      <span className={styles.navLabel}>{item.label}</span>
                    </div>
                  </button>
                  <button
                    className={styles.chevronBtn}
                    onClick={() => setLiveCallsExpanded(!liveCallsExpanded)}
                    aria-label={liveCallsExpanded ? 'Collapse' : 'Expand'}
                  >
                    {liveCallsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
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

          if (item.href) {
            return (
              <a
                key={item.tab}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => { if (onClose) onClose(); }}
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
              </a>
            );
          }

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
            src={avatarUrl}
            alt={displayName}
            className={styles.creatorAvatar}
          />
          <div className={styles.creatorInfo}>
            <div className={styles.creatorNameRow}>
              <span className={styles.creatorName}>{displayName}</span>
              <BadgeCheck size={16} className={styles.verifiedBadge} />
            </div>
            <span className={styles.creatorHandle}>@{username}</span>
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
        
        <button 
          className={styles.logoutButton} 
          onClick={() => setShowLogoutConfirm(true)}
        >
          <span>Logout</span>
          <img src="/arrow.png" alt="Logout" className={styles.logoutIcon} />
        </button>
      </div>

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
      )
      }
    </aside>
  );
};
