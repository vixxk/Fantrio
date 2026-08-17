import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import {
  Search, BadgeCheck, Phone, Video, Gift, MoreVertical,
  Lock, Image as ImageIcon, Send, Plus, Star,
  X, Check, MessageSquare, User, ChevronLeft, SlidersHorizontal
} from 'lucide-react';
import styles from './MessagesPage.module.css';
import { ActiveCallOverlay } from '../../calls/ActiveCallOverlay/ActiveCallOverlay';
import { ChatFiltersSheet } from '../../../components/ChatFiltersSheet/ChatFiltersSheet';
import {
  DEFAULT_CHAT_FILTERS,
  matchesChatFilters,
  sortConversationsByFilter,
  countActiveChatFilters
} from '../../../components/ChatFiltersSheet/chatFilters';
import { ChatThreadSkeleton, ChatScreenSkeleton } from '../../../components/ChatThreadSkeleton/ChatThreadSkeleton';
import { ReadReceipt } from '../../../components/ReadReceipt/ReadReceipt';
import { formatLastSeen } from '../../../utils/lastSeen';
import { ChatComposerExtras } from '../../../components/ChatComposerExtras/ChatComposerExtras';
import { insertEmojiAtCaret } from '../../../components/ChatComposerExtras/chatComposerUtils';
import { useToast } from '../../../components/Toast/Toast';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { GiftPanel } from '../../../features/gifts/GiftPanel';
import { QuickRecharge } from '../../../features/gifts/QuickRecharge';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { useOutgoingCall } from '../../../hooks/useOutgoingCall';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftMessageCard, parseGiftMessage } from '../../gifts/GiftMessageCard';

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

const parseMessagesPath = (pathname) => {
  if (!pathname || !pathname.startsWith('/messages')) {
    return { convId: null, msgId: null };
  }
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const parts = cleanPath.split('/').filter(Boolean);
  const convId = parts[1] || null;
  const msgId = parts[2] || null;
  return { convId, msgId };
};

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
  const rates = profile.rates || {};
  const lastMsg = conv.lastMessage || {};
  // Subscription info comes from the backend when the viewer has an active
  // subscription with this creator; otherwise nothing is shown (no fake data).
  const sub = conv.subscription || null;
  return {
    id: String(peer._id || conv._id),
    user: {
      displayName: peer.displayName || peer.username || 'Creator',
      username: peer.username || '',
      avatarUrl: peer.avatarUrl || DEFAULT_AVATAR,
      isVerified: !!profile.isVerifiedBadge,
      isOnline: !!profile.isOnline,
      isBusy: !!profile.isBusy,
      lastSeenAt: profile.lastSeenAt || null,
      rating: profile.rating || 0,
      ratingCount: profile.ratingCount || 0,
      subscriptionPlan: sub && sub.plan ? sub.plan : '—',
      renewalDate: sub && sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      hasSubscription: !!sub,
      audioRate: rates.audioCallPerMin || 0,
      videoRate: rates.videoCallPerMin || 0,
      audioAvailable: profile.audioAvailable !== false,
      videoAvailable: profile.videoAvailable !== false,
      followers: profile.followerCount || 0,
      posts: '—',
      country: profile.country || '—',
      language: profile.language || '—'
    },
    lastMessage: lastMsg.content || (lastMsg.isPaywall ? `🔒 ${lastMsg.mediaType || 'Media'}` : '📎 Media'),
    time: formatTime(lastMsg.createdAt),
    lastMessageAt: lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : 0,
    unreadCount: conv.unreadCount || 0
  };
};

const mapMessage = (m, currentUserId) => {
  const isUser = String(m.senderId) === String(currentUserId);
  const mediaType = m.mediaType || 'media';
  return {
    id: String(m._id),
    sender: isUser ? 'user' : 'creator',
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
    mediaType,
    mediaUrl: m.mediaUrl || '',
    title: mediaType === 'image' ? 'Exclusive Photo' : mediaType === 'video' ? 'Premium Video' : 'Exclusive Media',
    textSub: m.isPaywall ? (isUser ? 'Unlocked media you sent' : 'Unlock to view this exclusive content') : '',
    previewUrl: m.mediaUrl || '',
    read: !!m.isOpened,
    createdAt: m.createdAt
  };
};

export const MessagesPage = () => {
  const { darkMode, balance, currentPath, navigateTo, user, refreshBalance, refreshUnreadCount } = useApp();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingTargetCreator, setLoadingTargetCreator] = useState(false);
  const currentUserId = user?.id || null;
  const convIdsRef = useRef(new Set());

  const { convId: selectedConvId, msgId: selectedMsgId } = parseMessagesPath(currentPath);

  const [filter, setFilter] = useState('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [chatFilters, setChatFilters] = useState(DEFAULT_CHAT_FILTERS);
  const activeFilterCount = countActiveChatFilters(chatFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [messagesMap, setMessagesMap] = useState({});
  const [inputText, setInputText] = useState('');
  const chatInputRef = useRef(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
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

  // ---- 1:1 call connection (identical logic to the Audio/Video Calls pages) ----
  const [giftOpen, setGiftOpen] = useState(false);

  const {
    activeCall: audioCall,
    callDuration: audioCallDuration,
    isMuted: audioMuted,
    isSpeakerOn: audioSpeakerOn,
    startCall: startAudioCall,
    endCall: endAudioCall,
    toggleMute: toggleAudioMute,
    toggleSpeaker: toggleAudioSpeaker,
    remoteMicMuted: audioRemoteMicMuted,
    formatDuration: formatAudioDuration
  } = useOutgoingCall({ type: 'audio' });

  const {
    activeCall: videoCall,
    callDuration: videoCallDuration,
    isMuted: videoMuted,
    isSpeakerOn: videoSpeakerOn,
    remoteStream: videoRemoteStream,
    startCall: startVideoCall,
    endCall: endVideoCall,
    toggleMute: toggleVideoMute,
    toggleCamera: toggleVideoCamera,
    isCameraOff: videoCameraOff,
    toggleSpeaker: toggleVideoSpeaker,
    remoteMicMuted: videoRemoteMicMuted,
    attachRemote: attachVideoRemote,
    attachLocal: attachVideoLocal,
    formatDuration: formatVideoDuration,
    remoteCameraOff: videoRemoteCameraOff
  } = useOutgoingCall({ type: 'video' });

  // Only one call can be active at a time — combine for the gift context + overlays
  const activeCallForGifts = audioCall || videoCall;

  // Live gifts + recharge inside the active call (same as the call pages)
  const {
    events: callGiftEvents,
    sendGift: sendCallGift,
    summary: callGiftSummary,
    leaderboard: callGiftLeaderboard
  } = useGiftEvents({
    callRoomId: activeCallForGifts?.roomId || null,
    enabled: !!activeCallForGifts && activeCallForGifts.status === 'active',
    receiverId: activeCallForGifts?.creator?.userId || activeCallForGifts?.creator?._id || null
  });

  // Build the creator object expected by useOutgoingCall.startCall from a conversation
  const buildCallCreator = (conv) => {
    if (!conv) return null;
    return {
      _id: conv.id,
      userId: conv.id,
      displayName: conv.user.displayName,
      username: conv.user.username,
      avatarUrl: conv.user.avatarUrl,
      audioCallPerMin: conv.user.audioRate,
      videoCallPerMin: conv.user.videoRate,
      isBusy: !!conv.user.isBusy,
      isOnline: conv.user.isOnline
    };
  };

  // Persist last opened conversation across page navigations
  useEffect(() => {
    if (selectedConvId) {
      sessionStorage.setItem('lastConvId', selectedConvId);
    }
  }, [selectedConvId]);




  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;
  const currentMessages = useMemo(
    () => (selectedConvId ? (messagesMap[selectedConvId] || []) : []),
    [selectedConvId, messagesMap]
  );
  const chatDateLabel = currentMessages[0]?.createdAt
    ? new Date(currentMessages[0].createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Today';
  const unreadConversationCount = conversations.filter(c => c.unreadCount > 0).length;

  // Auto scroll to bottom of messages when selected conversation, messages, or mobileView change
  useEffect(() => {
    if (selectedConvId) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedConvId, currentMessages, mobileView]);

  // Auto-sync mobileView with URL — adjusted during render
  const [prevConvId, setPrevConvId] = useState(selectedConvId);
  if (selectedConvId !== prevConvId) {
    setPrevConvId(selectedConvId);
    setMobileView(selectedConvId ? 'chat' : 'list');
  }

  const selectMessage = () => {
    if (selectedConvId) {
      navigateTo(`/messages/${selectedConvId}`);
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
  const conversationsToFilter = useMemo(() => (showArchived ? [] : conversations), [showArchived, conversations]);

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
            [selectedConvId]: res.messages.map(m => mapMessage(m, currentUserId))
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

  useEffect(() => {
    let hlMsg = null;
    if (currentPath && currentPath.includes('highlightMsg=')) {
      const search = currentPath.split('?')[1];
      if (search) {
        hlMsg = new URLSearchParams(search).get('highlightMsg');
      }
    }
    if (!hlMsg) {
      const params = new URLSearchParams(window.location.search);
      hlMsg = params.get('highlightMsg');
    }

    if (hlMsg && selectedConvId && (messagesMap[selectedConvId] || []).length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`msg-${hlMsg}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.4s ease, transform 0.4s ease, border-color 0.4s ease';
          el.style.boxShadow = '0 0 30px #a78bfa, 0 0 15px #e10075';
          el.style.borderRadius = '18px';
          el.style.transform = 'scale(1.03)';
          setTimeout(() => {
            el.style.boxShadow = '';
            el.style.transform = '';
          }, 3500);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedConvId, messagesMap, currentPath]);

  // Handle case where user navigates directly to /messages/:creatorId for a creator without prior DM history
  useEffect(() => {
    if (!selectedConvId || loadingConversations) return;
    const exists = conversations.some(c => c.id === selectedConvId);
    if (!exists) {
      let active = true;
      Promise.resolve().then(() => setLoadingTargetCreator(true));
      api.get(`/creators/by-user/${selectedConvId}`)
        .then(res => {
          if (active && res.creator) {
            const profile = res.creator;
            const peerId = String(profile.userId?._id || profile.userId || selectedConvId);
            setConversations(prev => {
              if (prev.some(c => c.id === peerId)) return prev;
              const newConv = {
                id: peerId,
                user: {
                  displayName: profile.displayName || profile.username || 'Creator',
                  username: profile.username || '',
                  avatarUrl: profile.avatarUrl || DEFAULT_AVATAR,
                  isVerified: !!profile.isVerifiedBadge,
                  isOnline: !!profile.isOnline,
                  isBusy: !!res.isBusy,
                  rating: profile.rating || 0,
                  ratingCount: profile.ratingCount || 0,
                  subscriptionPlan: res.subscribedPlan || 'Active',
                  hasSubscription: !!res.isSubscribed,
                  audioRate: profile.rates?.audioCallPerMin || 0,
                  videoRate: profile.rates?.videoCallPerMin || 0,
                  audioAvailable: profile.audioAvailable !== false,
                  videoAvailable: profile.videoAvailable !== false,
                  followers: profile.followerCount || 0,
                  posts: '—',
                  country: profile.country || '—',
                  language: profile.language || '—',
                },
                lastMessage: 'Start a conversation...',
                time: 'Just now',
                lastMessageAt: Date.now(),
                unreadCount: 0
              };
              return [newConv, ...prev];
            });
          }
        })
        .catch(err => {
          console.error('Failed to load target creator for chat:', err);
        })
        .finally(() => {
          if (active) setLoadingTargetCreator(false);
        });
      return () => { active = false; };
    } else {
      Promise.resolve().then(() => setLoadingTargetCreator(false));
    }
  }, [selectedConvId, conversations, loadingConversations]);

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
        const uiMsg = mapMessage(msg, currentUserId);
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

  // Live presence — keep the chat header's Online / "Last seen …" line in sync
  // when the peer goes online or offline on any device.
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

  // Live read receipts — when the peer reads our messages (in this thread or on
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
  const filteredConversations = useMemo(() => {
    const base = conversationsToFilter.filter((c) => {
      const matchesSearch = c.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (chatFilters.type === 'subscribed') return true; // placeholder: subscription data not exposed in this view
      return matchesChatFilters(c, chatFilters, {});
    });
    return sortConversationsByFilter(base, chatFilters);
  }, [conversationsToFilter, searchQuery, chatFilters]);

  const setTypeFilter = (type) => {
    setFilter(type);
    setChatFilters((prev) => ({ ...prev, type }));
  };

  const handleApplyFilters = (f) => {
    setChatFilters(f);
    setFilter(f.type === 'unread' || f.type === 'subscribed' ? f.type : 'all');
  };

  const filterSheetProps = {
    open: filterSheetOpen,
    onClose: () => setFilterSheetOpen(false),
    onApply: handleApplyFilters,
    initialFilters: chatFilters,
    variant: 'user',
    conversations: conversations,
    dark: darkMode,
    desktop: !isMobile
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const content = inputText.trim();
    try {
      const res = await api.post('/chat/message', { receiverId: selectedConvId, content });
      if (res.status === 'success' && res.message) {
        const uiMsg = mapMessage(res.message, currentUserId);
        setMessagesMap(prev => ({
          ...prev,
          [selectedConvId]: [...(prev[selectedConvId] || []), uiMsg]
        }));
      }
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConvId) {
          return { ...c, lastMessage: content, time: 'Just now' };
        }
        return c;
      }));
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const chatMediaInputRef = useRef(null);

  // Upload picked image/video via S3 presigned URL and send as media message
  const handleSendImage = async (file) => {
    if (!file || !selectedConvId) return;
    const fileType = file.type || 'image/jpeg';
    const mediaType = fileType.startsWith('video/') ? 'video' : 'image';
    try {
      const res = await api.post('/settings/presigned-upload', {
        fileName: (file.name || `chat-image-${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType
      });
      if (res.status !== 'success') {
        toast.error('Failed to get upload URL.');
        return;
      }
      const putRes = await fetch(res.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: file
      });
      if (!putRes.ok) {
        toast.error('Upload to storage failed.');
        return;
      }
      const msgRes = await api.post('/chat/message', {
        receiverId: selectedConvId,
        content: '',
        mediaUrl: res.fileUrl,
        mediaType
      });
      if (msgRes.status === 'success' && msgRes.message) {
        const uiMsg = mapMessage(msgRes.message, currentUserId);
        setMessagesMap(prev => ({
          ...prev,
          [selectedConvId]: [...(prev[selectedConvId] || []), uiMsg]
        }));
        setConversations(prev => prev.map(c => (c.id === selectedConvId
          ? { ...c, lastMessage: '📎 Media', time: 'Just now' }
          : c)));
      }
    } catch (err) {
      console.error('Failed to send image:', err);
      toast.error('Failed to send image. Please try again.');
    }
  };

  // Insert a picked emoji at the caret position of the chat input
  const handlePickEmoji = (emoji) => {
    setInputText((prev) => insertEmojiAtCaret(prev, emoji, chatInputRef.current));
  };

  // Unlock PPV media — confirm the coin charge before unlocking
  const {
    target: unlockTarget,
    open: openUnlock,
    close: closeUnlock,
    confirm: confirmUnlock,
    deleting: unlocking,
  } = useConfirmDelete({
    onConfirm: ({ msgId }) => api.post(`/chat/message/${msgId}/unlock`),
    successMessage: 'Media unlocked successfully!',
    errorMessage: 'Failed to unlock. Please try again.',
    onSuccess: ({ msgId }, res) => {
      const updated = res.message ? mapMessage(res.message, currentUserId) : null;
      setMessagesMap(prev => ({
        ...prev,
        [selectedConvId]: (prev[selectedConvId] || []).map(m => {
          if (m.id === msgId) {
            return updated || { ...m, isLocked: false };
          }
          return m;
        })
      }));
      refreshBalance();
    },
  });

  const handleUnlockMedia = (msgId, price) => {
    if (balance < price) {
      toast.error(`Insufficient coins! You need ${price} Coins to unlock this media.`);
      return;
    }
    openUnlock({ msgId, price });
  };

  const handleSendGiftInChat = async (gift) => {
    if (!selectedConv) return;
    if (balance < gift.coins) {
      setShowTipModal(false);
      setRechargeOpen(true);
      return;
    }

    try {
      const res = await api.post(`/monetization/gift/${selectedConv.id}`, { giftId: gift.id });
      if (res.status === 'success') {
        refreshBalance();
        setShowTipModal(false);

        const rawMsg = res.message || {
          _id: res.eventId || `gift_${crypto.randomUUID()}`,
          senderId: currentUserId,
          receiverId: selectedConv.id,
          content: `${gift.emoji} Sent ${gift.name} (${gift.coins.toLocaleString()} Coins)!`,
          isGift: true,
          giftName: gift.name,
          giftEmoji: gift.emoji,
          giftCoins: gift.coins,
          giftTier: gift.tier || 1,
          createdAt: new Date().toISOString()
        };
        const giftMsg = mapMessage(rawMsg, currentUserId);

        setMessagesMap(prev => {
          const list = prev[selectedConvId] || [];
          if (list.some(m => String(m.id) === String(giftMsg.id))) {
            return prev;
          }
          return {
            ...prev,
            [selectedConvId]: [...list, giftMsg]
          };
        });
        toast.success(`${gift.name} sent!`);
      }
    } catch (err) {
      console.error('Failed to send gift:', err);
      toast.error(err.message || 'Failed to send gift. Please try again.');
      throw err;
    }
  };

  // ---- Active call overlays (shared by the mobile & desktop layouts) ----
  // Same full-screen call UI as the 1:1 Audio Calls / Video Calls pages.
  const callOverlays = (
    <>
      {/* Active audio call (shared overlay) */}
      {audioCall && (
        <ActiveCallOverlay
          call={audioCall}
          type="audio"
          balance={balance}
          duration={audioCallDuration}
          formatDuration={formatAudioDuration}
          isMuted={audioMuted}
          onToggleMute={toggleAudioMute}
          isSpeakerOn={audioSpeakerOn}
          onToggleSpeaker={toggleAudioSpeaker}
          onHangUp={endAudioCall}
          onOpenGift={() => setGiftOpen(true)}
          onRecharge={() => setRechargeOpen(true)}
          giftSummary={callGiftSummary}
          giftLeaderboard={callGiftLeaderboard}
          remoteMicMuted={audioRemoteMicMuted}
        />
      )}

      {/* ===== ACTIVE VIDEO CALL (shared overlay) ===== */}
      {videoCall && (
        <ActiveCallOverlay
          call={videoCall}
          type="video"
          balance={balance}
          duration={videoCallDuration}
          formatDuration={formatVideoDuration}
          isMuted={videoMuted}
          onToggleMute={toggleVideoMute}
          isSpeakerOn={videoSpeakerOn}
          onToggleSpeaker={toggleVideoSpeaker}
          isCameraOff={videoCameraOff}
          onToggleCamera={toggleVideoCamera}
          onHangUp={endVideoCall}
          onOpenGift={() => setGiftOpen(true)}
          onRecharge={() => setRechargeOpen(true)}
          remoteStream={videoRemoteStream}
          attachRemote={attachVideoRemote}
          attachLocal={attachVideoLocal}
          remoteCameraOff={videoRemoteCameraOff}
          giftSummary={callGiftSummary}
          giftLeaderboard={callGiftLeaderboard}
          remoteMicMuted={videoRemoteMicMuted}
        />
      )}

      {/* Gift animation rail + gift picker + recharge (active call only) */}
      {activeCallForGifts && activeCallForGifts.status === 'active' && <GiftOverlay events={callGiftEvents} />}
      {giftOpen && (
        <GiftPanel
          type="chat"
          receiverName={activeCallForGifts?.creator?.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => sendCallGift(gift)}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setGiftOpen(false)}
        />
      )}      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}

      {/* Unlock PPV Media Confirmation */}
      <ConfirmDeleteDialog
        open={!!unlockTarget}
        itemName={unlockTarget ? `${unlockTarget.price} coins` : ''}
        title="Unlock Exclusive Media?"
        confirmLabel="Unlock"
        busyLabel="Unlocking…"
        icon={<Lock size={22} />}
        message={unlockTarget ? (
          <>
            Unlock this exclusive media for <strong>{unlockTarget.price} Coins</strong>?
            <span className={styles.unlockConfirmNotice}>This purchase is non-refundable and cannot be cancelled for a refund later.</span>
          </>
        ) : ''}
        deleting={unlocking}
        darkMode={darkMode}
        variant="premium"
        onCancel={closeUnlock}
        onConfirm={confirmUnlock}
      />
    </>
  );


  if (isMobile) {
    return (
      <>
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
                <button
                  className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ''}`}
                  onClick={() => setFilterSheetOpen(true)}
                  aria-label="Open filters"
                >
                  <SlidersHorizontal size={16} />
                  {activeFilterCount > 0 && <span className={styles.filterBadge} />}
                </button>
              </div>

              {/* Filter Pills */}
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
                  className={`${styles.mobileFilterPill} ${filter === 'subscribed' ? styles.mobileFilterActive : ''}`}
                  onClick={() => setTypeFilter('subscribed')}
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
                      {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
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
                    <Gift size={18} color="#fbbf24" />
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
                            startAudioCall(buildCallCreator(selectedConv));
                            setShowMenu(false);
                          }}
                          type="button"
                          disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.audioAvailable}
                        >
                          <Phone size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Audio Call</span>
                            <span className={styles.dropdownItemSub}>
                              {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.audioAvailable ? 'Unavailable' : `${selectedConv.user.audioRate} Coins/min`))}
                            </span>
                          </div>
                        </button>

                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            startVideoCall(buildCallCreator(selectedConv));
                            setShowMenu(false);
                          }}
                          type="button"
                          disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.videoAvailable}
                        >
                          <Video size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Video Call</span>
                            <span className={styles.dropdownItemSub}>
                              {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.videoAvailable ? 'Unavailable' : `${selectedConv.user.videoRate} Coins/min`))}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className={styles.mobileChatBody}>
                {loadingMessages && currentMessages.length === 0 ? (
                  <ChatThreadSkeleton light={!darkMode} />
                ) : (
                  <>
                    <div className={styles.dateSeparator}>
                      <span>{chatDateLabel}</span>
                    </div>

                    {currentMessages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const parsedGift = parseGiftMessage(msg);

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
                                  {msg.previewUrl ? <img src={msg.previewUrl} alt="Locked" className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} /> : <div className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} style={{ background: 'linear-gradient(135deg, #1a1a2e, #e10075)' }} />}
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
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.msgContentWrapper}>
                            {parsedGift.isGift ? (
                              <GiftMessageCard msg={msg} isCreator={!isUser} />
                            ) : (
                              <div className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleCreator} ${msg.isTip ? styles.bubbleTip : ''} ${selectedMsgId === msg.id ? styles.bubbleSelected : ''}`}>
                                {msg.mediaUrl && msg.mediaType === 'video' ? (
                                  <video src={msg.mediaUrl} controls className={styles.msgMedia} />
                                ) : msg.mediaUrl ? (
                                  <img src={msg.mediaUrl} alt="Media" className={styles.msgMedia} />
                                ) : null}
                                {msg.text && <p className={styles.msgText}>{msg.text}</p>}
                              </div>
                            )}
                            <div className={`${styles.msgTimestampInline} ${isUser ? styles.timestampRight : styles.timestampLeft}`}>
                              <span className={styles.msgTimestamp}>{msg.time}</span>
                              {isUser && <ReadReceipt read={msg.read} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input Bar */}
              <form className={styles.mobileChatInputBar} onSubmit={handleSendMessage}>
                <button type="button" className={styles.inputAddBtn} title="Add Content">
                  <Plus size={20} />
                </button>

                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Enter your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.chatInput}
                />

                <div className={styles.inputRightIcons}>
                  <ChatComposerExtras
                    dark={darkMode}
                    anchor="right"
                    onPickEmoji={handlePickEmoji}
                  />
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
                          {selectedConv.user.hasSubscription && (
                            <span className={styles.statusActiveTag}>Active</span>
                          )}
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Plan</span>
                          <span className={styles.detailValue}>{selectedConv.user.subscriptionPlan}</span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Renewal Date</span>
                          <span className={styles.detailValue}>{selectedConv.user.renewalDate}</span>
                        </div>

                        <button className={styles.manageSubBtn}
                          onClick={() => navigateTo(`/subscriptions?highlight=${selectedConvId}`)}
                        >
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
                            navigateTo(`/creator-profile/${selectedConv.user.username}`);
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

          {/* ================= VIEW 2b: CHAT LOADING (direct URL) ================= */}
          {mobileView === 'chat' && !selectedConv && (loadingConversations || loadingMessages) && (
            <div className={styles.mobileChatScreen}>
              <ChatScreenSkeleton light={!darkMode} />
            </div>
          )}

          {/* Send Gift Panel Modal */}
          {showTipModal && selectedConv && (
            <GiftPanel
              type="chat"
              receiverName={selectedConv.user.displayName}
              balance={balance}
              onSendGift={handleSendGiftInChat}
              onRecharge={() => setRechargeOpen(true)}
              onClose={() => setShowTipModal(false)}
            />
          )}
          {callOverlays}

        </div>

        {/* Chat Filters Sheet */}
        <ChatFiltersSheet {...filterSheetProps} />
      </>
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
            <button
              className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
              onClick={() => setFilterSheetOpen(true)}
              aria-label="Open filters"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && <span className={styles.filterBadge} />}
            </button>
          </div>

          {/* Filter Tabs */}
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
              className={`${styles.filterPill} ${filter === 'subscribed' ? styles.filterActive : ''}`}
              onClick={() => setTypeFilter('subscribed')}
            >
              Subscribed
            </button>
          </div>

          {/* Conversations List */}
          <div className={styles.conversationsList}>
            {loadingConversations ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={`conv-skel-${idx}`} className={styles.convSkeletonItem}>
                  <div className={`${styles.skeletonBlock} ${styles.convSkeletonAvatar}`} />
                  <div className={styles.convSkeletonInfo}>
                    <div className={styles.convSkeletonTopRow}>
                      <div className={`${styles.skeletonBlock} ${styles.convSkeletonNameBar}`} />
                      <div className={`${styles.skeletonBlock} ${styles.convSkeletonTimeBar}`} />
                    </div>
                    <div className={`${styles.skeletonBlock} ${styles.convSkeletonMsgBar}`} />
                  </div>
                </div>
              ))
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
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
              })
            ) : (
              <div className={styles.mobileEmptyState}>
                <MessageSquare size={40} className={styles.emptyIcon} />
                <p>{showArchived ? 'No archived conversations' : 'No conversations yet'}</p>
              </div>
            )}
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
                      <div className={styles.roomLastSeen}>
                        {selectedConv.user.isOnline ? 'Online' : formatLastSeen(selectedConv.user.lastSeenAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.roomActions}>
                  {/* Desktop-only: Audio & Video Call buttons (disabled when the creator is offline) */}
                  <button
                    className={styles.audioCallBtn}
                    onClick={() => startAudioCall(buildCallCreator(selectedConv))}
                    type="button"
                    disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.audioAvailable}
                    title={!selectedConv.user.isOnline ? (selectedConv.user.isBusy ? 'Creator is on another call' : (!selectedConv.user.audioAvailable ? 'Creator is not available for audio calls' : '')) : 'Creator is offline'}
                  >
                    <Phone size={16} />
                    <div className={styles.btnTextCol}>
                      <span className={styles.btnLabel}>Audio Call</span>
                      <span className={styles.btnSub}>
                        {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.audioAvailable ? 'Unavailable' : `${selectedConv.user.audioRate} Coins/min`))}
                      </span>
                    </div>
                  </button>

                  <button
                    className={styles.videoCallBtn}
                    onClick={() => startVideoCall(buildCallCreator(selectedConv))}
                    type="button"
                    disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.videoAvailable}
                    title={!selectedConv.user.isOnline ? 'Creator is offline' : (selectedConv.user.isBusy ? 'Creator is on another call' : (!selectedConv.user.videoAvailable ? 'Creator is not available for video calls' : ''))}
                  >
                    <Video size={16} />
                    <div className={styles.btnTextCol}>
                      <span className={styles.btnLabel}>Video Call</span>
                      <span className={styles.btnSub}>
                        {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.videoAvailable ? 'Unavailable' : `${selectedConv.user.videoRate} Coins/min`))}
                      </span>
                    </div>
                  </button>

                  <button
                    className={styles.sendTipBtn}
                    onClick={() => setShowTipModal(true)}
                  >
                    <Gift size={18} color="#fbbf24" className={styles.tipHeartIcon} />
                    <span>Send Gift</span>
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
                            startAudioCall(buildCallCreator(selectedConv));
                            setShowMenu(false);
                          }}
                          type="button"
                          disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.audioAvailable}
                        >
                          <Phone size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Audio Call</span>
                            <span className={styles.dropdownItemSub}>
                              {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.audioAvailable ? 'Unavailable' : `${selectedConv.user.audioRate} Coins/min`))}
                            </span>
                          </div>
                        </button>

                        <button
                          className={styles.dropdownItem}
                          onClick={() => {
                            startVideoCall(buildCallCreator(selectedConv));
                            setShowMenu(false);
                          }}
                          type="button"
                          disabled={!selectedConv.user.isOnline || selectedConv.user.isBusy || !selectedConv.user.videoAvailable}
                        >
                          <Video size={16} className={styles.dropdownIcon} />
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>Video Call</span>
                            <span className={styles.dropdownItemSub}>
                              {!selectedConv.user.isOnline ? 'Offline' : (selectedConv.user.isBusy ? 'Busy' : (!selectedConv.user.videoAvailable ? 'Unavailable' : `${selectedConv.user.videoRate} Coins/min`))}
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className={styles.messagesBody}>
                {loadingMessages && currentMessages.length === 0 ? (
                  <ChatThreadSkeleton light={!darkMode} />
                ) : (
                  <>
                    {/* Date Separator */}
                    <div className={styles.dateSeparator}>
                      <span>{chatDateLabel}</span>
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
                                  {msg.previewUrl ? <img src={msg.previewUrl} alt="Locked" className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} /> : <div className={`${styles.paywallImg} ${msg.isLocked ? styles.blurred : ''}`} style={{ background: 'linear-gradient(135deg, #1a1a2e, #e10075)' }} />}
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

                      const parsedGift = parseGiftMessage(msg);
                      return (
                        <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          className={`${styles.msgRow} ${isUser ? styles.msgRowRight : styles.msgRowLeft}`}
                          onClick={() => selectMessage(msg.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.msgContentWrapper}>
                            {parsedGift.isGift ? (
                              <GiftMessageCard msg={msg} isCreator={!isUser} />
                            ) : (
                              <div className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleCreator} ${msg.isTip ? styles.bubbleTip : ''} ${selectedMsgId === msg.id ? styles.bubbleSelected : ''}`}>
                                {msg.text && <p className={styles.msgText}>{msg.text}</p>}
                                {msg.mediaUrl && (
                                  msg.mediaType === 'video' ? (
                                    <video src={msg.mediaUrl} controls className={styles.msgMedia} />
                                  ) : (
                                    <img
                                      src={msg.mediaUrl}
                                      alt="Attached media"
                                      className={styles.msgMedia}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(msg.mediaUrl, '_blank');
                                      }}
                                    />
                                  )
                                )}
                              </div>
                            )}
                            <div className={`${styles.msgTimestampInline} ${isUser ? styles.timestampRight : styles.timestampLeft}`}>
                              <span className={styles.msgTimestamp}>{msg.time}</span>
                              {isUser && <ReadReceipt read={msg.read} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Bar */}
              <form className={styles.chatInputBar} onSubmit={handleSendMessage}>
                <input
                  type="file"
                  ref={chatMediaInputRef}
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSendImage(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />

                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Enter your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.chatInput}
                />

                <div className={styles.inputRightIcons}>
                  <ChatComposerExtras
                    dark={darkMode}
                    anchor="right"
                    onPickEmoji={handlePickEmoji}
                  />
                  <button
                    type="button"
                    className={styles.inputIconButton}
                    title="Attach Image"
                    onClick={() => chatMediaInputRef.current?.click()}
                  >
                    <ImageIcon size={19} />
                  </button>
                  <button type="submit" className={styles.sendSubmitBtn} title="Send Message">
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : selectedConvId && (loadingConversations || loadingMessages || loadingTargetCreator) ? (
            <ChatScreenSkeleton light={!darkMode} />
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

          {loadingConversations ? (
            <div className={styles.profileSkeletonWrapper}>
              <div className={styles.profileSkeletonHeaderCard}>
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonAvatar}`} />
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonNameBar}`} />
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonUserBar}`} />
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonRatingBar}`} />
              </div>

              <div className={styles.profileSkeletonCard}>
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonCardTitle}`} />
                <div className={styles.profileSkeletonRow}>
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonLabel}`} />
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonValue}`} />
                </div>
                <div className={styles.profileSkeletonRow}>
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonLabel}`} />
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonValue}`} />
                </div>
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonButton}`} />
              </div>

              <div className={styles.profileSkeletonCard}>
                <div className={`${styles.skeletonBlock} ${styles.profileSkeletonCardTitle}`} />
                <div className={styles.profileSkeletonRow}>
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonLabel}`} />
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonValue}`} />
                </div>
                <div className={styles.profileSkeletonRow}>
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonLabel}`} />
                  <div className={`${styles.skeletonBlock} ${styles.profileSkeletonValue}`} />
                </div>
              </div>
            </div>
          ) : selectedConv ? (
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
                  {selectedConv.user.hasSubscription && (
                    <span className={styles.statusActiveTag}>Active</span>
                  )}
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Plan</span>
                  <span className={styles.detailValue}>{selectedConv.user.subscriptionPlan}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Renewal Date</span>
                  <span className={styles.detailValue}>{selectedConv.user.renewalDate}</span>
                </div>

                <button className={styles.manageSubBtn}
                  onClick={() => navigateTo(`/subscriptions?highlight=${selectedConvId}`)}
                >
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
                  onClick={() => navigateTo(`/creator-profile/${selectedConv.user.username}`)}
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

      {/* Send Gift Panel Modal */}
      {showTipModal && selectedConv && (
        <GiftPanel
          receiverName={selectedConv.user.displayName}
          balance={balance}
          onSendGift={handleSendGiftInChat}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setShowTipModal(false)}
        />
      )}
      {callOverlays}
      {/* Chat Filters Sheet */}
      <ChatFiltersSheet {...filterSheetProps} />
    </div>
  );
};
