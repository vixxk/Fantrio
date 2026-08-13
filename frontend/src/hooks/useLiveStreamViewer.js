import { useRef, useCallback, useEffect, useState } from 'react';
import {
  joinAgoraChannel,
  subscribeToUser,
  leaveAgoraChannel,
  destroyAgoraClient,
  onUserPublished,
  onUserLeft,
  onConnectionStateChange,
} from '../services/agora';

/**
 * Passive live-stream viewer: joins an Agora channel as a pure subscriber
 * (no local microphone/camera publish), plays the creator's video track into
 * the attached <video> element, and reports when the stream ends.
 */
export const useLiveStreamViewer = () => {
  const clientRef = useRef(null);
  const videoElRef = useRef(null);
  const remoteTrackRef = useRef(null);
  const onStreamEndedRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const cleanup = useCallback(() => {
    const c = clientRef.current;
    if (c) {
      try { leaveAgoraChannel(c); } catch { /* noop */ }
    }
    try { destroyAgoraClient(); } catch { /* noop */ }
    clientRef.current = null;
    remoteTrackRef.current = null;
    setJoined(false);
    setIsPlaying(false);
  }, []);

  const join = useCallback(async ({ channel, token, uid, onStreamEnded }) => {
    cleanup();
    try {
      const c = await joinAgoraChannel({ channel, token, uid });
      clientRef.current = c;
      onStreamEndedRef.current = onStreamEnded;

      const handleUserPublished = async (user, mediaType) => {
        await subscribeToUser(c, user, mediaType);
        if (mediaType === 'video' && user.videoTrack) {
          remoteTrackRef.current = user.videoTrack;
          if (videoElRef.current) {
            try {
              user.videoTrack.play(videoElRef.current);
            } catch (e) {
              console.warn('Remote video play error:', e);
            }
          }
          setIsPlaying(true);
        } else if (mediaType === 'audio' && user.audioTrack) {
          try {
            user.audioTrack.play();
          } catch (e) {
            console.warn('Remote audio play error:', e);
          }
        }
      };
      onUserPublished(c, handleUserPublished);

      // Check existing remote users who were already in the channel when joining
      if (c.remoteUsers && c.remoteUsers.length > 0) {
        for (const u of c.remoteUsers) {
          if (u.hasVideo) {
            handleUserPublished(u, 'video');
          }
          if (u.hasAudio) {
            handleUserPublished(u, 'audio');
          }
        }
      }

      const handleUserLeft = () => {
        if (onStreamEndedRef.current) onStreamEndedRef.current();
      };
      onUserLeft(c, handleUserLeft);

      const handleConnectionStateChange = (state, reason) => {
        if (state === 'DISCONNECTED' || state === 'FAILED' || reason === 'USER_OFFLINE') {
          if (onStreamEndedRef.current) onStreamEndedRef.current();
        }
      };
      onConnectionStateChange(c, handleConnectionStateChange);

      setJoined(true);
      return true;
    } catch (e) {
      console.error('Failed to join live stream channel', e);
      cleanup();
      throw e;
    }
  }, [cleanup]);

  const leave = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const attachVideo = useCallback((el) => {
    videoElRef.current = el;
    const track = remoteTrackRef.current;
    if (el && track && typeof track.play === 'function') {
      track.play(el);
    }
  }, []);

  // Cleanup on unmount (leave the channel, destroy the client)
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { joined, isPlaying, join, leave, attachVideo };
};
