import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getSocket, joinSocketRoom } from '../../services/socket';
import { 
  Bell, Landmark, Megaphone, CheckCheck 
} from 'lucide-react';
import styles from './NotificationDropdown.module.css';

export const NotificationDropdown = ({ isOpen, onClose, onUnreadCountChange, isCreatorPage }) => {
  const { user, darkMode, navigateTo, setActiveTab } = useApp();
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`read_notifications_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  useEffect(() => {
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = [];

      // 1. Fetch Conversations / Messages
      try {
        const chatRes = await api.get('/chat/conversations');
        const conversations = chatRes.conversations || [];
        conversations.forEach((c, idx) => {
          if (c.unreadCount > 0 || c.lastMessage) {
            const isUnread = c.unreadCount > 0;
            const peer = (c._id && typeof c._id === 'object') ? c._id : (c.user && typeof c.user === 'object') ? c.user : null;
            const otherName = peer?.displayName || peer?.username || c.displayName || c.username || 'User';
            const convId = peer?._id || peer?.id || (typeof c._id === 'string' ? c._id : idx);

            let snippetText = 'Sent you a message';
            if (typeof c.lastMessage === 'string') {
              snippetText = c.lastMessage;
            } else if (c.lastMessage && typeof c.lastMessage === 'object') {
              snippetText = c.lastMessage.content || c.lastMessage.text || (c.lastMessage.isGift ? `${c.lastMessage.giftEmoji || '🎁'} Sent ${c.lastMessage.giftName || 'a gift'} (${(c.lastMessage.giftCoins || 0).toLocaleString()} Coins)!` : 'Sent you a message');
            }

            const lastMsgDate = c.lastMessage?.createdAt || c.lastMessageAt;
            const timestamp = lastMsgDate ? new Date(lastMsgDate).getTime() : Date.now();
            const itemId = `msg_${convId}_${timestamp}`;

            items.push({
              id: itemId,
              type: 'message',
              title: `Message from ${otherName}`,
              snippet: String(snippetText || 'Sent you a message'),
              time: lastMsgDate ? new Date(lastMsgDate) : new Date(),
              avatarUrl: peer?.avatarUrl || c.avatarUrl || '/profile.png',
              conversationId: convId,
              username: peer?.username || c.username,
              isUnread: isUnread && !readIds.includes(itemId),
              targetRoute: user?.role === 'creator' ? '/creators/messages' : '/messages'
            });
          }
        });
      } catch (err) {
        console.warn('Failed to load chat notifications:', err);
      }

      // 2. Fetch Wallet Transactions (Coin Purchases / Bonuses)
      try {
        const txRes = await api.get('/wallet/transactions');
        const transactions = txRes.transactions || [];
        transactions.slice(0, 10).forEach((tx) => {
          if (tx.type === 'deposit' || tx.gateway === 'referral_bonus' || tx.gateway === 'promo') {
            const isPromo = tx.gateway === 'promo';
            const isRef = tx.gateway === 'referral_bonus';
            let title = 'Coins Purchased';
            if (isPromo) title = 'Promo Code Claimed';
            if (isRef) title = 'Referral Bonus';

            items.push({
              id: `tx_${tx._id}`,
              type: 'coins',
              title,
              snippet: `+${tx.amountCoins || 0} coins credited to your wallet balance.`,
              time: new Date(tx.createdAt),
              isUnread: !readIds.includes(`tx_${tx._id}`),
              targetRoute: '/buy-coins'
            });
          }
        });
      } catch (err) {
        console.warn('Failed to load wallet notifications:', err);
      }

      // 3. Fetch Admin Announcements
      try {
        const annRes = await api.get('/more/announcements');
        const announcements = annRes.announcements || [];
        announcements.slice(0, 5).forEach((ann) => {
          items.push({
            id: `ann_${ann._id}`,
            type: 'announcement',
            title: ann.title || 'Platform Announcement',
            snippet: ann.content || 'New update published by Fantrio team.',
            time: new Date(ann.createdAt),
            category: ann.category,
            isUnread: !readIds.includes(`ann_${ann._id}`),
            targetRoute: user?.role === 'creator' ? '/creators/announcements' : '/more/announcements'
          });
        });
      } catch (err) {
        console.warn('Failed to load announcement notifications:', err);
      }

      // Sort by newest first
      items.sort((a, b) => b.time - a.time);
      setNotifications(items);

      // Report unread count up to Header badge
      const totalUnread = items.filter((i) => i.isUnread).length;
      if (onUnreadCountChangeRef.current) {
        onUnreadCountChangeRef.current(totalUnread);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, readIds]);

  // Load notifications automatically on mount / user change
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  // Subscribe to real-time socket events & background polling so the bell badge stays up to date continuously
  useEffect(() => {
    if (!user?.id) return;

    let socket = null;
    let debounceTimer = null;

    const scheduleRefresh = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadNotifications();
      }, 300);
    };

    try {
      socket = getSocket();
      joinSocketRoom(user.id);

      socket.on('new_message', scheduleRefresh);
      socket.on('message_deleted', scheduleRefresh);
      socket.on('conversation_deleted', scheduleRefresh);
      socket.on('balance_updated', scheduleRefresh);
      socket.on('transaction_created', scheduleRefresh);
      socket.on('announcement_created', scheduleRefresh);
      socket.on('notification_updated', scheduleRefresh);
    } catch (err) {
      console.warn('Socket listener for notifications warning:', err);
    }

    // Interval polling every 15s to keep notifications up-to-date automatically
    const pollInterval = setInterval(() => {
      loadNotifications();
    }, 15000);

    // Refresh when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (socket) {
        socket.off('new_message', scheduleRefresh);
        socket.off('message_deleted', scheduleRefresh);
        socket.off('conversation_deleted', scheduleRefresh);
        socket.off('balance_updated', scheduleRefresh);
        socket.off('transaction_created', scheduleRefresh);
        socket.off('announcement_created', scheduleRefresh);
        socket.off('notification_updated', scheduleRefresh);
      }
      clearTimeout(debounceTimer);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, loadNotifications]);

  // Refresh when dropdown is opened explicitly
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!event.target.closest(`[class*="bellButton"]`)) {
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

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(`read_notifications_${user?.id}`, JSON.stringify(updated));
    } catch (e) {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    if (onUnreadCountChangeRef.current) {
      onUnreadCountChangeRef.current(0);
    }
  };

  const handleItemClick = (item) => {
    if (item.isUnread) {
      const updated = Array.from(new Set([...readIds, item.id]));
      setReadIds(updated);
      try {
        localStorage.setItem(`read_notifications_${user?.id}`, JSON.stringify(updated));
      } catch (e) {}
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n));
        const totalUnread = next.filter((i) => i.isUnread).length;
        if (onUnreadCountChangeRef.current) {
          onUnreadCountChangeRef.current(totalUnread);
        }
        return next;
      });
    }

    if (item.targetRoute) {
      navigateTo(item.targetRoute);
    } else if (item.targetTab) {
      setActiveTab(item.targetTab);
    }
    onClose();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const formatTimeAgo = (date) => {
    if (!date || Number.isNaN(date.getTime())) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const themeClass = !darkMode 
    ? styles.lightTheme 
    : (isCreatorPage ? styles.creatorTheme : '');

  return (
    <div 
      className={`${styles.notificationContainer} ${themeClass}`}
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Notifications</h3>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markReadBtn} onClick={markAllAsRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Notification Items List */}
      <div className={styles.listContent}>
        {loading && notifications.length === 0 ? (
          <div className={styles.skeletonContainer}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonItem}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonSnippet} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={28} className={styles.emptyIcon} />
            <span className={styles.emptyText}>No notifications here yet</span>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.isUnread ? styles.unreadItem : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.type === 'message' ? (
                <img
                  src={item.avatarUrl}
                  alt="Sender avatar"
                  className={styles.itemAvatar}
                />
              ) : item.type === 'coins' ? (
                <div className={`${styles.iconWrapper} ${styles.iconCoins}`}>
                  <Landmark size={18} />
                </div>
              ) : (
                <div className={`${styles.iconWrapper} ${styles.iconAnnouncement}`}>
                  <Megaphone size={18} />
                </div>
              )}

              <div className={styles.itemBody}>
                <div className={styles.itemTitleRow}>
                  <div className={styles.itemTitleWrap}>
                    {item.isUnread && <span className={styles.unreadDot} />}
                    <span className={styles.itemTitle}>{item.title}</span>
                  </div>
                  <span className={styles.itemTime}>{formatTimeAgo(item.time)}</span>
                </div>
                <p className={styles.itemSnippet}>
                  {typeof item.snippet === 'object' ? (item.snippet.content || item.snippet.text || 'New message') : String(item.snippet || '')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

