import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import {
  Search, MoreVertical, SlidersHorizontal,
  Image as ImageIcon, Send, Star,
  MessageSquare, User, ChevronLeft, Trash2, Ban,
  Eye, DollarSign, Gift, Unlock
} from 'lucide-react';

// Diamond Badge (kept for future use)
// const DiamondBadge = ({ size = 12 }) => ( ... )
import styles from './CreatorMessagesPage.module.css';
import { ChatFiltersSheet } from '../../../components/ChatFiltersSheet/ChatFiltersSheet';
import {
  DEFAULT_CHAT_FILTERS,
  matchesChatFilters,
  sortConversationsByFilter,
  countActiveChatFilters
} from '../../../components/ChatFiltersSheet/chatFilters';
import { ChatThreadSkeleton, ChatScreenSkeleton } from '../../../components/ChatThreadSkeleton/ChatThreadSkeleton';
import { ReadReceipt } from '../../../components/ReadReceipt/ReadReceipt';
import { ChatComposerExtras } from '../../../components/ChatComposerExtras/ChatComposerExtras';
import { insertEmojiAtCaret } from '../../../components/ChatComposerExtras/chatComposerUtils';
import { formatLastSeen } from '../../../utils/lastSeen';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { PpvMediaDialog } from '../../../components/PpvMediaDialog/PpvMediaDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useToast } from '../../../components/Toast/Toast';
import { GiftMessageCard, parseGiftMessage } from '../../gifts/GiftMessageCard';

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

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const mapConversation = (conv) => {
  const peer = conv._id || {};
  const profile = conv.profile || {};
  const lastMsg = conv.lastMessage || {};
  const stats = conv.fanStats || {};
  const sub = conv.subscription || {};
  const totalSpentCoins = stats.totalSpentCoins || 0;
  const totalTipsCoins = stats.totalTipsCoins || 0;

  return {
    id: String(peer._id || conv._id),
    user: {
      id: String(peer._id || conv._id),
      displayName: peer.displayName || peer.username || 'Fan',
      username: peer.username || '',
      avatarUrl: peer.avatarUrl || DEFAULT_AVATAR,
      isVerified: !!profile.isVerifiedBadge,
      isOnline: !!profile.isOnline,
      lastSeenAt: profile.lastSeenAt || null,
      isTopFan: totalSpentCoins >= 1000,
      isHighSpender: totalSpentCoins >= 500,
      fanSince: stats.fanSince || '—',
      totalSpent: totalSpentCoins,
      totalTips: totalTipsCoins,
      messages: stats.messagesCount || 0,
      subscription: {
        tier: sub.plan || 'Free',
        status: sub.status || 'INACTIVE',
        since: sub.since || '—',
        renewsOn: sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
      },
      labels: []
    },
    lastMessage: lastMsg.content || (lastMsg.isPaywall ? '🔒 ' + (lastMsg.mediaType || 'Media') : (lastMsg.mediaUrl ? '📎 Media' : '')),
    time: formatTime(lastMsg.createdAt),
    lastMessageAt: lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : 0,
    unreadCount: conv.unreadCount || 0,
    isNew: false
  };
};

const mapCreatorMessage = (m, currentUserId) => {
  const isCreator = String(m.senderId) === String(currentUserId);
  return {
    id: String(m._id),
    sender: isCreator ? 'creator' : 'fan',
    text: m.content || '',
    time: formatTime(m.createdAt),
    isGift: !!m.isGift,
    giftName: m.giftName || '',
    giftEmoji: m.giftEmoji || '',
    giftCoins: m.giftCoins || 0,
    giftTier: m.giftTier || 1,
    isPaywall: !!m.isPaywall,
    isLocked: !!m.isLocked,
    coinPrice: m.coinPrice || 0,
    mediaType: m.mediaType || 'media',
    mediaUrl: m.mediaUrl || '',
    read: !!m.isOpened,
    createdAt: m.createdAt
  };
};

export const CreatorMessagesPage = () => {
  const { darkMode, navigateTo, currentPath, user, refreshUnreadCount } = useApp();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileView, setMobileView] = useState(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const convId = parts[2] || null;
    return convId ? 'chat' : 'list';
  });
  const [filter, setFilter] = useState('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [chatFilters, setChatFilters] = useState(DEFAULT_CHAT_FILTERS);
  const activeFilterCount = countActiveChatFilters(chatFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const chatInputRef = useRef(null);
  const chatMediaInputRef = useRef(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const currentUserId = user?.id || null;
  const convIdsRef = useRef(new Set());
  const conversationsRef = useRef([]);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  // Media file picked by the creator — drives the Send Media (free / PPV) popup
  const [pendingMedia, setPendingMedia] = useState(null);
  // Live "Fan unlocked your media" notices per conversation (realtime only)
  const [unlockNotices, setUnlockNotices] = useState({});
  // Fan IDs with a recent unlock — shows a "🔥 Unlocked" badge on the
  // conversation row, auto-cleared after a few seconds.
  const [recentUnlocks, setRecentUnlocks] = useState({});
  const recentUnlockTimers = useRef({});

  // Favorite fans (persisted locally)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('favoriteFans') || '[]'));
    } catch {
      return new Set();
    }
  });

  const toggleFavorite = (convId) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) next.delete(convId);
      else next.add(convId);
      try {
        localStorage.setItem('favoriteFans', JSON.stringify([...next]));
      } catch (err) {
        console.error('Failed to persist favorites:', err);
      }
      return next;
    });
  };

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

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;
  const currentMessages = useMemo(() => selectedConvId ? (messagesMap[selectedConvId] || []) : [], [selectedConvId, messagesMap]);
  const unreadConversationCount = conversations.filter(c => c.unreadCount > 0).length;

  // ---- Real data loading (chat API) ----
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.conversations) {
        setConversations(res.conversations.map(mapConversation));
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadConversations();
    });
  }, [loadConversations]);

  useEffect(() => {
    convIdsRef.current = new Set(conversations.map(c => c.id));
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!selectedConvId) return;
    let cancelled = false;
    Promise.resolve().then(() => setLoadingMessages(true));
    const loadMessages = async () => {
      try {
        const res = await api.get(`/chat/messages/${selectedConvId}`);
        if (!cancelled && res.messages) {
          setMessagesMap(prev => ({
            ...prev,
            [selectedConvId]: res.messages.map(m => mapCreatorMessage(m, currentUserId))
          }));
          setConversations(prev => prev.map(c => (c.id === selectedConvId ? { ...c, unreadCount: 0 } : c)));
          // Fetching the thread marks it read on the server — keep the global
          // unread-conversations badge in sync.
          refreshUnreadCount();
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    loadMessages();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId]);

  // Real-time delivery via Socket.io
  useEffect(() => {
    if (!currentUserId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onNewMessage = (msg) => {
        const otherId = String(msg.senderId) === String(currentUserId)
          ? String(msg.receiverId)
          : String(msg.senderId);
        const uiMsg = mapCreatorMessage(msg, currentUserId);
        const isOpenConv = !!selectedConvId && otherId === selectedConvId;
        if (isOpenConv) {
          setMessagesMap(prev => ({
            ...prev,
            [selectedConvId]: [...(prev[selectedConvId] || []), uiMsg]
          }));
          // The user is actively viewing this conversation — mark the new
          // message as read on the server so the unread badge stays accurate.
          api.post(`/chat/read/${otherId}`).catch(() => {});
        } else if (!convIdsRef.current.has(otherId)) {
          // A brand-new conversation arrived — reload the list to show it.
          loadConversations();
        }
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === otherId);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            lastMessage: msg.content || (msg.isPaywall ? '🔒 ' + (msg.mediaType || 'Media') : '📎 Media'),
            time: 'Just now',
            lastMessageAt: Date.now(),
            unreadCount: isOpenConv ? 0 : (next[idx].unreadCount || 0) + 1
          };
          return next;
        });
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [selectedConvId, currentUserId, loadConversations]);

  // Live read receipts — when a fan reads our messages (in this thread or on
  // another device), flip the sent ticks to read ticks in real time.
  useEffect(() => {
    if (!currentUserId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onMessagesRead = (payload) => {
        const peerId = payload && payload.peerId ? String(payload.peerId) : null;
        const ids = payload && Array.isArray(payload.messageIds) ? payload.messageIds.map(String) : [];
        if (!peerId || ids.length === 0) return;
        const idSet = new Set(ids);
        setMessagesMap(prev => {
          const list = prev[peerId];
          if (!list) return prev;
          let changed = false;
          const next = list.map(m => {
            if (idSet.has(m.id) && !m.read) {
              changed = true;
              return { ...m, read: true };
            }
            return m;
          });
          return changed ? { ...prev, [peerId]: next } : prev;
        });
      };
      socket.on('messages_read', onMessagesRead);
      return () => { socket.off('messages_read', onMessagesRead); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [currentUserId]);

  // Live notice when a fan unlocks one of our paywalled media messages — show
  // a "Fan unlocked your media · +X coins" pill in that conversation.
  useEffect(() => {
    if (!currentUserId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onMessageUnlocked = (payload) => {
        const fanId = payload && payload.unlockedBy ? String(payload.unlockedBy) : null;
        if (!fanId) return;
        const conv = conversationsRef.current.find(c => c.id === fanId);
        const notice = {
          id: `${payload.messageId}-${Date.now()}`,
          fanName: (conv && conv.user && conv.user.displayName) || '',
          coinPrice: payload.coinPrice || 0
        };
        setUnlockNotices(prev => ({
          ...prev,
          [fanId]: [...(prev[fanId] || []), notice]
        }));
        // Show the 🔥 Unlocked badge on the conversation row, then auto-clear it.
        setRecentUnlocks(prev => ({ ...prev, [fanId]: true }));
        clearTimeout(recentUnlockTimers.current[fanId]);
        recentUnlockTimers.current[fanId] = setTimeout(() => {
          setRecentUnlocks(prev => {
            if (!prev[fanId]) return prev;
            const next = { ...prev };
            delete next[fanId];
            return next;
          });
          delete recentUnlockTimers.current[fanId];
        }, 6000);
      };
      socket.on('message_unlocked', onMessageUnlocked);
      return () => { socket.off('message_unlocked', onMessageUnlocked); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [currentUserId]);

  // Remove a conversation in real time when it's deleted from another device
  // (the global unread badge is refreshed by AppContext on the same event).
  useEffect(() => {
    if (!currentUserId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onConversationDeleted = (payload) => {
        const peerId = payload && payload.peerId ? String(payload.peerId) : null;
        if (!peerId) return;
        setConversations(prev => prev.filter(c => c.id !== peerId));
        setMessagesMap(prev => {
          if (!(peerId in prev)) return prev;
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      };
      socket.on('conversation_deleted', onConversationDeleted);
      return () => { socket.off('conversation_deleted', onConversationDeleted); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [currentUserId]);

  // Live presence — keep the chat header's Online / "Last seen …" line in sync
  // when the fan goes online or offline on any device.
  useEffect(() => {
    if (!currentUserId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onPresenceChange = ({ userId, isOnline, lastSeenAt }) => {
        if (!userId) return;
        setConversations(prev => prev.map(c => {
          if (c.id !== String(userId)) return c;
          return {
            ...c,
            user: {
              ...c.user,
              isOnline: !!isOnline,
              ...(lastSeenAt ? { lastSeenAt } : {})
            }
          };
        }));
      };
      socket.on('user_presence_change', onPresenceChange);
      return () => { socket.off('user_presence_change', onPresenceChange); };
    } catch (err) {
      console.error('Socket init for presence failed:', err);
    }
  }, [currentUserId]);

  // Filter conversations
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const base = sortedConversations.filter((c) => {
      const matchesSearch = c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && matchesChatFilters(c, chatFilters, { favoriteIds });
    });
    return sortConversationsByFilter(base, chatFilters);
  }, [sortedConversations, searchQuery, chatFilters, favoriteIds]);

  const setTypeFilter = (type) => {
    setFilter(type);
    setChatFilters((prev) => ({ ...prev, type }));
  };

  const handleApplyFilters = (f) => {
    setChatFilters(f);
    setFilter(f.type === 'unread' || f.type === 'favorites' ? f.type : 'all');
  };

  const filterSheetProps = {
    open: filterSheetOpen,
    onClose: () => setFilterSheetOpen(false),
    onApply: handleApplyFilters,
    initialFilters: chatFilters,
    variant: 'creator',
    conversations: sortedConversations,
    favoriteIds,
    dark: darkMode,
    desktop: !isMobile
  };

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

  // Block the fan in the active conversation — shared confirm dialog state machine
  const {
    target: blockTarget,
    open: openBlock,
    close: closeBlock,
    confirm: confirmBlockUser,
    deleting: blocking,
  } = useConfirmDelete({
    onConfirm: (conv) => api.post(`/block/${conv?.user?.id || conv?.id}`),
    successMessage: (conv) => `${conv?.user?.displayName || 'User'} blocked successfully`,
    errorMessage: 'Failed to block user. Please try again.',
    onSuccess: () => {
      loadConversations();
      navigateTo('/creators/messages');
    },
  });

  const handleBlockUser = () => {
    const userId = selectedConv?.user?.id || selectedConv?.id;
    if (!userId) return;
    setShowMenu(false);
    openBlock(selectedConv);
  };

  // Delete the active conversation — shared confirm dialog state machine
  const {
    target: deleteChatTarget,
    open: openDeleteChat,
    close: closeDeleteChat,
    confirm: confirmDeleteChat,
    deleting: deletingChat,
  } = useConfirmDelete({
    onConfirm: (conv) => api.delete(`/chat/conversation/${conv.id}`),
    successMessage: 'Conversation deleted',
    errorMessage: 'Failed to delete conversation. Please try again.',
    onSuccess: (conv) => {
      setMessagesMap((prev) => { const next = { ...prev }; delete next[conv.id]; return next; });
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      navigateTo('/creators/messages');
      refreshUnreadCount();
    },
  });

  const requestDeleteChat = () => {
    setShowMenu(false);
    openDeleteChat(selectedConv);
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
      if (!e.target.closest('[data-kebab-menu]')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const content = inputText.trim();
    try {
      const res = await api.post('/chat/message', { receiverId: selectedConvId, content });
      if (res.status === 'success' && res.message) {
        const uiMsg = mapCreatorMessage(res.message, currentUserId);
        setMessagesMap(prev => ({
          ...prev,
          [selectedConvId]: [...(prev[selectedConvId] || []), uiMsg]
        }));
        setConversations(prev => prev.map(c => (c.id === selectedConvId
          ? { ...c, lastMessage: content, time: 'Just now', lastMessageAt: Date.now() }
          : c)));
      }
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Insert a picked emoji at the caret position of the chat input
  const handlePickEmoji = (emoji) => {
    setInputText((prev) => insertEmojiAtCaret(prev, emoji, chatInputRef.current));
  };

  // A file was picked in the composer — open the Send Media popup so the
  // creator can choose between a free send and a paid (PPV) unlock.
  const handlePickMedia = (file) => {
    if (!file) return;
    setPendingMedia(file);
  };

  // Upload the picked media (via presigned URL) and send it as a chat message.
  // `price` is 0 for a free send, or the coin price for a PPV unlock (the fan
  // pays `price` to view it and the creator receives it on unlock).
  const sendMedia = async (file, price) => {
    if (!file || !selectedConvId) return;
    const fileType = file.type || 'image/jpeg';
    const mediaType = fileType.startsWith('video/') ? 'video' : 'image';
    const isPaywall = price > 0;
    try {
      let mediaUrl = '';
      try {
        const res = await api.post('/settings/presigned-upload', {
          fileName: (file.name || `chat-image-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_'),
          fileType
        });
        if (res.status === 'success' && res.uploadUrl) {
          const putRes = await fetch(res.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': fileType },
            body: file
          });
          if (putRes.ok) {
            mediaUrl = res.fileUrl;
          }
        }
      } catch (s3Err) {
        console.warn('S3 direct upload failed, using Data URL fallback:', s3Err);
      }

      if (!mediaUrl) {
        mediaUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const msgRes = await api.post('/chat/message', {
        receiverId: selectedConvId,
        content: '',
        mediaUrl,
        mediaType,
        isPaywall,
        coinPrice: isPaywall ? price : 0
      });
      if (msgRes.status === 'success' && msgRes.message) {
        const uiMsg = mapCreatorMessage(msgRes.message, currentUserId);
        setMessagesMap(prev => ({
          ...prev,
          [selectedConvId]: [...(prev[selectedConvId] || []), uiMsg]
        }));
        const preview = isPaywall ? `🔒 ${mediaType === 'video' ? 'Video' : 'Photo'} · ${price} coins` : '📎 Media';
        setConversations(prev => prev.map(c => (c.id === selectedConvId
          ? { ...c, lastMessage: preview, time: 'Just now', lastMessageAt: Date.now() }
          : c)));
        setPendingMedia(null);
      } else {
        throw new Error('Failed to send media.');
      }
    } catch (err) {
      console.error('Failed to send media:', err);
      toast.error('Failed to send media. Please try again.');
    }
  };

  // Auto-sync mobileView with URL — adjusted during render
  const [prevConvId, setPrevConvId] = useState(selectedConvId);
  if (selectedConvId !== prevConvId) {
    setPrevConvId(selectedConvId);
    setMobileView(selectedConvId ? 'chat' : 'list');
  }

  if (isMobile) {
    return (
      <>
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
              <button
                className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ''}`}
                onClick={() => setFilterSheetOpen(true)}
                aria-label="Open filters"
              >
                <SlidersHorizontal size={15} />
                {activeFilterCount > 0 && <span className={styles.filterBadge} />}
              </button>
            </div>

            <div className={styles.mobileFilterPills}>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'all' ? styles.mobileFilterActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'unread' ? styles.mobileFilterActive : ''}`}
                onClick={() => setTypeFilter('unread')}
              >
                Unread ({unreadConversationCount})
              </button>
              <button
                className={`${styles.mobileFilterPill} ${filter === 'favorites' ? styles.mobileFilterActive : ''}`}
                onClick={() => setTypeFilter('favorites')}
              >
                Favorites
              </button>
            </div>

            <div className={styles.mobileConvList}>
              {loadingConversations ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className={`${styles.convSkeleton} ${styles.mobileConvSkeleton}`}>
                    <span className={`${styles.convSkeletonAvatar} ${styles.sk}`} />
                    <div className={styles.convSkeletonLines}>
                      <span className={`${styles.convSkeletonName} ${styles.sk}`} />
                      <span className={`${styles.convSkeletonPreview} ${styles.sk}`} />
                    </div>
                  </div>
                ))
              ) : (
              filteredConversations.map((conv) => {
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
                        <div className={styles.convPreviewBadges}>
                          {recentUnlocks[conv.id] && (
                            <span className={styles.unlockBadge}>🔥 Unlocked</span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              )}
              {filteredConversations.length === 0 && !loadingConversations && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <MessageSquare size={36} className={styles.emptyIcon} />
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.55 }}>
                    No conversations yet
                  </p>
                </div>
              )}
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
                    {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
                  </div>
                </div>
              </div>

              <div className={styles.mobileChatActions} data-kebab-menu>
                <button
                  className={`${styles.mobileMoreBtn} ${favoriteIds.has(selectedConvId) ? styles.mobileFavActive : ''}`}
                  onClick={() => { setShowMenu(false); toggleFavorite(selectedConvId); }}
                  type="button"
                  title={favoriteIds.has(selectedConvId) ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Star size={18} fill={favoriteIds.has(selectedConvId) ? 'currentColor' : 'none'} />
                </button>
                <button
                  className={styles.mobileMoreBtn}
                  onClick={() => setShowMenu(!showMenu)}
                  type="button"
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div className={styles.dropdownMenu}>
                    <button className={styles.dropdownItem} onClick={handleBlockUser} type="button">
                      <Ban size={16} />
                      <span>Block User</span>
                    </button>
                    <button className={styles.dropdownItem} onClick={requestDeleteChat} type="button">
                      <Trash2 size={16} />
                      <span>Delete Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.mobileChatBody}>
              {loadingMessages && currentMessages.length === 0 ? (
                <ChatThreadSkeleton light={!darkMode} />
              ) : (
                <>
                  <div className={styles.dateSeparator}>
                    <span>Today</span>
                  </div>

                  {currentMessages.map((msg) => {
                    const isCreator = msg.sender === 'creator';
                    const parsedGift = parseGiftMessage(msg);
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.msgRow} ${isCreator ? styles.msgRowRight : styles.msgRowLeft}`}
                        style={isCreator ? { maxWidth: '85%' } : undefined}
                      >
                        {!isCreator && (
                          <img src={selectedConv.user?.avatarUrl || '/profile.png'} alt="" className={styles.msgAvatar} />
                        )}
                        <div className={styles.msgContentWrapper}>
                          {parsedGift.isGift ? (
                            <GiftMessageCard msg={msg} isCreator={isCreator} />
                          ) : (
                            <div className={`${styles.msgBubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                              {msg.mediaUrl && msg.mediaType === 'video' ? (
                                <video src={msg.mediaUrl} controls className={styles.msgMedia} />
                              ) : msg.mediaUrl ? (
                                <img src={msg.mediaUrl} alt="Media" className={styles.msgMedia} />
                              ) : null}
                              {msg.text && <p className={styles.msgText}>{msg.text}</p>}
                            </div>
                          )}
                          <div className={`${styles.msgTimestampInline} ${isCreator ? styles.timestampRight : styles.timestampLeft}`}>
                            <span className={styles.msgTimestamp}>{msg.time}</span>
                            {isCreator && <ReadReceipt read={msg.read} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(unlockNotices[selectedConvId] || []).map((n) => {
                    const noticeName = n.fanName || selectedConv?.user?.displayName || 'A fan';
                    return (
                      <div key={n.id} className={styles.unlockNoticeRow}>
                        <span className={styles.unlockNotice}>
                          <Unlock size={11} className={styles.unlockNoticeIcon} />
                          {noticeName} unlocked your media{n.coinPrice > 0 ? ` · +${n.coinPrice} coins` : ''}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className={styles.mobileChatInputBar} onSubmit={handleSendMessage}>
              <div className={styles.inputLeftIcons}>
                <input
                  ref={chatMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePickMedia(file);
                    e.target.value = '';
                  }}
                />
                <button type="button" className={styles.inputIconButton} title="Attach Image" onClick={() => chatMediaInputRef.current?.click()}>
                  <ImageIcon size={19} />
                </button>
                <ChatComposerExtras
                  dark={darkMode}
                  anchor="left"
                  onPickEmoji={handlePickEmoji}
                />
              </div>
              <input
                ref={chatInputRef}
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
                    </h3>                      <span className={styles.profileUsername}>@{selectedConv.user.username}</span>
                      <div className={`${styles.profileStatus} ${selectedConv.user.isOnline ? styles.profileStatusOnline : ''}`}>
                        <span className={styles.profileStatusDot} />
                        {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
                      </div>
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
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionCreatePPV}`}
                  onClick={() => {
                    handleBackToChat();
                    setTimeout(() => chatMediaInputRef.current?.click(), 80);
                  }}
                >
                  <div className={`${styles.actionIcon} ${styles.iconPurple}`}><Gift size={22} /></div>
                  <span>Create PPV Offer</span>
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBlockUser}`}
                  onClick={handleBlockUser}
                >
                  <div className={`${styles.actionIcon} ${styles.iconRed}`}><Ban size={22} /></div>
                  <span>Block User</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedConv && mobileView === 'chat' && (
          loadingConversations || loadingMessages ? (
            <div className={styles.mobileChatScreen}>
              <ChatScreenSkeleton light={!darkMode} />
            </div>
          ) : (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateCard}>
                <MessageSquare size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Your Messages</h3>
                <p className={styles.emptyText}>Select a conversation to start chatting</p>
              </div>
            </div>
          )
        )}

        {/* Delete Chat Confirmation Popup */}
        <ConfirmDeleteDialog
          open={!!deleteChatTarget}
          itemName={selectedConv?.user?.displayName || 'this fan'}
          title="Delete Conversation?"
          confirmLabel="Delete Chat"
          message={<>Are you sure you want to delete the conversation with <strong>{selectedConv?.user?.displayName || 'this fan'}</strong>?</>}
          deleting={deletingChat}
          darkMode={darkMode}
          onCancel={closeDeleteChat}
          onConfirm={confirmDeleteChat}
        />

        {/* Block Fan Confirmation Popup */}
        <ConfirmDeleteDialog
          open={!!blockTarget}
          itemName={selectedConv?.user?.displayName || 'this fan'}
          title="Block User?"
          confirmLabel="Block"
          busyLabel="Blocking…"
          icon={<Ban size={22} />}
          message={<>Are you sure you want to block <strong>{selectedConv?.user?.displayName || 'this fan'}</strong>? They won't be able to message you anymore.</>}
          deleting={blocking}
          darkMode={darkMode}
          onCancel={closeBlock}
          onConfirm={confirmBlockUser}
        />

        {/* Send Media (Free / PPV) Popup */}
        <PpvMediaDialog
          open={!!pendingMedia}
          file={pendingMedia}
          darkMode={darkMode}
          onCancel={() => setPendingMedia(null)}
          onConfirm={(price) => sendMedia(pendingMedia, price)}
        />
      </div>

      {/* Chat Filters Sheet */}
      <ChatFiltersSheet {...filterSheetProps} />
      </>
    );
  }

  return (
    <div className={`${styles.messagesContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.messagesShell}>

        {/* ================= COLUMN 1: FANS LIST ================= */}
        <div className={`${styles.chatsSidebar} ${mobileView !== 'list' ? styles.hideOnMobile : ''}`}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterSheetOpen(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && <span className={styles.filterBadge} />}
            </button>
          </div>

          <div className={styles.filterPills}>
            <button
              className={`${styles.filterPill} ${filter === 'all' ? styles.filterActive : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterPill} ${filter === 'unread' ? styles.filterActive : ''}`}
              onClick={() => setTypeFilter('unread')}
            >
              Unread ({unreadConversationCount})
            </button>
            <button
              className={`${styles.filterPill} ${filter === 'favorites' ? styles.filterActive : ''}`}
              onClick={() => setTypeFilter('favorites')}
            >
              Favorites
            </button>
          </div>

          <div className={styles.conversationsList}>
            {loadingConversations ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className={styles.convSkeleton}>
                  <span className={`${styles.convSkeletonAvatar} ${styles.sk}`} />
                  <div className={styles.convSkeletonLines}>
                    <span className={`${styles.convSkeletonName} ${styles.sk}`} />
                    <span className={`${styles.convSkeletonPreview} ${styles.sk}`} />
                  </div>
                </div>
              ))
            ) : (
            filteredConversations.map((conv) => {
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
                      <div className={styles.convPreviewBadges}>
                        {recentUnlocks[conv.id] && (
                          <span className={styles.unlockBadge}>🔥 Unlocked</span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
            {filteredConversations.length === 0 && !loadingConversations && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2.5rem 1rem', textAlign: 'center' }}>
                <MessageSquare size={36} className={styles.emptyIcon} />
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.55 }}>
                  {'No conversations yet'}
                </p>
              </div>
            )}
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
                    <span className={`${styles.roomStatus} ${selectedConv.user.isOnline ? styles.roomStatusOnline : ''}`}>
                      <span className={styles.roomStatusDot} />
                      {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
                    </span>
                    {selectedConv.user.isTopFan && (
                      <div className={styles.topFanTag}>
                        <TopFanBadge size={12} />
                        <span>Top Fan</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.roomActions}>
                  <button
                    className={`${styles.roomActionBtn} ${favoriteIds.has(selectedConvId) ? styles.roomActionActive : ''}`}
                    title={favoriteIds.has(selectedConvId) ? 'Remove from Favorites' : 'Add to Favorites'}
                    onClick={() => toggleFavorite(selectedConvId)}
                  >
                    <Star size={18} fill={favoriteIds.has(selectedConvId) ? 'currentColor' : 'none'} />
                  </button>
                  <button className={styles.roomActionBtn} title="Delete" onClick={requestDeleteChat}>
                    <Trash2 size={18} />
                  </button>
                  <div className={styles.menuWrapper} data-kebab-menu>
                    <button
                      className={styles.roomActionBtn}
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <div className={styles.dropdownMenu}>
                        <button className={styles.dropdownItem} onClick={handleBlockUser}>
                          <Ban size={16} />
                          <span>Block User</span>
                        </button>
                        <button className={styles.dropdownItem} onClick={requestDeleteChat}>
                          <Trash2 size={16} />
                          <span>Delete Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.messagesBody}>
                {loadingMessages && currentMessages.length === 0 ? (
                  <ChatThreadSkeleton light={!darkMode} />
                ) : (
                  <>
                    <div className={styles.dateSeparator}>
                      <span>Today</span>
                    </div>

                    {currentMessages.map((msg) => {
                      const isCreator = msg.sender === 'creator';
                      const parsedGift = parseGiftMessage(msg);
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.msgRow} ${isCreator ? styles.msgRowRight : styles.msgRowLeft}`}
                        >
                          {!isCreator && (
                            <img src={selectedConv.user?.avatarUrl || '/profile.png'} alt="" className={styles.msgAvatar} />
                          )}
                          <div className={styles.msgContentWrapper}>
                            {parsedGift.isGift ? (
                              <GiftMessageCard msg={msg} isCreator={isCreator} />
                            ) : (
                              <div className={`${styles.msgBubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                                {msg.mediaUrl && msg.mediaType === 'video' ? (
                                  <video src={msg.mediaUrl} controls className={styles.msgMedia} />
                                ) : msg.mediaUrl ? (
                                  <img src={msg.mediaUrl} alt="Media" className={styles.msgMedia} />
                                ) : null}
                                {msg.text && <p className={styles.msgText}>{msg.text}</p>}
                              </div>
                            )}
                            <div className={`${styles.msgTimestampInline} ${isCreator ? styles.timestampRight : styles.timestampLeft}`}>
                              <span className={styles.msgTimestamp}>{msg.time}</span>
                              {isCreator && <ReadReceipt read={msg.read} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(unlockNotices[selectedConvId] || []).map((n) => {
                      const noticeName = n.fanName || selectedConv?.user?.displayName || 'A fan';
                      return (
                        <div key={n.id} className={styles.unlockNoticeRow}>
                          <span className={styles.unlockNotice}>
                            <Unlock size={11} className={styles.unlockNoticeIcon} />
                            {noticeName} unlocked your media{n.coinPrice > 0 ? ` · +${n.coinPrice} coins` : ''}
                          </span>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className={styles.chatInputBar} onSubmit={handleSendMessage}>
                <div className={styles.inputLeftIcons}>
                  <input
                    ref={chatMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePickMedia(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    className={styles.inputIconButton}
                    title="Attach Image"
                    onClick={() => chatMediaInputRef.current?.click()}
                  >
                    <ImageIcon size={19} />
                  </button>
                  <ChatComposerExtras
                    dark={darkMode}
                    anchor="left"
                    onPickEmoji={handlePickEmoji}
                  />
                </div>

                <input
                  ref={chatInputRef}
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
          ) : selectedConvId && (loadingConversations || loadingMessages) ? (
            <ChatScreenSkeleton light={!darkMode} />
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
                    </h3>                      <span className={styles.profileUsername}>@{selectedConv.user.username}</span>
                      <div className={`${styles.profileStatus} ${selectedConv.user.isOnline ? styles.profileStatusOnline : ''}`}>
                        <span className={styles.profileStatusDot} />
                        {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
                      </div>
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
                  <span className={styles.statValue}>{selectedConv.user.totalSpent.toLocaleString()} Coins</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Gifts</span>
                  <span className={styles.statValue}>{selectedConv.user.totalTips.toLocaleString()} Coins</span>
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
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionCreatePPV}`}
                  onClick={() => chatMediaInputRef.current?.click()}
                >
                  <div className={`${styles.actionIcon} ${styles.iconPurple}`}>
                    <Gift size={22} />
                  </div>
                  <span>Create PPV Offer</span>
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBlockUser}`}
                  onClick={handleBlockUser}
                >
                  <div className={`${styles.actionIcon} ${styles.iconRed}`}>
                    <Ban size={22} />
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

      {/* Chat Filters Sheet */}
      <ChatFiltersSheet {...filterSheetProps} />

      {/* Delete Chat Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteChatTarget}
        itemName={selectedConv?.user?.displayName || 'this fan'}
        title="Delete Conversation?"
        confirmLabel="Delete Chat"
        message={<>Are you sure you want to delete the conversation with <strong>{selectedConv?.user?.displayName || 'this fan'}</strong>?</>}
        deleting={deletingChat}
        darkMode={darkMode}
        onCancel={closeDeleteChat}
        onConfirm={confirmDeleteChat}
      />

      {/* Block Fan Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!blockTarget}
        itemName={selectedConv?.user?.displayName || 'this fan'}
        title="Block User?"
        confirmLabel="Block"
        busyLabel="Blocking…"
        icon={<Ban size={22} />}
        message={<>Are you sure you want to block <strong>{selectedConv?.user?.displayName || 'this fan'}</strong>? They won't be able to message you anymore.</>}
        deleting={blocking}
        darkMode={darkMode}
        onCancel={closeBlock}
        onConfirm={confirmBlockUser}
      />

      {/* Send Media (Free / PPV) Popup */}
      <PpvMediaDialog
        open={!!pendingMedia}
        file={pendingMedia}
        darkMode={darkMode}
        onCancel={() => setPendingMedia(null)}
        onConfirm={(price) => sendMedia(pendingMedia, price)}
      />
    </div>
  );
};
