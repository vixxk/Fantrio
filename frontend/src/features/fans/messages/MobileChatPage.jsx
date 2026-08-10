import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import { useToast } from '../../../components/Toast/Toast';
import { ChevronLeft, MoreVertical, Heart, Send, Smile, Image as ImageIcon, Lock, Check, Phone, Video, MessageSquare } from 'lucide-react';
import styles from './MobileChatPage.module.css';
import { ActiveCallOverlay } from '../../calls/ActiveCallOverlay/ActiveCallOverlay';
import { useOutgoingCall } from '../../../hooks/useOutgoingCall';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { QuickRecharge } from '../../gifts/QuickRecharge';
import { ChatScreenSkeleton } from '../../../components/ChatThreadSkeleton/ChatThreadSkeleton';

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
    isPaywall: !!m.isPaywall,
    isLocked: !!m.isLocked,
    coinPrice: m.coinPrice || 0,
    mediaType,
    title: mediaType === 'image' ? 'Exclusive Photo' : mediaType === 'video' ? 'Premium Video' : 'Exclusive Media',
    textSub: m.isPaywall ? (isUser ? 'Unlocked media you sent' : 'Unlock to view this exclusive content') : '',
    previewUrl: m.mediaUrl || '',
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
    setIsSpeakerOn: setAudioSpeakerOn,
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
    setIsSpeakerOn: setVideoSpeakerOn,
    attachRemote: attachVideoRemote,
    attachLocal: attachVideoLocal,
    formatDuration: formatVideoDuration
  } = useOutgoingCall({ type: 'video' });

  const activeCallForGifts = audioCall || videoCall;

  const { events: callGiftEvents, sendGift: sendCallGift } = useGiftEvents({
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
                isOnline: !!profile.isOnline,
                isBusy: !!profRes.isBusy,
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
        }
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [convId, currentUserId]);

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

  const handleUnlock = async (msgId, price) => {
    if (balance < price) {
      toast.error(`Insufficient coins! You need ${price} Coins to unlock this media.`);
      return;
    }
    try {
      const res = await api.post(`/chat/message/${msgId}/unlock`);
      if (res.status === 'success') {
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isLocked: false } : m)));
        refreshBalance();
      }
    } catch (err) {
      console.error('Failed to unlock message:', err);
      toast.error(err.message || 'Failed to unlock. Please try again.');
    }
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
            <span className={styles.status}>{peer.isBusy ? 'Busy' : (peer.isOnline ? 'Online' : 'Offline')}</span>
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
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRight : styles.msgLeft}`}>
              {!isMe && peer.avatarUrl && (
                <img src={peer.avatarUrl} alt="" className={styles.msgAvatar} />
              )}
                <div className={styles.msgContent}>
                  {msg.isPaywall ? (
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
                      <p className={styles.bubbleText}>{msg.text}</p>
                    </div>
                  )}
                  <span className={`${styles.time} ${isMe ? styles.timeRight : styles.timeLeft}`}>{msg.time}</span>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <button type="button" className={styles.inputIcon}><ImageIcon size={20} /></button>
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={styles.input}
        />
        <button type="button" className={styles.inputIcon}><Smile size={20} /></button>
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
          onToggleSpeaker={() => setAudioSpeakerOn(!audioSpeakerOn)}
          onHangUp={endAudioCall}
          onOpenGift={() => setGiftOpen(true)}
          onRecharge={() => setRechargeOpen(true)}
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
          onToggleSpeaker={() => setVideoSpeakerOn(!videoSpeakerOn)}
          isCameraOff={videoCameraOff}
          onToggleCamera={toggleVideoCamera}
          onHangUp={endVideoCall}
          onOpenGift={() => setGiftOpen(true)}
          onRecharge={() => setRechargeOpen(true)}
          remoteStream={videoRemoteStream}
          attachRemote={attachVideoRemote}
          attachLocal={attachVideoLocal}
        />
      )}

      {activeCallForGifts && activeCallForGifts.status === 'active' && <GiftOverlay events={callGiftEvents} />}
      {giftOpen && (
        <GiftPanel
          receiverName={activeCallForGifts?.creator?.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => sendCallGift(gift)}
          onRecharge={() => { setGiftOpen(false); setRechargeOpen(true); }}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}
    </div>
  );
};
