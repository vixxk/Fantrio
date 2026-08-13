let audioInstance = null;

/**
 * Play phone ringing sound for caller (outgoing) or receiver (incoming).
 * @param {'outgoing'|'incoming'} type
 */
export const playRingtone = (type = 'outgoing') => {
  stopRingtone();
  const src = type === 'incoming' ? '/incoming_ringtone.wav' : '/ringtone.wav';
  try {
    audioInstance = new Audio(src);
    audioInstance.loop = true;
    audioInstance.volume = 0.8;
    audioInstance.play().catch((err) => {
      console.warn('Browser prevented audio autoplay until user interaction:', err);
    });
  } catch (err) {
    console.error('Failed to initialize ringtone audio:', err);
  }
};

/**
 * Stop any active call ringtone sound.
 */
export const stopRingtone = () => {
  if (audioInstance) {
    try {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    } catch { /* noop */ }
    audioInstance = null;
  }
};
