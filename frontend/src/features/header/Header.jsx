import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getSocket, joinSocketRoom } from '../../services/socket';
import { Search, Bell, MessageCircle, Plus, Menu, ChevronDown } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import styles from './Header.module.css';

export const Header = ({ onMenuToggle }) => {
  const { user, balance, darkMode, activeTab, setActiveTab, navigateTo } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchBoxRef = useRef(null);

  // Load the real unread message count from the chat API
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      const conversations = res.conversations || [];
      const total = conversations.filter((c) => (c.unreadCount || 0) > 0).length;
      setUnreadCount(total);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount, activeTab]);

  // Keep the unread badge in sync in real time via Socket.io
  useEffect(() => {
    if (!user?.id) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(user.id);
      const onNewMessage = (msg) => {
        if (msg && String(msg.receiverId) === String(user.id)) {
          setUnreadCount((prev) => prev + 1);
        }
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [user?.id]);

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

  // Debounced real creator search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchOpen(false);
        return;
      }
      setSearchOpen(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('search', searchQuery.trim());
        queryParams.append('limit', '6');
        const res = await api.get(`/creators/discover?${queryParams.toString()}`);
        setSearchResults(res.creators || []);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const goToMessages = () => {
    if (activeTab.startsWith('Creator')) {
      navigateTo('/creators/messages');
    } else {
      navigateTo('/messages');
    }
  };

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
          title: `Welcome Back, ${user?.displayName || user?.username || 'User'} 👋`,
          subtitle: "Here's what's happening with your account today."
        };
    }
  };

  const { title, subtitle } = getHeaderMeta();
  const avatarUrl = user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
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
            placeholder="Search creators, posts, streams..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                navigateTo(`/listener-profile/${searchResults[0].username}`);
                setSearchOpen(false);
              }
            }}
          />
          {searchOpen && searchQuery.trim() && (
            <div className={styles.searchDropdown}>
              {searchResults.length === 0 ? (
                <div className={styles.searchDropdownEmpty}>No creators found</div>
              ) : (
                searchResults.map((creator) => (
                  <button
                    key={creator.username}
                    className={styles.searchResultItem}
                    onClick={() => {
                      navigateTo(`/listener-profile/${creator.username}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <img
                      src={creator.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                      alt={creator.displayName}
                      className={styles.searchResultAvatar}
                    />
                    <div className={styles.searchResultMeta}>
                      <span className={styles.searchResultName}>{creator.displayName || creator.username}</span>
                      <span className={styles.searchResultHandle}>@{creator.username}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.rightActions}>
        <button className={`${styles.iconButton} ${styles.bellButton}`} onClick={() => {
          if (activeTab.startsWith('Creator')) navigateTo('/creators/messages');
          else navigateTo('/messages');
        }}>
          <div className={styles.iconWrapper}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
        </button>

        {!isCreatorPage && (
          <button className={styles.iconButton} onClick={goToMessages}>
            <div className={styles.iconWrapper}>
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
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
