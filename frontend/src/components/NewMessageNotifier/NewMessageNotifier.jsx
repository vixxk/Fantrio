import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../Toast/Toast';
import { getSocket, joinSocketRoom } from '../../services/socket';
import { isChatPageSoundEnabled, isMessageSoundEnabled, playMessageSound } from '../../utils/sound';

// Any page under the fan or creator messages routes counts as "on the messages
// page" — the conversation UI already handles realtime updates there.
const isMessagesPath = (path) => {
  if (!path) return false;
  return path.startsWith('/messages') || path.startsWith('/creators/messages');
};

// Extract the conversation/peer ID of the currently open thread from the path:
// fans use /messages/:convId, creators use /creators/messages/:fanId.
const openThreadIdFromPath = (path) => {
  if (!path) return null;
  if (path.startsWith('/creators/messages')) {
    const parts = path.split('?')[0].split('/').filter(Boolean);
    return parts[2] || null;
  }
  if (path.startsWith('/messages')) {
    const parts = path.split('?')[0].split('/').filter(Boolean);
    return parts[1] || null;
  }
  return null;
};

/**
 * NewMessageNotifier — shows an in-app "unread" toast when a DM arrives while
 * the user is anywhere except the messages pages (e.g. browsing the feed,
 * dashboard, profile). The toast is clickable and jumps straight to the
 * conversation. Mounted once at the app root inside ToastProvider.
 */
export const NewMessageNotifier = () => {
  const { user, currentPath, navigateTo } = useApp();
  const { toast } = useToast();

  // Keep the live path available to the socket handler without re-subscribing
  // on every navigation.
  const pathRef = useRef(currentPath);
  useEffect(() => { pathRef.current = currentPath; }, [currentPath]);

  // Dedupe: don't stack a toast per message when the same sender fires several
  // in a row — one notice per sender per 4s window is enough.
  const lastToastRef = useRef({ senderId: null, at: 0 });

  useEffect(() => {
    if (!user?.id) return;
    const isFan = user.role !== 'creator';
    const senderLabel = isFan ? 'a creator' : 'a fan';

    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(user.id);

      const onNewMessage = (payload) => {
        if (!payload) return;
        // Never toast for the user's own messages.
        if (String(payload.senderId) === String(user.id)) return;

        const onMessagesPage = isMessagesPath(pathRef.current);
        const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
        const peerId = String(payload.senderId);

        // On the messages page:
        //  - Desktop: chime for DMs outside the currently open thread, so a
        //    message arriving in another conversation is noticeable (no toast
        //    needed — the chat UI already shows those inline). Messages inside
        //    the open thread are already on screen, so stay silent.
        //  - Mobile: the full-screen chat already updates in view, so no sound.
        if (onMessagesPage && !isDesktop) return;
        if (onMessagesPage && peerId === openThreadIdFromPath(pathRef.current)) return;

        const now = Date.now();
        const last = lastToastRef.current;
        if (last.senderId === String(payload.senderId) && now - last.at < 4000) {
          last.at = now;
          return;
        }
        lastToastRef.current = { senderId: String(payload.senderId), at: now };

        // On the desktop messages page, just chime — the message is already
        // visible in the conversation list/thread. Respect the "chat page
        // sounds" setting.
        if (onMessagesPage) {
          if (isChatPageSoundEnabled()) playMessageSound();
          return;
        }

        let label;
        if (payload.mediaType === 'image') {
          label = `📷 New photo from ${senderLabel}`;
        } else if (payload.mediaType === 'video') {
          label = `🎬 New video from ${senderLabel}`;
        } else if (payload.isPaywall) {
          label = `🔒 New locked media from ${senderLabel} · ${payload.coinPrice || 0} coins`;
        } else {
          const preview = payload.content
            ? (String(payload.content).length > 60
              ? `${String(payload.content).slice(0, 60)}…`
              : String(payload.content))
            : 'New message';
          label = `💬 ${senderLabel}: ${preview}`;
        }

        const targetPath = isFan ? `/messages/${peerId}` : `/creators/messages/${peerId}`;

        // Audible cue for the incoming DM (silent if the browser blocks it or
        // the user disabled message sounds).
        if (isMessageSoundEnabled()) playMessageSound();
        toast.info(label, 4500, () => navigateTo(targetPath));
      };

      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init for new-message notifier failed:', err);
    }
  }, [user?.id, user?.role, toast, navigateTo]);

  return null;
};

export default NewMessageNotifier;
