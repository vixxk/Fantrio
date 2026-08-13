import { useState } from 'react';
import { Gift, Mic, MicOff, Phone, Volume2, VolumeX, Coins, Video, VideoOff, CameraOff } from 'lucide-react';
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
  attachLocal
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (!call) return null;
  const isVideo = type === 'video';
  const creator = call.creator || {};

  return (
    <div className={`${styles.callModalOverlay} ${isVideo ? styles.videoCallOverlay : ''}`}>
      {/* Top Bar for Coin Balance + Quick Recharge */}
      <div className={styles.callTopBar}>
        <div className={styles.callBalanceChip}>
          <div className={styles.callCoinInfo}>
            <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
            <span className={styles.callBalanceText}>{balance.toLocaleString()} Coins</span>
          </div>
          <button
            className={styles.callRechargeBtn}
            onClick={onRecharge}
            title="Recharge coins"
          >
            <Coins size={12} /> Recharge
          </button>
        </div>
      </div>

      <div className={`${styles.callModalContent} ${isVideo ? styles.videoCallContent : ''}`}>
        {/* Video Surface Area */}
        {isVideo && (
          <div className={styles.videoArea}>
            {call.status === 'active' && remoteStream ? (
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
                {call.status === 'active' && (
                  <span className={styles.cameraOffBadge}>
                    <CameraOff size={14} /> Camera Off
                  </span>
                )}
              </div>
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
        )}

        {/* Audio Call / Connecting Info overlay */}
        {(!isVideo || call.status !== 'active' || isCameraOff) && (
          <div className={styles.infoCenterCard}>
            {!isVideo && (
              <div className={styles.callAvatarWrapper}>
                <div className={styles.pulseRing} />
                <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
                <img
                  src={creator.avatarUrl || '/profile.png'}
                  alt={creator.displayName || 'Creator'}
                  className={styles.callAvatar}
                />
              </div>
            )}

            <h2 className={styles.callName}>{creator.displayName || 'Creator'}</h2>
            <span className={styles.callUsername}>@{creator.username || 'user'}</span>

            <div className={styles.callStatusBox}>
              {call.status === 'connecting' && <span className={styles.statusBlink}>Connecting...</span>}
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
          </div>
        )}

        {/* Call Action Bar */}
        <div className={styles.callControls}>
          <button
            type="button"
            className={`${styles.controlBtn} ${styles.controlBtnGift}`}
            onClick={onOpenGift}
            disabled={call.status !== 'active'}
            aria-label="Send a gift"
            title="Send Gift"
          >
            <Gift size={22} />
          </button>

          <button
            type="button"
            className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
            onClick={onToggleMute}
            disabled={call.status !== 'active'}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {isVideo && (
            <button
              type="button"
              className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ''}`}
              onClick={onToggleCamera}
              disabled={call.status !== 'active'}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}

          <button
            type="button"
            className={styles.hangupBtn}
            onClick={() => setShowEndConfirm(true)}
            title="End Call"
          >
            <Phone size={26} className={styles.hangupIcon} />
          </button>

          <button
            type="button"
            className={`${styles.controlBtn} ${!isSpeakerOn ? styles.controlActive : ''}`}
            onClick={onToggleSpeaker}
            disabled={call.status !== 'active'}
            title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>

          <button
            type="button"
            className={`${styles.controlBtn} ${styles.controlBtnCoins}`}
            onClick={onRecharge}
            aria-label="Recharge coins"
            title="Recharge Balance"
          >
            <Coins size={22} />
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
