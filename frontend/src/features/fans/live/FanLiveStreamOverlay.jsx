import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { StreamLeaderboardModal } from '../../gifts/StreamLeaderboardModal';
import { QuickRecharge } from '../../gifts/QuickRecharge';
import {
  Eye,
  Gift,
  Trophy,
  Send,
  X,
  BadgeCheck,
  Loader2,
  Smile
} from 'lucide-react';
import styles from './FanLiveStreamOverlay.module.css';

export const FanLiveStreamOverlay = ({
  stream,
  viewer,
  giftEvents,
  sendGift,
  giftLeaderboard,
  giftSummary,
  chatMessages,
  sendChatMessage,
  chatSending,
  onLeaveStream,
  balance,
}) => {
  const { darkMode } = useApp();
  const [chatDraft, setChatDraft] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const chatListRef = useRef(null);

  // Auto-scroll chat to newest message
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

  const addEmoji = (emoji) => {
    setChatDraft((prev) => prev + emoji);
  };

  if (!stream) return null;

  return (
    <div className={`${styles.overlayContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Video View Area */}
      <div className={styles.videoArea}>
        {/* Agora Remote Video Container */}
        <div
          ref={(el) => el && viewer?.attachVideo && viewer.attachVideo(el)}
          className={styles.videoElement}
        />

        {/* Camera OFF / Connecting Overlay */}
        {!viewer?.isPlaying && (
          <div className={styles.cameraOffView}>
            <div className={styles.avatarPulseContainer}>
              <div className={styles.pulseRing1} />
              <div className={styles.pulseRing2} />
              <div className={styles.pulseRing3} />
              <img
                src={stream.coverUrl || stream.avatarUrl || '/Girl.png'}
                alt={stream.displayName || 'Creator'}
                className={styles.cameraOffAvatar}
              />
            </div>
            <div className={styles.cameraOffBadge}>
              <Loader2 size={15} className={styles.spin} /> Connecting to Live Stream…
            </div>
          </div>
        )}

        {/* Vignette Gradients */}
        <div className={styles.topVignette} />
        <div className={styles.bottomVignette} />

        {/* Instagram Header Bar */}
        <div className={styles.headerBar}>
          <div className={styles.creatorInfo}>
            <img
              src={stream.coverUrl || stream.avatarUrl || '/Girl.png'}
              alt={stream.displayName || 'Creator'}
              className={styles.avatar}
            />
            <div className={styles.nameBlock}>
              <span className={styles.displayName}>
                {stream.displayName || stream.username || 'Creator'}
                {stream.isVerified && <BadgeCheck size={13} color="#e10075" />}
              </span>
              <span className={styles.streamTitle}>{stream.streamTitle}</span>
            </div>
            <div className={styles.headerMetaRow}>
              <span className={styles.liveTag}>
                <span className={styles.liveDot} /> LIVE
              </span>
              <span className={styles.viewerChip}>
                <Eye size={12} /> {stream.viewerCount || 0}
              </span>
            </div>
          </div>

          {/* Top Right Controls & Coin Balance under close button */}
          <div className={styles.topRightControlsColumn}>
            <div className={styles.headerRightControls}>
              <button
                className={styles.leaderboardBtn}
                onClick={() => setShowLeaderboard(true)}
                title="Top Gifters Leaderboard"
              >
                <Trophy size={13} />
                <span>Top Gifters</span>
              </button>

              <button
                className={styles.closeBtn}
                onClick={onLeaveStream}
                title="Leave Stream"
                aria-label="Leave Stream"
              >
                <X size={18} />
              </button>
            </div>

            {/* Balance chip positioned directly under cross button */}
            <div className={styles.topBalanceChip}>
              <img src="/coin.png" alt="Coin" className={styles.coinImg} />
              <span>{(balance || 0).toLocaleString()}</span>
              <button
                className={styles.rechargePlusBtn}
                onClick={() => setRechargeOpen(true)}
                title="Recharge coins"
              >
                +
              </button>
            </div>
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

        {/* Bottom Action Bar */}
        <div className={styles.bottomActionBar}>
          <div className={styles.composerWrapper}>
            {/* Interactive Emoji Reaction Bar */}
            {showEmojiPicker && (
              <div className={styles.emojiPickerBar}>
                {['❤️', '🔥', '👏', '😍', '🎉', '🚀', '💯', '💎', '✨', '👑', '😮', '💖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={styles.emojiPickItem}
                    onClick={() => addEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Composer Form */}
            <form className={styles.chatComposerForm} onSubmit={handleChatSend}>
              <input
                type="text"
                className={styles.composerInput}
                placeholder="Send a message…"
                maxLength={500}
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                onFocus={() => setShowEmojiPicker(false)}
              />
              <button
                type="button"
                className={`${styles.emojiBtn} ${showEmojiPicker ? styles.emojiBtnActive : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji Picker"
              >
                <Smile size={16} />
              </button>
              <button
                type="submit"
                className={styles.composerSendBtn}
                disabled={!chatDraft.trim() || chatSending}
              >
                <Send size={13} />
              </button>
            </form>
          </div>

          {/* Send Gift Action Button */}
          <button
            className={styles.giftTriggerBtn}
            onClick={() => setGiftOpen(true)}
          >
            <Gift size={16} /> Send Gift
          </button>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <StreamLeaderboardModal
          leaderboard={giftLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Gift Panel Bottom Sheet */}
      {giftOpen && (
        <GiftPanel
          receiverName={stream.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => {
            const targetId = stream.creatorId?._id || stream.creatorId;
            return sendGift(gift, targetId);
          }}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setGiftOpen(false)}
        />
      )}

      {/* Quick Recharge Modal */}
      {rechargeOpen && (
        <QuickRecharge onClose={() => setRechargeOpen(false)} />
      )}
    </div>
  );
};
