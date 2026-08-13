import { useEffect, useRef } from 'react';
import { api } from '../services/api';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Monitors creator user interaction (mouse movement, keystrokes, touch, scroll).
 * Automatically turns the creator offline for calls if idle for 5 minutes.
 */
export const useInactivityOffline = (userRole) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (userRole !== 'creator') return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          console.log('[Inactivity] 5 minutes of user inactivity detected. Automatically setting creator offline.');
          await api.post('/creators/profile/toggle-calls', { type: 'audio', available: false });
          await api.post('/creators/profile/toggle-calls', { type: 'video', available: false });
        } catch (err) {
          console.error('[Inactivity] Failed to set creator offline:', err);
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [userRole]);
};
