import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { X, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import styles from './Stories.module.css';

// Duration each image story is shown before auto-advancing (ms)
const STORY_DURATION = 9000;

// Devices with a coarse primary pointer (touchscreens) use hold-to-pause;
// desktop pointers use double-tap to pause.
const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Full-screen story viewer. Renders the tapped creator's story items one at a
 * time with an animated progress bar per item, auto-advances images, plays
 * videos to completion, and lets the user navigate with clicks/keys/swipes.
 * Pausing: double-tap to pause on desktop, hold to pause on mobile.
 */
const StoryViewer = ({ stories, startIndex, startItemIndex = 0, onClose }) => {
  const [creatorIdx, setCreatorIdx] = useState(startIndex);
  const [itemIdx, setItemIdx] = useState(startItemIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaKey, setMediaKey] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  const story = stories[creatorIdx];
  const items = story?.items || [];
  const item = items[itemIdx];
  const isLastStory = creatorIdx >= stories.length - 1 && itemIdx >= items.length - 1;

  const isTouch = useMemo(() => isTouchDevice(), []);

  // Always-fresh navigation state for event handlers (keyboard/timer) so they
  // never operate on a stale render's indices. Updated in an effect only.
  const stateRef = useRef({ creatorIdx, itemIdx });
  const elapsedRef = useRef(0); // accumulated ms watched for the current item
  const timerRef = useRef(null);
  const clickTimerRef = useRef(null); // desktop single-click delay (double-tap detection)
  const viewedRef = useRef(new Set()); // item ids actually shown, reported on close

  useEffect(() => {
    stateRef.current = { creatorIdx, itemIdx };
  }, [creatorIdx, itemIdx]);

  // Auto-hide the interaction hint after a few seconds; it reappears on pause.
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Clear any pending single-click navigation when the viewer unmounts.
  useEffect(
    () => () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    },
    []
  );

  function goNext() {
    const { creatorIdx: ci, itemIdx: ii } = stateRef.current;
    const list = stories[ci]?.items || [];
    setProgress(0);
    elapsedRef.current = 0;
    setMediaKey((k) => k + 1);
    if (ii < list.length - 1) {
      setItemIdx(ii + 1);
    } else if (ci < stories.length - 1) {
      setCreatorIdx(ci + 1);
      setItemIdx(0);
    } else {
      onClose();
    }
  }

  function goPrev() {
    const { creatorIdx: ci, itemIdx: ii } = stateRef.current;
    setProgress(0);
    elapsedRef.current = 0;
    setMediaKey((k) => k + 1);
    if (ii > 0) {
      setItemIdx(ii - 1);
    } else if (ci > 0) {
      const prevList = stories[ci - 1]?.items || [];
      setCreatorIdx(ci - 1);
      setItemIdx(Math.max(0, prevList.length - 1));
    } else {
      onClose();
    }
  }

  const togglePause = () => {
    if (!paused) {
      setPaused(true);
      setHintVisible(true);
    } else {
      // Resuming: restore the progress bar to where it was left off.
      setPaused(false);
      setProgress(Math.min(100, (elapsedRef.current / STORY_DURATION) * 100));
    }
  };

  // Lock body scroll while open + keyboard navigation
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Auto-advance timer for image stories. Videos drive their own lifecycle
  // (onEnded + onTimeUpdate). Skipped while paused or the tab is hidden so
  // stories are never advanced (or marked viewed) without being seen. Elapsed
  // time is accumulated so pausing/resuming resumes from the same position.
  useEffect(() => {
    if (!item || item.mediaType === 'video' || paused || document.hidden) return undefined;

    timerRef.current = setInterval(() => {
      if (document.hidden) return;
      elapsedRef.current += 50;
      setProgress(Math.min(100, (elapsedRef.current / STORY_DURATION) * 100));
      if (elapsedRef.current >= STORY_DURATION) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        goNext();
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, itemIdx, creatorIdx, paused, mediaKey]);

  // Keep the active image story's progress bar accurate when the tab comes
  // back into focus (timer was paused while hidden).
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && !paused) {
        elapsedRef.current = 0;
        setProgress(0);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [paused]);

  // Mark the currently displayed story item as viewed (server-side tracking)
  // and remember it locally so the ring dims immediately on close.
  useEffect(() => {
    if (!item?._id) return undefined;
    viewedRef.current.add(item._id);
    api
      .post(`/creators/stories/${item._id}/view`)
      .catch((err) => console.error('Failed to mark story as viewed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdx, creatorIdx, mediaKey]);

  if (!story || !item) {
    return (
      <div className={styles.viewerOverlay} onClick={() => onClose()}>
        <div className={styles.viewerCard}>
          <button className={styles.viewerClose} onClick={() => onClose()} aria-label="Close story">
            <X size={22} />
          </button>
        </div>
      </div>
    );
  }

  const isVideo = item.mediaType === 'video';

  // Tap zones: left 25% = previous, right 75% = next. On desktop the single
  // click is delayed briefly so a double-click can toggle pause instead.
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const zone = x < rect.width * 0.25 ? 'prev' : x > rect.width * 0.75 ? 'next' : null;
    if (!zone) return;

    if (isTouch) {
      if (zone === 'prev') goPrev();
      else goNext();
      return;
    }

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      if (zone === 'prev') goPrev();
      else goNext();
    }, 250);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    togglePause();
  };

  return (
    <div className={styles.viewerOverlay} role="dialog" aria-modal="true" aria-label={`${story.displayName}'s story`}>
      {/* Progress bars */}
      <div className={styles.progressRow}>
        {items.map((it, idx) => {
          const active = idx === itemIdx;
          const done = idx < itemIdx;
          const width = active ? progress : done ? 100 : 0;
          return (
            <div key={`${it._id}-${idx}`} className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${width}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className={styles.viewerHead}>
        <div className={styles.viewerUser}>
          <img src={story.avatarUrl || '/profile.png'} alt={story.displayName} className={styles.viewerAvatar} />
          <span className={styles.viewerName}>
            {story.displayName}
            {story.isVerified && <BadgeCheck size={14} className={styles.verifiedIcon} />}
          </span>
          <span className={styles.viewerTime}>{formatTimeAgo(item.createdAt)}</span>
        </div>
        <button className={styles.viewerClose} onClick={() => onClose()} aria-label="Close story">
          <X size={22} />
        </button>
      </div>

      {/* Pause hint (top center) — image stories only, videos pause natively */}
      {!isVideo && (hintVisible || paused) && (
        <div className={styles.viewerHint}>
          {paused
            ? isTouch ? 'Paused · release to resume' : 'Paused · Double tap to resume'
            : isTouch ? 'Hold to pause' : 'Double tap to pause'}
        </div>
      )}

      {/* Media */}
      <div
        className={styles.viewerMediaArea}
        onClick={handleClick}
        onDoubleClick={!isVideo && !isTouch ? handleDoubleClick : undefined}
        onMouseDown={(e) => {
          if (!isTouch) e.preventDefault();
        }}
        onTouchStart={() => {
          if (!isVideo) setPaused(true);
        }}
        onTouchEnd={() => {
          if (!isVideo) {
            setPaused(false);
            setProgress(Math.min(100, (elapsedRef.current / STORY_DURATION) * 100));
          }
        }}
      >
        {isVideo ? (
          <video
            key={mediaKey}
            src={item.mediaUrl}
            className={styles.viewerMedia}
            autoPlay
            playsInline
            controls
            onEnded={goNext}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            key={mediaKey}
            src={item.mediaUrl}
            alt={`${story.displayName}'s story`}
            className={styles.viewerMedia}
            draggable={false}
          />
        )}
      </div>

      {/* Nav arrows */}
      <button
        className={`${styles.viewerNav} ${styles.viewerNavPrev}`}
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        aria-label="Previous story"
        disabled={creatorIdx === 0 && itemIdx === 0}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        className={`${styles.viewerNav} ${styles.viewerNavNext}`}
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        aria-label="Next story"
        disabled={isLastStory}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
};

export const Stories = () => {
  const { darkMode } = useApp();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = React.useRef(null);

  // Viewer state: null = closed, otherwise the clicked story + index
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get('/creators/stories');
        if (res.status === 'success') {
          setStories(res.stories || []);
        }
      } catch (err) {
        console.error('Failed to fetch stories from backend:', err);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Sort: unseen stories (any item not yet viewed) first, then fully-seen ones.
  const sortedStories = useMemo(() => {
    return [...stories].sort((a, b) => {
      const aViewed = a.items.length > 0 && a.items.every((it) => it.viewed === true);
      const bViewed = b.items.length > 0 && b.items.every((it) => it.viewed === true);
      if (aViewed && !bViewed) return 1;
      if (!aViewed && bViewed) return -1;
      return 0;
    });
  }, [stories]);

  const handleStoryClick = (story, index) => {
    if (!story.items || story.items.length === 0) return;
    setViewer({ storyIndex: index, itemIndex: 0 });
  };

  if (loading) {
    return (
      <div className={`${styles.storiesSection} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.storiesHeader}>
          <h2 className={styles.sectionTitle}>Stories</h2>
        </div>
        <div className={styles.storiesListContainer} ref={containerRef}>
          <div className={styles.storiesScroll}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.storyBubble}>
                <div className={`${styles.avatarRing} ${styles.storyRing}`}>
                  <div className="skeleton-box skeleton-avatar" />
                </div>
                <span className={styles.storyName}>
                  <div className="skeleton-box skeleton-subtitle" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.storiesSection} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.storiesHeader}>
        <h2 className={styles.sectionTitle}>Stories</h2>
      </div>

      <div className={styles.storiesListContainer} ref={containerRef}>
        <div className={styles.storiesScroll}>
          {sortedStories.map((story, index) => {
            const allViewed =
              story.items.length > 0 && story.items.every((it) => it.viewed === true);
            return (
              <button
                key={story._id}
                className={styles.storyBubble}
                onClick={() => handleStoryClick(story, index)}
                type="button"
              >
                <div className={`${styles.avatarRing} ${allViewed ? styles.viewedRing : styles.storyRing}`}>
                  <img
                    src={story.avatarUrl}
                    alt={story.displayName}
                    className={`${styles.storyAvatar} ${allViewed ? styles.storyAvatarViewed : ''}`}
                  />
                  {story.isOnline && <span className={styles.onlineDot} />}
                </div>
                <span className={`${styles.storyName} ${allViewed ? styles.storyNameViewed : ''}`}>
                  {story.displayName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {viewer && (
        <StoryViewer
          stories={sortedStories}
          startIndex={viewer.storyIndex}
          startItemIndex={viewer.itemIndex}
          onClose={(viewedIds) => {
            setViewer(null);
            const ids = Array.isArray(viewedIds) ? viewedIds : [];
            if (ids.length > 0) {
              const viewedSet = new Set(ids);
              setStories((prev) =>
                prev.map((s) => ({
                  ...s,
                  items: s.items.map((it) =>
                    viewedSet.has(it._id) ? { ...it, viewed: true } : it
                  )
                }))
              );
            }
          }}
        />
      )}
    </div>
  );
};
