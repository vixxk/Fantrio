import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Search, MoreVertical, SlidersHorizontal,
  Smile, Image as ImageIcon, Send, Star,
  MessageSquare, User, ChevronLeft, Trash2, Ban,
  Eye, DollarSign, Gift
} from 'lucide-react';

// Diamond Badge (kept for future use)
// const DiamondBadge = ({ size = 12 }) => ( ... )
import styles from './CreatorMessagesPage.module.css';

// Custom Gradient Verification Badge
const GradientBadgeCheck = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="badgeGradCreator" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e10075" />
        <stop offset="100%" stopColor="#7e00f3" />
      </linearGradient>
    </defs>
    <path
      d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"
      fill="url(#badgeGradCreator)"
    />
    <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Top Fan Badge
const TopFanBadge = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#eab308" />
  </svg>
);

// Diamond Badge
const DiamondBadge = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M6 3H18L22 9L12 22L2 9L6 3Z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1" />
  </svg>
);

const FAN_CONVERSATIONS = [
  {
    id: 'fan1',
    user: {
      id: 'usr1',
      displayName: 'Alex Turner',
      username: 'alext_23',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: true,
      isTopFan: true,
      isHighSpender: true,
      fanSince: 'Feb 14, 2024',
      totalSpent: 1245.80,
      totalTips: 320.00,
      messages: 156,
      subscription: { tier: 'VIP Fan', status: 'ACTIVE', since: 'Mar 10, 2024', renewsOn: 'Jun 10, 2024' },
      labels: ['Top Fan', 'High Spender']
    },
    lastMessage: "Can't wait for your next stream!",
    time: '2m',
    unreadCount: 2,
    isNew: false
  },
  {
    id: 'fan2',
    user: {
      id: 'usr2',
      displayName: 'Jason Miller',
      username: 'jason_m',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: true,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Jan 5, 2024',
      totalSpent: 450.00,
      totalTips: 120.00,
      messages: 45,
      subscription: { tier: 'Monthly', status: 'ACTIVE', since: 'Apr 1, 2024', renewsOn: 'May 1, 2024' },
      labels: []
    },
    lastMessage: 'You looked amazing today 🔥',
    time: '15m',
    unreadCount: 1,
    isNew: false
  },
  {
    id: 'fan3',
    user: {
      id: 'usr3',
      displayName: 'Chris Evans',
      username: 'chris_e',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Mar 20, 2024',
      totalSpent: 85.00,
      totalTips: 25.00,
      messages: 12,
      subscription: { tier: 'Free', status: 'INACTIVE', since: '-', renewsOn: '-' },
      labels: []
    },
    lastMessage: 'Thanks for the reply! That made...',
    time: '1h',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'fan4',
    user: {
      id: 'usr4',
      displayName: 'Mike Anderson',
      username: 'mike_a',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Feb 1, 2024',
      totalSpent: 210.00,
      totalTips: 50.00,
      messages: 28,
      subscription: { tier: 'Monthly', status: 'ACTIVE', since: 'Mar 1, 2024', renewsOn: 'Apr 1, 2024' },
      labels: []
    },
    lastMessage: "When's the next Q&A?",
    time: '2h',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'fan5',
    user: {
      id: 'usr5',
      displayName: 'Daniel Roberts',
      username: 'dan_r',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: true,
      isTopFan: true,
      isHighSpender: false,
      fanSince: 'Dec 15, 2023',
      totalSpent: 890.00,
      totalTips: 200.00,
      messages: 98,
      subscription: { tier: 'Yearly', status: 'ACTIVE', since: 'Dec 15, 2023', renewsOn: 'Dec 15, 2024' },
      labels: ['Top Fan']
    },
    lastMessage: "Just sent a tip! You're the best ❤️",
    time: '3h',
    unreadCount: 1,
    isNew: false
  },
  {
    id: 'fan6',
    user: {
      id: 'usr6',
      displayName: 'Ryan Cooper',
      username: 'ryan_c',
      avatarUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Apr 2, 2024',
      totalSpent: 120.00,
      totalTips: 30.00,
      messages: 15,
      subscription: { tier: 'Monthly', status: 'ACTIVE', since: 'Apr 2, 2024', renewsOn: 'May 2, 2024' },
      labels: []
    },
    lastMessage: 'Love your content so much!',
    time: '5h',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'fan7',
    user: {
      id: 'usr7',
      displayName: 'Tyler Brooks',
      username: 'tyler_b',
      avatarUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Mar 10, 2024',
      totalSpent: 340.00,
      totalTips: 80.00,
      messages: 32,
      subscription: { tier: 'Monthly', status: 'ACTIVE', since: 'Mar 10, 2024', renewsOn: 'Apr 10, 2024' },
      labels: []
    },
    lastMessage: 'That workout was intense! 💪',
    time: '8h',
    unreadCount: 1,
    isNew: false
  },
  {
    id: 'fan8',
    user: {
      id: 'usr8',
      displayName: 'Brandon Lee',
      username: 'brandon_l',
      avatarUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: false,
      isHighSpender: false,
      fanSince: 'Jan 20, 2024',
      totalSpent: 175.00,
      totalTips: 45.00,
      messages: 20,
      subscription: { tier: 'Monthly', status: 'ACTIVE', since: 'Jan 20, 2024', renewsOn: 'Feb 20, 2024' },
      labels: []
    },
    lastMessage: 'See you on the stream tonight',
    time: '1d',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'fan9',
    user: {
      id: 'usr9',
      displayName: 'Matt Wilson',
      username: 'matt_w',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      isTopFan: true,
      isHighSpender: true,
      fanSince: 'Oct 5, 2023',
      totalSpent: 2150.00,
      totalTips: 550.00,
      messages: 210,
      subscription: { tier: 'VIP', status: 'ACTIVE', since: 'Oct 5, 2023', renewsOn: 'Oct 5, 2024' },
      labels: ['Top Fan', 'High Spender', 'VIP']
    },
    lastMessage: 'Keep up the fantastic work!',
    time: '1d',
    unreadCount: 0,
    isNew: false
  }
];

const INITIAL_MESSAGES = {
  fan1: [
    { id: 'm1', sender: 'fan', text: 'Hey Bella! Hope you\'re having an amazing day 💜', time: '10:24 AM' },
    { id: 'm2', sender: 'creator', text: 'Hey Alex! You just made my day 🥰', time: '10:25 AM', read: true },
    { id: 'm3', sender: 'fan', text: 'Your last stream was 🔥🔥🔥\nCan\'t wait for your next one!', time: '10:26 AM' },
    { id: 'm4', sender: 'creator', text: 'Thank you so much! The support means everything to me 🩷', time: '10:27 AM', read: true },
    { id: 'm5', sender: 'fan', text: 'Is there anything special planned for the next stream?', time: '10:28 AM' },
    { id: 'm6', sender: 'creator', text: 'Yes! We\'re doing a Q&A and some fun games with exclusive rewards 🎉', time: '10:30 AM', read: true },
    { id: 'm7', sender: 'fan', text: 'Awesome! I\'ll be there for sure 🙌', time: '10:31 AM' },
  ],
  fan2: [
    { id: 'm8', sender: 'fan', text: 'You looked amazing today 🔥', time: '9:45 AM' },
    { id: 'm9', sender: 'creator', text: 'Thank you so much! 💕', time: '9:50 AM', read: true },
  ],
  fan3: [
    { id: 'm10', sender: 'fan', text: 'Thanks for the reply!', time: '8:30 AM' },
    { id: 'm11', sender: 'creator', text: 'Anytime! ❤️', time: '8:35 AM', read: true },
  ],
  fan4: [
    { id: 'm12', sender: 'fan', text: 'When\'s the next Q&A?', time: '7:00 AM' },
    { id: 'm13', sender: 'creator', text: 'Stay tuned, will announce soon!', time: '7:15 AM', read: true },
  ],
  fan5: [
    { id: 'm14', sender: 'fan', text: 'Just sent a tip! You\'re the best ❤️', time: '6:30 AM' },
  ],
  fan6: [
    { id: 'm15', sender: 'fan', text: 'Love your content so much!', time: '5:00 AM' },
  ],
  fan7: [
    { id: 'm16', sender: 'fan', text: 'That workout was intense! 💪', time: '2:00 AM' },
  ],
  fan8: [
    { id: 'm17', sender: 'fan', text: 'See you on the stream tonight', time: 'Yesterday' },
  ],
  fan9: [
    { id: 'm18', sender: 'fan', text: 'Keep up the fantastic work!', time: 'Yesterday' },
  ]
};

export const CreatorMessagesPage = () => {
  const { darkMode, navigateTo, currentPath } = useApp();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileView, setMobileView] = useState(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const convId = parts[2] || null;
    return convId ? 'chat' : 'list';
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [messagesMap, setMessagesMap] = useState(INITIAL_MESSAGES);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedConvId = (() => {
    if (!currentPath.startsWith('/creators/messages')) return null;
    const parts = currentPath.split('/').filter(Boolean);
    return parts[2] || null;
  })();

  const selectedConv = FAN_CONVERSATIONS.find(c => c.id === selectedConvId) || null;
  const currentMessages = useMemo(() => selectedConvId ? (messagesMap[selectedConvId] || []) : [], [selectedConvId, messagesMap]);

  // Filter conversations
  const filteredConversations = FAN_CONVERSATIONS.filter(c => {
    const matchesSearch = c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'unread') return c.unreadCount > 0;
    if (filter === 'favorites') return c.user.isTopFan;
    return true;
  });

  // Handle conversation selection with mobile view switching
  const handleSelectConversation = (convId) => {
    navigateTo(`/creators/messages/${convId}`);
    setMobileView('chat');
  };

  // Handle back navigation on mobile
  const handleBackToList = () => {
    navigateTo('/creators/messages');
    setMobileView('list');
  };

  // Handle profile view on mobile
  const handleShowProfile = () => {
    setMobileView('profile');
  };

  // Handle back to chat from profile
  const handleBackToChat = () => {
    setMobileView('chat');
  };

  useEffect(() => {
    if (selectedConvId && mobileView === 'chat') {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedConvId, currentMessages, mobileView]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'creator',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessagesMap(prev => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg]
    }));
    setInputText('');
  };

  // Auto-sync mobileView with URL
  useEffect(() => {
    if (selectedConvId) {
      if (mobileView === 'list') {
        setMobileView('chat');
      }
    } else {
      setMobileView('list');
    }
  }, [selectedConvId]);

  if (isMobile) {
    return (
      <div className={`${styles.mobileContainer} ${!darkMode ? styles.lightMobile : ''}`}>

        {/* ================= VIEW 1: FANS LIST ================= */}
        {mobileView === 'list' && (
          <div className={styles.mobileListScreen}>
            <div className={styles.mobileHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={20} style={{ color: '#e10075' }} />
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'inherit' }}>
                    Messages
                  </h1>
                </div>
              </div>
            </div>

            <div className={styles.mobileSearchWrapper}>
              <Search size={15} className={styles.mobileSearchIcon} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.mobileSearchInput}
              />
              <button className={styles.mobileFilterBtn}>
                <SlidersHorizontal size={15} />
              </button>
            </div>

            <div className={styles.mobileFilterPills}>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'all' ? styles.mobileFilterActive : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'unread' ? styles.mobileFilterActive : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'favorites' ? styles.mobileFilterActive : ''}`}
                onClick={() => setFilter('favorites')}
              >
                Favorites
              </button>
            </div>

            <div className={styles.mobileConvList}>
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    className={`${styles.mobileConvItem} ${isSelected ? styles.convSelected : ''}`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className={styles.convAvatarWrapper}>
                      <img src={conv.user.avatarUrl} alt={conv.user.displayName} className={styles.convAvatar} />
                      {conv.user.isOnline && <span className={styles.onlineDot} />}
                    </div>
                    <div className={styles.convInfo}>
                      <div className={styles.convNameRow}>
                        <span className={styles.convName}>
                          {conv.user.displayName}
                        </span>
                        <span className={styles.convTime}>{conv.time}</span>
                      </div>
                      <div className={styles.convPreviewRow}>
                        <span className={styles.convPreviewText}>{conv.lastMessage}</span>
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: CHAT ROOM ================= */}
        {mobileView === 'chat' && selectedConv && (
          <div className={styles.mobileChatScreen}>
            <div className={styles.mobileChatHeader}>
              <button
                type="button"
                className={styles.mobileChatBackBtn}
                onClick={handleBackToList}
              >
                <ChevronLeft size={24} />
              </button>

              <div className={styles.mobileChatUserBlock}>
                <div className={styles.mobileChatAvatarWrapper}>
                  <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.mobileChatAvatar} />
                  {selectedConv.user.isOnline && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.mobileChatNameBlock}>
                  <div className={styles.mobileChatDisplayName}>
                    {selectedConv.user.displayName}
                    {selectedConv.user.isVerified && <GradientBadgeCheck size={14} />}
                  </div>
                  <div className={styles.mobileChatStatus}>
                    {selectedConv.user.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div className={styles.mobileChatActions}>
                <button
                  className={styles.mobileMoreBtn}
                  onClick={() => setShowMenu(!showMenu)}
                  type="button"
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={() => { handleShowProfile(); setShowMenu(false); }} type="button">
                      <Eye size={16} />
                      <span>View Profile</span>
                    </button>
                    <button className={styles.dropdownItem} type="button">
                      <Ban size={16} />
                      <span>Block User</span>
                    </button>
                    <button className={styles.dropdownItem} type="button">
                      <Trash2 size={16} />
                      <span>Delete Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.mobileChatBody}>
              <div className={styles.dateSeparator}>
                <span>Today</span>
              </div>

              {currentMessages.map((msg) => {
                const isCreator = msg.sender === 'creator';
                return (
                  <div
                    key={msg.id}
                    className={`${styles.msgRow} ${isCreator ? styles.msgRowRight : styles.msgRowLeft}`}
                    style={isCreator ? { maxWidth: '85%' } : undefined}
                  >
                    {!isCreator && (
                      <img src={selectedConv.user.avatarUrl} alt="" className={styles.msgAvatar} />
                    )}
                    <div className={styles.msgContentWrapper}>
                      <div className={`${styles.msgBubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                        <p className={styles.msgText}>{msg.text}</p>
                      </div>
                      <div className={`${styles.msgTimestampInline} ${isCreator ? styles.timestampRight : styles.timestampLeft}`}>
                        <span className={styles.msgTimestamp}>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.mobileChatInputBar} onSubmit={handleSendMessage}>
              <div className={styles.inputLeftIcons}>
                <button type="button" className={styles.inputIconButton} title="Attach Image">
                  <ImageIcon size={19} />
                </button>
                <button type="button" className={styles.inputIconButton} title="Emoji">
                  <Smile size={19} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={styles.chatInput}
              />
              <button type="submit" className={styles.sendBtn} title="Send Message">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ================= VIEW 3: FAN PROFILE ================= */}
        {mobileView === 'profile' && selectedConv && (
          <div className={styles.mobileChatScreen}>
            <div className={styles.mobileChatHeader}>
              <button type="button" className={styles.mobileChatBackBtn} onClick={handleBackToChat}>
                <ChevronLeft size={24} />
              </button>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Fan Info</span>
              <div style={{ width: 36 }} />
            </div>

            <div className={styles.mobileChatBody} style={{ padding: '1rem' }}>
              <div className={styles.profileCard}>
                <div className={styles.profileHeaderRow}>
                  <div className={styles.profileAvatarWrapper}>
                    <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.profileAvatar} />
                  </div>
                  <div className={styles.profileInfo}>
                    <h3 className={styles.profileName}>
                      {selectedConv.user.displayName}
                      {selectedConv.user.isVerified && <GradientBadgeCheck size={16} />}
                    </h3>
                    <span className={styles.profileUsername}>@{selectedConv.user.username}</span>
                    {selectedConv.user.isTopFan && (
                      <div className={styles.topFanBadge}>
                        <TopFanBadge size={12} />
                        <span>Top Fan</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Fan Since</span>
                  <span className={styles.statValue}>{selectedConv.user.fanSince}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Spent</span>
                  <span className={styles.statValue}>${selectedConv.user.totalSpent.toLocaleString()}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Tips</span>
                  <span className={styles.statValue}>${selectedConv.user.totalTips.toLocaleString()}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Messages</span>
                  <span className={styles.statValue}>{selectedConv.user.messages}</span>
                </div>
              </div>

              <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <span className={styles.subscriptionTitle}>Subscription</span>
                  <span className={`${styles.subscriptionStatus} ${selectedConv.user.subscription.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>
                    {selectedConv.user.subscription.status}
                  </span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Tier</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.tier}</span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Since</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.since}</span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Renews On</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.renewsOn}</span>
                </div>
              </div>

              <div className={styles.actionsCard}>
                <h4 className={styles.actionsTitle}>Quick Actions</h4>
                <button className={`${styles.actionBtn} ${styles.actionViewProfile}`}>
                  <div className={`${styles.actionIcon} ${styles.iconPink}`}><User size={16} /></div>
                  <span>View Profile</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionSendTip}`}>
                  <div className={`${styles.actionIcon} ${styles.iconWhite}`}><DollarSign size={16} /></div>
                  <span>Send Tip</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionCreatePPV}`}>
                  <div className={`${styles.actionIcon} ${styles.iconPurple}`}><Gift size={16} /></div>
                  <span>Create PPV Offer</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionBlockUser}`}>
                  <div className={`${styles.actionIcon} ${styles.iconRed}`}><Ban size={16} /></div>
                  <span>Block User</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedConv && mobileView === 'chat' && (
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyStateCard}>
              <MessageSquare size={48} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Your Messages</h3>
              <p className={styles.emptyText}>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.messagesContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.messagesShell}>

        {/* ================= COLUMN 1: FANS LIST ================= */}
        <div className={`${styles.chatsSidebar} ${mobileView !== 'list' ? styles.hideOnMobile : ''}`}>
          <div className={styles.chatsHeader}>
            <div>
              <h2 className={styles.chatsTitle}>Messages</h2>
            </div>
          </div>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.filterBtn}>
              <SlidersHorizontal size={16} />
            </button>
          </div>

          <div className={styles.filterPills}>
            <button
              className={`${styles.filterPill} ${filter === 'all' ? styles.filterActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterPill} ${filter === 'unread' ? styles.filterActive : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread (8)
            </button>
            <button
              className={`${styles.filterPill} ${filter === 'favorites' ? styles.filterActive : ''}`}
              onClick={() => setFilter('favorites')}
            >
              Favorites
            </button>
          </div>

          <div className={styles.conversationsList}>
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  className={`${styles.convItem} ${isSelected ? styles.convSelected : ''}`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className={styles.convAvatarWrapper}>
                    <img src={conv.user.avatarUrl} alt={conv.user.displayName} className={styles.convAvatar} />
                    {conv.user.isOnline && <span className={styles.onlineDot} />}
                  </div>

                  <div className={styles.convInfo}>
                    <div className={styles.convNameRow}>
                      <span className={styles.convName}>
                        {conv.user.displayName}
                      </span>
                      <span className={styles.convTime}>{conv.time}</span>
                    </div>

                    <div className={styles.convPreviewRow}>
                      <span className={styles.convPreviewText}>{conv.lastMessage}</span>
                      {conv.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= COLUMN 2: CHAT ROOM ================= */}
        <div className={`${styles.chatRoom} ${mobileView !== 'chat' ? styles.hideOnMobile : ''}`}>
          {selectedConv ? (
            <>
              <div className={styles.roomHeader}>
                <div className={styles.roomHeaderLeft}>
                  <button
                    type="button"
                    className={styles.mobileBackBtn}
                    onClick={handleBackToList}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className={styles.roomAvatarWrapper}>
                    <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.roomAvatar} />
                    {selectedConv.user.isOnline && <span className={styles.onlineDot} />}
                  </div>
                  <div className={styles.roomNameBlock}>
                    <div className={styles.roomDisplayName}>
                      {selectedConv.user.displayName}
                      {selectedConv.user.isVerified && <GradientBadgeCheck size={15} />}
                    </div>
                    {selectedConv.user.isTopFan && (
                      <div className={styles.topFanTag}>
                        <TopFanBadge size={12} />
                        <span>Top Fan</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.roomActions}>
                  <button className={styles.roomActionBtn} title="Favorite">
                    <Star size={18} />
                  </button>
                  <button className={styles.roomActionBtn} title="Delete">
                    <Trash2 size={18} />
                  </button>
                  <div className={styles.menuWrapper} ref={menuRef}>
                    <button
                      className={styles.roomActionBtn}
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <div className={styles.dropdownMenu}>
                        <button className={styles.dropdownItem} onClick={handleShowProfile}>
                          <Eye size={16} />
                          <span>View Profile</span>
                        </button>
                        <button className={styles.dropdownItem}>
                          <Ban size={16} />
                          <span>Block User</span>
                        </button>
                        <button className={styles.dropdownItem}>
                          <Trash2 size={16} />
                          <span>Delete Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.messagesBody}>
                <div className={styles.dateSeparator}>
                  <span>Today</span>
                </div>

                {currentMessages.map((msg) => {
                  const isCreator = msg.sender === 'creator';
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.msgRow} ${isCreator ? styles.msgRowRight : styles.msgRowLeft}`}
                    >
                      {!isCreator && (
                        <img src={selectedConv.user.avatarUrl} alt="" className={styles.msgAvatar} />
                      )}
                      <div className={styles.msgContentWrapper}>
                        <div className={`${styles.msgBubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                          <p className={styles.msgText}>{msg.text}</p>
                        </div>
                        <div className={`${styles.msgTimestampInline} ${isCreator ? styles.timestampRight : styles.timestampLeft}`}>
                          <span className={styles.msgTimestamp}>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              <form className={styles.chatInputBar} onSubmit={handleSendMessage}>
                <div className={styles.inputLeftIcons}>
                  <button type="button" className={styles.inputIconButton} title="Attach Image">
                    <ImageIcon size={19} />
                  </button>
                  <button type="button" className={styles.inputIconButton} title="GIF">
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>GIF</span>
                  </button>
                  <button type="button" className={styles.inputIconButton} title="Emoji">
                    <Smile size={19} />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.chatInput}
                />

                <button type="submit" className={styles.sendBtn} title="Send Message">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateCard}>
                <MessageSquare size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Your Messages</h3>
                <p className={styles.emptyText}>Select a conversation to start chatting with your fans</p>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: FAN PROFILE DETAILS ================= */}
        <div className={`${styles.profileSidebar} ${mobileView !== 'profile' ? styles.hideOnMobile : ''}`}>
          {/* Mobile Profile Header */}
          <div className={styles.mobileProfileHeader}>
            <button
              type="button"
              className={styles.mobileBackBtn}
              onClick={handleBackToChat}
            >
              <ChevronLeft size={24} />
            </button>
            <span className={styles.mobileProfileTitle}>Fan Info</span>
          </div>

          {selectedConv ? (
            <div className={styles.profileContent}>
              {/* Fan Profile Header */}
              <div className={styles.profileCard}>
                <div className={styles.profileHeaderRow}>
                  <div className={styles.profileAvatarWrapper}>
                    <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.profileAvatar} />
                  </div>
                  <div className={styles.profileInfo}>
                    <h3 className={styles.profileName}>
                      {selectedConv.user.displayName}
                      {selectedConv.user.isVerified && <GradientBadgeCheck size={16} />}
                    </h3>
                    <span className={styles.profileUsername}>@{selectedConv.user.username}</span>
                    {selectedConv.user.isTopFan && (
                      <div className={styles.topFanBadge}>
                        <TopFanBadge size={12} />
                        <span>Top Fan</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fan Stats */}
              <div className={styles.statsCard}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Fan Since</span>
                  <span className={styles.statValue}>{selectedConv.user.fanSince}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Spent</span>
                  <span className={styles.statValue}>${selectedConv.user.totalSpent.toLocaleString()}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Tips</span>
                  <span className={styles.statValue}>${selectedConv.user.totalTips.toLocaleString()}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Messages</span>
                  <span className={styles.statValue}>{selectedConv.user.messages}</span>
                </div>
              </div>

              {/* Subscription Info */}
              <div className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <span className={styles.subscriptionTitle}>Subscription</span>
                  <span className={`${styles.subscriptionStatus} ${selectedConv.user.subscription.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>
                    {selectedConv.user.subscription.status}
                  </span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Tier</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.tier}</span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Since</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.since}</span>
                </div>
                <div className={styles.subscriptionDetail}>
                  <span className={styles.subscriptionLabel}>Renews On</span>
                  <span className={styles.subscriptionValue}>{selectedConv.user.subscription.renewsOn}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.actionsCard}>
                <h4 className={styles.actionsTitle}>Quick Actions</h4>
                <button className={`${styles.actionBtn} ${styles.actionViewProfile}`}>
                  <div className={`${styles.actionIcon} ${styles.iconPink}`}>
                    <User size={16} />
                  </div>
                  <span>View Profile</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionSendTip}`}>
                  <div className={`${styles.actionIcon} ${styles.iconWhite}`}>  
                    <DollarSign size={16} />
                  </div>
                  <span>Send Tip</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionCreatePPV}`}>
                  <div className={`${styles.actionIcon} ${styles.iconPurple}`}>
                    <Gift size={16} />
                  </div>
                  <span>Create PPV Offer</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionBlockUser}`}>
                  <div className={`${styles.actionIcon} ${styles.iconRed}`}>
                    <Ban size={16} />
                  </div>
                  <span>Block User</span>
                </button>
              </div>


            </div>
          ) : (
            <div className={styles.emptyProfileState}>
              <User size={40} className={styles.emptyIcon} />
              <p>Select a fan to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
