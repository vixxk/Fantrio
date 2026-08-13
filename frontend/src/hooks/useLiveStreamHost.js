import { useRef, useCallback, useEffect, useState } from 'react';
import {
  joinAgoraChannel,
  createLocalAudioTrack,
  createLocalVideoTrack,
  publishTrack,
  unpublishTrack,
  leaveAgoraChannel,
  destroyAgoraClient,
} from '../services/agora';

/**
 * Hook for live stream host (creator).
 * Manages Agora channel publishing, local camera/microphone tracks,
 * camera ON/OFF toggle, mic mute, duration timer, and cleanup.
 */
export const useLiveStreamHost = () => {
  const clientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const videoTrackRef = useRef(null);
  const videoContainerRef = useRef(null);
  const timerRef = useRef(null);

  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  const cleanup = useCallback(() => {
    stopTimer();

    // Close video track
    if (videoTrackRef.current) {
      try {
        videoTrackRef.current.stop();
        videoTrackRef.current.close();
      } catch { /* noop */ }
      videoTrackRef.current = null;
    }

    // Close audio track
    if (audioTrackRef.current) {
      try {
        audioTrackRef.current.stop();
        audioTrackRef.current.close();
      } catch { /* noop */ }
      audioTrackRef.current = null;
    }

    // Leave channel
    if (clientRef.current) {
      try { leaveAgoraChannel(clientRef.current); } catch { /* noop */ }
      try { destroyAgoraClient(); } catch { /* noop */ }
      clientRef.current = null;
    }

    setIsLive(false);
    setIsCameraOn(true);
    setIsMuted(false);
    setCameraError(null);
  }, [stopTimer]);

  // Start hosting stream
  const startHost = useCallback(async ({ channel, token, uid }) => {
    cleanup();
    setCameraError(null);

    try {
      // 1. Join Agora Channel
      const c = await joinAgoraChannel({ channel, token, uid });
      clientRef.current = c;

      // 2. Create Audio Track
      try {
        const audioTrack = await createLocalAudioTrack();
        audioTrackRef.current = audioTrack;
        await publishTrack(c, audioTrack);
      } catch (audioErr) {
        console.warn('Microphone access failed or unavailable:', audioErr);
      }

      // 3. Create Video Track
      try {
        const videoTrack = await createLocalVideoTrack();
        videoTrackRef.current = videoTrack;
        await publishTrack(c, videoTrack);
        setIsCameraOn(true);

        if (videoContainerRef.current) {
          videoTrack.play(videoContainerRef.current);
        }
      } catch (vidErr) {
        console.warn('Camera access failed or unavailable. Falling back to Camera Off:', vidErr);
        setIsCameraOn(false);
        setCameraError('Camera unavailable or permission denied.');
      }

      setIsLive(true);
      startTimer();
      return true;
    } catch (err) {
      console.error('Failed to start live host session:', err);
      cleanup();
      throw err;
    }
  }, [cleanup, startTimer]);

  // Toggle Camera ON / OFF
  const toggleCamera = useCallback(async () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);

    if (nextState) {
      // Turn Camera ON
      try {
        if (!videoTrackRef.current) {
          const videoTrack = await createLocalVideoTrack();
          videoTrackRef.current = videoTrack;
          if (clientRef.current) {
            await publishTrack(clientRef.current, videoTrack);
          }
        } else {
          await videoTrackRef.current.setEnabled(true);
          if (clientRef.current) {
            await publishTrack(clientRef.current, videoTrackRef.current);
          }
        }
        if (videoContainerRef.current && videoTrackRef.current) {
          videoTrackRef.current.play(videoContainerRef.current);
        }
        setCameraError(null);
      } catch (err) {
        console.error('Failed to enable camera:', err);
        setIsCameraOn(false);
        setCameraError('Could not turn camera on.');
      }
    } else {
      // Turn Camera OFF
      if (videoTrackRef.current) {
        try {
          if (clientRef.current) {
            await unpublishTrack(clientRef.current, videoTrackRef.current);
          }
          await videoTrackRef.current.setEnabled(false);
        } catch (e) {
          console.warn('Error disabling video track:', e);
        }
      }
    }
  }, [isCameraOn]);

  // Toggle Mute / Unmute
  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (audioTrackRef.current) {
      try {
        await audioTrackRef.current.setEnabled(!nextMuted);
      } catch (e) {
        console.warn('Error setting audio track enabled state:', e);
      }
    }
  }, [isMuted]);

  // Attach local video track to DOM element
  const attachLocalVideo = useCallback((element) => {
    videoContainerRef.current = element;
    if (element && videoTrackRef.current && isCameraOn) {
      try {
        videoTrackRef.current.play(element);
      } catch (e) {
        console.warn('Failed to play local video in element:', e);
      }
    }
  }, [isCameraOn]);

  // End hosting session
  const stopHost = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isLive,
    isCameraOn,
    isMuted,
    durationSeconds,
    cameraError,
    startHost,
    stopHost,
    toggleCamera,
    toggleMute,
    attachLocalVideo,
  };
};
