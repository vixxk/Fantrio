import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../Toast/Toast';
import { getSocket, joinSocketRoom } from '../../services/socket';
import { playUnlockSound } from '../../utils/sound';

// Any page under the fan or creator messages routes counts as "on the messages
// page" — the conversation UI already shows unlock notices there.
const isMessagesPath = (path) => {
  if (!path) return false;
  return path.startsWith('/messages') || path.startsWith('/creators/messages');
};

/**
 * UnlockNotifier — shows an in-app toast when a fan unlocks the creator's PPV
 * media while the creator is anywhere except the messages pages (feed,
 * dashboard, profile, etc.). The toast is clickable and jumps straight to that
 * conversation. Mounted once at the app root inside ToastProvider.
 */
export const UnlockNotifier = () => {
  const { user, currentPath, navigateTo } = useApp();
  const { toast } = useToast();

  // Keep the live path available to the socket handler without re-subscribing
  // on every navigation.
  const pathRef = useRef(currentPath);
  useEffect(() => { pathRef.current = currentPath; }, [currentPath]);

  // Dedupe: don't stack a toast when the same fan unlocks several messages in
  // a row — one notice per fan per 4s window is enough.
  const lastToastRef = useRef({ fanId: null, at: 0 });

  useEffect(() => {
    if (!user?.id) return;

    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(user.id);

      const onMessageUnlocked = (payload) => {
        if (!payload || !payload.unlockedBy) return;
        // The event goes to the message sender (the creator), so this only
        // fires for the media owner — no self-toast needed.
        if (String(payload.unlockedBy) === String(user.id)) return;
        // The conversation UI already shows unlock notices on these pages.
        if (isMessagesPath(pathRef.current)) return;

        const now = Date.now();
        const last = lastToastRef.current;
        if (last.fanId === String(payload.unlockedBy) && now - last.at < 4000) {
          last.at = now;
          return;
        }
        lastToastRef.current = { fanId: String(payload.unlockedBy), at: now };

        const fanName = payload.fanName || 'A fan';
        const price = payload.coinPrice || 0;
        const label = `🔓 ${fanName} unlocked your media${price > 0 ? ` · +${price} coins` : ''}`;

        const targetPath = `/creators/messages/${String(payload.unlockedBy)}`;

        // Audible cue for the unlock — a distinct coin arpeggio from the DM ding.
        playUnlockSound();
        toast.info(label, 5000, () => navigateTo(targetPath));
      };

      socket.on('message_unlocked', onMessageUnlocked);
      return () => { socket.off('message_unlocked', onMessageUnlocked); };
    } catch (err) {
      console.error('Socket init for unlock notifier failed:', err);
    }
  }, [user?.id, user?.role, toast, navigateTo]);

  return null;
};

export default UnlockNotifier;
