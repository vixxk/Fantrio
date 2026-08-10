import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Smile, X } from 'lucide-react';
import styles from './ChatComposerExtras.module.css';

// Curated emoji palette grouped by category
const EMOJI_GROUPS = [
  {
    label: 'Smileys',
    emojis: ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤩', '🥳', '😜', '🤪', '😅', '😇', '🙃', '😉', '🤗', '🤔', '😴', '🥱', '😷', '🥺', '😭', '😤', '😡', '🤯']
  },
  {
    label: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️', '🤞', '👌', '🤙', '🫶', '👋', '🤘', '🖖', '👊', '✊', '💅']
  },
  {
    label: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖', '💗', '💓', '💕', '💞', '💘', '💝', '❤️‍🔥', '💔']
  },
  {
    label: 'Celebration',
    emojis: ['🎉', '🎊', '🥳', '✨', '⭐', '🌟', '💯', '🔥', '⚡', '💫', '🎈', '🎁', '🏆', '🥇', '👑', '💎', '🌈', '🦄']
  },
  {
    label: 'Animals & Nature',
    emojis: ['🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐸', '🐵', '🐧', '🐦', '🐢', '🦋', '🌸', '🌹', '🌻', '🍀', '🌙', '☀️', '⛄', '❄️']
  },
  {
    label: 'Food & Drink',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍰', '🍦', '🍿', '☕', '🧋', '🍺', '🥂', '🍎', '🍉', '🥑']
  },
  {
    label: 'Symbols',
    emojis: ['💡', '🔔', '📌', '📎', '✏️', '📷', '🎥', '🎧', '🎮', '💻', '📱', '⌚', '🔒', '🔑', '⚽', '🏀', '🚀', '🎯']
  }
];

/**
 * ChatComposerExtras — emoji picker for the chat input bar.
 * Renders the Smile button; opens a fixed-position popover above it.
 *
 * @param {boolean} dark        dark theme variant
 * @param {'left'|'right'} anchor  align popover to the buttons (left of bar = right-aligned popover)
 * @param {(emoji: string) => void} onPickEmoji
 */
export const ChatComposerExtras = ({ dark = false, anchor = 'left', onPickEmoji }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { left, bottom }
  const wrapRef = useRef(null);

  const togglePanel = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Position the popover just above the buttons, fixed to the viewport so it
  // never gets clipped by the chat screen's overflow:hidden.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPos({
      left: anchor === 'right' ? Math.max(8, rect.right - 320) : Math.max(8, rect.left - 8),
      bottom: window.innerHeight - rect.top + 8
    });
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return undefined;
    const handleDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={`${styles.wrap} ${dark ? styles.dark : styles.light}`} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.iconBtn} ${open ? styles.iconBtnActive : ''}`}
        onClick={togglePanel}
        title="Emoji"
        aria-label="Emoji picker"
      >
        <Smile size={19} />
      </button>

      {open && pos && (
        <div
          className={`${styles.popover} ${dark ? styles.dark : styles.light}`}
          style={{ left: pos.left, bottom: pos.bottom, width: 320 }}
          role="dialog"
          aria-label="Emoji picker"
        >
          <div className={styles.popoverHeader}>
            <span className={styles.title}>Emoji</span>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className={styles.popoverBody}>
            <div className={styles.emojiBody}>
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className={styles.emojiGroup}>
                  <div className={styles.groupLabel}>{group.label}</div>
                  <div className={styles.emojiGrid}>
                    {group.emojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={styles.emojiCell}
                        onClick={() => {
                          onPickEmoji(e);
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
