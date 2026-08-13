import { useRef, useState, useCallback, useEffect } from 'react';
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
  setTrackPlaybackDevice,
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
  // True while the remote user's camera is off (or not published yet). Lets
  // the UI show the avatar fallback instead of a black screen when they turn
  // their camera off. Only ever reflects the REMOTE party's video.
  const [remoteCameraOff, setRemoteCameraOff] = useState(true);
  // True while the remote user's microphone is muted. Driven purely by the
  // remote party's publish/unpublish events — their mute never touches the
  // local tracks.
  const [remoteMicMuted, setRemoteMicMuted] = useState(false);
  // Output device (speaker) chosen via the speaker button. Kept in a ref so it
  // survives track changes and is re-applied whenever the remote audio track
  // is (re)published. 'default' routes to the browser's default speakers.
  const playbackSinkRef = useRef('default');

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

  // Remote track priority: video wins for video calls, audio is the fallback.
  // Remote audio is played explicitly at subscribe time (see
  // handleUserPublished) — audio calls have no <video> element to attach to,
  // so the audio track must be played to the default output on its own.
  const pickRemoteStream = useCallback(() => {
    return remoteVideoTrackRef.current || remoteAudioTrackRef.current;
  }, []);

  const endCall = useCallback(() => {
    const c = clientRef.current;
    if (localAudioTrackRef.current) {
      try {
        if (c) unpublishTrack(c, localAudioTrackRef.current);
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      } catch (e) {
        console.error('endCall audio track cleanup error', e);
      }
    }
    if (localVideoTrackRef.current) {
      try {
        if (c) unpublishTrack(c, localVideoTrackRef.current);
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      } catch (e) {
        console.error('endCall video track cleanup error', e);
      }
    }
    if (c) {
      try {
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
    playbackSinkRef.current = 'default';
    setJoined(false);
    setRemoteCameraOff(true);
    setRemoteMicMuted(false);
  }, [cleanupListeners]);

  // Clean up on component unmount to guarantee hardware release
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

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
          setRemoteCameraOff(false);
        } else if (mediaType === 'audio' && user.audioTrack) {
          remoteAudioTrackRef.current = user.audioTrack;
          setRemoteMicMuted(false);
          // Remote audio is not auto-played by the SDK after subscribe — play
          // it explicitly (no element: plays through the default output), so
          // audio calls are audible on both ends.
          try {
            remoteAudioTrackRef.current.play();
          } catch (err) {
            console.error('Failed to play remote audio track:', err);
          }
          // Re-apply the user's chosen speaker sink (e.g. after the remote
          // mutes and re-publishes audio mid-call).
          if (playbackSinkRef.current && playbackSinkRef.current !== 'default') {
            try {
              await setTrackPlaybackDevice(remoteAudioTrackRef.current, playbackSinkRef.current);
            } catch (err) {
              console.warn('Failed to re-apply playback device:', err);
            }
          }
        }
        if (onRemoteStream) onRemoteStream(pickRemoteStream());
      };
      onUserPublished(c, handleUserPublished);
      callbacksRef.current['user-published'] = handleUserPublished;

      // Remote toggling a track (mute/camera off) must NOT end the call —
      // just clear that track and keep the other one playing.
      const handleUserUnpublished = (user, mediaType) => {
        // Only the remote party's track is affected — never the local tracks.
        if (mediaType === 'video') {
          remoteVideoTrackRef.current = null;
          setRemoteCameraOff(true);
        } else if (mediaType === 'audio') {
          remoteAudioTrackRef.current = null;
          setRemoteMicMuted(true);
        }
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
      const handleConnectionStateChange = (curState) => {
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

  // These only ever touch the LOCAL track — the remote user's own mic/camera
  // state is completely independent. They return the new MUTED / OFF state,
  // which is what every caller stores in isMuted / isCameraOff.
  const toggleMute = useCallback(() => {
    const track = localAudioTrackRef.current;
    if (!track) return false;
    const next = !track.enabled; // next *enabled* state
    track.setEnabled(next);
    return !next; // new muted state
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localVideoTrackRef.current;
    if (!track) return false;
    const next = !track.enabled; // next *enabled* state
    track.setEnabled(next);
    return !next; // new camera-off state
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

  // Route the remote audio to a specific output device (speaker toggle).
  // Stores the choice so it is re-applied if the remote track is re-published.
  const setPlaybackSink = useCallback(async (deviceId) => {
    playbackSinkRef.current = deviceId || 'default';
    const track = remoteAudioTrackRef.current;
    if (track) {
      await setTrackPlaybackDevice(track, playbackSinkRef.current);
    }
  }, []);

  return {
    joined,
    joinCall,
    endCall,
    toggleMute,
    toggleCamera,
    attachLocal,
    attachRemote,
    remoteCameraOff,
    remoteMicMuted,
    setPlaybackSink,
  };
};
