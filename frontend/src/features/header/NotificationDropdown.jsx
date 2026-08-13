import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
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

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = [];

      // 1. Fetch Conversations / Messages
      try {
        const chatRes = await api.get('/chat/conversations');
        const conversations = chatRes.conversations || [];
        conversations.forEach((c) => {
          if (c.unreadCount > 0 || c.lastMessage) {
            const isUnread = c.unreadCount > 0;
            const otherName = c.displayName || c.username || 'User';
            items.push({
              id: `msg_${c._id}_${c.lastMessageAt || Date.now()}`,
              type: 'message',
              title: `Message from ${otherName}`,
              snippet: c.lastMessage || 'Sent you a message',
              time: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
              avatarUrl: c.avatarUrl && !c.avatarUrl.includes('unsplash.com') ? c.avatarUrl : '/profile.png',
              conversationId: c._id,
              username: c.username,
              isUnread: isUnread && !readIds.includes(`msg_${c._id}_${c.lastMessageAt || Date.now()}`),
              targetRoute: user.role === 'creator' ? '/creators/messages' : '/messages'
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

      // Report unread count up
      const totalUnread = items.filter((i) => i.isUnread).length;
      if (onUnreadCountChange) onUnreadCountChange(totalUnread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, readIds, onUnreadCountChange]);

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
    if (onUnreadCountChange) onUnreadCountChange(0);
  };

  const handleItemClick = (item) => {
    if (item.isUnread) {
      const updated = Array.from(new Set([...readIds, item.id]));
      setReadIds(updated);
      try {
        localStorage.setItem(`read_notifications_${user?.id}`, JSON.stringify(updated));
      } catch (e) {}
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n)));
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
                <p className={styles.itemSnippet}>{item.snippet}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
