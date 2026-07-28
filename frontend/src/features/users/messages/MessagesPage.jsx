import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { 
  Search, Edit, BadgeCheck, Phone, Video, Heart, MoreVertical,
  Lock, Smile, Image as ImageIcon, Send, Plus, Archive, Star,
  X, Check, MessageSquare, User, ChevronLeft, SlidersHorizontal
} from 'lucide-react';
import styles from './MessagesPage.module.css';

// Custom Gradient Verification Badge
const GradientBadgeCheck = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e10075" />
        <stop offset="100%" stopColor="#7e00f3" />
      </linearGradient>
    </defs>
    <path 
      d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" 
      fill="url(#badgeGrad)" 
    />
    <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Custom Gradient Archive Icon
const GradientArchiveIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="archiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e10075" />
        <stop offset="100%" stopColor="#7e00f3" />
      </linearGradient>
    </defs>
    <rect width="20" height="5" x="2" y="3" rx="1" stroke="url(#archiveGrad)" strokeWidth="2" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" stroke="url(#archiveGrad)" strokeWidth="2" />
    <path d="M10 12h4" stroke="url(#archiveGrad)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv1',
    user: {
      id: 'usr1',
      displayName: 'Molly Jane',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: true,
      rating: 4.9,
      ratingCount: 125,
      subscriptionPlan: 'Monthly',
      renewalDate: '5, July 2026',
      audioRate: 10,
      videoRate: 10,
      followers: '12.5K',
      posts: 234,
      country: 'United States 🇺🇸',
      language: 'English'
    },
    lastMessage: 'Hey babe!',
    time: 'New',
    unreadCount: 3,
    isNew: true
  },
  {
    id: 'conv2',
    user: {
      id: 'usr2',
      displayName: 'Khushi',
      username: 'khushi_official',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: true,
      rating: 4.8,
      ratingCount: 98,
      subscriptionPlan: 'Monthly',
      renewalDate: '12, Aug 2026',
      audioRate: 15,
      videoRate: 20,
      followers: '45.2K',
      posts: 512,
      country: 'India 🇮🇳',
      language: 'Hindi, English'
    },
    lastMessage: 'New video uploaded!',
    time: '5 Min',
    unreadCount: 3,
    isNew: false
  },
  {
    id: 'conv3',
    user: {
      id: 'usr3',
      displayName: 'Angelina',
      username: 'angelinajolie',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: true,
      rating: 4.7,
      ratingCount: 64,
      subscriptionPlan: 'Yearly',
      renewalDate: '01, Jan 2027',
      audioRate: 12,
      videoRate: 18,
      followers: '8.9K',
      posts: 104,
      country: 'United Kingdom 🇬🇧',
      language: 'English'
    },
    lastMessage: 'thanks for the tip!',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv4',
    user: {
      id: 'usr4',
      displayName: 'Sonam',
      username: 'sonam_k',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: false,
      rating: 4.9,
      ratingCount: 310,
      subscriptionPlan: 'Monthly',
      renewalDate: '18, Jul 2026',
      audioRate: 20,
      videoRate: 25,
      followers: '89.4K',
      posts: 640,
      country: 'India 🇮🇳',
      language: 'Hindi, English'
    },
    lastMessage: 'Lorem ipsum dolor sit...',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv5',
    user: {
      id: 'usr5',
      displayName: 'Shanvi',
      username: 'shanvi_s',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      rating: 4.6,
      ratingCount: 42,
      subscriptionPlan: 'Monthly',
      renewalDate: '24, Jun 2026',
      audioRate: 10,
      videoRate: 15,
      followers: '5.1K',
      posts: 88,
      country: 'India 🇮🇳',
      language: 'English'
    },
    lastMessage: 'Lorem ipsum dolor sit...',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv6',
    user: {
      id: 'usr6',
      displayName: 'Roshni Kumari',
      username: 'roshni_k',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: true,
      rating: 4.9,
      ratingCount: 180,
      subscriptionPlan: 'Monthly',
      renewalDate: '10, Aug 2026',
      audioRate: 15,
      videoRate: 22,
      followers: '32.1K',
      posts: 310,
      country: 'India 🇮🇳',
      language: 'Hindi'
    },
    lastMessage: 'Lorem ipsum dolor sit...',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv7',
    user: {
      id: 'usr7',
      displayName: 'Riya Singh',
      username: 'riya_s',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      rating: 4.5,
      ratingCount: 29,
      subscriptionPlan: 'Monthly',
      renewalDate: '02, Jul 2026',
      audioRate: 8,
      videoRate: 12,
      followers: '3.4K',
      posts: 45,
      country: 'India 🇮🇳',
      language: 'English'
    },
    lastMessage: 'Lorem ipsum dolor sit...',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv8',
    user: {
      id: 'usr8',
      displayName: 'Sweta Singh',
      username: 'sweta_s',
      avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: true,
      rating: 4.8,
      ratingCount: 145,
      subscriptionPlan: 'Monthly',
      renewalDate: '15, Aug 2026',
      audioRate: 18,
      videoRate: 25,
      followers: '28.9K',
      posts: 275,
      country: 'India 🇮🇳',
      language: 'English, Hindi'
    },
    lastMessage: 'Lorem ipsum dolor sit...',
    time: '5 Min',
    unreadCount: 0,
    isNew: false
  }
];

const ARCHIVED_CONVERSATIONS = [
  {
    id: 'conv_arch1',
    user: {
      id: 'usr_arch1',
      displayName: 'Riya Singh',
      username: 'riya_s',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isVerified: false,
      isOnline: false,
      rating: 4.5,
      ratingCount: 29,
      subscriptionPlan: 'Monthly',
      renewalDate: '02, Jul 2026',
      audioRate: 8,
      videoRate: 12,
      followers: '3.4K',
      posts: 45,
      country: 'India 🇮🇳',
      language: 'English'
    },
    lastMessage: "Let's catch up later! (Archived)",
    time: '2 Weeks',
    unreadCount: 0,
    isNew: false
  },
  {
    id: 'conv_arch2',
    user: {
      id: 'usr_arch2',
      displayName: 'Sweta Singh',
      username: 'sweta_s',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      isVerified: true,
      isOnline: false,
      rating: 4.8,
      ratingCount: 145,
      subscriptionPlan: 'Monthly',
      renewalDate: '15, Aug 2026',
      audioRate: 18,
      videoRate: 25,
      followers: '28.9K',
      posts: 275,
      country: 'India 🇮🇳',
      language: 'English, Hindi'
    },
    lastMessage: 'This conversation is archived.',
    time: '3 Weeks',
    unreadCount: 0,
    isNew: false
  }
];

const INITIAL_MESSAGES = [
  { 
    id: 'm1', 
    sender: 'user', 
    text: 'This is the main chat template', 
    time: '9:40 AM' 
  },
  { 
    id: 'm2', 
    sender: 'user', 
    text: 'This is the main chat template', 
    time: '9:40 AM' 
  },
  { 
    id: 'm3', 
    sender: 'creator', 
    text: 'Oh?', 
    time: '9:41 AM' 
  },
  { 
    id: 'm4', 
    sender: 'creator', 
    text: 'How does it work?', 
    time: '9:41 AM' 
  },
  { 
    id: 'm5', 
    sender: 'user', 
    text: 'Simple', 
    time: '9:42 AM' 
  },
  { 
    id: 'm6', 
    sender: 'user', 
    text: "You just edit any text to type in the conversation you want to show, and delete any bubbles you don't want to use", 
    time: '9:43 AM' 
  },
  { 
    id: 'm7', 
    sender: 'user', 
    text: 'Boom', 
    time: '9:43 AM' 
  },
  { 
    id: 'm8', 
    sender: 'creator', 
    isPaywall: true, 
    isLocked: true, 
    coinPrice: 34, 
    title: 'Jessica sent you an image', 
    mediaType: 'Exclusive Image', 
    textSub: 'This image is locked', 
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 
    time: '9:44 AM' 
  },
  { 
    id: 'm9', 
    sender: 'creator', 
    text: 'Hmmm', 
    time: '9:44 AM' 
  },
  { 
    id: 'm10', 
    sender: 'creator', 
    text: 'I think I get it', 
    time: '9:45 AM' 
  },
  { 
    id: 'm11', 
    sender: 'creator', 
    isPaywall: true, 
    isLocked: true, 
    coinPrice: 34, 
    title: 'Jessica sent you an image', 
    mediaType: 'Exclusive Image', 
    textSub: 'This image is locked', 
    previewUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 
    time: '9:45 AM' 
  }
];

const parseMessagesPath = (pathname) => {
  if (!pathname.startsWith('/messages')) {
    return { convId: null, msgId: null };
  }
  const parts = pathname.split('/').filter(Boolean);
  const convId = parts[1] || null;
  const msgId = parts[2] || null;
  return { convId, msgId };
};

export const MessagesPage = () => {
  const { darkMode, balance, addCoins, setActiveTab, currentPath, navigateTo } = useApp();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  
  const { convId: selectedConvId, msgId: selectedMsgId } = parseMessagesPath(currentPath);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [messagesMap, setMessagesMap] = useState({ 
    conv1: INITIAL_MESSAGES,
    conv_arch1: [
      { id: 'archm1', sender: 'user', text: 'Hey Riya, did you see my message?', time: '2 weeks ago' },
      { id: 'archm2', sender: 'creator', text: "Hey! Yes, let's catch up later!", time: '2 weeks ago' }
    ],
    conv_arch2: [
      { id: 'archm3', sender: 'creator', text: 'This conversation has been archived.', time: '3 weeks ago' }
    ]
  });
  const [inputText, setInputText] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(50);
  const [mobileView, setMobileView] = useState(() => {
    const { convId } = parseMessagesPath(window.location.pathname);
    return convId ? 'chat' : 'list';
  });
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedConv = (showArchived ? ARCHIVED_CONVERSATIONS : conversations).find(c => c.id === selectedConvId) || null;
  const currentMessages = selectedConvId ? (messagesMap[selectedConvId] || [
    { id: 'default1', sender: 'creator', text: `Hi! Welcome to my chat feed.`, time: 'Just now' }
  ]) : [];

  // Auto scroll to bottom of messages when selected conversation, messages, or mobileView change
  useEffect(() => {
    if (selectedConvId) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedConvId, currentMessages, mobileView]);

  useEffect(() => {
    if (selectedConvId) {
      if (mobileView === 'list') {
        setMobileView('chat');
      }
    } else {
      setMobileView('list');
    }
  }, [selectedConvId]);

  const selectMessage = (msgId) => {
    if (selectedConvId) {
      if (selectedMsgId === msgId) {
        navigateTo(`/messages/${selectedConvId}`);
      } else {
        navigateTo(`/messages/${selectedConvId}/${msgId}`);
      }
    }
  };

  // Scroll selected message into view when it is set or changes
  useEffect(() => {
    if (selectedMsgId) {
      const timer = setTimeout(() => {
        const msgElement = document.getElementById(selectedMsgId);
        if (msgElement) {
          msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedMsgId]);

  // Filter conversations
  const conversationsToFilter = showArchived ? ARCHIVED_CONVERSATIONS : conversations;
  const filteredConversations = conversationsToFilter.filter(c => {
    const matchesSearch = c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'unread') return c.unreadCount > 0;
    if (filter === 'subscribed') return true;
    return true;
  });

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesMap(prev => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg]
    }));

    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return { ...c, lastMessage: inputText.trim(), time: 'Just now' };
      }
      return c;
    }));

    setInputText('');
  };

  const handleUnlockMedia = async (msgId, price) => {
    if (balance < price) {
      alert(`Insufficient coins! You need ${price} Coins to unlock this image.`);
      return;
    }

    try {
      await addCoins(-price);

      setMessagesMap(prev => ({
        ...prev,
        [selectedConvId]: (prev[selectedConvId] || []).map(m => {
          if (m.id === msgId) {
            return { ...m, isLocked: false };
          }
          return m;
        })
      }));
    } catch (err) {
      console.error('Failed to unlock message:', err);
    }
  };

  const handleSendTip = async () => {
    if (!selectedConv) return;
    if (balance < tipAmount) {
      alert(`Insufficient balance! You have ${balance} Coins.`);
      return;
    }

    try {
      await addCoins(-tipAmount);
      setShowTipModal(false);

      const tipMsg = {
        id: `tip_${Date.now()}`,
        sender: 'user',
        text: `❤️ Sent a tip of ${tipAmount} Coins to ${selectedConv.user.displayName}!`,
        time: 'Just now',
        isTip: true
      };

      setMessagesMap(prev => ({
        ...prev,
        [selectedConvId]: [...(prev[selectedConvId] || []), tipMsg]
      }));
    } catch (err) {
      console.error('Failed to send tip:', err);
    }
  };

  if (isMobile) {
    return (
      <div className={`${styles.mobileContainer} ${!darkMode ? styles.lightMobile : ''}`}>
        
        {/* ================= VIEW 1: CHATS LIST ================= */}
        {mobileView === 'list' && (
          <div className={styles.mobileListScreen}>
            {/* Header */}
            <div className={styles.mobileHeader}>
              <div className={styles.headerTitleBlock} style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.titleRow} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                  {showArchived ? (
                    <button 
                      type="button" 
                      className={styles.mobileHeaderBack} 
                      onClick={() => setShowArchived(false)}
                      style={{ background: 'transparent', border: 'none', color: 'inherit', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                  ) : (
                    <MessageSquare size={24} style={{ stroke: 'url(#activeGradient)', filter: 'drop-shadow(0 2px 6px rgba(225,0,117,0.3))' }} />
                  )}
                  <h1 className={styles.pageTitle} style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'inherit' }}>
                    {showArchived ? 'Archived' : 'Chats'}
                  </h1>
                </div>
              </div>
              <div className={styles.mobileHeaderActions} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  type="button"
                  className={`${styles.mobileArchiveBtn} ${showArchived ? styles.archiveActive : ''}`} 
                  onClick={() => {
                    setShowArchived(!showArchived);
                    navigateTo('/messages');
                  }}
                  title={showArchived ? "Back to Messages" : "Archived Chats"}
                >
                  <GradientArchiveIcon size={20} />
                </button>
                <button className={styles.mobileComposeBtn} title="New Message">
                  <img src="/compose.png" alt="Compose" className={styles.composeIconImg} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className={styles.mobileSearchWrapper}>
              <Search size={16} className={styles.mobileSearchIcon} />
              <input 
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.mobileSearchInput}
              />
              <button className={styles.mobileFilterBtn}>
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Filter Pills */}
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
                className={`${styles.mobileFilterPill} ${filter === 'subscribed' ? styles.mobileFilterActive : ''}`}
                onClick={() => setFilter('subscribed')}
              >
                Subscribed
              </button>
            </div>

            {/* Chats List */}
            <div className={styles.mobileConvList}>
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  return (
                    <div 
                      key={conv.id}
                      className={`${styles.mobileConvItem} ${isSelected ? styles.convSelected : ''}`}
                      onClick={() => {
                        navigateTo(`/messages/${conv.id}`);
                        setMobileView('chat');
                      }}
                    >
                      <div className={styles.convAvatarWrapper}>
                        <img src={conv.user.avatarUrl} alt={conv.user.displayName} className={styles.convAvatar} />
                        {conv.user.isOnline && <span className={styles.onlineDot} />}
                      </div>

                      <div className={styles.convInfo}>
                        <div className={styles.convNameRow}>
                          <span className={styles.convName}>
                            {conv.user.displayName}
                            {conv.user.isVerified && <GradientBadgeCheck size={14} />}
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
                })
              ) : (
                <div className={styles.mobileEmptyState}>
                  <MessageSquare size={40} className={styles.emptyIcon} />
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: CHAT ROOM ================= */}
        {mobileView === 'chat' && selectedConv && (
          <div className={styles.mobileChatScreen}>
            {/* Header */}
            <div className={styles.mobileChatHeader}>
              <button 
                type="button" 
                className={styles.mobileChatBackBtn} 
                onClick={() => {
                  setMobileView('list');
                  navigateTo('/messages');
                }}
              >
                <ChevronLeft size={24} />
              </button>
              
              <div 
                className={styles.mobileChatUserBlock}
                onClick={() => setShowProfileSheet(true)}
              >
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

              {/* Header Actions */}
              <div className={styles.mobileChatActions}>
                <button 
                  className={styles.mobileTipBtn}
                  onClick={() => setShowTipModal(true)}
                  type="button"
                >
                  <Heart size={18} fill="#ff003b" color="#ff003b" />
                </button>

                <div className={styles.menuWrapper} ref={menuRef}>
                  <button 
                    className={styles.mobileMoreBtn}
                    onClick={() => setShowMenu(!showMenu)}
                    type="button"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {showMenu && (
                    <div className={styles.dropdownMenu}>
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setActiveTab('1:1 Audio Calls');
                          setShowMenu(false);
                        }}
                        type="button"
                      >
                        <Phone size={16} className={styles.dropdownIcon} />
                        <div className={styles.dropdownItemText}>
                          <span className={styles.dropdownItemLabel}>Audio Call</span>
                          <span className={styles.dropdownItemSub}>{selectedConv.user.audioRate} Coins/min</span>
                        </div>
                      </button>
                      
                      <button 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setActiveTab('1:1 Video Calls');
                          setShowMenu(false);
                        }}
                        type="button"
                      >
                        <Video size={16} className={styles.dropdownIcon} />
                        <div className={styles.dropdownItemText}>
                          <span className={styles.dropdownItemLabel}>Video Call</span>
                          <span className={styles.dropdownItemSub}>{selectedConv.user.videoRate} Coins/min</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className={styles.mobileChatBody}>
              <div className={styles.dateSeparator}>
                <span>Nov 30, 2023, 9:41 AM</span>
              </div>

              {currentMessages.map((msg) => {
                const isUser = msg.sender === 'user';

                if (msg.isPaywall) {
                  return (
                    <div 
                      key={msg.id} 
                      id={msg.id}
                      className={`${styles.msgRow} ${styles.msgRowLeft}`}
                      onClick={() => selectMessage(msg.id)}
                    >
                      <div className={`${styles.paywallWrapper} ${selectedMsgId === msg.id ? styles.paywallSelected : ''}`}>
                        <span className={styles.paywallNoticeTitle}>{msg.title}</span>
                        
                        <div className={styles.paywallCard}>
                          <div className={styles.paywallMediaFrame}>
                            <img src={msg.previewUrl} alt="Locked" className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} />
                            {msg.isLocked && (
                              <div className={styles.lockOverlay}>
                                <Lock size={18} className={styles.lockIcon} />
                              </div>
                            )}
                          </div>

                          <div className={styles.paywallContentBlock}>
                            <h4 className={styles.paywallMediaTitle}>{msg.mediaType}</h4>
                            <p className={styles.paywallSubtext}>{msg.textSub}</p>
                          </div>
                        </div>

                        {/* Unlock Action Row */}
                        {msg.isLocked ? (
                          <div className={styles.paywallUnlockBar}>
                            <div className={styles.coinPriceTag}>
                              <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
                              <span>{msg.coinPrice} Coins</span>
                            </div>
                            <button 
                              className={styles.unlockBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockMedia(msg.id, msg.coinPrice);
                              }}
                            >
                              Unlock
                            </button>
                          </div>
                        ) : (
                          <div className={styles.unlockedNotice}>
                            <Check size={14} /> Unlocked
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id} 
                    id={msg.id}
                    className={`${styles.msgRow} ${isUser ? styles.msgRowRight : styles.msgRowLeft}`}
                    onClick={() => selectMessage(msg.id)}
                  >
                    <div className={styles.msgContentWrapper}>
                      <div className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleCreator} ${msg.isTip ? styles.bubbleTip : ''} ${selectedMsgId === msg.id ? styles.bubbleSelected : ''}`}>
                        <p className={styles.msgText}>{msg.text}</p>
                      </div>
                      <div className={`${styles.msgTimestampInline} ${isUser ? styles.timestampRight : styles.timestampLeft}`}>
                        <span className={styles.msgTimestamp}>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form className={styles.mobileChatInputBar} onSubmit={handleSendMessage}>
              <button type="button" className={styles.inputAddBtn} title="Add Content">
                <Plus size={20} />
              </button>

              <input 
                type="text"
                placeholder="Enter your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={styles.chatInput}
              />

              <div className={styles.inputRightIcons}>
                <button type="button" className={styles.inputIconButton} title="Emoji">
                  <Smile size={19} />
                </button>
                <button type="button" className={styles.inputIconButton} title="Attach Image">
                  <ImageIcon size={19} />
                </button>
                <button type="submit" className={styles.sendSubmitBtn} title="Send Message">
                  <Send size={16} />
                </button>
              </div>
            </form>

            {/* ================= PROFILE BOTTOM SHEET DRAWER ================= */}
            {showProfileSheet && (
              <>
                <div 
                  className={styles.profileSheetBackdrop} 
                  onClick={() => setShowProfileSheet(false)}
                />
                <div className={styles.profileSheet}>
                  <div className={styles.profileDragHandle} />
                  
                  <div className={styles.sheetHeader}>
                    <h3 className={styles.sheetTitle}>Creator Info</h3>
                    <button 
                      type="button" 
                      className={styles.sheetCloseBtn} 
                      onClick={() => setShowProfileSheet(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className={styles.sheetContent}>
                    {/* Top Creator Info */}
                    <div className={styles.creatorProfileCard}>
                      <div className={styles.avatarRingWrapper}>
                        <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.profileAvatar} />
                        {selectedConv.user.isOnline && <span className={styles.profileOnlineDot} />}
                      </div>
                      
                      <h3 className={styles.profileName}>
                        {selectedConv.user.displayName}
                        {selectedConv.user.isVerified && <BadgeCheck size={16} className={styles.feedVerifiedBadge} />}
                      </h3>
                      <span className={styles.profileUsername}>@{selectedConv.user.username}</span>

                      <div className={styles.ratingRow}>
                        <Star size={14} className={styles.starIcon} fill="#eab308" />
                        <span>{selectedConv.user.rating} ({selectedConv.user.ratingCount})</span>
                      </div>
                    </div>

                    {/* Subscription Info Card */}
                    <div className={styles.sidebarCard}>
                      <div className={styles.cardHeaderRow}>
                        <span className={styles.cardHeaderTitle}>Subscription</span>
                        <span className={styles.statusActiveTag}>Active</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Plan</span>
                        <span className={styles.detailValue}>{selectedConv.user.subscriptionPlan}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Renewal Date</span>
                        <span className={styles.detailValue}>{selectedConv.user.renewalDate}</span>
                      </div>

                      <button className={styles.manageSubBtn}>
                        Manage Subscription
                      </button>
                    </div>

                    {/* Rates Card */}
                    <div className={styles.sidebarCard}>
                      <h4 className={styles.cardTitle}>Rates</h4>

                      <div className={styles.rateItem}>
                        <div className={styles.rateLeft}>
                          <Phone size={15} className={styles.rateIcon} />
                          <span>1:1 Audio Call</span>
                        </div>
                        <span className={styles.rateVal}>{selectedConv.user.audioRate} Coins / Min</span>
                      </div>

                      <div className={styles.rateItem}>
                        <div className={styles.rateLeft}>
                          <Video size={15} className={styles.rateIcon} />
                          <span>1:1 Video Call</span>
                        </div>
                        <span className={styles.rateVal}>{selectedConv.user.videoRate} Coins / Min</span>
                      </div>
                    </div>

                    {/* About Card */}
                    <div className={styles.sidebarCard}>
                      <h4 className={styles.cardTitle}>About</h4>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Followers</span>
                        <span className={styles.detailValue}>{selectedConv.user.followers}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Posts</span>
                        <span className={styles.detailValue}>{selectedConv.user.posts}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Country</span>
                        <span className={styles.detailValue}>{selectedConv.user.country}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Language</span>
                        <span className={styles.detailValue}>{selectedConv.user.language}</span>
                      </div>

                      <button 
                        className={styles.viewProfileBtn}
                        onClick={() => {
                          setActiveTab('All Creators');
                          setShowProfileSheet(false);
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Send Tip Modal (reused in mobile view) */}
        {showTipModal && selectedConv && (
          <div className={styles.modalOverlay} onClick={() => setShowTipModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeModalBtn} onClick={() => setShowTipModal(false)} aria-label="Close">
                <X size={20} />
              </button>

              <div className={styles.modalCreatorHeader}>
                <div className={styles.modalAvatarContainer}>
                  <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.modalCreatorAvatar} />
                  <div className={styles.modalHeartBadge}>
                    <Heart size={14} fill="#ffffff" color="#ff007f" />
                  </div>
                </div>
                <h3 className={styles.modalTitle}>
                  Support {selectedConv.user.displayName}
                  {selectedConv.user.isVerified && <BadgeCheck className={styles.verifiedIcon} size={16} />}
                </h3>
                <p className={styles.modalSubtext}>Tipping is a great way to support creators and get noticed!</p>
              </div>

              <div className={styles.balanceInfo}>
                <span className={styles.balanceLabel}>Your Balance:</span>
                <div className={styles.balanceValue}>
                  <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                  <span className={styles.balanceAmount}>{balance.toLocaleString()} Coins</span>
                </div>
              </div>

              <div className={styles.tipPresets}>
                {[20, 50, 100, 250].map((amt) => (
                  <button 
                    key={amt}
                    className={`${styles.presetBtn} ${tipAmount === amt ? styles.presetActive : ''}`}
                    onClick={() => setTipAmount(amt)}
                    type="button"
                  >
                    <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                    <span>{amt}</span>
                  </button>
                ))}
              </div>

              <div className={styles.customTipRow}>
                <span className={styles.customTipLabel}>Custom Amount:</span>
                <div className={styles.customInputWrapper}>
                  <img src="/coin.png" alt="Coin" className={styles.customCoinIcon} />
                  <input 
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Math.max(1, Number(e.target.value)))}
                    min="1"
                    className={styles.customTipInput}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowTipModal(false)} type="button">
                  Cancel
                </button>
                <button className={styles.confirmTipBtn} onClick={handleSendTip} type="button">
                  Send Tip ({tipAmount} Coins)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className={`${styles.messagesContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.messagesShell}>
        
        {/* ================= COLUMN 1: CHATS LIST SIDEBAR ================= */}
        <div className={`${styles.chatsSidebar} ${mobileView !== 'list' ? styles.hideMobile : ''}`}>
          
          {/* Header */}
          <div className={styles.chatsHeader}>
            <h2 className={styles.chatsTitle}>
              {showArchived ? 'Archived' : 'Messages'}
            </h2>
            <div className={styles.headerRightActions}>
              <button 
                type="button"
                className={`${styles.archiveHeaderBtn} ${showArchived ? styles.archiveHeaderActive : ''}`} 
                onClick={() => {
                  setShowArchived(!showArchived);
                  navigateTo('/messages');
                }}
                title={showArchived ? "Back to Messages" : "Archived Chats"}
              >
                <GradientArchiveIcon size={22} />
              </button>
              <button className={styles.composeBtn} title="New Message">
                <img src="/compose.png" alt="Compose" className={styles.composeIconImg} />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filter Tabs */}
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
              Unread (12)
            </button>
            <button 
              className={`${styles.filterPill} ${filter === 'subscribed' ? styles.filterActive : ''}`}
              onClick={() => setFilter('subscribed')}
            >
              Subscribed
            </button>
          </div>

          {/* Conversations List */}
          <div className={styles.conversationsList}>
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div 
                  key={conv.id}
                  className={`${styles.convItem} ${isSelected ? styles.convSelected : ''}`}
                  onClick={() => {
                    navigateTo(`/messages/${conv.id}`);
                    setMobileView('chat');
                  }}
                >
                  <div className={styles.convAvatarWrapper}>
                    <img src={conv.user.avatarUrl} alt={conv.user.displayName} className={styles.convAvatar} />
                    {conv.user.isOnline && <span className={styles.onlineDot} />}
                  </div>

                  <div className={styles.convInfo}>
                    <div className={styles.convNameRow}>
                      <span className={styles.convName}>
                        {conv.user.displayName}
                        {conv.user.isVerified && <GradientBadgeCheck size={14} />}
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

        {/* ================= COLUMN 2: CENTER CHAT ROOM ================= */}
        <div className={`${styles.chatRoom} ${mobileView !== 'chat' ? styles.hideMobile : ''}`}>
          
          {selectedConv ? (
            <>
              {/* Header Bar */}
              <div className={styles.roomHeader}>
                <div className={styles.roomHeaderLeft}>
                  <button 
                    type="button" 
                    className={styles.mobileBackBtn} 
                    onClick={() => {
                      setMobileView('list');
                      navigateTo('/messages');
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <div 
                    className={styles.roomUserBlock}
                    onClick={() => {
                      if (window.innerWidth <= 768) {
                        setMobileView('profile');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.roomAvatarWrapper}>
                      <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.roomAvatar} />
                      {selectedConv.user.isOnline && <span className={styles.onlineDot} />}
                    </div>
                    <div className={styles.roomNameBlock}>
                      <div className={styles.roomDisplayName}>
                        {selectedConv.user.displayName}
                        {selectedConv.user.isVerified && <GradientBadgeCheck size={15} />}
                      </div>
                      <div className={styles.roomUsername}>@{selectedConv.user.username}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.roomActions}>
                  {/* Desktop-only: Audio & Video Call buttons */}
                  <button 
                    className={styles.audioCallBtn}
                    onClick={() => setActiveTab('1:1 Audio Calls')}
                    type="button"
                  >
                    <Phone size={16} />
                    <div className={styles.btnTextCol}>
                      <span className={styles.btnLabel}>Audio Call</span>
                      <span className={styles.btnSub}>10 Coins/min</span>
                    </div>
                  </button>

                  <button 
                    className={styles.videoCallBtn}
                    onClick={() => setActiveTab('1:1 Video Calls')}
                    type="button"
                  >
                    <Video size={16} />
                    <div className={styles.btnTextCol}>
                      <span className={styles.btnLabel}>Video Call</span>
                      <span className={styles.btnSub}>10 Coins/min</span>
                    </div>
                  </button>

                  <button 
                    className={styles.sendTipBtn}
                    onClick={() => setShowTipModal(true)}
                  >
                    <Heart size={18} fill="#ff003b" color="#ff003b" className={styles.tipHeartIcon} />
                    <span>Send Tip</span>
                  </button>

                  {/* Mobile-only: kebab menu with audio/video call options */}
                  <div className={styles.menuWrapper} ref={menuRef}>
                    <button 
                      className={styles.moreOptionsBtn}
                      onClick={() => setShowMenu(!showMenu)}
                      type="button"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {showMenu && (
                      <div className={styles.dropdownMenu}>
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            setActiveTab('1:1 Audio Calls');
                            setShowMenu(false);
                          }}
                          type="button"
                        >
                          <Phone size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Audio Call</span>
                            <span className={styles.dropdownItemSub}>10 Coins/min</span>
                          </div>
                        </button>
                        
                        <button 
                          className={styles.dropdownItem}
                          onClick={() => {
                            setActiveTab('1:1 Video Calls');
                            setShowMenu(false);
                          }}
                          type="button"
                        >
                          <Video size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Video Call</span>
                            <span className={styles.dropdownItemSub}>10 Coins/min</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className={styles.messagesBody}>
                
                {/* Date Separator */}
                <div className={styles.dateSeparator}>
                  <span>Nov 30, 2023, 9:41 AM</span>
                </div>

                {currentMessages.map((msg) => {
                  const isUser = msg.sender === 'user';

                  if (msg.isPaywall) {
                    return (
                      <div 
                        key={msg.id} 
                        id={msg.id}
                        className={`${styles.msgRow} ${styles.msgRowLeft}`}
                        onClick={() => selectMessage(msg.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`${styles.paywallWrapper} ${selectedMsgId === msg.id ? styles.paywallSelected : ''}`}>
                          <span className={styles.paywallNoticeTitle}>{msg.title}</span>
                          
                          <div className={styles.paywallCard}>
                            <div className={styles.paywallMediaFrame}>
                              <img src={msg.previewUrl} alt="Locked" className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} />
                              {msg.isLocked && (
                                <div className={styles.lockOverlay}>
                                  <Lock size={20} className={styles.lockIcon} />
                                </div>
                              )}
                            </div>

                            <div className={styles.paywallContentBlock}>
                              <h4 className={styles.paywallMediaTitle}>{msg.mediaType}</h4>
                              <p className={styles.paywallSubtext}>{msg.textSub}</p>
                            </div>
                          </div>

                          {/* Unlock Action Row */}
                          {msg.isLocked ? (
                            <div className={styles.paywallUnlockBar}>
                              <div className={styles.coinPriceTag}>
                                <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
                                <span>{msg.coinPrice} Coins</span>
                              </div>
                              <button 
                                className={styles.unlockBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlockMedia(msg.id, msg.coinPrice);
                                }}
                              >
                                Unlock
                              </button>
                            </div>
                          ) : (
                            <div className={styles.unlockedNotice}>
                              <Check size={14} /> Unlocked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      id={msg.id}
                      className={`${styles.msgRow} ${isUser ? styles.msgRowRight : styles.msgRowLeft}`}
                      onClick={() => selectMessage(msg.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.msgContentWrapper}>
                        <div className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleCreator} ${msg.isTip ? styles.bubbleTip : ''} ${selectedMsgId === msg.id ? styles.bubbleSelected : ''}`}>
                          <p className={styles.msgText}>{msg.text}</p>
                        </div>
                        <div className={`${styles.msgTimestampInline} ${isUser ? styles.timestampRight : styles.timestampLeft}`}>
                          <span className={styles.msgTimestamp}>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form className={styles.chatInputBar} onSubmit={handleSendMessage}>
                <button type="button" className={styles.inputAddBtn} title="Add Content">
                  <Plus size={20} />
                </button>

                <input 
                  type="text"
                  placeholder="Enter your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.chatInput}
                />

                <div className={styles.inputRightIcons}>
                  <button type="button" className={styles.inputIconButton} title="Emoji">
                    <Smile size={19} />
                  </button>
                  <button type="button" className={styles.inputIconButton} title="Attach Image">
                    <ImageIcon size={19} />
                  </button>
                  <button type="submit" className={styles.sendSubmitBtn} title="Send Message">
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateCard}>
                <MessageSquare size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Your Messages</h3>
                <p className={styles.emptyText}>Select a conversation from the left sidebar to start chatting</p>
              </div>
            </div>
          )}

        </div>

        {/* ================= COLUMN 3: RIGHT PROFILE DETAILS SIDEBAR ================= */}
        <div className={`${styles.profileSidebar} ${mobileView !== 'profile' ? styles.hideMobile : ''}`}>
          
          {/* Mobile Profile Header */}
          <div className={styles.mobileProfileHeader}>
            <button 
              type="button"
              className={styles.mobileBackBtn} 
              onClick={() => setMobileView('chat')}
            >
              <ChevronLeft size={24} />
            </button>
            <span className={styles.mobileProfileTitle}>Creator Info</span>
          </div>

          {selectedConv ? (
            <>
              {/* Top Creator Header */}
              <div className={styles.creatorProfileCard}>
                <div className={styles.avatarRingWrapper}>
                  <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.profileAvatar} />
                  {selectedConv.user.isOnline && <span className={styles.profileOnlineDot} />}
                </div>
                
                <h3 className={styles.profileName}>
                  {selectedConv.user.displayName}
                  {selectedConv.user.isVerified && <BadgeCheck size={16} className={styles.feedVerifiedBadge} />}
                </h3>
                <span className={styles.profileUsername}>@{selectedConv.user.username}</span>

                <div className={styles.ratingRow}>
                  <Star size={14} className={styles.starIcon} fill="#eab308" />
                  <span>{selectedConv.user.rating} ({selectedConv.user.ratingCount})</span>
                </div>
              </div>

              {/* Subscription Info Card */}
              <div className={styles.sidebarCard}>
                <div className={styles.cardHeaderRow}>
                  <span className={styles.cardHeaderTitle}>Subscription</span>
                  <span className={styles.statusActiveTag}>Active</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Plan</span>
                  <span className={styles.detailValue}>{selectedConv.user.subscriptionPlan}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Renewal Date</span>
                  <span className={styles.detailValue}>{selectedConv.user.renewalDate}</span>
                </div>

                <button className={styles.manageSubBtn}>
                  Manage Subscription
                </button>
              </div>

              {/* Rates Card */}
              <div className={styles.sidebarCard}>
                <h4 className={styles.cardTitle}>Rates</h4>

                <div className={styles.rateItem}>
                  <div className={styles.rateLeft}>
                    <Phone size={15} className={styles.rateIcon} />
                    <span>1:1 Audio Call</span>
                  </div>
                  <span className={styles.rateVal}>{selectedConv.user.audioRate} Coins / Min</span>
                </div>

                <div className={styles.rateItem}>
                  <div className={styles.rateLeft}>
                    <Video size={15} className={styles.rateIcon} />
                    <span>1:1 Video Call</span>
                  </div>
                  <span className={styles.rateVal}>{selectedConv.user.videoRate} Coins / Min</span>
                </div>
              </div>

              {/* About Card */}
              <div className={styles.sidebarCard}>
                <h4 className={styles.cardTitle}>About</h4>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Followers</span>
                  <span className={styles.detailValue}>{selectedConv.user.followers}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Posts</span>
                  <span className={styles.detailValue}>{selectedConv.user.posts}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Country</span>
                  <span className={styles.detailValue}>{selectedConv.user.country}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Language</span>
                  <span className={styles.detailValue}>{selectedConv.user.language}</span>
                </div>

                <button 
                  className={styles.viewProfileBtn}
                  onClick={() => setActiveTab('All Creators')}
                >
                  View Profile
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyProfileState}>
              <User size={40} className={styles.emptyIcon} />
              <p>Select a creator to view details</p>
            </div>
          )}

        </div>

      </div>

      {/* Send Tip Modal */}
      {showTipModal && selectedConv && (
        <div className={styles.modalOverlay} onClick={() => setShowTipModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setShowTipModal(false)} aria-label="Close">
              <X size={20} />
            </button>

            <div className={styles.modalCreatorHeader}>
              <div className={styles.modalAvatarContainer}>
                <img src={selectedConv.user.avatarUrl} alt={selectedConv.user.displayName} className={styles.modalCreatorAvatar} />
                <div className={styles.modalHeartBadge}>
                  <Heart size={14} fill="#ffffff" color="#ff007f" />
                </div>
              </div>
              <h3 className={styles.modalTitle}>
                Support {selectedConv.user.displayName}
                {selectedConv.user.isVerified && <BadgeCheck className={styles.verifiedIcon} size={16} />}
              </h3>
              <p className={styles.modalSubtext}>Tipping is a great way to support creators and get noticed!</p>
            </div>

            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Your Balance:</span>
              <div className={styles.balanceValue}>
                <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                <span className={styles.balanceAmount}>{balance.toLocaleString()} Coins</span>
              </div>
            </div>

            <div className={styles.tipPresets}>
              {[20, 50, 100, 250].map((amt) => (
                <button 
                  key={amt}
                  className={`${styles.presetBtn} ${tipAmount === amt ? styles.presetActive : ''}`}
                  onClick={() => setTipAmount(amt)}
                  type="button"
                >
                  <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                  <span>{amt}</span>
                </button>
              ))}
            </div>

            <div className={styles.customTipRow}>
              <span className={styles.customTipLabel}>Custom Amount:</span>
              <div className={styles.customInputWrapper}>
                <img src="/coin.png" alt="Coin" className={styles.customCoinIcon} />
                <input 
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Math.max(1, Number(e.target.value)))}
                  min="1"
                  className={styles.customTipInput}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowTipModal(false)} type="button">
                Cancel
              </button>
              <button className={styles.confirmTipBtn} onClick={handleSendTip} type="button">
                Send Tip ({tipAmount} Coins)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
