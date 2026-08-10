import { useState, useEffect, useMemo, useRef } from 'react';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  DEFAULT_CHAT_FILTERS,
  countActiveChatFilters,
  matchesChatFilters,
  isMediaConversation
} from './chatFilters';
import styles from './ChatFiltersSheet.module.css';

const Chip = ({ label, count, active, onClick }) => (
  <button type="button" className={`${styles.chip} ${active ? styles.chipActive : ''}`} onClick={onClick}>
    {label}
    {count !== undefined && <span className={styles.chipCount}>{count}</span>}
  </button>
);

const Toggle = ({ label, hint, checked, onChange }) => (
  <div className={styles.toggleRow}>
    <div>
      <div className={styles.toggleLabel}>{label}</div>
      {hint && <div className={styles.toggleHint}>{hint}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`${styles.knob} ${checked ? styles.knobOn : ''}`} />
    </button>
  </div>
);

export const ChatFiltersSheet = ({
  open,
  onClose,
  onApply,
  initialFilters = DEFAULT_CHAT_FILTERS,
  variant = 'creator', // 'creator' | 'user'
  conversations = [],
  favoriteIds,
  dark = false,
  desktop = false, // centered dialog on desktop, bottom sheet on mobile
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const isCreator = variant === 'creator';

  // Reset the draft back to the currently applied filters each time the sheet opens
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setFilters(initialFilters || DEFAULT_CHAT_FILTERS);
    }
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { unreadCount, favoritesCount, mediaCount } = useMemo(() => {
    let unread = 0;
    let favorites = 0;
    let media = 0;
    for (const c of conversations) {
      if (c.unreadCount > 0) unread += 1;
      if (isCreator && favoriteIds && favoriteIds.has(c.id)) favorites += 1;
      if (isMediaConversation(c)) media += 1;
    }
    return { unreadCount: unread, favoritesCount: favorites, mediaCount: media };
  }, [conversations, favoriteIds, isCreator]);

  const resultCount = useMemo(
    () => conversations.filter((c) => matchesChatFilters(c, filters, { favoriteIds })).length,
    [conversations, filters, favoriteIds]
  );

  if (!open) return null;

  const activeCount = countActiveChatFilters(filters);
  const set = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <>
      <div className={`${styles.backdrop} ${dark ? styles.backdropDark : ''}`} onClick={onClose} />
      <div
        className={`${styles.sheet} ${desktop ? styles.dialog : ''} ${dark ? styles.dark : ''} ${isCreator ? styles.creator : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter chats"
      >
        <div className={styles.dragHandle} />

        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <SlidersHorizontal size={17} className={styles.titleIcon} />
            Filters
            {activeCount > 0 && <span className={styles.headerCount}>{activeCount}</span>}
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.resetBtn} onClick={() => setFilters(DEFAULT_CHAT_FILTERS)}>
              <RotateCcw size={13} /> Reset
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {/* Sort */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Sort by</div>
            <div className={styles.chipRow}>
              <Chip label="Newest" active={filters.sort === 'recent'} onClick={() => set({ sort: 'recent' })} />
              <Chip label="Oldest" active={filters.sort === 'oldest'} onClick={() => set({ sort: 'oldest' })} />
              <Chip label="Unread first" active={filters.sort === 'unreadFirst'} onClick={() => set({ sort: 'unreadFirst' })} />
            </div>
          </div>

          {/* Conversation type */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Conversation type</div>
            <div className={styles.chipRow}>
              <Chip label="All" active={filters.type === 'all'} onClick={() => set({ type: 'all' })} />
              <Chip label="Unread" count={unreadCount} active={filters.type === 'unread'} onClick={() => set({ type: 'unread' })} />
              {isCreator ? (
                <Chip label="Favorites" count={favoritesCount} active={filters.type === 'favorites'} onClick={() => set({ type: 'favorites' })} />
              ) : (
                <Chip label="Subscribed" active={filters.type === 'subscribed'} onClick={() => set({ type: 'subscribed' })} />
              )}
              <Chip label="With media" count={mediaCount} active={filters.type === 'media'} onClick={() => set({ type: 'media' })} />
            </div>
          </div>

          {/* Time period */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Time period</div>
            <div className={styles.chipRow}>
              <Chip label="All time" active={filters.period === 'all'} onClick={() => set({ period: 'all' })} />
              <Chip label="Today" active={filters.period === 'today'} onClick={() => set({ period: 'today' })} />
              <Chip label="Last 7 days" active={filters.period === 'week'} onClick={() => set({ period: 'week' })} />
              <Chip label="Last 30 days" active={filters.period === 'month'} onClick={() => set({ period: 'month' })} />
            </div>
          </div>

          {/* Toggles */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Show only</div>
            <Toggle
              label="Verified accounts"
              hint={isCreator ? 'Only fans with a verified badge' : 'Only creators with a verified badge'}
              checked={filters.verifiedOnly}
              onChange={(v) => set({ verifiedOnly: v })}
            />
            <Toggle
              label="Online now"
              hint="Only people who are currently online"
              checked={filters.onlineOnly}
              onChange={(v) => set({ onlineOnly: v })}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.resetAllBtn} onClick={() => setFilters(DEFAULT_CHAT_FILTERS)}>
            Clear all
          </button>
          <button type="button" className={styles.applyBtn} onClick={handleApply}>
            Show {resultCount} {resultCount === 1 ? 'chat' : 'chats'}
          </button>
        </div>
      </div>
    </>
  );
};
