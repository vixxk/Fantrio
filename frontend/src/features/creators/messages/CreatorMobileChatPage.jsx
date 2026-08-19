import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { ReadReceipt } from '../../../components/ReadReceipt/ReadReceipt';
import { formatLastSeen } from '../../../utils/lastSeen';
import { ChevronLeft, MoreVertical, Send, Image as ImageIcon, Star, DollarSign, Gift, Ban, Lock, Check, Trash2, Unlock } from 'lucide-react';
import styles from './CreatorMobileChatPage.module.css';
import { ChatComposerExtras } from '../../../components/ChatComposerExtras/ChatComposerExtras';
import { insertEmojiAtCaret } from '../../../components/ChatComposerExtras/chatComposerUtils';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useToast } from '../../../components/Toast/Toast';
import { useAppDialog } from '../../../components/AppDialog/AppDialog';
import { PpvMediaDialog } from '../../../components/PpvMediaDialog/PpvMediaDialog';
import { GiftMessageCard, parseGiftMessage } from '../../gifts/GiftMessageCard';

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

const mapMessage = (m, currentUserId) => {
  const isCreator = String(m.senderId) === String(currentUserId);
  const mediaType = m.mediaType || 'media';
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
    mediaType,
    title: mediaType === 'image' ? 'Exclusive Photo' : mediaType === 'video' ? 'Premium Video' : 'Exclusive Media',
    textSub: m.isPaywall ? (isCreator ? 'Locked — fan needs to pay' : 'Locked — pay to view') : '',
    previewUrl: m.mediaUrl || '',
    read: !!m.isOpened,
    createdAt: m.createdAt
  };
};

export const CreatorMobileChatPage = () => {
  const { darkMode, currentPath, navigateTo, user } = useApp();
  const { toast } = useToast();
  const { prompt } = useAppDialog();
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [fan, setFan] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const mediaInputRef = useRef(null);
  // Media file picked by the creator — drives the Send Media (free / PPV) popup
  const [pendingMedia, setPendingMedia] = useState(null);
  // Live "Fan unlocked your media" notices for this fan (realtime only)
  const [unlockNotices, setUnlockNotices] = useState([]);

  const fanId = currentPath.split('/').filter(Boolean).pop();
  const currentUserId = user?.id || null;

  // Favorite fans (persisted locally, same store as the messages list page)
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('favoriteFans') || '[]'));
    } catch {
      return new Set();
    }
  });
  const isFavorite = fanId ? favoriteIds.has(fanId) : false;

  const toggleFavorite = () => {
    if (!fanId) return;
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(fanId)) next.delete(fanId);
      else next.add(fanId);
      try {
        localStorage.setItem('favoriteFans', JSON.stringify([...next]));
      } catch (err) {
        console.error('Failed to persist favorites:', err);
      }
      return next;
    });
  };

  // Delete conversation — shared confirm dialog state machine
  const {
    target: deleteChatTarget,
    open: openDeleteChat,
    close: closeDeleteChat,
    confirm: confirmDeleteChat,
    deleting: deletingChat,
  } = useConfirmDelete({
    onConfirm: () => api.delete(`/chat/conversation/${fanId}`),
    successMessage: 'Conversation deleted',
    errorMessage: 'Failed to delete conversation. Please try again.',
    onSuccess: () => navigateTo('/creators/messages'),
  });

  const requestDeleteChat = () => {
    setShowMenu(false);
    openDeleteChat({ fanId });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Load fan info + messages from the real chat API
  useEffect(() => {
    if (!fanId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get('/chat/conversations'),
          api.get(`/chat/messages/${fanId}`)
        ]);
        if (cancelled) return;
        const conv = (convRes.conversations || []).find(
          (c) => String(c._id && c._id._id ? c._id._id : c._id) === fanId
        );
        if (conv) {
          const profile = conv.profile || {};
          setFan({
            displayName: conv._id.displayName || conv._id.username || 'Fan',
            username: conv._id.username || '',
            avatarUrl: conv._id.avatarUrl || DEFAULT_AVATAR,
            isVerified: !!profile.isVerifiedBadge,
            isOnline: !!profile.isOnline,
            lastSeenAt: profile.lastSeenAt || null,
            isTopFan: false
          });
        }
        setMessages((msgRes.messages || []).map((m) => mapMessage(m, currentUserId)));
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fanId]);

  // Real-time delivery via Socket.io
  useEffect(() => {
    if (!currentUserId || !fanId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onNewMessage = (msg) => {
        const otherId = String(msg.senderId) === String(currentUserId)
          ? String(msg.receiverId)
          : String(msg.senderId);
        if (otherId === fanId) {
          setMessages((prev) => [...prev, mapMessage(msg, currentUserId)]);
          // The user is actively viewing this conversation — mark the new
          // message as read on the server so the unread badge stays accurate.
          api.post(`/chat/read/${fanId}`).catch(() => {});
        }
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [fanId, currentUserId]);

  // Live presence — keep the header's Online / "Last seen …" line in sync when
  // the fan goes online or offline on any device.
  useEffect(() => {
    if (!currentUserId || !fanId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onPresenceChange = ({ userId, isOnline, lastSeenAt }) => {
        if (!userId || String(userId) !== fanId) return;
        setFan(prev => prev ? {
          ...prev,
          isOnline: !!isOnline,
          ...(lastSeenAt ? { lastSeenAt } : {})
        } : prev);
      };
      socket.on('user_presence_change', onPresenceChange);
      return () => { socket.off('user_presence_change', onPresenceChange); };
    } catch (err) {
      console.error('Socket init for presence failed:', err);
    }
  }, [fanId, currentUserId]);

  // Live read receipts — when the fan reads our messages (here or on another
  // device), flip the sent ticks to read ticks in real time.
  useEffect(() => {
    if (!currentUserId || !fanId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onMessagesRead = (payload) => {
        const peerId = payload && payload.peerId ? String(payload.peerId) : null;
        if (!peerId || peerId !== fanId) return;
        const ids = payload && Array.isArray(payload.messageIds) ? payload.messageIds.map(String) : [];
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        setMessages(prev => {
          if (!prev.some(m => idSet.has(m.id) && !m.read)) return prev;
          return prev.map(m => (idSet.has(m.id) ? { ...m, read: true } : m));
        });
      };
      socket.on('messages_read', onMessagesRead);
      return () => { socket.off('messages_read', onMessagesRead); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [fanId, currentUserId]);

  // Live notice when the fan unlocks one of our paywalled media messages
  useEffect(() => {
    if (!currentUserId || !fanId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onMessageUnlocked = (payload) => {
        const unlockingFan = payload && payload.unlockedBy ? String(payload.unlockedBy) : null;
        if (!unlockingFan || unlockingFan !== fanId) return;
        setUnlockNotices(prev => [
          ...prev,
          { id: `${payload.messageId}-${Date.now()}`, coinPrice: payload.coinPrice || 0 }
        ]);
      };
      socket.on('message_unlocked', onMessageUnlocked);
      return () => { socket.off('message_unlocked', onMessageUnlocked); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [fanId, currentUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !fanId) return;
    const content = inputText.trim();
    try {
      const res = await api.post('/chat/message', { receiverId: fanId, content });
      if (res.status === 'success' && res.message) {
        setMessages((prev) => [...prev, mapMessage(res.message, currentUserId)]);
      }
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleBack = () => {
    navigateTo('/creators/messages');
  };

  // Upload a picked image (via presigned URL) and send it as a media message
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
    if (!file || !fanId) return;
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
        receiverId: fanId,
        content: '',
        mediaUrl,
        mediaType,
        isPaywall,
        coinPrice: isPaywall ? price : 0
      });
      if (msgRes.status === 'success' && msgRes.message) {
        setMessages((prev) => [...prev, mapMessage(msgRes.message, currentUserId)]);
        setPendingMedia(null);
      } else {
        throw new Error('Failed to send media.');
      }
    } catch (err) {
      console.error('Failed to send media:', err);
      toast.error('Failed to send media. Please try again.');
    }
  };

  // Insert a picked emoji at the caret position of the chat input
  const handlePickEmoji = (emoji) => {
    setInputText((prev) => insertEmojiAtCaret(prev, emoji, inputRef.current));
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    navigateTo('/creators/subscribers');
  };

  const handleSendTip = async () => {
    setShowMenu(false);
    const amount = await prompt({
      title: 'Send a Tip',
      message: `Send a coin tip to ${fan?.displayName || 'this fan'}.`,
      placeholder: 'Tip amount (coins)',
      initialValue: '10',
      confirmLabel: 'Send Tip'
    });
    const parsed = Math.floor(Number(amount));
    if (!amount || Number.isNaN(parsed) || parsed <= 0) return;
    try {
      await api.post(`/monetization/tip/${fanId}`, { coins: parsed });
      const text = `Sent ${parsed} coin${parsed === 1 ? '' : 's'} tip to ${fan?.displayName || 'fan'}`;
      setMessages((prev) => [...prev, mapMessage({ _id: `tip-${Date.now()}`, content: `💸 ${text}`, senderId: currentUserId, receiverId: fanId, createdAt: new Date().toISOString() }, currentUserId)]);
    } catch (err) {
      console.error('Failed to send tip:', err);
      toast.error('Failed to send tip. Please try again.');
    }
  };

  const handleSendPpv = async () => {
    setShowMenu(false);
    const price = await prompt({
      title: 'PPV Offer',
      message: 'Set the price fans must pay to unlock this media.',
      placeholder: 'Price (coins)',
      initialValue: '10',
      confirmLabel: 'Send Offer'
    });
    const parsed = Math.floor(Number(price));
    if (!price || Number.isNaN(parsed) || parsed <= 0) return;
    try {
      const res = await api.post('/chat/message', {
        receiverId: fanId,
        content: 'PPV offer — pay to unlock',
        isPaywall: true,
        coinPrice: parsed,
        mediaType: 'media'
      });
      if (res.status === 'success' && res.message) {
        setMessages((prev) => [...prev, mapMessage(res.message, currentUserId)]);
      }
    } catch (err) {
      console.error('Failed to send PPV offer:', err);
      toast.error('Failed to send PPV offer. Please try again.');
    }
  };

  // Block fan — shared confirm dialog state machine
  const {
    target: blockTarget,
    open: openBlock,
    close: closeBlock,
    confirm: confirmBlockUser,
    deleting: blocking,
  } = useConfirmDelete({
    onConfirm: () => api.post(`/block/${fanId}`),
    successMessage: () => `${fan?.displayName || 'User'} blocked`,
    errorMessage: 'Failed to block user. Please try again.',
    onSuccess: () => navigateTo('/creators/messages'),
  });

  const handleBlockUser = () => {
    setShowMenu(false);
    openBlock({ fanId });
  };

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} type="button">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.userBlock}>
          <div className={styles.avatarWrap}>
            <img src={fan?.avatarUrl || DEFAULT_AVATAR} alt={fan?.displayName || 'Fan'} className={styles.avatar} />
            {fan?.isOnline && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.displayName}>
              {fan?.displayName || 'Fan'}
              {fan?.isTopFan && <Star size={12} fill="#eab308" color="#eab308" />}
            </div>
            <span className={styles.status}>{fan?.isOnline ? 'Online' : formatLastSeen(fan?.lastSeenAt)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${isFavorite ? styles.actionActive : ''}`}
            onClick={toggleFavorite}
            type="button"
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label="Toggle favorite"
          >
            <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className={styles.actionBtn} onClick={requestDeleteChat} type="button" title="Delete Conversation" aria-label="Delete conversation">
            <Trash2 size={20} />
          </button>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)} type="button">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} type="button" onClick={handleSendPpv}>
                  <Gift size={14} /> PPV Offer
                </button>
                <button className={`${styles.dropdownItem} ${styles.dangerItem}`} type="button" onClick={handleBlockUser}>
                  <Ban size={14} /> Block
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.messagesArea}>
        <div className={styles.dateSep}>
          <span>Today</span>
        </div>

        {loading && messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <ShimmerSkeleton variant="avatar" width="36px" height="36px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', borderBottomLeftRadius: '4px', padding: '0.6rem 0.9rem' }}>
                  <ShimmerSkeleton variant="text" width="70%" height="11px" />
                  <ShimmerSkeleton variant="text" width="45%" height="11px" marginTop="0.35rem" />
                </div>
                <ShimmerSkeleton variant="text" width="25%" height="8px" marginLeft="0.5rem" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(225,0,117,0.35), rgba(155,81,224,0.35))', borderRadius: '12px', borderBottomRightRadius: '4px', padding: '0.6rem 0.9rem' }}>
                  <ShimmerSkeleton variant="text" width="60%" height="11px" />
                  <ShimmerSkeleton variant="text" width="35%" height="11px" marginTop="0.35rem" />
                </div>
                <ShimmerSkeleton variant="text" width="20%" height="8px" marginRight="0.5rem" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <ShimmerSkeleton variant="avatar" width="36px" height="36px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', borderBottomLeftRadius: '4px', padding: '0.6rem 0.9rem' }}>
                  <ShimmerSkeleton variant="text" width="55%" height="11px" />
                </div>
                <ShimmerSkeleton variant="text" width="20%" height="8px" marginLeft="0.5rem" />
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isCreator = msg.sender === 'creator';
            const parsedGift = parseGiftMessage(msg);
            return (
              <div key={msg.id} className={`${styles.msgRow} ${isCreator ? styles.msgRight : styles.msgLeft}`}>
                {!isCreator && (
                  <img src={fan?.avatarUrl || DEFAULT_AVATAR} alt="" className={styles.msgAvatar} />
                )}
                <div className={styles.msgContent}>
                  {parsedGift.isGift ? (
                    <GiftMessageCard msg={msg} isCreator={isCreator} />
                  ) : msg.isPaywall ? (
                    <div className={styles.paywall}>
                      <div className={styles.paywallPreview}>
                        {msg.previewUrl ? <img src={msg.previewUrl} alt="" className={styles.paywallImg} /> : <div className={styles.paywallImg} style={{ background: 'linear-gradient(135deg, #1a1a2e, #e10075)' }} />}
                        {msg.isLocked && (
                          <div className={styles.lockOverlay}>
                            <Lock size={16} />
                          </div>
                        )}
                      </div>
                      <div className={styles.paywallInfo}>
                        <span className={styles.paywallLabel}>{msg.mediaType}</span>
                        <span className={styles.paywallDesc}>{msg.textSub}</span>
                      </div>
                      {msg.isLocked ? (
                        <div className={styles.paywallAction}>
                          <span className={styles.coinTag}>
                            <img src="/coin.png" alt="" className={styles.coinIcon} />
                            {msg.coinPrice} Coins
                          </span>
                          <button className={styles.unlockBtn} type="button">Unlock</button>
                        </div>
                      ) : (
                        <div className={styles.unlocked}>
                          <Check size={14} /> Unlocked
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`${styles.bubble} ${isCreator ? styles.bubbleCreator : styles.bubbleFan}`}>
                      {msg.previewUrl && msg.mediaType === 'video' ? (
                        <video src={msg.previewUrl} controls className={styles.msgMedia} />
                      ) : msg.previewUrl ? (
                        <img src={msg.previewUrl} alt="Media" className={styles.msgMedia} />
                      ) : null}
                      {msg.text && <p className={styles.bubbleText}>{msg.text}</p>}
                    </div>
                  )}
                  <span className={`${styles.time} ${isCreator ? styles.timeRight : styles.timeLeft}`}>
                    {msg.time}
                    {isCreator && <ReadReceipt read={msg.read} />}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {unlockNotices.map((n) => (
          <div key={n.id} className={styles.unlockNoticeRow}>
            <span className={styles.unlockNotice}>
              <Unlock size={11} className={styles.unlockNoticeIcon} />
              {fan?.displayName || 'A fan'} unlocked your media{n.coinPrice > 0 ? ` · +${n.coinPrice} coins` : ''}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePickMedia(file);
            e.target.value = '';
          }}
        />
        <button type="button" className={styles.inputIcon} title="Attach Image" aria-label="Attach image" onClick={() => mediaInputRef.current?.click()}>
          <ImageIcon size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Reply..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={styles.input}
        />
        <ChatComposerExtras
          dark={darkMode}
          anchor="right"
          onPickEmoji={handlePickEmoji}
        />
        <button type="submit" className={styles.sendBtn}>
          <Send size={18} />
        </button>
      </form>

      {/* Delete Chat Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteChatTarget}
        itemName={fan?.displayName || 'this fan'}
        title="Delete Conversation?"
        confirmLabel="Delete Chat"
        message={<>Are you sure you want to delete the conversation with <strong>{fan?.displayName || 'this fan'}</strong>?</>}
        deleting={deletingChat}
        darkMode={darkMode}
        onCancel={closeDeleteChat}
        onConfirm={confirmDeleteChat}
      />

      {/* Block Fan Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!blockTarget}
        itemName={fan?.displayName || 'this fan'}
        title="Block User?"
        confirmLabel="Block"
        busyLabel="Blocking…"
        icon={<Ban size={22} />}
        message={<>Are you sure you want to block <strong>{fan?.displayName || 'this fan'}</strong>? They won't be able to message you anymore.</>}
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
