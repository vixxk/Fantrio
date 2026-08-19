import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import { useToast } from '../../../components/Toast/Toast';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { ChevronLeft, MoreVertical, Heart, Send, Smile, Image as ImageIcon, Lock, Check, Phone, Video, MessageSquare } from 'lucide-react';
import styles from './MobileChatPage.module.css';
import { ActiveCallOverlay } from '../../calls/ActiveCallOverlay/ActiveCallOverlay';
import { useOutgoingCall } from '../../../hooks/useOutgoingCall';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { QuickRecharge } from '../../gifts/QuickRecharge';
import { ChatScreenSkeleton } from '../../../components/ChatThreadSkeleton/ChatThreadSkeleton';
import { ReadReceipt } from '../../../components/ReadReceipt/ReadReceipt';
import { formatLastSeen } from '../../../utils/lastSeen';
import { GiftMessageCard, parseGiftMessage } from '../../gifts/GiftMessageCard';
import { ChatComposerExtras } from '../../../components/ChatComposerExtras/ChatComposerExtras';
import { insertEmojiAtCaret } from '../../../components/ChatComposerExtras/chatComposerUtils';

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

export const MobileChatPage = () => {
  const { darkMode, currentPath, navigateTo, user, balance, refreshBalance } = useApp();
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  const convId = currentPath.split('/').filter(Boolean).pop();
  const currentUserId = user?.id || null;

  // ---- 1:1 call connection (identical logic to the Audio/Video Calls pages) ----
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

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

  const activeCallForGifts = audioCall || videoCall;

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

  const buildCallCreator = (p) => ({
    _id: convId,
    userId: convId,
    displayName: p.displayName,
    username: p.username,
    avatarUrl: p.avatarUrl,
    audioCallPerMin: p.audioRate,
    videoCallPerMin: p.videoRate,
    isBusy: !!p.isBusy,
    isOnline: p.isOnline
  });

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

  // Load conversation peer + messages from the real chat API
  useEffect(() => {
    if (!convId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get('/chat/conversations'),
          api.get(`/chat/messages/${convId}`)
        ]);
        if (cancelled) return;
        const conv = (convRes.conversations || []).find(
          (c) => String(c._id && c._id._id ? c._id._id : c._id) === convId
        );
        if (conv) {
          const profile = conv.profile || {};
          setPeer({
            displayName: conv._id.displayName || conv._id.username || '',
            username: conv._id.username || '',
            avatarUrl: conv._id.avatarUrl || '',
            isVerified: !!profile.isVerifiedBadge,
            isOnline: !!profile.isOnline,
            isBusy: !!profile.isBusy,
            lastSeenAt: profile.lastSeenAt || null,
            audioRate: (profile.rates && profile.rates.audioCallPerMin) || 0,
            videoRate: (profile.rates && profile.rates.videoCallPerMin) || 0,
            audioAvailable: profile.audioAvailable !== false,
            videoAvailable: profile.videoAvailable !== false
          });
        } else {
          // No prior conversation yet — fetch the creator's real profile so the
          // header never falls back to placeholder/mock values on direct URLs.
          try {
            const profRes = await api.get(`/creators/by-user/${convId}`);
            if (cancelled) return;
            const profile = profRes.creator || null;
            if (profile) {
              const rates = profile.rates || {};
              setPeer({
                displayName: profile.displayName || profile.username || '',
                username: profile.username || '',
                avatarUrl: profile.avatarUrl || '',
                isVerified: !!profile.isVerifiedBadge,
                isOnline: profRes.isOnline !== undefined ? !!profRes.isOnline : !!profile.isOnline,
                isBusy: !!profRes.isBusy,
                lastSeenAt: profRes.lastSeenAt || null,
                audioRate: rates.audioCallPerMin || 0,
                videoRate: rates.videoCallPerMin || 0,
                audioAvailable: profile.audioAvailable !== false,
                videoAvailable: profile.videoAvailable !== false
              });
            }
          } catch (e) {
            console.error('Failed to load target creator for chat:', e);
          }
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
  }, [convId]);

  // Real-time delivery via Socket.io
  useEffect(() => {
    if (!currentUserId || !convId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onNewMessage = (msg) => {
        const otherId = String(msg.senderId) === String(currentUserId)
          ? String(msg.receiverId)
          : String(msg.senderId);
        if (otherId === convId) {
          setMessages((prev) => [...prev, mapMessage(msg, currentUserId)]);
          // The user is actively viewing this conversation — mark the new
          // message as read on the server so the unread badge stays accurate.
          api.post(`/chat/read/${convId}`).catch(() => {});
        }
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [convId, currentUserId]);

  // Live presence — keep the header's Online / "Last seen …" line in sync when
  // the peer goes online or offline on any device.
  useEffect(() => {
    if (!currentUserId || !convId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onPresenceChange = ({ userId, isOnline, lastSeenAt }) => {
        if (!userId || String(userId) !== convId) return;
        setPeer(prev => prev ? {
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
  }, [convId, currentUserId]);

  // Live read receipts — when the creator reads our messages (here or on
  // another device), flip the sent ticks to read ticks in real time.
  useEffect(() => {
    if (!currentUserId || !convId) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(currentUserId);
      const onMessagesRead = (payload) => {
        const peerId = payload && payload.peerId ? String(payload.peerId) : null;
        if (!peerId || peerId !== convId) return;
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
  }, [convId, currentUserId]);

  const mediaInputRef = useRef(null);
  const inputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !convId) return;
    const content = inputText.trim();
    try {
      const res = await api.post('/chat/message', { receiverId: convId, content });
      if (res.status === 'success' && res.message) {
        setMessages((prev) => [...prev, mapMessage(res.message, currentUserId)]);
      }
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleSendImage = async (file) => {
    if (!file || !convId) return;
    const fileType = file.type || 'image/jpeg';
    const mediaType = fileType.startsWith('video/') ? 'video' : 'image';
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
        receiverId: convId,
        content: '',
        mediaUrl,
        mediaType
      });
      if (msgRes.status === 'success' && msgRes.message) {
        setMessages((prev) => [...prev, mapMessage(msgRes.message, currentUserId)]);
      }
    } catch (err) {
      console.error('Failed to send image:', err);
      toast.error('Failed to send image. Please try again.');
    }
  };

  const handlePickEmoji = (emoji) => {
    setInputText((prev) => insertEmojiAtCaret(prev, emoji, inputRef.current));
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
    onSuccess: ({ msgId }) => {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isLocked: false } : m)));
      refreshBalance();
    },
  });

  const handleUnlock = (msgId, price) => {
    if (balance < price) {
      toast.error(`Insufficient coins! You need ${price} Coins to unlock this media.`);
      return;
    }
    openUnlock({ msgId, price });
  };

  const handleBack = () => {
    navigateTo('/messages');
  };

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      {loading ? (
        <ChatScreenSkeleton light={!darkMode} />
      ) : !peer ? (
        <div className={styles.emptyState}>
          <MessageSquare size={42} className={styles.emptyIcon} />
          <p>This conversation could not be loaded.</p>
          <button type="button" className={styles.emptyBackBtn} onClick={handleBack}>
            Back to Messages
          </button>
        </div>
      ) : (
      <>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} type="button">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.userBlock} onClick={() => setShowMenu(false)}>
          <div className={styles.avatarWrap}>
            {peer.avatarUrl ? (
              <img src={peer.avatarUrl} alt={peer.displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {(peer.displayName || peer.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {peer.isOnline && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.nameBlock}>
            <div className={styles.displayName}>
              {peer.displayName || peer.username}
              {peer.isVerified && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="vBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e10075" />
                      <stop offset="100%" stopColor="#7e00f3" />
                    </linearGradient>
                  </defs>
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" fill="url(#vBadge)" />
                  <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={styles.status}>{peer.isBusy ? 'Busy' : (peer.isOnline ? 'Online' : formatLastSeen(peer.lastSeenAt))}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} type="button">
            <Heart size={20} fill="#ff003b" color="#ff003b" />
          </button>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.actionBtn} onClick={() => setShowMenu(!showMenu)} type="button">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropdownItem} ${styles.callItem}`}
                  type="button"
                  onClick={() => { if (peer) startAudioCall(buildCallCreator(peer)); setShowMenu(false); }}
                  disabled={!peer.isOnline || peer.isBusy || !peer.audioAvailable}
                >
                  <div className={styles.callItemInner}>
                    <Phone size={14} className={styles.audioIcon} />
                    <div className={styles.callTextCol}>
                      <span className={styles.callLabelAudio}>Audio Call</span>
                      <span className={styles.callCost}>{!peer.isOnline ? 'Offline' : (peer.isBusy ? 'Busy' : (!peer.audioAvailable ? 'Unavailable' : `${peer.audioRate} coins/min`))}</span>
                    </div>
                  </div>
                </button>
                <button
                  className={`${styles.dropdownItem} ${styles.callItem}`}
                  type="button"
                  onClick={() => { if (peer) startVideoCall(buildCallCreator(peer)); setShowMenu(false); }}
                  disabled={!peer.isOnline || peer.isBusy || !peer.videoAvailable}
                >
                  <div className={styles.callItemInner}>
                    <Video size={14} className={styles.videoIcon} />
                    <div className={styles.callTextCol}>
                      <span className={styles.callLabelVideo}>Video Call</span>
                      <span className={styles.callCost}>{!peer.isOnline ? 'Offline' : (peer.isBusy ? 'Busy' : (!peer.videoAvailable ? 'Unavailable' : `${peer.videoRate} coins/min`))}</span>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.messagesArea}>
        {messages[0]?.createdAt && (
          <div className={styles.dateSep}>
            <span>{new Date(messages[0].createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender === 'user';
          const parsedGift = parseGiftMessage(msg);
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRight : styles.msgLeft}`}>
              {!isMe && (
                <img src={peer.avatarUrl || '/profile.png'} alt="" className={styles.msgAvatar} />
              )}
                <div className={styles.msgContent}>
                  {parsedGift.isGift ? (
                    <GiftMessageCard msg={msg} isCreator={!isMe} />
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
                      {msg.isLocked && !isMe ? (
                        <div className={styles.paywallAction}>
                          <span className={styles.coinTag}>
                            <img src="/coin.png" alt="" className={styles.coinIcon} />
                            {msg.coinPrice} Coins
                          </span>
                          <button
                            className={styles.unlockBtn}
                            type="button"
                            onClick={() => handleUnlock(msg.id, msg.coinPrice)}
                          >
                            Unlock
                          </button>
                        </div>
                      ) : (
                        <div className={styles.unlocked}>
                          <Check size={14} /> Unlocked
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                      {msg.mediaUrl && msg.mediaType === 'video' ? (
                        <video src={msg.mediaUrl} controls className={styles.msgMedia} />
                      ) : msg.mediaUrl ? (
                        <img src={msg.mediaUrl} alt="Media" className={styles.msgMedia} />
                      ) : null}
                      {msg.text && <p className={styles.bubbleText}>{msg.text}</p>}
                    </div>
                  )}
                  <span className={`${styles.time} ${isMe ? styles.timeRight : styles.timeLeft}`}>
                    {msg.time}
                    {isMe && <ReadReceipt read={msg.read} />}
                  </span>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleSendImage(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
        <button
          type="button"
          className={styles.inputIcon}
          title="Attach Image"
          onClick={() => mediaInputRef.current?.click()}
        >
          <ImageIcon size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
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
      </>
      )}

      {/* ===== Active call overlays (shared with the Audio/Video Calls pages) ===== */}
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

      {activeCallForGifts && activeCallForGifts.status === 'active' && <GiftOverlay events={callGiftEvents} />}
      {giftOpen && (
        <GiftPanel
          receiverName={activeCallForGifts?.creator?.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => sendCallGift(gift)}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}

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
    </div>
  );
};
