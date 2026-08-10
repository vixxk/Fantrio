import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useToast } from '../components/Toast/Toast';
import { useAgoraCall } from './useAgoraCall';

export const useOutgoingCall = ({ type }) => {
  const { user, balance, refreshBalance } = useApp();
  const { toast } = useToast();
  const [activeCall, setActiveCall] = useState(null); // { creator, status, roomId, callLogId, rate, token }
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const ag = useAgoraCall();

  const activeCallRef = useRef(null);
  const durationTimer = useRef(null);
  const heartbeatTimer = useRef(null);
  const listenerRefs = useRef([]);
  const endingRef = useRef(false);
  const remoteVideoElRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const videoCall = type === 'video';

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  const cleanupTimers = useCallback(() => {
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    durationTimer.current = null;
    heartbeatTimer.current = null;
  }, []);

  const removeSocketListeners = useCallback(() => {
    const socket = getSocket();
    listenerRefs.current.forEach(({ event, handler }) => {
      socket.off(event, handler);
    });
    listenerRefs.current = [];
  }, []);

  const clearCall = useCallback(() => {
    cleanupTimers();
    removeSocketListeners();
    ag.endCall();
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsCameraOff(false);
    setRemoteStream(null);
  }, [cleanupTimers, removeSocketListeners, ag]);

  const endCall = useCallback(async () => {
    // Guard against double-end: remote leave (user-left) and the connection
    // dropping (DISCONNECTED) can fire back-to-back and both reach here.
    if (endingRef.current) return;
    endingRef.current = true;
    const cur = activeCallRef.current;
    if (cur && cur.roomId) {
      try {
        await api.post('/calls/end', { roomId: cur.roomId });
      } catch (e) { console.error('end call failed', e); }
    }
    clearCall();
    refreshBalance();
    endingRef.current = false;
  }, [clearCall, refreshBalance]);

  const startCall = useCallback(async (creator) => {
    const rate = creator.rate || creator[videoCall ? 'videoCallPerMin' : 'audioCallPerMin'] || 0;
    if (creator.isBusy) {
      toast.warning(`${creator.displayName} is currently busy on another call.`);
      return;
    }
    if (balance < rate) {
      toast.error(`Insufficient coins! You need at least ${rate} coins to initiate this call.`);
      return;
    }

    let call;
    try {
      call = await api.post('/calls/initiate', {
        receiverId: creator.userId || creator._id,
        type
      });
    } catch (err) {
      toast.error(err.message || 'Failed to initiate call');
      return;
    }

    const { roomId, callLogId, rate: callRate } = call;
    const callerToken = call.callLog && call.callLog.callerToken;
    const token = callerToken || call.agoraToken;

    setActiveCall({ creator, status: 'connecting', roomId, callLogId, rate: callRate, token });
    setCallDuration(0);

    const socket = getSocket();

    const handleAccepted = (payload) => {
      if (payload.roomId !== roomId) return;
      setActiveCall((prev) => (prev ? { ...prev, status: 'active' } : prev));
      setCallDuration(0);
      refreshBalance();

      // Join Agora room as the caller. NOTE: the hook expects `channel`, not
      // `roomId`, and `uid`, not `userId` — a mismatch here silently breaks
      // the Agora connection even with valid credentials.
      ag.joinCall({
        channel: roomId,
        token,
        uid: user.id,
        type,
        onRemoteStream: (stream) => setRemoteStream(stream),
        onRemoteLeave: () => endCall(),
        onCallEnded: () => endCall()
      }).catch((e) => console.error('join call failed', e));

      // Start duration + heartbeat
      durationTimer.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
      heartbeatTimer.current = setInterval(async () => {
        try {
          const hb = await api.post('/calls/heartbeat', { roomId });
          if (hb.status === 'terminated') {
            toast.error('Call disconnected: Insufficient coins.');
            endCall();
          } else {
            refreshBalance();
          }
        } catch (e) { console.error('heartbeat error', e); }
      }, 60000);
    };

    const handleRejected = (payload) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      clearCall();
      toast.info('The call was declined.');
      refreshBalance();
    };

    const handleEnded = (payload) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      clearCall();
      refreshBalance();
    };

    const handleTerminated = (payload) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      clearCall();
      toast.error('Call ended due to insufficient balance.');
      refreshBalance();
    };

    // Backend warns the caller (the payer) one minute before funds run out.
    const handleCallWarning = (payload) => {
      if (payload.roomId && payload.roomId !== roomId) return;
      toast.warning(payload.message || 'Your coin balance is very low. Recharge now to stay connected.');
    };

    socket.on('call_accepted', handleAccepted);
    socket.on('call_rejected', handleRejected);
    socket.on('call_ended', handleEnded);
    socket.on('call_terminated', handleTerminated);
    socket.on('call_warning', handleCallWarning);
    listenerRefs.current = [
      { event: 'call_accepted', handler: handleAccepted },
      { event: 'call_rejected', handler: handleRejected },
      { event: 'call_ended', handler: handleEnded },
      { event: 'call_terminated', handler: handleTerminated },
      { event: 'call_warning', handler: handleCallWarning }
    ];
  }, [type, videoCall, balance, user, ag, endCall, clearCall, refreshBalance, toast]);

  // Attach remote stream (an Agora track, not a MediaStream) to a <video>.
  // Keeps the element in a ref so the stream can be re-attached when it
  // arrives after the element has mounted.
  const attachRemote = useCallback((el) => {
    remoteVideoElRef.current = el;
    const stream = remoteStreamRef.current;
    if (el && stream && typeof stream.play === 'function') {
      stream.play(el);
    }
  }, []);

  // Re-attach whenever the remote stream changes (video track, then audio,
  // or a mute/unmute cycle) — the ref callback alone only runs on mount.
  useEffect(() => {
    const el = remoteVideoElRef.current;
    const stream = remoteStream;
    if (el && stream && typeof stream.play === 'function') {
      stream.play(el);
    }
  }, [remoteStream]);

  const attachLocal = useCallback((el) => {
    ag.attachLocal(el);
  }, [ag]);

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

  return {
    activeCall,
    callDuration,
    isMuted,
    isSpeakerOn,
    isCameraOff,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    setIsSpeakerOn,
    attachRemote,
    attachLocal,
    formatDuration,
    videoCall
  };
};
