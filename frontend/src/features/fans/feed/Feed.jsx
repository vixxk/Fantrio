import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { 
  Heart, 
  MessageCircle, 
  Gift, 
  Share2, 
  Lock, 
  MoreVertical, 
  BadgeCheck, 
  Send,
  Play,
  Video,
  Inbox,
  Ban,
  X,
  Check,
  Zap,
  Link2,
  MessageSquare
} from 'lucide-react';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useToast } from '../../../components/Toast/Toast';
import { useAppDialog } from '../../../components/AppDialog/AppDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import styles from './Feed.module.css';
import { GiftPanel } from '../../../features/gifts/GiftPanel';
import { QuickRecharge } from '../../../features/gifts/QuickRecharge';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'just now';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const SEEN_KEY = 'fantrio_seen_posts';

const loadSeenIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const persistSeenIds = (ids) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to persist seen posts:', err);
  }
};

const buildShareTargets = (url) => [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    url: `https://wa.me/?text=${encodeURIComponent(url)}`
  },
  {
    id: 'x',
    label: 'X / Twitter',
    color: '#000000',
    url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#229ED9',
    url: `https://t.me/share/url?url=${encodeURIComponent(url)}`
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  }
];

const renderShareIcon = (id) => {
  switch (id) {
    case 'whatsapp':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 2C6.477 2 2 6.477 2 12c0 2.137.672 4.116 1.82 5.74L2.05 21.95l4.316-1.731C7.94 21.35 9.897 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.848 0-3.555-.536-5.002-1.462l-.358-.228-2.565 1.028.983-2.483-.243-.377A7.954 7.954 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
        </svg>
      );
    case 'x':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'telegram':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 4.01-1.74 6.69-2.89 8.04-3.45 3.82-1.59 4.61-1.87 5.13-1.88.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07.01.21 0 .34z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    default:
      return <MessageSquare size={18} />;
  }
};

export const Feed = () => {
  const { darkMode, refreshBalance, balance, user, navigateTo } = useApp();
  const { toast } = useToast();
  const { prompt } = useAppDialog();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [seenIds, setSeenIds] = useState(loadSeenIds);
  const [sharePostId, setSharePostId] = useState(null);
  const sentinelRef = useRef(null);
  const seenObserverRef = useRef(null);

  // States for comments and gifting modals
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newComment, setNewComment] = useState('');

  const [activeTipCreator, setActiveTipCreator] = useState(null);
  const [activeTipPostId, setActiveTipPostId] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [activeKebabPostId, setActiveKebabPostId] = useState(null);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveKebabPostId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const fetchPosts = useCallback(async (cursor) => {
    const params = cursor ? `?limit=30&cursor=${cursor}` : '?limit=30';
    try {
      const res = await api.get(`/posts${params}`);
      if (res.status === 'success') {
        const incoming = res.posts || [];
        setPosts((prev) => cursor ? [...prev, ...incoming] : incoming);
        setNextCursor(res.nextCursor || null);
      } else {
        setPosts((prev) => cursor ? prev : []);
        setNextCursor(null);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      if (!cursor) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPosts();
    });
  }, [fetchPosts]);

  // Mark a post as seen locally + persist + fire server notification
  const markPostAsSeen = useCallback(async (postId) => {
    setSeenIds((prev) => {
      if (prev.has(postId)) return prev;
      const next = new Set(prev);
      next.add(postId);
      persistSeenIds(next);
      return next;
    });
    api.post(`/posts/${postId}/seen`).catch(() => {});
  }, []);

  // IntersectionObserver for seen-tracking — observe post cards entering viewport
  useEffect(() => {
    if (!seenObserverRef.current) {
      seenObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const postId = entry.target.getAttribute('data-post-id');
              if (postId) markPostAsSeen(postId);
            }
          });
        },
        { threshold: 0.3 }
      );
    }
    const observer = seenObserverRef.current;
    const cards = document.querySelectorAll('[data-post-id]');
    cards.forEach((el) => observer.observe(el));
    return () => {
      cards.forEach((el) => observer.unobserve(el));
    };
  }, [posts, markPostAsSeen]);

  // IntersectionObserver for infinite scroll — fire fetch when sentinel enters viewport
  useEffect(() => {
    if (!nextCursor || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchPosts(nextCursor);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPosts]);

  const handleLike = async (postId) => {
    const prev = posts.find((p) => p._id === postId);
    if (!prev) return;

    setPosts((current) => current.map((p) =>
      p._id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));

    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res && typeof res.likesCount === 'number') {
        setPosts((current) => current.map((p) =>
          p._id === postId ? { ...p, likesCount: res.likesCount, isLiked: res.isLiked } : p
        ));
      }
    } catch (err) {
      setPosts((current) => current.map((p) =>
        p._id === postId ? { ...p, isLiked: prev.isLiked, likesCount: prev.likesCount } : p
      ));
      console.error('Failed to like post:', err);
    }
  };

  // Unlock premium content — shared confirm dialog state machine
  const {
    target: unlockTarget,
    open: openUnlock,
    close: closeUnlock,
    confirm: confirmUnlock,
    deleting: unlocking,
  } = useConfirmDelete({
    onConfirm: ({ postId }) => api.post(`/posts/${postId}/unlock`),
    successMessage: 'Content unlocked successfully!',
    errorMessage: 'Failed to unlock content',
    onSuccess: ({ postId }, res) => {
      const mediaUrlMap = {};
      (res.mediaUrls || []).forEach((m) => { mediaUrlMap[m._id] = m.url; });

      setPosts((current) => current.map((p) =>
        p._id === postId
          ? {
              ...p,
              hasAccess: true,
              media: p.media.map((m) => ({
                ...m,
                isLocked: false,
                url: mediaUrlMap[m._id] || m.url
              }))
            }
          : p
      ));
      refreshBalance();
    },
  });

  const handleUnlock = (postId, coinPrice) => {
    if (balance < coinPrice) {
      toast.error(`Insufficient coins! You need ${coinPrice} coins but have ${balance}. Add coins first!`);
      return;
    }
    openUnlock({ postId, coinPrice });
  };

  const handleCommentSubmit = async (postId) => {
    const text = newComment.trim();
    if (!text) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      const comments = res.comments || [];
      setPosts((current) => current.map((p) =>
        p._id === postId ? { ...p, comments, commentsCount: comments.length } : p
      ));
      setNewComment('');
    } catch (err) {
      toast.error('Failed to post comment: ' + err.message);
    }
  };

  const handleSendGift = async (gift) => {
    if (balance < gift.coins) {
      setGiftOpen(false);
      setRechargeOpen(true);
      return;
    }
    try {
      const res = await api.post(`/monetization/gift/${activeTipCreator}`, { giftId: gift.id, postId: activeTipPostId });
      toast.success(`${gift.name} sent!`);
      setGiftOpen(false);
      setActiveTipCreator(null);
      await refreshBalance();
      if (activeTipPostId && res.post) {
        setPosts((current) => current.map((p) =>
          p._id === activeTipPostId
            ? {
                ...p,
                giftCount: res.post.giftCount,
                commentsCount: res.post.commentsCount,
                comments: res.post.comments
              }
            : p
        ));
        setActiveCommentPost(activeTipPostId);
      }
      setActiveTipPostId(null);
    } catch (err) {
      toast.error('Failed to send gift: ' + (err.message || 'Please try again'));
      throw err;
    }
  };

  const handleShare = (postId) => {
    setSharePostId(postId);
    // Increment share count on the server (fire-and-forget)
    api.post(`/posts/${postId}/share`).then(() => {
      setPosts((current) => current.map((p) =>
        p._id === postId ? { ...p, sharesCount: (p.sharesCount || 0) + 1 } : p
      ));
    }).catch(() => {});
  };

  const handleSharePlatform = (targetUrl) => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setSharePostId(null);
  };

  const handleCopyShareLink = async (postId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast.success('Post link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
    setSharePostId(null);
  };

  const handleCopyLink = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast.success('Post link copied to clipboard!');
    setActiveKebabPostId(null);
  };

  const handleToggleFollow = async (creatorId, isFollowing) => {
    // Optimistic update
    setPosts((current) => current.map((p) => {
      const pid = p.creatorId?._id || p.creatorId;
      return pid === creatorId ? { ...p, isFollowing: !isFollowing } : p;
    }));
    try {
      await api.post(`/creators/follow/${creatorId}`);
      toast.success(isFollowing ? 'Unfollowed creator.' : 'Following creator!');
      setActiveKebabPostId(null);
    } catch (err) {
      // Revert on error
      setPosts((current) => current.map((p) => {
        const pid = p.creatorId?._id || p.creatorId;
        return pid === creatorId ? { ...p, isFollowing: isFollowing } : p;
      }));
      toast.error('Failed to update follow status: ' + err.message);
    }
  };

  // Block creator — shared confirm dialog state machine
  const {
    target: blockTarget,
    open: openBlock,
    close: closeBlock,
    confirm: confirmBlock,
    deleting: blocking,
  } = useConfirmDelete({
    onConfirm: (creatorId) => api.post(`/block/${creatorId}`),
    successMessage: 'Creator blocked successfully.',
    errorMessage: 'Failed to block creator',
    onSuccess: (creatorId) => {
      setPosts((current) => current.filter((p) => (p.creatorId?._id || p.creatorId) !== creatorId));
    },
  });

  const handleBlock = (creatorId) => {
    setActiveKebabPostId(null);
    openBlock(creatorId);
  };

  const handleReport = async (post) => {
    const reason = await prompt({
      title: 'Report Post',
      message: 'Please describe why you are reporting this post.',
      placeholder: 'Reason for reporting...',
      confirmLabel: 'Submit Report'
    });
    if (!reason || !reason.trim()) {
      setActiveKebabPostId(null);
      return;
    }
    try {
      await api.post(`/posts/${post._id}/report`, { reason: reason.trim() });
      toast.success('Post reported. Our team will review it shortly.');
    } catch (err) {
      toast.error('Failed to report post: ' + err.message);
    }
    setActiveKebabPostId(null);
  };

  // Discovery sort: fresh (unseen, un-interacted) posts first, already-seen/interacted last
  const sortedPosts = useMemo(() => {
    const fresh = [];
    const stale = [];
    posts.forEach((p) => {
      const hasInteracted = seenIds.has(p._id) || p.isSeen || p.isLiked || p.hasCommented;
      (hasInteracted ? stale : fresh).push(p);
    });
    return [...fresh, ...stale];
  }, [posts, seenIds]);

  if (loading) {
    return (
      <div className={`${styles.feedContainer} ${darkMode ? styles.dark : styles.light}`} style={{ padding: '2rem 0' }}>
        <div className={styles.postsList}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-header">
                <div className="skeleton-box skeleton-avatar" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="skeleton-box skeleton-title" />
                  <div className="skeleton-box skeleton-subtitle" />
                </div>
              </div>
              <div className="skeleton-box skeleton-content-line" />
              <div className="skeleton-box skeleton-content-line short" />
              <div className="skeleton-box skeleton-media" />
              <div className="skeleton-footer">
                <div className="skeleton-box skeleton-btn" />
                <div className="skeleton-box skeleton-btn" />
                <div className="skeleton-box skeleton-btn" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && sortedPosts.length === 0) {
    return (
      <div className={`${styles.feedContainer} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.postsList}>
          <div className={styles.emptyState}>
            <Inbox size={40} />
            <p>No posts to show right now.</p>
            <span>Follow more creators to fill your feed.</span>
          </div>
        </div>
      </div>
    );
  }

  const TIER_STYLES = {
    1: styles.tierBadge1,
    2: styles.tierBadge2,
    3: styles.tierBadge3,
    4: styles.tierBadge4
  };

  const giftCreator = posts.find((p) => {
    const pid = p.creatorId?._id || p.creatorId;
    return pid === activeTipCreator;
  });
  const receiverName = giftCreator?.creatorId?.displayName || 'this creator';

  return (
    <div className={`${styles.feedContainer} ${darkMode ? styles.dark : styles.light}`}>
      
      {/* Posts List */}
      <div className={styles.postsList}>
        {sortedPosts.map((post) => {
          const creator = post.creatorId || {};
          const creatorId = creator._id || post.creatorId;
          const isPPV = post.postType === 'ppv';
          const isLocked = isPPV && !post.hasAccess;

          return (
            <article key={post._id} className={styles.postCard} data-post-id={post._id}>
              {/* Post Header */}
              <div className={styles.postHeader}>
                <div className={styles.creatorProfile}>
                  <img 
                    src={creator.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'} 
                    alt={creator.displayName} 
                    className={styles.avatar}
                    onClick={() => { if (creator.username) navigateTo(`/creator-profile/${creator.username}`); }}
                    style={{ cursor: creator.username ? 'pointer' : 'default' }}
                  />
                  <div className={styles.creatorInfo}>
                    <div className={styles.nameBlock}>
                      <span 
                        className={styles.displayName}
                        onClick={() => { if (creator.username) navigateTo(`/creator-profile/${creator.username}`); }}
                        style={{ cursor: creator.username ? 'pointer' : 'default' }}
                      >{creator.displayName || 'Creator'}</span>
                      {creator.isVerifiedBadge && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                    </div>
                    <span 
                      className={styles.username}
                      onClick={() => { if (creator.username) navigateTo(`/creator-profile/${creator.username}`); }}
                      style={{ cursor: creator.username ? 'pointer' : 'default' }}
                    >@{creator.username || 'creator'}</span>
                  </div>
                </div>

                <div className={styles.headerRight}>
                  <div className={styles.headerActionCol}>
                    {((user?._id || user?.id) !== creatorId) && (
                      <button
                        className={`${styles.followBadge} ${post.isFollowing ? styles.followingBadge : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(creatorId, Boolean(post.isFollowing));
                        }}
                      >
                        {post.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                    <span className={styles.timestamp}>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                  <div className={styles.kebabWrapper}>
                    <button 
                      className={styles.moreBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebabPostId(activeKebabPostId === post._id ? null : post._id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeKebabPostId === post._id && (
                      <div className={styles.kebabDropdown} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={styles.kebabOption} 
                          onClick={() => handleCopyLink(post._id)}
                        >
                          Copy post link
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={styles.kebabOption} 
                          onClick={() => handleBlock(creatorId)}
                        >
                          Block
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={`${styles.kebabOption} ${styles.kebabDanger}`} 
                          onClick={() => handleReport(post)}
                        >
                          Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Caption */}
              <div className={styles.postCaption}>
                <p>{post.content}</p>
              </div>

              {/* Post Media Container */}
              <div className={styles.mediaContainer}>
                {post.media && post.media.map((mediaItem) => (
                  <div key={mediaItem._id} className={styles.mediaItemWrapper}>
                    {isLocked ? (
                      <div className={styles.lockedOverlay}>
                        <div className={mediaItem.isBlurred !== false ? styles.blurBg : styles.clearBg} style={{ backgroundImage: `url(${mediaItem.thumbnailUrl || mediaItem.url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=40&q=10'})` }} />
                        {mediaItem.type === 'video' && (
                          <>
                            <span className={styles.videoLengthBadge}>
                              <Play size={10} fill="#ffffff" /> 01:45
                            </span>
                            <span className={styles.videoIndicatorBadge}>
                              <Video size={14} />
                            </span>
                          </>
                        )}
                        <div className={styles.lockBox}>
                          <div className={styles.lockIconCircle}>
                            <Lock size={38} className={styles.lockIcon} />
                          </div>
                          <p className={styles.lockMsg}>
                            Unlock this {mediaItem.type === 'video' ? 'video' : 'content'} <br /> for {post.coinPrice} Coins
                          </p>
                          <button 
                            className={styles.unlockBtn}
                            onClick={() => handleUnlock(post._id, post.coinPrice)}
                          >
                            Unlock Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      mediaItem.type === 'video' ? (
                        <div className={styles.videoPlayerWrapper}>
                          <video 
                            src={mediaItem.url} 
                            controls 
                            className={styles.postVideo} 
                            poster={mediaItem.thumbnailUrl}
                          />
                          <div className={styles.videoLengthBadge}>
                            <Play size={10} fill="#ffffff" />
                            <span>01:45</span>
                          </div>
                          <div className={styles.videoIndicatorBadge}>
                            <Video size={14} />
                          </div>
                        </div>
                      ) : mediaItem.type === 'audio' ? (
                        <div className={styles.audioPlayerWrapper}>
                          <div className={styles.audioInfo}>
                            <img 
                              src={mediaItem.thumbnailUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80"} 
                              alt="Audio cover" 
                              className={styles.audioCover} 
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80";
                              }}
                            />
                            <div className={styles.audioText}>
                              <span className={styles.audioTitle}>Voice Note Update</span>
                              <span className={styles.audioArtist}>{creator.displayName || 'Creator'}</span>
                            </div>
                          </div>
                          <audio src={mediaItem.url} controls className={styles.postAudio} />
                        </div>
                      ) : (
                        <img 
                          src={mediaItem.url} 
                          alt="Post attachment" 
                          className={styles.postImage} 
                        />
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* Post Footer Actions */}
              <div className={styles.postFooter}>
                <div className={styles.actionGroup}>
                  <button 
                    className={`${styles.footerActionBtn} ${post.isLiked ? styles.liked : ''}`}
                    onClick={() => handleLike(post._id)}
                  >
                    <Heart size={20} className={post.isLiked ? styles.filledHeart : ''} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  <button 
                    className={`${styles.footerActionBtn} ${activeCommentPost === post._id ? styles.activeComments : ''}`}
                    onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)}
                  >
                    <MessageCircle size={20} />
                    <span>{post.commentsCount || 0}</span>
                  </button>

                  <button 
                    className={`${styles.footerActionBtn} ${styles.giftBtn}`}
                    onClick={() => { setActiveTipCreator(creatorId); setActiveTipPostId(post._id); setGiftOpen(true); }}
                  >
                    <Gift size={20} />
                    <span>{post.giftCount || 0}</span>
                  </button>
                </div>

                <button 
                  className={styles.shareActionBtn}
                  onClick={() => handleShare(post._id)}
                  title="Share this post"
                >
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>

              {/* Inline Comments Section */}
              {activeCommentPost === post._id && (
                <div className={styles.commentsSection}>
                  <div className={styles.commentInputRow}>
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}
                      alt="Your avatar"
                      className={styles.commentInputAvatar}
                    />
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      className={styles.commentInput}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                    />
                    <button 
                      className={styles.sendCommentBtn}
                      onClick={() => handleCommentSubmit(post._id)}
                      disabled={!newComment.trim()}
                      aria-label="Post comment"
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  <div className={styles.commentsList}>
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.slice(-5).reverse().map((c, i) => {
                        if (c.isGift) {
                          const coins = c.giftCoins || 0;
                          let giftTier = c.giftTier || 1;
                          if (coins >= 5000) giftTier = 4;
                          else if (coins >= 1000) giftTier = 3;
                          else if (coins >= 100) giftTier = 2;

                          const tierClass = styles[`giftTier${giftTier}`] || styles.giftTier1;
                          const badgeClass = styles[`badgeTier${giftTier}`] || styles.badgeTier1;
                          const tierLabels = {
                            1: 'CLASSIC GIFT',
                            2: 'PREMIUM GIFT ✦',
                            3: 'LUXURY ROYALTY 💎',
                            4: 'ROYAL JACKPOT 👑✨'
                          };

                          return (
                            <div key={c._id || i} className={`${styles.giftCommentCard} ${tierClass}`}>
                              <span className={styles.giftBgEmoji} aria-hidden="true">{c.giftEmoji || '🎁'}</span>
                              <img 
                                src={c.userId?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                                alt={c.userId?.displayName || 'User'} 
                                className={styles.giftAvatar} 
                              />
                              <div className={styles.giftCommentContent}>
                                <div className={styles.giftHeaderRow}>
                                  <span className={styles.giftCommenterName}>{c.userId?.displayName || c.userId?.username || 'Fan'}</span>
                                  <span className={`${styles.giftBadge} ${badgeClass}`}>
                                    {tierLabels[giftTier]}
                                  </span>
                                </div>
                                <div className={styles.giftBodyRow}>
                                  <span className={styles.giftEmojiLarge}>{c.giftEmoji || '🎁'}</span>
                                  <div className={styles.giftDetails}>
                                    <span className={styles.giftMessage}>{c.text || `Sent ${c.giftName || 'Gift'}`}</span>
                                  </div>
                                  <div className={styles.giftCoinPill}>
                                    <span>🪙 {coins.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={c._id || i} className={styles.commentItem}>
                            <img 
                              src={c.userId?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'} 
                              alt={`${c.userId?.displayName || 'User'}'s avatar`} 
                              className={styles.commentAvatar} 
                            />
                            <div className={styles.commentBubble}>
                              <div className={styles.commentMeta}>
                                <span className={styles.commenterName}>{c.userId?.displayName || 'User'}</span>
                                {c.userId?.isVerifiedBadge && <BadgeCheck size={12} className={styles.commentVerifiedIcon} />}
                                <span className={styles.commentTime}>{formatTimeAgo(c.createdAt)}</span>
                              </div>
                              <p className={styles.commentText}>{c.text}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className={styles.commentsEmpty}>No comments yet — be the first to join the conversation.</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className={styles.sentinel}>
          {loadingMore && (
            <div className={styles.loadingDots}>
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </div>
          )}
          {!nextCursor && !loadingMore && (
            <div className={styles.caughtUp}>
              <span className={styles.caughtUpIcon}><Inbox size={28} /></span>
              <p className={styles.caughtUpText}>You are all caught up!</p>
              <span className={styles.caughtUpSub}>Explore other features too.</span>
            </div>
          )}
        </div>
      </div>

      {/* Share Sheet */}
      {sharePostId && (
        <div className={styles.shareBackdrop} onClick={() => setSharePostId(null)}>
          <div className={styles.shareSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shareHandle} />
            <h3 className={styles.shareTitle}>Share this post</h3>
            <div className={styles.sharePlatforms}>
              <button
                className={styles.sharePlatform}
                onClick={() => handleCopyShareLink(sharePostId)}
              >
                <div className={`${styles.shareIconWrap} ${styles.shareIconCopy}`}>
                  <Link2 size={18} />
                </div>
                <span className={styles.shareLabel}>Copy Link</span>
              </button>
              {buildShareTargets(`${window.location.origin}/post/${sharePostId}`).map((target) => (
                <button
                  key={target.id}
                  className={styles.sharePlatform}
                  onClick={() => handleSharePlatform(target.url)}
                >
                  <div className={styles.shareIconWrap} style={{ backgroundColor: target.color }}>
                    {renderShareIcon(target.id)}
                  </div>
                  <span className={styles.shareLabel}>{target.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.shareCancel} onClick={() => setSharePostId(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gift Panel */}
      {giftOpen && activeTipCreator && (
        <GiftPanel
          type="comment"
          receiverName={receiverName}
          balance={balance}
          onSendGift={handleSendGift}
          onRecharge={() => {
            setGiftOpen(false);
            setRechargeOpen(true);
          }}
          onClose={() => {
            setGiftOpen(false);
            setActiveTipCreator(null);
          }}
        />
      )}
      {rechargeOpen && (
        <QuickRecharge onClose={() => setRechargeOpen(false)} />
      )}

      {/* Unlock Premium Content Confirmation */}
      <ConfirmDeleteDialog
        open={!!unlockTarget}
        itemName={unlockTarget ? `${unlockTarget.coinPrice} coins` : ''}
        title="Unlock Premium Content?"
        confirmLabel="Unlock"
        busyLabel="Unlocking…"
        icon={<Lock size={22} />}
        message={unlockTarget ? (
          <>
            Unlock this premium content for <strong>{unlockTarget.coinPrice} Coins</strong>?
            <span className={styles.unlockNotice}>This purchase is non-refundable and cannot be cancelled for a refund later.</span>
          </>
        ) : ''}
        deleting={unlocking}
        darkMode={darkMode}
        variant="premium"
        onCancel={closeUnlock}
        onConfirm={confirmUnlock}
      />

      {/* Block Creator Confirmation */}
      <ConfirmDeleteDialog
        open={!!blockTarget}
        title="Block Creator?"
        confirmLabel="Block"
        busyLabel="Blocking…"
        icon={<Ban size={22} />}
        message="Block this creator? You will no longer see their posts and they will not be notified."
        deleting={blocking}
        darkMode={darkMode}
        onCancel={closeBlock}
        onConfirm={confirmBlock}
      />
    </div>
  );
};