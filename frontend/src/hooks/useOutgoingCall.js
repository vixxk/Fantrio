import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useToast } from '../components/Toast/Toast';
import { useAppDialog } from '../components/AppDialog/AppDialog';
import { pickAlternatePlaybackDevice } from '../services/agora';
import { useAgoraCall } from './useAgoraCall';
import { playRingtone, stopRingtone } from '../utils/ringtone';

export const useOutgoingCall = ({ type }) => {
  const { user, balance, refreshBalance } = useApp();
  const { toast } = useToast();
  const { info } = useAppDialog();
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
    stopRingtone();
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
    if (endingRef.current) return;
    endingRef.current = true;
    const cur = activeCallRef.current;
    clearCall();
    if (cur && cur.roomId) {
      try {
        await api.post('/calls/end', { roomId: cur.roomId });
      } catch (e) { console.error('end call failed', e); }
    }
    refreshBalance();
    endingRef.current = false;
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [clearCall, refreshBalance]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (activeCallRef.current) {
        e?.preventDefault?.();
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (activeCall) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeCall]);

  const endCallRef = useRef(endCall);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  useEffect(() => {
    return () => {
      if (activeCallRef.current) {
        endCallRef.current();
      }
    };
  }, []);

  const checkMediaPermissions = async (callType) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return true;
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

  const startCall = useCallback(async (creator) => {
    if (activeCallRef.current) {
      toast.warning('You are already in an active call. End it before starting a new one.');
      return;
    }
    endingRef.current = false;
    const rate = creator.rate || creator[videoCall ? 'videoCallPerMin' : 'audioCallPerMin'] || 0;

    // Special themed popup for fans if creator is busy
    if (creator.isBusy) {
      info({
        title: 'Creator is Busy',
        message: `${creator.displayName || 'The creator'} is currently in another active call. Please try again in a few minutes.`
      });
      return;
    }
    if (creator.isOnline === false) {
      info({
        title: 'Creator Offline',
        message: `${creator.displayName || 'The creator'} is currently offline and cannot take call requests right now.`
      });
      return;
    }
    if (balance < rate) {
      toast.error(`Insufficient coins! You need at least ${rate} coins to initiate this call.`);
      return;
    }

    const hasPermission = await checkMediaPermissions(type);
    if (!hasPermission) {
      toast.error(`Microphone ${videoCall ? 'and Camera ' : ''}permission is required for ${type} calls. Please allow permission in your browser settings.`);
      return;
    }

    let call;
    try {
      call = await api.post('/calls/initiate', {
        receiverId: creator.userId || creator._id,
        type
      });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('busy')) {
        info({
          title: 'Creator is Busy',
          message: `${creator.displayName || 'The creator'} is currently in another active call. Please try again in a few minutes.`
        });
      } else {
        toast.error(err.message || 'Failed to initiate call');
      }
      return;
    }

    const { roomId, callLogId, rate: callRate } = call;
    const callerToken = call.callLog && call.callLog.callerToken;
    const token = callerToken || call.agoraToken;

    setActiveCall({ creator, status: 'connecting', roomId, callLogId, rate: callRate, token });
    setCallDuration(0);
    playRingtone('outgoing');

    // Set when the ring times out (no answer). Prevents a late call_accepted
    // from the receiver racing the timeout and reviving a call the user
    // already saw end.
    let callEnded = false;

    const ringTimeout = setTimeout(() => {
      setActiveCall((prev) => {
        if (prev && prev.status === 'connecting' && prev.roomId === roomId) {
          callEnded = true;
          removeSocketListeners();
          try { api.post('/calls/end', { roomId }); } catch { /* noop */ }
          clearCall();
          sessionStorage.setItem('fantrio_call_notice', JSON.stringify({
            title: 'Call Unanswered',
            message: `No answer. ${creator.displayName || 'The creator'} did not pick up the call request.`
          }));
          setTimeout(() => {
            window.location.reload();
          }, 150);
          return null;
        }
        return prev;
      });
    }, 30000);

    const socket = getSocket();

    const handleAccepted = (payload) => {
      if (callEnded || payload.roomId !== roomId) return;
      stopRingtone();
      clearTimeout(ringTimeout);
      setActiveCall((prev) => (prev ? { ...prev, status: 'active' } : prev));
      setCallDuration(0);
      setIsMuted(false);
      setIsCameraOff(false);
      refreshBalance();

      ag.joinCall({
        channel: roomId,
        token: payload?.token || token,
        uid: user?.id || user?._id,
        type,
        onRemoteStream: (stream) => setRemoteStream(stream),
        onRemoteLeave: () => endCall(),
        onCallEnded: () => endCall()
      }).catch((e) => console.error('join call failed', e));

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
      clearTimeout(ringTimeout);
      clearCall();
      let title = 'Call Declined';
      let message = `${creator.displayName || 'The creator'} declined your call request.`;
      if (payload?.reason === 'receiver_busy') {
        title = 'Creator Busy';
        message = `${creator.displayName || 'The creator'} is currently busy on another call.`;
      } else if (payload?.reason === 'insufficient_funds') {
        title = 'Call Failed';
        message = 'The call could not start — your coin balance is too low.';
      }
      sessionStorage.setItem('fantrio_call_notice', JSON.stringify({ title, message }));
      refreshBalance();
      setTimeout(() => {
        window.location.reload();
      }, 150);
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
  }, [type, videoCall, balance, user, ag, endCall, clearCall, removeSocketListeners, refreshBalance, toast]);

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

  // Toggle the speaker: flips the UI state AND routes the remote audio to the
  // matching output device — speaker ON → default output, speaker OFF →
  // earpiece/alternate output — on browsers that support setSinkId (Chrome/
  // Edge desktop). Where the browser doesn't support it, it stays a visual
  // toggle and routing is skipped.
  const toggleSpeaker = useCallback(async () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    const sink = next ? 'default' : await pickAlternatePlaybackDevice();
    ag.setPlaybackSink(sink).catch(() => {});
  }, [isSpeakerOn, ag]);

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
    toggleSpeaker,
    attachRemote,
    attachLocal,
    formatDuration,
    videoCall,
    remoteCameraOff: ag.remoteCameraOff,
    remoteMicMuted: ag.remoteMicMuted
  };
};
