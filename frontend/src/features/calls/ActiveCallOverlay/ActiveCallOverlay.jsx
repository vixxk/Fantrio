import { useState, useEffect, useRef } from 'react';
import { Gift, Mic, MicOff, Phone, Volume2, VolumeX, Coins, Video, VideoOff, CameraOff, Bell, BellOff, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { isGiftChimeMuted, setGiftChimeMuted } from '../../../utils/sound';
import styles from './ActiveCallOverlay.module.css';

/**
 * ActiveCallOverlay — full-screen 1:1 call UI shared across Audio/Video Calls and Messages.
 * Features:
 * - Dynamic video surface & PIP local self-view preview (visible while ringing and active)
 * - Mute/Camera toggle state accuracy
 * - Creator/Fan avatar overlay when camera is turned off
 * - Theme-matched Call End confirmation modal
 * - Responsive screen space allocation & mobile-optimized top bar
 */
export const ActiveCallOverlay = ({
  call,
  type = 'audio',
  balance,
  duration,
  formatDuration,
  isMuted,
  onToggleMute,
  isSpeakerOn,
  onToggleSpeaker,
  isCameraOff,
  onToggleCamera,
  onHangUp,
  onOpenGift,
  onRecharge,
  remoteStream,
  attachRemote,
  attachLocal,
  remoteCameraOff = false,
  remoteMicMuted = false,
  giftSummary = null,
  giftLeaderboard = []
}) => {
  const { user } = useApp();
  const isFan = user?.role !== 'creator';
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // The gift summary pill can be dismissed so it doesn't crowd small screens.
  // It stays hidden for the rest of the call (per-call state — fresh each call).
  const [giftSummaryDismissed, setGiftSummaryDismissed] = useState(false);

  // Gift-chime mute toggle (shared preference, persisted in localStorage).
  const [chimeMuted, setChimeMuted] = useState(isGiftChimeMuted());
  const toggleChimeMuted = () => {
    setChimeMuted((prev) => {
      const next = !prev;
      setGiftChimeMuted(next);
      return next;
    });
  };

  // Pop the balance chip whenever the live balance changes (gift sent, call
  // billed, recharge) so spend/credit is visible in real time on screen.
  const [balancePulse, setBalancePulse] = useState(0);
  const prevBalanceRef = useRef(balance);
  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      prevBalanceRef.current = balance;
      setBalancePulse((n) => n + 1);
    }
  }, [balance]);

  if (!call) return null;
  const isVideo = type === 'video';
  const creator = call.creator || {};

  return (
    <div
      className={`${styles.callModalOverlay} ${isVideo ? styles.videoCallOverlay : ''}`}
      onClick={() => setControlsVisible((prev) => !prev)}
    >
      {/* Top Bar for Coin Balance + Quick Recharge + per-call gift summary */}
      <div className={`${styles.callTopBar} ${!controlsVisible ? styles.controlsHidden : ''}`}>
        <div className={styles.topBarRow}>
          <button
            type="button"
            className={`${styles.chimeMuteBtn} ${chimeMuted ? styles.chimeMuteBtnActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleChimeMuted();
            }}
            title={chimeMuted ? 'Unmute gift chimes' : 'Mute gift chimes'}
            aria-label={chimeMuted ? 'Unmute gift chimes' : 'Mute gift chimes'}
          >
            {chimeMuted ? <BellOff size={14} /> : <Bell size={14} />}
          </button>
          <div className={styles.callBalanceChip}>
            <div className={styles.callCoinInfo}>
              <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
              <span
                key={balancePulse}
                className={`${styles.callBalanceText} ${balancePulse > 0 ? styles.balancePop : ''}`}
              >
                {balance.toLocaleString()} Coins
              </span>
            </div>
            {isFan && (
              <button
                className={styles.callRechargeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onRecharge();
                }}
                title="Recharge coins"
              >
                <Coins size={12} /> Recharge
              </button>
            )}
          </div>
        </div>

        {/* Per-call gift summary — appears after the first gift. Fans see how
            many gifts they sent; creators see how many they received. The
            pill can be dismissed (×) so it doesn't crowd small screens. */}
        {giftSummary &&
          !giftSummaryDismissed &&
          (isFan ? giftSummary.sentCount > 0 : giftSummary.receivedCount > 0) && (
            <div className={styles.callGiftSummary}>
              <Gift size={13} />
              {isFan ? (
                <>
                  <span>You sent</span>
                  <strong>{giftSummary.sentCount}</strong>
                  <img src="/coin.png" alt="Coin" className={styles.callCoinImgSm} />
                  <span>{giftSummary.sentCoins.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <span>Received</span>
                  <strong>{giftSummary.receivedCount}</strong>
                  <img src="/coin.png" alt="Coin" className={styles.callCoinImgSm} />
                  <span>{giftSummary.receivedCoins.toLocaleString()}</span>
                </>
              )}
              <button
                type="button"
                className={styles.giftSummaryDismiss}
                onClick={(e) => {
                  e.stopPropagation();
                  setGiftSummaryDismissed(true);
                }}
                title="Hide gift summary"
                aria-label="Hide gift summary"
              >
                <X size={11} />
              </button>
            </div>
          )}
      </div>

      <div className={`${styles.callModalContent} ${isVideo ? styles.videoCallContent : styles.audioCallContent}`}>
        {/* Video Surface Area */}
        {isVideo ? (
          <div className={styles.videoArea}>
            {/* Only render the remote video element when the remote party's
                camera is actually on — otherwise show the avatar fallback.
                (Their camera toggling never affects the local tracks.) */}
            {call.status === 'active' && remoteStream && !remoteCameraOff ? (
              <video
                ref={(el) => el && attachRemote(el)}
                className={styles.remoteVideo}
                playsInline
                autoPlay
              />
            ) : (
              <div className={styles.cameraOffOverlay}>
                <div className={styles.callAvatarWrapper}>
                  <div className={styles.pulseRing} />
                  <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
                  <img
                    src={creator.avatarUrl || '/profile.png'}
                    alt={creator.displayName || 'Creator'}
                    className={styles.callAvatar}
                  />
                </div>
                <h2 className={styles.callName}>{creator.displayName || 'Creator'}</h2>
                <span className={styles.callUsername}>@{creator.username || 'user'}</span>
                <div className={styles.callStatusBox}>
                  {call.status === 'connecting' && (
                    <div className={styles.activeCallMeta}>
                      <span className={styles.statusBlink}>Connecting...</span>
                      {!!call.rate && <span className={styles.billingRate}>({call.rate} Coins / min)</span>}
                    </div>
                  )}
                  {call.status === 'ringing' && <span className={styles.statusBlink}>Ringing call...</span>}
                  {call.status === 'active' && (
                    <div className={styles.activeCallMeta}>
                      <span className={styles.duration}>{formatDuration(duration)}</span>
                      <span className={styles.billingRate}>({call.rate} Coins / min)</span>
                    </div>
                  )}
                </div>
                {call.status === 'active' && isCameraOff && (
                  <span className={styles.cameraOffBadge}>
                    <CameraOff size={14} /> Camera Off
                  </span>
                )}
              </div>
            )}

            {/* Remote party muted their mic — show it on their tile */}
            {call.status === 'active' && remoteMicMuted && (
              <span className={styles.remoteMicMutedBadge}>
                <MicOff size={13} /> Mic muted
              </span>
            )}

            {/* PIP Local Video Self-View (Visible while ringing & active) */}
            <div className={styles.localVideoContainer}>
              <video
                ref={(el) => el && attachLocal(el)}
                className={`${styles.localVideo} ${isCameraOff ? styles.localVideoHidden : ''}`}
                playsInline
                autoPlay
                muted
              />
              {isCameraOff && (
                <div className={styles.localCameraOffFallback}>
                  <CameraOff size={18} />
                  <span>Cam Off</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call Surface: Identical Full Screen Centered Layout */
          <div className={styles.audioCallSurface}>
            <div className={styles.callAvatarWrapper}>
              <div className={styles.pulseRing} />
              <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
              <img
                src={creator.avatarUrl || '/profile.png'}
                alt={creator.displayName || 'Creator'}
                className={styles.callAvatar}
              />
            </div>

            <h2 className={styles.callName}>{creator.displayName || 'Creator'}</h2>
            <span className={styles.callUsername}>@{creator.username || 'user'}</span>

            <div className={styles.callStatusBox}>
              {call.status === 'connecting' && (
                <div className={styles.activeCallMeta}>
                  <span className={styles.statusBlink}>Connecting...</span>
                  {!!call.rate && <span className={styles.billingRate}>({call.rate} Coins / min)</span>}
                </div>
              )}
              {call.status === 'ringing' && <span className={styles.statusBlink}>Ringing call...</span>}
              {call.status === 'active' && (
                <div className={styles.activeCallMeta}>
                  <span className={styles.duration}>{formatDuration(duration)}</span>
                  <span className={styles.billingRate}>
                    ({call.rate} Coins / min)
                  </span>
                </div>
              )}
            </div>

            {/* Remote party muted their mic — show it on their tile */}
            {call.status === 'active' && remoteMicMuted && (
              <span className={styles.remoteMicMutedBadge}>
                <MicOff size={13} /> Mic muted
              </span>
            )}
          </div>
        )}

        {/* Call Action Bar */}
        <div
          className={`${styles.callControls} ${!controlsVisible ? styles.controlsHidden : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isFan && (
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.controlBtnGift}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenGift();
              }}
              disabled={call.status !== 'active'}
              aria-label="Send a gift"
              title="Send Gift"
            >
              <Gift size={22} />
            </button>
          )}

          <button
            type="button"
            className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            disabled={call.status !== 'active'}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {isVideo && (
            <button
              type="button"
              className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCamera();
              }}
              disabled={call.status !== 'active'}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}

          <button
            type="button"
            className={styles.hangupBtn}
            onClick={(e) => {
              e.stopPropagation();
              setShowEndConfirm(true);
            }}
            title="End Call"
          >
            <Phone size={26} className={styles.hangupIcon} />
          </button>

          <button
            type="button"
            className={`${styles.controlBtn} ${!isSpeakerOn ? styles.controlActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSpeaker();
            }}
            disabled={call.status !== 'active'}
            title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
        </div>
      </div>

      {/* Modern Theme-matched Call End Confirmation Modal */}
      {showEndConfirm && (
        <div className={styles.confirmModalBackdrop} onClick={() => setShowEndConfirm(false)}>
          <div className={styles.confirmModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalIcon}>
              <Phone size={24} className={styles.confirmPhoneIcon} />
            </div>
            <h3 className={styles.confirmModalTitle}>End Video Call?</h3>
            <p className={styles.confirmModalText}>
              Are you sure you want to end this call with <strong>{creator.displayName || 'this creator'}</strong>?
            </p>
            <div className={styles.confirmModalActions}>
              <button
                type="button"
                className={styles.confirmModalCancelBtn}
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmModalEndBtn}
                onClick={() => {
                  setShowEndConfirm(false);
                  onHangUp();
                }}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
