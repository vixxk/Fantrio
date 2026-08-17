import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Search, Bell, Plus, Menu, ChevronDown, ChevronRight,
  User, Shield, CreditCard, Landmark, BookOpen, Headphones, Heart, AlertOctagon, FileText, PhoneCall, Loader
} from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import styles from './Header.module.css';

const ALL_SETTINGS_ITEMS = [
  {
    id: 'profile',
    title: 'Profile Settings',
    desc: 'Update your display name, avatar, bio, and profile details',
    iconName: 'User',
    route: '/settings?section=profile',
    keywords: ['profile', 'name', 'avatar', 'bio', 'display name', 'username', 'picture', 'account']
  },
  {
    id: 'security',
    title: 'Security & Password',
    desc: 'Manage password, two-factor authentication (2FA) and login activity',
    iconName: 'Shield',
    route: '/settings?section=security',
    keywords: ['security', 'password', '2fa', 'two-factor', 'login', 'devices', 'sessions', 'auth']
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    desc: 'Choose push and email notification settings',
    iconName: 'Bell',
    route: '/settings?section=notifications',
    keywords: ['notifications', 'alerts', 'email', 'push', 'messages', 'reminders']
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    desc: 'Manage credit cards, payment methods and billing',
    iconName: 'CreditCard',
    route: '/settings?section=payment',
    keywords: ['payment', 'card', 'billing', 'credit card', 'cards', 'wallet', 'money', 'visa', 'mastercard']
  },
  {
    id: 'payout',
    title: 'Payout & Bank Settings (Creators)',
    desc: 'Manage creator bank accounts, payout schedule, and minimum threshold',
    iconName: 'Landmark',
    route: '/creators/settings',
    keywords: ['payout', 'bank', 'earnings', 'payouts', 'routing', 'account number', 'money', 'threshold', 'creator settings']
  },
  {
    id: 'call-rates',
    title: 'Call Rates & Pricing (Creators)',
    desc: 'Configure rates for audio calls, video calls, and subscriptions',
    iconName: 'PhoneCall',
    route: '/creators/settings',
    keywords: ['rates', 'call rates', 'price', 'pricing', 'audio call', 'video call', 'subscription price', 'creator']
  },
  {
    id: 'help-centre',
    title: 'Help Centre & FAQ',
    desc: 'Browse help guides, articles, and frequently asked questions',
    iconName: 'BookOpen',
    route: '/settings?section=help-centre',
    keywords: ['help', 'faq', 'support', 'guide', 'docs', 'help centre', 'questions']
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    desc: 'Chat or email Fantrio customer support team directly',
    iconName: 'Headphones',
    route: '/settings?section=contact-support-link',
    keywords: ['contact', 'support', 'customer service', 'help', 'email support', 'chat support']
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    desc: 'Read safety standards and platform community rules',
    iconName: 'Heart',
    route: '/settings?section=community',
    keywords: ['community', 'guidelines', 'rules', 'safety', 'terms', 'policies']
  },
  {
    id: 'report-problem',
    title: 'Report a Problem',
    desc: 'Report bugs, technical issues, or inappropriate content',
    iconName: 'AlertOctagon',
    route: '/settings?section=report',
    keywords: ['report', 'problem', 'bug', 'issue', 'violating', 'report user']
  }
];

const renderSettingIcon = (iconName) => {
  switch (iconName) {
    case 'User': return <User size={18} />;
    case 'Shield': return <Shield size={18} />;
    case 'Bell': return <Bell size={18} />;
    case 'CreditCard': return <CreditCard size={18} />;
    case 'Landmark': return <Landmark size={18} />;
    case 'PhoneCall': return <PhoneCall size={18} />;
    case 'BookOpen': return <BookOpen size={18} />;
    case 'Headphones': return <Headphones size={18} />;
    case 'Heart': return <Heart size={18} />;
    case 'AlertOctagon': return <AlertOctagon size={18} />;
    default: return <User size={18} />;
  }
};

export const Header = ({ onMenuToggle }) => {
  const { user, balance, darkMode, activeTab, setActiveTab, navigateTo, unreadConversations } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatorResults, setCreatorResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [settingResults, setSettingResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef(null);

  // Close the search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-category search: Creators, Posts, and Settings
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) {
        setCreatorResults([]);
        setPostResults([]);
        setSettingResults([]);
        setSearchOpen(false);
        setIsSearching(false);
        return;
      }
      setSearchOpen(true);
      setIsSearching(true);

      // 1. Search Settings locally
      const matchingSettings = ALL_SETTINGS_ITEMS.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });
      setSettingResults(matchingSettings);

      // 2. Search Creators & Posts from API in parallel
      try {
        const [creatorsRes, postsRes] = await Promise.allSettled([
          api.get(`/creators/discover?search=${encodeURIComponent(q)}&limit=5`),
          api.get(`/posts?search=${encodeURIComponent(q)}&limit=5`)
        ]);

        if (creatorsRes.status === 'fulfilled' && creatorsRes.value) {
          setCreatorResults(creatorsRes.value.creators || []);
        } else {
          setCreatorResults([]);
        }

        if (postsRes.status === 'fulfilled' && postsRes.value) {
          setPostResults(postsRes.value.posts || []);
        } else {
          setPostResults([]);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
          title: `Welcome Back, ${user?.displayName || user?.username || 'Creator'} 👋`,
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
          title: `Welcome Back, ${user?.displayName || user?.username || 'User'} 👋`,
          subtitle: "Here's what's happening with your account today."
        };
    }
  };

  const { title, subtitle } = getHeaderMeta();
  const avatarUrl = user?.avatarUrl && !user.avatarUrl.includes('unsplash.com') ? user.avatarUrl : '/profile.png';
  const displayName = user?.displayName || user?.username || 'User';

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
        <div className={styles.searchContainer} ref={searchBoxRef}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search creators, posts, settings..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (creatorResults.length > 0) {
                  navigateTo(`/creator-profile/${creatorResults[0].username}`);
                  setSearchOpen(false);
                  setSearchQuery('');
                } else if (postResults.length > 0) {
                  navigateTo(`/post/${postResults[0]._id}`);
                  setSearchOpen(false);
                  setSearchQuery('');
                } else if (settingResults.length > 0) {
                  navigateTo(settingResults[0].route);
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }
            }}
          />
          {searchOpen && searchQuery.trim() && (
            <div className={styles.searchDropdown}>
              {isSearching ? (
                <div className={styles.searchDropdownEmpty}>
                  <Loader size={20} className={styles.spin} />
                  <span className={styles.emptyTitle}>Searching...</span>
                </div>
              ) : creatorResults.length === 0 && postResults.length === 0 && settingResults.length === 0 ? (
                <div className={styles.searchDropdownEmpty}>
                  <Search size={22} className={styles.emptySearchIcon} />
                  <span className={styles.emptyTitle}>No results found</span>
                  <span className={styles.emptySubtext}>No creators, posts or settings match "{searchQuery}"</span>
                </div>
              ) : (
                <>
                  {/* Creators Group */}
                  {creatorResults.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchSectionHeader}>Creators</div>
                      {creatorResults.map((creator) => (
                        <button
                          key={creator.username}
                          className={styles.searchResultItem}
                          onClick={() => {
                            navigateTo(`/creator-profile/${creator.username}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <img
                            src={creator.avatarUrl && !creator.avatarUrl.includes('unsplash.com') ? creator.avatarUrl : '/profile.png'}
                            alt={creator.displayName}
                            className={styles.searchResultAvatar}
                          />
                          <div className={styles.searchResultMeta}>
                            <span className={styles.searchResultName}>{creator.displayName || creator.username}</span>
                            <span className={styles.searchResultHandle}>@{creator.username}</span>
                          </div>
                          <ChevronRight size={16} className={styles.searchResultArrow} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Posts Group */}
                  {postResults.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchSectionHeader}>Posts</div>
                      {postResults.map((post) => (
                        <button
                          key={post._id}
                          className={styles.searchResultItem}
                          onClick={() => {
                            navigateTo(`/post/${post._id}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className={styles.searchPostIcon}>
                            <FileText size={18} />
                          </div>
                          <div className={styles.searchResultMeta}>
                            <span className={styles.searchResultName}>
                              {post.content ? (post.content.length > 42 ? post.content.substring(0, 42) + '...' : post.content) : 'Media Post'}
                            </span>
                            <span className={styles.searchResultHandle}>
                              By @{post.creatorId?.username || post.creatorId?.displayName || 'creator'}
                            </span>
                          </div>
                          <ChevronRight size={16} className={styles.searchResultArrow} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Settings Group */}
                  {settingResults.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchSectionHeader}>Settings</div>
                      {settingResults.map((setting) => (
                        <button
                          key={setting.id}
                          className={styles.searchResultItem}
                          onClick={() => {
                            navigateTo(setting.route);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className={styles.searchSettingIcon}>
                            {renderSettingIcon(setting.iconName)}
                          </div>
                          <div className={styles.searchResultMeta}>
                            <span className={styles.searchResultName}>{setting.title}</span>
                            <span className={styles.searchResultHandle}>{setting.desc}</span>
                          </div>
                          <ChevronRight size={16} className={styles.searchResultArrow} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.rightActions}>
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

        {/* Notification bell button with Popover */}
        <div style={{ position: 'relative' }}>
          <button 
            className={`${styles.iconButton} ${styles.bellButton}`} 
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setDropdownOpen(false);
            }}
            aria-label="Notifications"
          >
            <div className={styles.iconWrapper}>
              <Bell size={20} />
              {(unreadConversations > 0 || notificationUnreadCount > 0) && (
                <span className={styles.badge}>
                  {Math.max(unreadConversations, notificationUnreadCount) > 99 ? '99+' : Math.max(unreadConversations, notificationUnreadCount)}
                </span>
              )}
            </div>
          </button>

          <NotificationDropdown
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            onUnreadCountChange={(cnt) => setNotificationUnreadCount(cnt)}
            isCreatorPage={isCreatorPage}
          />
        </div>

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
