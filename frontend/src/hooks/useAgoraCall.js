import { useRef, useState, useCallback } from 'react';
import {
  joinAgoraChannel,
  createLocalAudioTrack,
  createLocalVideoTrack,
  publishTrack,
  subscribeToUser,
  unpublishTrack,
  unsubscribeFromUser,
  leaveAgoraChannel,
  destroyAgoraClient,
  onUserPublished,
  onUserUnpublished,
  onUserLeft,
  onConnectionStateChange,
} from '../services/agora';

export const useAgoraCall = () => {
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const remoteAudioTrackRef = useRef(null);
  const remoteUserIdRef = useRef('');
  const streamIdRef = useRef('');
  const callbacksRef = useRef({});
  const [joined, setJoined] = useState(false);

  const cleanupListeners = useCallback(() => {
    const c = clientRef.current;
    if (!c) return;
    const handlers = callbacksRef.current;
    Object.keys(handlers).forEach((event) => {
      if (handlers[event]) {
        try { c.off(event, handlers[event]); } catch { /* noop */ }
      }
    });
    callbacksRef.current = {};
  }, []);

  // Remote track priority: video wins for video calls, audio is the fallback
  // (audio tracks auto-play in Agora once subscribed, so this is only used to
  // attach video to a <video> element and to surface the stream).
  const pickRemoteStream = useCallback(() => {
    return remoteVideoTrackRef.current || remoteAudioTrackRef.current;
  }, []);

  const endCall = useCallback(() => {
    const c = clientRef.current;
    if (c) {
      try {
        if (localAudioTrackRef.current) {
          unpublishTrack(c, localAudioTrackRef.current);
          localAudioTrackRef.current.close();
        }
        if (localVideoTrackRef.current) {
          unpublishTrack(c, localVideoTrackRef.current);
          localVideoTrackRef.current.close();
        }
        if (remoteUserIdRef.current) {
          unsubscribeFromUser(c, { uid: remoteUserIdRef.current });
        }
      } catch (e) {
        console.error('endCall cleanup error', e);
      }
      leaveAgoraChannel(c);
    }
    cleanupListeners();
    destroyAgoraClient();
    clientRef.current = null;
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    remoteUserIdRef.current = '';
    streamIdRef.current = '';
    setJoined(false);
  }, [cleanupListeners]);

  const joinCall = useCallback(async ({ channel, token, uid, type, onRemoteStream, onRemoteLeave, onCallEnded }) => {
    endCall();
    try {
      const c = await joinAgoraChannel({ channel, token, uid });
      clientRef.current = c;
      callbacksRef.current = {};

      const localAudioTrack = await createLocalAudioTrack();
      localAudioTrackRef.current = localAudioTrack;

      let localVideoTrack = localVideoTrackRef.current;
      if (type === 'video' && !localVideoTrack) {
        try {
          localVideoTrack = await createLocalVideoTrack();
          localVideoTrackRef.current = localVideoTrack;
        } catch (camErr) {
          console.warn('Local camera capture unavailable, proceeding with audio only:', camErr);
        }
      }

      const streamId = `${uid}_${Date.now()}`;
      streamIdRef.current = streamId;

      if (localVideoTrack) {
        await publishTrack(c, localVideoTrack);
      }
      await publishTrack(c, localAudioTrack);

      const handleUserPublished = async (user, mediaType) => {
        remoteUserIdRef.current = user.uid;
        await subscribeToUser(c, user, mediaType);
        if (mediaType === 'video' && user.videoTrack) {
          remoteVideoTrackRef.current = user.videoTrack;
        } else if (mediaType === 'audio' && user.audioTrack) {
          remoteAudioTrackRef.current = user.audioTrack;
        }
        if (onRemoteStream) onRemoteStream(pickRemoteStream());
      };
      onUserPublished(c, handleUserPublished);
      callbacksRef.current['user-published'] = handleUserPublished;

      // Remote toggling a track (mute/camera off) must NOT end the call —
      // just clear that track and keep the other one playing.
      const handleUserUnpublished = (user, mediaType) => {
        if (mediaType === 'video') remoteVideoTrackRef.current = null;
        else if (mediaType === 'audio') remoteAudioTrackRef.current = null;
        if (onRemoteStream) onRemoteStream(pickRemoteStream());
      };
      onUserUnpublished(c, handleUserUnpublished);
      callbacksRef.current['user-unpublished'] = handleUserUnpublished;

      // Only a real channel leave (hang up / app close) should end the call.
      const handleUserLeft = () => {
        if (onRemoteLeave) onRemoteLeave();
      };
      onUserLeft(c, handleUserLeft);
      callbacksRef.current['user-left'] = handleUserLeft;

      let hasBeenConnected = false;
      const handleConnectionStateChange = (curState, revState, reason) => {
        if (curState === 'CONNECTED') {
          hasBeenConnected = true;
        }
        if (onCallEnded && (curState === 'FAILED' || (hasBeenConnected && curState === 'DISCONNECTED'))) {
          onCallEnded();
        }
      };
      onConnectionStateChange(c, handleConnectionStateChange);
      callbacksRef.current['connection-state-change'] = handleConnectionStateChange;

      setJoined(true);
      return { localAudioTrack, localVideoTrack, streamId };
    } catch (e) {
      console.error('joinCall failed', e);
      endCall();
      throw e;
    }
  }, [endCall, pickRemoteStream]);

  const toggleMute = useCallback(() => {
    const track = localAudioTrackRef.current;
    if (!track) return false;
    const next = !track.enabled;
    track.setEnabled(next);
    return next;
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localVideoTrackRef.current;
    if (!track) return false;
    const next = !track.enabled;
    track.setEnabled(next);
    return next;
  }, []);

  const attachLocal = useCallback(async (el) => {
    if (!el) return;
    try {
      if (!localVideoTrackRef.current) {
        localVideoTrackRef.current = await createLocalVideoTrack();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.play(el);
      }
    } catch (err) {
      console.warn('Failed to attach local video preview:', err);
    }
  }, []);

  const attachRemote = useCallback((el) => {
    const track = pickRemoteStream();
    if (!el || !track) return;
    track.play(el);
  }, [pickRemoteStream]);

  return {
    joined,
    joinCall,
    endCall,
    toggleMute,
    toggleCamera,
    attachLocal,
    attachRemote,
  };
};
