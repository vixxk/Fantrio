import { Gift, Mic, MicOff, Phone, Volume2, VolumeX, Coins, VideoOff } from 'lucide-react';
import styles from './ActiveCallOverlay.module.css';

/**
 * ActiveCallOverlay — the full-screen 1:1 call UI shared by the Audio Calls,
 * Video Calls and Messages pages. Renders the balance chip, caller avatar with
 * pulse rings, connecting/ringing/active status, and every call control. For
 * video calls it also renders the remote + local video surfaces and the camera
 * toggle.
 *
 * @param {Object|null} call                - active call { creator, status, roomId, rate, ... } or null
 * @param {'audio'|'video'} type            - call type
 * @param {number} balance                  - viewer's coin balance
 * @param {number} duration                 - elapsed call seconds
 * @param {(seconds:number)=>string} formatDuration
 * @param {boolean} isMuted
 * @param {() => void} onToggleMute
 * @param {boolean} isSpeakerOn
 * @param {() => void} onToggleSpeaker
 * @param {boolean} isCameraOff             - video only
 * @param {() => void} onToggleCamera       - video only
 * @param {() => void} onHangUp
 * @param {() => void} onOpenGift
 * @param {() => void} onRecharge
 * @param {*} remoteStream                  - remote Agora track (video only)
 * @param {(el:HTMLElement)=>void} attachRemote
 * @param {(el:HTMLElement)=>void} attachLocal
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
  if (!call) return null;
  const isVideo = type === 'video';

  return (
    <div className={styles.callModalOverlay}>
      <div className={styles.callTopBar}>
        <span className={styles.callBalanceChip}>
          <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
          {balance.toLocaleString()}
          <button
            className={styles.callRechargeBtn}
            onClick={onRecharge}
            title="Recharge coins"
          >
            <Coins size={11} /> Recharge
          </button>
        </span>
      </div>

      <div className={styles.callModalContent}>
        {isVideo && call.status === 'active' && (
          <div className={styles.videoArea}>
            <video
              ref={(el) => el && attachRemote(el)}
              className={styles.remoteVideo}
              playsInline
              autoPlay
            />
            <video
              ref={(el) => el && attachLocal(el)}
              className={styles.localVideo}
              playsInline
              autoPlay
              muted
            />
            {!remoteStream && (
              <div className={styles.waitingRemote}>
                <span className={styles.statusBlink}>Waiting for the creator to connect...</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.callAvatarWrapper}>
          <div className={styles.pulseRing} />
          <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
          <img
            src={call.creator.avatarUrl}
            alt={call.creator.displayName}
            className={styles.callAvatar}
          />
        </div>

        <h2 className={styles.callName}>{call.creator.displayName}</h2>
        <span className={styles.callUsername}>@{call.creator.username}</span>

        <div className={styles.callStatusBox}>
          {call.status === 'connecting' && <span className={styles.statusBlink}>Connecting...</span>}
          {call.status === 'ringing' && <span className={styles.statusBlink}>Ringing...</span>}
          {call.status === 'active' && (
            <div className={styles.activeCallMeta}>
              <span className={styles.duration}>{formatDuration(duration)}</span>
              <span className={styles.billingRate}>
                ({call.rate} Coins / min)
              </span>
            </div>
          )}
        </div>

        <div className={styles.callControls}>
          <button
            className={`${styles.controlBtn} ${styles.controlBtnGift}`}
            onClick={onOpenGift}
            disabled={call.status !== 'active'}
            aria-label="Send a gift"
          >
            <Gift size={22} />
          </button>

          <button
            className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
            onClick={onToggleMute}
            disabled={call.status !== 'active'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {isVideo && (
            <button
              className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ''}`}
              onClick={onToggleCamera}
              disabled={call.status !== 'active'}
            >
              <VideoOff size={22} />
            </button>
          )}

          <button className={styles.hangupBtn} onClick={onHangUp}>
            <Phone size={26} className={styles.hangupIcon} />
          </button>

          <button
            className={`${styles.controlBtn} ${!isSpeakerOn ? styles.controlActive : ''}`}
            onClick={onToggleSpeaker}
            disabled={call.status !== 'active'}
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>

          <button
            className={`${styles.controlBtn} ${styles.controlBtnCoins}`}
            onClick={onRecharge}
            disabled={call.status !== 'active'}
            aria-label="Recharge coins"
          >
            <Coins size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
