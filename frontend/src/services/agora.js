// The agora-rtc-sdk-ng package exports a single default namespace (AgoraRTC).
// Using a named import (e.g. `import { AgoraRTCClient }`) silently yields
// `undefined`, so the correct API is `AgoraRTC.createClient(...)` etc.
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

let client = null;

export const getAgoraClient = () => {
  if (!client) {
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return client;
};

export const joinAgoraChannel = async ({ channel, token, uid }) => {
  const c = getAgoraClient();
  await c.join(APP_ID, channel, token, uid);
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