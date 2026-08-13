import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Gift, Coins, Bell, BellOff, X } from 'lucide-react';
import { isGiftChimeMuted, setGiftChimeMuted } from '../../utils/sound';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/Toast/Toast';
import { api } from '../../services/api';
import { getSocket, connectSocket, joinSocketRoom } from '../../services/socket';
import { useAgoraCall } from '../../hooks/useAgoraCall';
import { useGiftEvents } from '../../hooks/useGiftEvents';
import { GiftOverlay } from '../gifts/GiftOverlay';
import { GiftPanel } from '../gifts/GiftPanel';
import { QuickRecharge } from '../gifts/QuickRecharge';
import { playRingtone, stopRingtone } from '../../utils/ringtone';
import styles from './IncomingCall.module.css';

const IncomingCallContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useIncomingCall = () => useContext(IncomingCallContext);

export const IncomingCallProvider = ({ children }) => {
  const { user, refreshBalance, balance } = useApp();
  const { toast } = useToast();
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
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

  // Pop the balance chip whenever the live balance changes (gift received /
  // call billed / recharge) so credits are visible in real time on screen.
  const [balancePulse, setBalancePulse] = useState(0);
  const prevBalanceRef = useRef(balance);
  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      prevBalanceRef.current = balance;
      setBalancePulse((n) => n + 1);
    }
  }, [balance]);

  const ag = useAgoraCall();

  // Live gifts + recharge while the call is active. Both parties see the same
  // animation in real time (socket events); the receiver can also gift back.
  const { events: giftEvents, sendGift, summary: giftSummary, leaderboard: giftLeaderboard } = useGiftEvents({
    callRoomId: active?.roomId || null,
    enabled: !!active && active.status === 'active',
    receiverId: (incoming || active)?.caller?.id || null
  });

  // Top gifter this call = the leaderboard leader (sorted by total coins).
  // In a 1:1 call that's the fan once they've sent a gift.
  const topGifter = giftLeaderboard && giftLeaderboard.length > 0 ? giftLeaderboard[0] : null;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const activeRef = useRef(null);
  const endingRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Connect socket when user logs in and register to their room
  useEffect(() => {
    if (user?.id) {
      connectSocket();
      joinSocketRoom(user.id);
    }
  }, [user]);

  const ringTimeoutRef = useRef(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleIncoming = (payload) => {
      if (activeRef.current || incoming) {
        // Receiver busy: auto reject
        try {
          api.post(`/calls/reject/${payload.callLogId}`);
        } catch { /* noop */ }
        return;
      }
      setIncoming(payload);
      playRingtone('incoming');

      // Auto-dismiss & reject incoming call after 30s timeout if unanswered
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = setTimeout(() => {
        setIncoming((curr) => {
          if (curr && curr.callLogId === payload.callLogId) {
            stopRingtone();
            // Release the ringing preview track before the overlay unmounts.
            ag.endCall();
            try { api.post(`/calls/reject/${payload.callLogId}`); } catch { /* noop */ }
            return null;
          }
          return curr;
        });
      }, 30000);
    };

    socket.on('incoming_call', handleIncoming);
    return () => {
      socket.off('incoming_call', handleIncoming);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, [user, incoming, ag]);

  const cleanupTimers = useCallback(() => {
    stopRingtone();
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    durationTimer.current = null;
    heartbeatTimer.current = null;
  }, []);

  const endActiveCall = useCallback(async (notifyBackend = true) => {
    // Guard against double-end (user-left + connection drop fire back-to-back)
    if (endingRef.current) return;
    endingRef.current = true;
    stopRingtone();
    cleanupTimers();
    const cur = activeRef.current;
    // Release local camera/mic first so the browser's in-use indicator turns
    // off immediately, then notify the backend (which may be slow or offline).
    ag.endCall();
    if (notifyBackend && cur && cur.roomId) {
      try {
        await api.post('/calls/end', { roomId: cur.roomId });
      } catch { /* noop */ }
    }
    setActive(null);
    setIncoming(null);
    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    refreshBalance();
    endingRef.current = false;
    // Refresh page for receiver after call ends or cuts
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [cleanupTimers, ag, refreshBalance]);

  const endActiveCallRef = useRef(endActiveCall);
  useEffect(() => {
    endActiveCallRef.current = endActiveCall;
  }, [endActiveCall]);

  useEffect(() => {
    return () => {
      if (activeRef.current) {
        endActiveCallRef.current(true);
      }
    };
  }, []);

  const checkMediaPermissions = async (callType) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return true;
    // Video calls need BOTH mic and camera — the receiver accepts the call as
    // the requested type, so degrading a video call to audio-only here would
    // leave the creator in a video call with no video (and no way to fix it).
    const constraints = callType === 'video'
      ? { audio: true, video: true }
      : { audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error('Media permission denied or error:', err);
      return false;
    }
  };

  const acceptCall = useCallback(async () => {
    if (!incoming) return;
    stopRingtone();
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    const { callLogId, roomId, type, caller, rate, receiverToken } = incoming;

    const hasPermission = await checkMediaPermissions(type);
    if (!hasPermission) {
      toast.error(`Microphone ${type === 'video' ? 'and Camera ' : ''}permission is required to join ${type} calls. Please allow permission in your browser settings.`);
      return;
    }

    setActive({
      callLogId,
      roomId,
      type,
      caller,
      rate,
      status: 'connecting'
    });
    setIncoming(null);

    try {
      const res = await api.post(`/calls/accept/${callLogId}`);
      const token = res.receiverToken || receiverToken;

      await ag.joinCall({
        channel: roomId,
        token,
        uid: user?.id || user?._id,
        type,
        onRemoteStream: (stream) => setRemoteStream(stream),
        onRemoteLeave: () => endActiveCall(),
        onCallEnded: () => endActiveCall()
      });

      setActive((prev) => ({ ...prev, status: 'active' }));
      setCallDuration(0);
      // The call starts with both parties' mic & camera ON (fresh tracks are
      // created enabled by joinCall). Reset the UI flags so the buttons always
      // reflect the true state at connect.
      setIsMuted(false);
      setIsCameraOff(false);

      // Duration timer
      durationTimer.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('accept call failed', err);
      endActiveCall(false);
    }
  }, [incoming, user, ag, endActiveCall, toast]);

  const rejectCall = useCallback(async () => {
    if (!incoming) return;
    stopRingtone();
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    const { callLogId } = incoming;
    setIncoming(null);
    // Release any preview tracks created while the call was ringing (the local
    // video self-view is live during ringing), otherwise the camera stays on.
    ag.endCall();
    try {
      await api.post(`/calls/reject/${callLogId}`);
    } catch { /* noop */ }
  }, [incoming, ag]);

  // Attach remote stream (an Agora track, not a MediaStream) to the video element
  // once it arrives. `track.play(el)` handles the actual rendering.
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && typeof remoteStream.play === 'function') {
      remoteStream.play(remoteVideoRef.current);
    }
  }, [remoteStream]);

  // If the provider unmounts mid-call (e.g. logout / tab switch / going back), clean up the
  // Lock navigation to the ongoing call view while a call is incoming or active
  useEffect(() => {
    const handlePopState = (e) => {
      if (activeRef.current || incoming) {
        e?.preventDefault?.();
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (active || incoming) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [active, incoming]);

  // Attach local preview once active
  useEffect(() => {
    if (active && active.status === 'active' && active.type === 'video' && localVideoRef.current) {
      ag.attachLocal(localVideoRef.current);
    }
  }, [active, ag]);

  const toggleMute = () => {
    const muted = ag.toggleMute();
    setIsMuted(muted);
  };

  const toggleCamera = () => {
    const off = ag.toggleCamera();
    setIsCameraOff(off);
  };

  const formatDuration = (sec) => {
    const mins = String(Math.floor(sec / 60)).padStart(2, '0');
    const secs = String(sec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const showOverlay = incoming || active;
  const isVideo = (incoming || active)?.type === 'video';
  const peer = (incoming || active)?.caller;
  const activeStatus = active?.status || 'incoming';

  return (
    <IncomingCallContext.Provider value={{ incoming, active, acceptCall, rejectCall, endActiveCall }}>
      {children}
      {showOverlay && (
        <div
          className={`${styles.overlay} ${isVideo ? styles.videoOverlay : ''}`}
          onClick={() => setControlsVisible((prev) => !prev)}
        >
          <div className={`${styles.container} ${isVideo ? styles.videoContainer : styles.audioContainer}`}>
            {isVideo && (
              <div className={styles.videoArea}>
                {/* Only render the remote video element when the remote party's
                    camera is actually on — otherwise show the avatar fallback.
                    (Their camera toggling never affects the local tracks.) */}
                {activeStatus === 'active' && remoteStream && !ag.remoteCameraOff ? (
                  <video ref={remoteVideoRef} className={styles.remoteVideo} playsInline autoPlay muted={false} />
                ) : (
                  <div className={styles.cameraOffOverlay}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.pulseRing} />
                      <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
                      {peer?.avatarUrl ? (
                        <img src={peer.avatarUrl} alt={peer.displayName} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatar}>{peer?.displayName?.[0] || '?'}</div>
                      )}
                    </div>
                    <h2 className={styles.name}>{peer?.displayName || 'Incoming Call'}</h2>
                    <span className={styles.username}>@{peer?.username || 'user'}</span>
                    <div className={styles.statusBox}>
                      {activeStatus === 'incoming' && <span className={styles.blink}>Incoming Video Call...</span>}
                      {activeStatus === 'connecting' && (
                        <div className={styles.activeMeta}>
                          <span className={styles.blink}>Connecting...</span>
                          {!!active?.rate && <span className={styles.rate}>({active.rate} Coins / min)</span>}
                        </div>
                      )}
                      {activeStatus === 'active' && (
                        <div className={styles.activeMeta}>
                          <span className={styles.duration}>{formatDuration(callDuration)}</span>
                          <span className={styles.rate}>({active.rate} Coins / min)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Remote party muted their mic — show it on their tile */}
                {activeStatus === 'active' && ag.remoteMicMuted && (
                  <span className={styles.remoteMicMutedBadge}>
                    <MicOff size={13} /> Mic muted
                  </span>
                )}
                <div className={styles.localVideoContainer}>
                  <video
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && isVideo) {
                        ag.attachLocal(el);
                      }
                    }}
                    className={`${styles.localVideo} ${isCameraOff ? styles.localVideoHidden : ''}`}
                    playsInline
                    autoPlay
                    muted
                  />
                  {isCameraOff && (
                    <div className={styles.localCameraOffFallback}>
                      <span>Cam Off</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isVideo && (
              <div className={styles.audioSurface}>
                <div className={styles.avatarWrap}>
                  <div className={styles.pulseRing} />
                  <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
                  {peer?.avatarUrl ? (
                    <img src={peer.avatarUrl} alt={peer.displayName} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatar}>{peer?.displayName?.[0] || '?'}</div>
                  )}
                </div>

                <h2 className={styles.name}>{peer?.displayName || 'Incoming Call'}</h2>
                <span className={styles.username}>@{peer?.username || 'user'}</span>

                <div className={styles.statusBox}>
                  {activeStatus === 'incoming' && <span className={styles.blink}>Incoming Audio Call...</span>}
                  {activeStatus === 'connecting' && (
                    <div className={styles.activeMeta}>
                      <span className={styles.blink}>Connecting...</span>
                      {!!active?.rate && <span className={styles.rate}>({active.rate} Coins / min)</span>}
                    </div>
                  )}
                  {activeStatus === 'active' && (
                    <div className={styles.activeMeta}>
                      <span className={styles.duration}>{formatDuration(callDuration)}</span>
                      <span className={styles.rate}>({active.rate} Coins / min)</span>
                    </div>
                  )}
                </div>

                {/* Remote party muted their mic — show it on their tile */}
                {activeStatus === 'active' && ag.remoteMicMuted && (
                  <span className={styles.remoteMicMutedBadge}>
                    <MicOff size={13} /> Mic muted
                  </span>
                )}
              </div>
            )}

            {activeStatus === 'incoming' ? (
              <div className={styles.controls} onClick={(e) => e.stopPropagation()}>
                <button
                  className={styles.rejectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    rejectCall();
                  }}
                  title="Decline Call"
                >
                  <PhoneOff size={26} />
                </button>
                <button
                  className={styles.acceptBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptCall();
                  }}
                  title="Accept Call"
                >
                  <Phone size={26} />
                </button>
              </div>
            ) : (
              <>
                <div className={`${styles.callTopBar} ${!controlsVisible ? styles.controlsHidden : ''}`}>
                  <span className={styles.topBarRow}>
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
                    <span className={styles.callBalanceChip}>
                      <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
                      <span
                        key={balancePulse}
                        className={`${styles.callBalanceText} ${balancePulse > 0 ? styles.balancePop : ''}`}
                      >
                        {balance.toLocaleString()}
                      </span>
                      <button
                        className={styles.callRechargeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRechargeOpen(true);
                        }}
                        title="Recharge coins"
                      >
                        <Coins size={11} /> Recharge
                      </button>
                    </span>
                  </span>

                  {/* Per-call gift summary — the creator sees gifts received
                      from the fan during this call. Dismissible (×) so it
                      doesn't crowd small screens. */}
                  {giftSummary && !giftSummaryDismissed && giftSummary.receivedCount > 0 && (
                    <span className={styles.callGiftSummary}>
                      <Gift size={13} />
                      <span>Received</span>
                      <strong>{giftSummary.receivedCount}</strong>
                      <img src="/coin.png" alt="Coin" className={styles.callCoinImgSm} />
                      <span>{giftSummary.receivedCoins.toLocaleString()}</span>
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
                    </span>
                  )}
                </div>
                <div
                  className={`${styles.controls} ${!controlsVisible ? styles.controlsHidden : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {user?.role !== 'creator' && (
                    <button
                      className={`${styles.controlBtn} ${styles.controlBtnGift}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setGiftOpen(true);
                      }}
                      disabled={activeStatus !== 'active'}
                      aria-label="Send a gift"
                      title="Send Gift"
                    >
                      <Gift size={22} />
                    </button>
                  )}
                  <button
                    className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    disabled={activeStatus !== 'active'}
                    title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                  {isVideo && (
                    <button
                      className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCamera();
                      }}
                      disabled={activeStatus !== 'active'}
                      title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                  )}
                  <button
                    className={styles.hangupBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEndConfirm(true);
                    }}
                    title="End Call"
                  >
                    <Phone size={26} className={styles.hangupIcon} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Theme End Call Confirmation Modal */}
      {showEndConfirm && (
        <div className={styles.confirmModalBackdrop} onClick={() => setShowEndConfirm(false)}>
          <div className={styles.confirmModalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalIcon}>
              <Phone size={24} className={styles.confirmPhoneIcon} />
            </div>
            <h3 className={styles.confirmModalTitle}>End Call?</h3>
            <p className={styles.confirmModalText}>
              Are you sure you want to end this call with <strong>{peer?.displayName || 'this user'}</strong>?
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
                  endActiveCall();
                }}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift animation layer + gift picker + recharge (active call only) */}
      {active && active.status === 'active' && <GiftOverlay events={giftEvents} />}
      {giftOpen && (
        <GiftPanel
          receiverName={peer?.displayName || 'this caller'}
          balance={balance}
          onSendGift={(gift) => sendGift(gift)}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}
    </IncomingCallContext.Provider>
  );
};
