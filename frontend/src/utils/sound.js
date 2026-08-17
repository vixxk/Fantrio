/**
 * Soft synthesized gift chime + haptic tap. No audio asset required — the
 * chime is generated with the Web Audio API, so it always sounds consistent,
 * loads instantly, and works offline.
 */
import { isCallActive } from './callState';

let audioCtx = null;

// Chime throttle: at most one chime per CHIME_COOLDOWN_MS, with tier priority
// — a higher-tier gift always rings through even mid-cooldown, while a flood
// of low-tier gifts (live-stream bursts) is collapsed into a single chime.
const CHIME_COOLDOWN_MS = 800;
let lastChimeAt = 0;
let lastChimeTier = 0;

// User preference: mute gift chimes (persisted). Muting silences the sound;
// the subtle haptic tap still fires so silent-mode phones keep the feedback.
const MUTE_STORAGE_KEY = 'giftChimeMuted';
let chimeMuted = (() => {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch { /* localStorage unavailable */ }
  return false;
})();

export const isGiftChimeMuted = () => chimeMuted;

export const setGiftChimeMuted = (muted) => {
  chimeMuted = !!muted;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(chimeMuted));
  } catch { /* localStorage unavailable */ }
};

const getAudioCtx = () => {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) {
      try {
        audioCtx = new Ctor();
      } catch (err) {
        console.warn('Web Audio unavailable:', err);
      }
    }
  }
  return audioCtx;
};

// Note frequencies (Hz)
const NOTES = {
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
  E6: 1318.5,
  G6: 1567.98
};

// Ascending chime patterns per gift tier — a soft double "ding" for Classic
// gifts, a richer arpeggio for Luxury/Royal/Ultra gifts.
// Each entry: [note, startOffsetSec, durationSec]
const TIER_PATTERNS = {
  1: [['E5', 0, 0.5], ['C6', 0.12, 0.65]],
  2: [['E5', 0, 0.45], ['G5', 0.1, 0.5], ['C6', 0.2, 0.7]],
  3: [['C5', 0, 0.4], ['G5', 0.12, 0.5], ['E6', 0.24, 0.65], ['G6', 0.36, 0.8]],
  4: [['C5', 0, 0.4], ['E5', 0.12, 0.45], ['G5', 0.24, 0.55], ['C6', 0.36, 0.7], ['E6', 0.48, 0.9]],
  5: [['C5', 0, 0.4], ['E5', 0.1, 0.45], ['G5', 0.2, 0.5], ['C6', 0.3, 0.6], ['E6', 0.4, 0.75], ['G6', 0.5, 1.0]]
};

const playTone = (ctx, freq, startAt, duration) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  // Soft bell envelope: quick attack, gentle exponential decay.
  const peak = 0.1;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.08);
};

/**
 * Play a soft chime (and trigger a light haptic vibration on supported
 * devices) for a gift that was just sent or received.
 * @param {number} [tier=1] Gift tier (1-5) — higher tiers get a richer chime.
 */
export const playGiftChime = (tier = 1) => {
  const t = Number.isFinite(tier) ? Math.min(5, Math.max(1, Math.round(tier))) : 1;
  // Throttle: skip unless the cooldown has elapsed or this gift outranks the
  // last chime that played. Keeps gift bursts from stacking overlapping chimes.
  const now = Date.now();
  const cooldownElapsed = now - lastChimeAt >= CHIME_COOLDOWN_MS;
  if (!cooldownElapsed && t <= lastChimeTier) {
    return;
  }
  lastChimeAt = now;
  lastChimeTier = t;
  try {
    if (!chimeMuted) {
      const ctx = getAudioCtx();
      if (ctx) {
        if (ctx.state === 'suspended') {
          // Resuming inside the call is fine — the user has already interacted
          // (started/answered the call), so autoplay is generally allowed.
          ctx.resume().catch(() => {});
        }
        const startAt = ctx.currentTime;
        (TIER_PATTERNS[t] || TIER_PATTERNS[1]).forEach(([note, offset, dur]) => {
          playTone(ctx, NOTES[note], startAt + offset, dur);
        });
      }
    }
    // Light haptic tap on devices that support vibration (Android/mobile).
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(t >= 3 ? [25, 35, 50] : 25);
      } catch { /* noop */ }
    }
  } catch (err) {
    console.warn('Gift chime could not play:', err);
  }
};

// User preferences for the DM sound (persisted locally, like the gift chime
// mute). `messageSound` controls the ding for DMs arriving anywhere off the
// messages pages; `chatPageSound` controls the desktop chime for messages
// arriving in other conversations while browsing the chat list. Both default
// to enabled when no value is stored yet.
const MESSAGE_SOUND_KEY = 'messageSoundEnabled';
const CHAT_PAGE_SOUND_KEY = 'chatPageSoundEnabled';

const readSoundPref = (key) => {
  try {
    return localStorage.getItem(key) !== 'false';
  } catch { /* localStorage unavailable */ }
  return true;
};

const writeSoundPref = (key, enabled) => {
  try {
    localStorage.setItem(key, String(!!enabled));
  } catch { /* localStorage unavailable */ }
};

export const isMessageSoundEnabled = () => readSoundPref(MESSAGE_SOUND_KEY);
export const setMessageSoundEnabled = (enabled) => writeSoundPref(MESSAGE_SOUND_KEY, enabled);
export const isChatPageSoundEnabled = () => readSoundPref(CHAT_PAGE_SOUND_KEY);
export const setChatPageSoundEnabled = (enabled) => writeSoundPref(CHAT_PAGE_SOUND_KEY, enabled);

// Soft two-note "ding" for incoming DMs. At most one per MSG_SOUND_COOLDOWN_MS
// so a rapid message burst collapses into a single notification sound.
const MSG_SOUND_COOLDOWN_MS = 2000;
let lastMsgSoundAt = 0;

/**
 * Play a short, soft notification sound (and light haptic) for a new DM
 * arriving while the user is on another page. Falls back to a low-volume
 * tone if the synthesized chime is unavailable.
 */
export const playMessageSound = () => {
  // Never ping a DM ding over an active call (ringing, connecting, or on-air).
  if (isCallActive()) return;
  const now = Date.now();
  if (now - lastMsgSoundAt < MSG_SOUND_COOLDOWN_MS) return;
  lastMsgSoundAt = now;

  try {
    const ctx = getAudioCtx();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const startAt = ctx.currentTime;
      // Gentle two-note ding: E5 then a higher A5 — soft and unobtrusive.
      playTone(ctx, 659.25, startAt, 0.25);
      playTone(ctx, 880, startAt + 0.09, 0.35);
    }
    // Light haptic tap on supported devices (Android/mobile).
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch { /* noop */ }
    }
  } catch (err) {
    console.warn('Message sound could not play:', err);
  }
};

// Brighter three-note "coin" arpeggio for media unlocks — clearly distinct
// from the soft two-note DM ding. Same burst cooldown as the message sound.
let lastUnlockSoundAt = 0;

/**
 * Play a short, bright notification sound (and light haptic) when a fan
 * unlocks the creator's PPV media while they're on another page.
 */
export const playUnlockSound = () => {
  // Never ping an unlock chime over an active call.
  if (isCallActive()) return;
  const now = Date.now();
  if (now - lastUnlockSoundAt < MSG_SOUND_COOLDOWN_MS) return;
  lastUnlockSoundAt = now;

  try {
    const ctx = getAudioCtx();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const startAt = ctx.currentTime;
      // Rising three-note arpeggio (C5 → E5 → G5) — brighter, "coins earned" feel.
      playTone(ctx, 523.25, startAt, 0.22);
      playTone(ctx, 659.25, startAt + 0.08, 0.24);
      playTone(ctx, 783.99, startAt + 0.16, 0.4);
    }
    // Slightly stronger haptic to signal the coin reward.
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([20, 30, 20]);
      } catch { /* noop */ }
    }
  } catch (err) {
    console.warn('Unlock sound could not play:', err);
  }
};
