import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Gift, Coins } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getSocket, connectSocket, joinSocketRoom } from '../../services/socket';
import { useAgoraCall } from '../../hooks/useAgoraCall';
import { useGiftEvents } from '../../hooks/useGiftEvents';
import { GiftOverlay } from '../gifts/GiftOverlay';
import { GiftPanel } from '../gifts/GiftPanel';
import { QuickRecharge } from '../gifts/QuickRecharge';
import styles from './IncomingCall.module.css';

const IncomingCallContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useIncomingCall = () => useContext(IncomingCallContext);

export const IncomingCallProvider = ({ children }) => {
  const { user, token, refreshBalance, balance } = useApp();
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const ag = useAgoraCall();

  // Live gifts + recharge while the call is active. Both parties see the same
  // animation in real time (socket events); the receiver can also gift back.
  const { events: giftEvents, sendGift } = useGiftEvents({
    callRoomId: active?.roomId || null,
    enabled: !!active && active.status === 'active',
    receiverId: (incoming || active)?.caller?.id || null
  });

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
    if (token && user) {
      connectSocket();
      joinSocketRoom(user.id);
    }
  }, [token, user]);

  // Listen for incoming calls
  useEffect(() => {
    if (!token || !user) return;
    const socket = getSocket();
    socket.on('incoming_call', (payload) => {
      if (activeRef.current || incoming) {
        // Receiver busy: auto reject
        try {
          api.post(`/calls/reject/${payload.callLogId}`);
        } catch { /* noop */ }
        return;
      }
      setIncoming(payload);
    });
    return () => {
      socket.off('incoming_call');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const cleanupTimers = useCallback(() => {
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    durationTimer.current = null;
    heartbeatTimer.current = null;
  }, []);

  const endActiveCall = useCallback(async (notifyBackend = true) => {
    // Guard against double-end (user-left + connection drop fire back-to-back)
    if (endingRef.current) return;
    endingRef.current = true;
    cleanupTimers();
    const cur = activeRef.current;
    if (notifyBackend && cur && cur.roomId) {
      try {
        await api.post('/calls/end', { roomId: cur.roomId });
      } catch { /* noop */ }
    }
    ag.endCall();
    setActive(null);
    setIncoming(null);
    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    refreshBalance();
    endingRef.current = false;
  }, [cleanupTimers, ag, refreshBalance]);

  const acceptCall = useCallback(async () => {
    if (!incoming) return;
    const { callLogId, roomId, type, caller, rate, receiverToken } = incoming;
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
        uid: user.id,
        type,
        onRemoteStream: (stream) => setRemoteStream(stream),
        onRemoteLeave: () => endActiveCall(),
        onCallEnded: () => endActiveCall()
      });

      setActive((prev) => ({ ...prev, status: 'active' }));
      setCallDuration(0);

      // Duration timer
      durationTimer.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      // Heartbeat billing (per minute)
      heartbeatTimer.current = setInterval(async () => {
        try {
          const hb = await api.post('/calls/heartbeat', { roomId });
          if (hb.status === 'terminated') {
            endActiveCall();
          } else {
            refreshBalance();
          }
        } catch { /* noop */ }
      }, 60000);
    } catch (err) {
      console.error('accept call failed', err);
      endActiveCall(false);
    }
  }, [incoming, user, ag, endActiveCall, refreshBalance]);

  const rejectCall = useCallback(async () => {
    if (!incoming) return;
    const { callLogId } = incoming;
    setIncoming(null);
    try {
      await api.post(`/calls/reject/${callLogId}`);
    } catch { /* noop */ }
  }, [incoming]);

  // Attach remote stream (an Agora track, not a MediaStream) to the video element
  // once it arrives. `track.play(el)` handles the actual rendering.
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && typeof remoteStream.play === 'function') {
      remoteStream.play(remoteVideoRef.current);
    }
  }, [remoteStream]);

  // If the provider unmounts mid-call (e.g. logout / tab switch), clean up the
  // Agora session, billing heartbeat and backend session so no orphaned call
  // lingers and the other party isn't left hanging.
  useEffect(() => {
    return () => {
      cleanupTimers();
      const cur = activeRef.current;
      if (cur && cur.roomId) {
        api.post('/calls/end', { roomId: cur.roomId }).catch(() => {});
      }
      ag.endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const showOverlay = incoming || active;
  const isVideo = (incoming || active)?.type === 'video';
  const peer = (incoming || active)?.caller;
  const activeStatus = active?.status || 'incoming';

  return (
    <IncomingCallContext.Provider value={{ incoming, active, acceptCall, rejectCall, endActiveCall }}>
      {children}
      {showOverlay && (
        <div className={styles.overlay}>
          <div className={styles.container}>
            {isVideo && (
              <div className={styles.videoArea}>
                <video ref={remoteVideoRef} className={styles.remoteVideo} playsInline autoPlay muted={false} />
                <video ref={localVideoRef} className={styles.localVideo} playsInline autoPlay muted />
              </div>
            )}

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
            <span className={styles.username}>@{peer?.username || 'fan'}</span>

            <div className={styles.statusBox}>
              {activeStatus === 'incoming' && <span className={styles.blink}>Incoming {isVideo ? 'Video' : 'Audio'} Call...</span>}
              {activeStatus === 'connecting' && <span className={styles.blink}>Connecting...</span>}
              {activeStatus === 'active' && (
                <div className={styles.activeMeta}>
                  <span className={styles.duration}>{formatDuration(callDuration)}</span>
                  <span className={styles.rate}>({active.rate} Coins / min)</span>
                </div>
              )}
            </div>

            {activeStatus === 'incoming' ? (
              <div className={styles.controls}>
                <button className={styles.rejectBtn} onClick={rejectCall}>
                  <PhoneOff size={26} />
                </button>
                <button className={styles.acceptBtn} onClick={acceptCall}>
                  <Phone size={26} />
                </button>
              </div>
            ) : (
              <>
                <div className={styles.callTopBar}>
                  <span className={styles.callBalanceChip}>
                    <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
                    {balance.toLocaleString()}
                    <button
                      className={styles.callRechargeBtn}
                      onClick={() => setRechargeOpen(true)}
                      title="Recharge coins"
                    >
                      <Coins size={11} /> Recharge
                    </button>
                  </span>
                </div>
                <div className={styles.controls}>
                  <button
                    className={`${styles.controlBtn} ${styles.controlBtnGift}`}
                    onClick={() => setGiftOpen(true)}
                    aria-label="Send a gift"
                  >
                    <Gift size={22} />
                  </button>
                  <button
                    className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>
                  {isVideo && (
                    <button
                      className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ''}`}
                      onClick={toggleCamera}
                    >
                      {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                  )}
                  <button className={styles.hangupBtn} onClick={() => endActiveCall()}>
                    <Phone size={26} className={styles.hangupIcon} />
                  </button>
                  <button
                    className={`${styles.controlBtn} ${styles.controlBtnCoins}`}
                    onClick={() => setRechargeOpen(true)}
                    aria-label="Recharge coins"
                  >
                    <Coins size={22} />
                  </button>
                </div>
              </>
            )}
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
          onRecharge={() => { setGiftOpen(false); setRechargeOpen(true); }}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}
    </IncomingCallContext.Provider>
  );
};
