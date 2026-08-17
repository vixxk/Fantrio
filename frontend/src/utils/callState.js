/**
 * Shared "am I on a call" tracker (module-level singleton).
 *
 * A simple boolean won't work because multiple pieces of UI can be mounted at
 * once (e.g. the messages page mounts both an audio and a video
 * useOutgoingCall instance, plus the global IncomingCallProvider). Each one
 * independently claims/releases a call, so we count active claims instead of
 * storing a single flag.
 */
let activeCallClaims = 0;

/** Claim that a call is active (idempotent per caller). */
export const claimCall = () => {
  activeCallClaims += 1;
};

/** Release a previously claimed call. Safe to call when nothing is claimed. */
export const releaseCall = () => {
  activeCallClaims = Math.max(0, activeCallClaims - 1);
};

/** True while any piece of UI has an active call (ringing, connecting, active). */
export const isCallActive = () => activeCallClaims > 0;

export default { claimCall, releaseCall, isCallActive };
