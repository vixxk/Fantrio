import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useLiveStreamHost } from '../../../hooks/useLiveStreamHost';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { useStreamChat } from '../../../hooks/useStreamChat';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { StreamLeaderboardModal } from '../../gifts/StreamLeaderboardModal';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Radio,
  Eye,
  Clock,
  Trophy,
  Send,
  Power,
  X,
  BadgeCheck
} from 'lucide-react';
import styles from './CreatorLiveStreamOverlay.module.css';

const formatTimer = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const CreatorLiveStreamOverlay = ({ liveStream, onEndStream }) => {
  const { darkMode, user } = useApp();

  // Host WebRTC / Agora manager
  const {
    isCameraOn,
    isMuted,
    durationSeconds,
    startHost,
    stopHost,
    toggleCamera,
    toggleMute,
    attachLocalVideo
  } = useLiveStreamHost();

  // Live gift events + leaderboard
  const { events: giftEvents, leaderboard: giftLeaderboard, summary: giftSummary } = useGiftEvents({
    streamId: liveStream?._id || null,
    enabled: !!liveStream
  });

  // Live stream chat
  const { messages: chatMessages, sendMessage: sendChatMessage, sending: chatSending } = useStreamChat({
    streamId: liveStream?._id || null,
    enabled: !!liveStream
  });

  const [chatDraft, setChatDraft] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [endingStream, setEndingStream] = useState(false);
  const chatListRef = useRef(null);

  // Initialize Host session
  const roomId = liveStream?.roomId;
  const agoraToken = liveStream?.agoraToken;
  const userId = user?.id || user?._id;

  useEffect(() => {
    if (roomId && agoraToken && userId) {
      startHost({
        channel: roomId,
        token: agoraToken,
        uid: userId
      }).catch((err) => {
        console.warn('Host streaming auto-start error:', err);
      });
    }
    return () => {
      stopHost();
    };
  }, [roomId, agoraToken, userId]);

  // Auto scroll chat to newest message
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;
    const sent = await sendChatMessage(chatDraft);
    if (sent) setChatDraft('');
  };

  const handleConfirmEnd = async () => {
    if (endingStream) return;
    setEndingStream(true);
    try {
      if (liveStream?._id) {
        await api.post('/creators/live/end', { streamId: liveStream._id });
      }
    } catch (err) {
      console.error('Error ending live stream:', err);
    } finally {
      stopHost();
      setEndingStream(false);
      setShowConfirmEnd(false);
      if (onEndStream) onEndStream();
    }
  };

  if (!liveStream) return null;

  return (
    <div className={`${styles.overlayContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Video Stream Area */}
      <div className={styles.videoArea}>
        {/* Agora Video Container for Camera ON */}
        <div
          ref={(el) => attachLocalVideo(el)}
          className={styles.videoElement}
          style={{ display: isCameraOn ? 'block' : 'none' }}
        />

        {/* Camera OFF View */}
        {!isCameraOn && (
          <div className={styles.cameraOffView}>
            <div className={styles.avatarPulseContainer}>
              <div className={styles.pulseRing1} />
              <div className={styles.pulseRing2} />
              <div className={styles.pulseRing3} />
              <img
                src={user?.avatarUrl || liveStream.coverUrl || '/Girl.png'}
                alt={user?.displayName || 'Creator'}
                className={styles.cameraOffAvatar}
              />
            </div>
            <div className={styles.cameraOffBadge}>
              <CameraOff size={14} /> Camera Turned Off
            </div>
            <span className={styles.cameraOffSubtext}>Your live audio & chat remain active</span>
          </div>
        )}

        {/* Vignette Gradients */}
        <div className={styles.topVignette} />
        <div className={styles.bottomVignette} />

        {/* Top Header Bar */}
        <div className={styles.headerBar}>
          <div className={styles.creatorInfo}>
            <img
              src={user?.avatarUrl || '/Girl.png'}
              alt={user?.displayName || 'Creator'}
              className={styles.avatar}
            />
            <div className={styles.nameBlock}>
              <span className={styles.displayName}>
                {user?.displayName || user?.username || 'Creator'}
                {user?.isVerified && <BadgeCheck size={13} color="#e10075" />}
              </span>
              <span className={styles.streamTitle}>{liveStream.streamTitle}</span>
            </div>
            <div className={styles.headerMetaRow}>
              <span className={styles.liveTag}>
                <span className={styles.liveDot} /> LIVE
              </span>
              <span className={styles.viewerChip}>
                <Eye size={12} /> {liveStream.viewerCount || 0}
              </span>
            </div>
          </div>

          <div className={styles.headerRightControls}>
            <div className={styles.timerChip}>
              <Clock size={12} />
              <span>{formatTimer(durationSeconds)}</span>
            </div>

            <button
              className={styles.leaderboardBtn}
              onClick={() => setShowLeaderboard(true)}
              title="Top Gifters Leaderboard"
            >
              <Trophy size={13} />
              <span>Top Gifters</span>
            </button>

            <button
              className={styles.endBtn}
              onClick={() => setShowConfirmEnd(true)}
            >
              End
            </button>
          </div>
        </div>

        {/* Real-time Gift Overlay */}
        <GiftOverlay events={giftEvents} />

        {/* Floating Chat Overlay (Bottom Left) */}
        <div className={styles.floatingChatContainer}>
          <div ref={chatListRef} className={styles.chatMessageList}>
            {chatMessages.map((m) => (
              <div key={m._id} className={styles.chatBubble}>
                <img
                  src={m.avatarUrl || '/Girl.png'}
                  alt={m.displayName}
                  className={styles.chatAvatar}
                />
                <div className={styles.chatBody}>
                  <span className={styles.chatSenderName}>{m.displayName}</span>
                  <span className={styles.chatText}>{m.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className={styles.bottomControlBar}>
          {/* Creator Chat Input */}
          <form className={styles.creatorComposerForm} onSubmit={handleChatSend}>
            <input
              type="text"
              className={styles.composerInput}
              placeholder="Comment live as creator…"
              maxLength={500}
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
            />
            <button
              type="submit"
              className={styles.composerSendBtn}
              disabled={!chatDraft.trim() || chatSending}
            >
              <Send size={13} />
            </button>
          </form>

          {/* Live Earnings Badge */}
          {giftSummary && giftSummary.receivedCoins > 0 && (
            <div className={styles.earningsChip}>
              <img src="/coin.png" alt="Coin" className={styles.coinImg} />
              <span>{giftSummary.receivedCoins.toLocaleString()}</span>
            </div>
          )}

          {/* Controls: Camera & Mic */}
          <div className={styles.mediaControlsRow}>
            <button
              className={`${styles.controlCircleBtn} ${!isCameraOn ? styles.btnOff : ''}`}
              onClick={toggleCamera}
              title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {isCameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>

            <button
              className={`${styles.controlCircleBtn} ${isMuted ? styles.btnOff : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              className={`${styles.controlCircleBtn} ${styles.btnOff}`}
              onClick={() => setShowConfirmEnd(true)}
              title="End Stream"
            >
              <Power size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <StreamLeaderboardModal
          leaderboard={giftLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* End Stream Confirmation Modal (Theme Matched) */}
      {showConfirmEnd && (
        <div className={`${styles.confirmModalBackdrop} ${!darkMode ? styles.light : ''}`} onClick={() => !endingStream && setShowConfirmEnd(false)}>
          <div className={styles.confirmModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalIcon}>
              <Radio size={24} className={styles.confirmRadioIcon} />
            </div>
            <h3 className={styles.confirmModalTitle}>End Live Stream?</h3>
            <p className={styles.confirmModalText}>
              Are you sure you want to end this live stream session? Your viewers will be disconnected and session metrics saved.
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.confirmModalCancelBtn}
                onClick={() => setShowConfirmEnd(false)}
                disabled={endingStream}
              >
                Continue Live
              </button>
              <button
                type="button"
                className={styles.confirmModalEndBtn}
                onClick={handleConfirmEnd}
                disabled={endingStream}
              >
                {endingStream ? 'Ending...' : 'End Stream Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
