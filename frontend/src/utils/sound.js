/**
 * Soft synthesized gift chime + haptic tap. No audio asset required — the
 * chime is generated with the Web Audio API, so it always sounds consistent,
 * loads instantly, and works offline.
 */

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
