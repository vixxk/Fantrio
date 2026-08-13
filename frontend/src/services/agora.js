// The agora-rtc-sdk-ng package exports a single default namespace (AgoraRTC).
// Using a named import (e.g. `import { AgoraRTCClient }`) silently yields
// `undefined`, so the correct API is `AgoraRTC.createClient(...)` etc.
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '8834c7bd129d4aba90bc322fdba03b4b';

let client = null;

export const getAgoraClient = () => {
  if (!client) {
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return client;
};

export const joinAgoraChannel = async ({ channel, token, uid }) => {
  const c = getAgoraClient();
  const userIdStr = String(uid);
  const tokenToUse = (token && typeof token === 'string' && token.length > 10) ? token : null;
  await c.join(APP_ID, channel, tokenToUse, userIdStr);
  return c;
};

export const createLocalAudioTrack = async () => {
  const track = await AgoraRTC.createMicrophoneAudioTrack();
  return track;
};

export const createLocalVideoTrack = async () => {
  const track = await AgoraRTC.createCameraVideoTrack();
  return track;
};

export const publishTrack = async (c, track) => {
  await c.publish([track]);
};

export const subscribeToUser = async (c, user, mediaType) => {
  // Passing mediaType subscribes only the published type, so e.g. a mute
  // (user-unpublished) on one track can't disrupt the other track.
  await c.subscribe(user, mediaType);
  return user;
};

export const unpublishTrack = async (c, track) => {
  await c.unpublish(track);
};

export const unsubscribeFromUser = async (c, user) => {
  await c.unsubscribe(user);
};

export const leaveAgoraChannel = async (c) => {
  if (c) {
    try {
      await c.leave();
    } catch (e) {
      console.error('leaveAgoraChannel error', e);
    }
  }
};

export const destroyAgoraClient = () => {
  // SDK 4.x has no client.remove() — after leave(), releasing the reference
  // is enough. A fresh client is created on the next getAgoraClient() call.
  if (client) {
    client = null;
  }
};

export const playTrack = (track, container) => {
  if (!track || !container) return;
  track.play(container);
};

export const onUserPublished = (c, handler) => {
  c.on('user-published', handler);
};

export const onUserUnpublished = (c, handler) => {
  c.on('user-unpublished', handler);
};

export const onUserLeft = (c, handler) => {
  c.on('user-left', handler);
};

export const onConnectionStateChange = (c, handler) => {
  c.on('connection-state-change', handler);
};

export const offUserPublished = (c, handler) => {
  c.off('user-published', handler);
};

export const offUserUnpublished = (c, handler) => {
  c.off('user-unpublished', handler);
};

export const offUserLeft = (c, handler) => {
  c.off('user-left', handler);
};

export const offConnectionStateChange = (c, handler) => {
  c.off('connection-state-change', handler);
};

/* ==========================================================================
   Audio output routing (the "speaker" button)
   Backed by the browser's setSinkId API, surfaced by the SDK as
   IRemoteAudioTrack.setPlaybackDevice. Supported on browsers with setSinkId
   (Chrome/Edge desktop and others); everywhere else these helpers no-op so
   the speaker button stays a pure visual toggle.
   ========================================================================== */

export const supportsSinkSelection = () =>
  typeof window !== 'undefined' &&
  typeof HTMLMediaElement !== 'undefined' &&
  typeof HTMLMediaElement.prototype.setSinkId === 'function';

// Enumerate the available audio output devices (speakers/earpiece).
// skipPermissionCheck=true avoids a permission prompt — we only need the
// device ids; labels stay empty until the user grants permission.
export const getPlaybackDevices = async () => {
  if (!supportsSinkSelection() || typeof AgoraRTC.getPlaybackDevices !== 'function') {
    return [];
  }
  try {
    return await AgoraRTC.getPlaybackDevices(true);
  } catch (e) {
    console.warn('Failed to enumerate playback devices:', e);
    return [];
  }
};

// Best "speaker off" sink: the earpiece ('communications') when available,
// otherwise the first non-default output device, otherwise the default.
export const pickAlternatePlaybackDevice = async () => {
  const devices = await getPlaybackDevices();
  const comm = devices.find((d) => d.deviceId === 'communications');
  if (comm && comm.deviceId) return comm.deviceId;
  const alt = devices.find((d) => d.deviceId && d.deviceId !== 'default');
  return alt ? alt.deviceId : 'default';
};

// Route a remote audio track to a specific output device.
export const setTrackPlaybackDevice = async (track, deviceId) => {
  if (!supportsSinkSelection() || !track || typeof track.setPlaybackDevice !== 'function') {
    return false;
  }
  try {
    await track.setPlaybackDevice(deviceId || 'default');
    return true;
  } catch (e) {
    console.warn('Failed to set playback device:', e);
    return false;
  }
};