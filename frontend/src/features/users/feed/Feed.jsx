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

export const Feed = () => {
  const { darkMode, refreshBalance, balance, user } = useApp();
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
      await api.post(`/monetization/gift/${activeTipCreator}`, { giftId: gift.id });
      toast.success(`${gift.name} sent!`);
      setGiftOpen(false);
      setActiveTipCreator(null);
      await refreshBalance();
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
                <div>
                  <div className="skeleton-box skeleton-title" />
                  <div className="skeleton-box skeleton-subtitle" />
                </div>
              </div>
              <div className="skeleton-box skeleton-content-line" />
              <div className="skeleton-box skeleton-content-line short" />
              <div className="skeleton-box skeleton-media" />
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
                  />
                  <div className={styles.creatorInfo}>
                    <div className={styles.nameBlock}>
                      <span className={styles.displayName}>{creator.displayName || 'Creator'}</span>
                      {creator.isVerifiedBadge && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                    </div>
                    <div className={styles.nameRow}>
                      <span className={styles.username}>@{creator.username || 'creator'}</span>
                      <button
                        className={`${styles.followBadge} ${post.isFollowing ? styles.followingBadge : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(creatorId, Boolean(post.isFollowing));
                        }}
                      >
                        {post.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.headerRight}>
                  <span className={styles.timestamp}>{formatTimeAgo(post.createdAt)}</span>
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
                        <div className={styles.blurBg} style={{ backgroundImage: `url(${mediaItem.thumbnailUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=40&q=10'})` }} />
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
                    onClick={() => { setActiveTipCreator(creatorId); setGiftOpen(true); }}
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
                      post.comments.slice(-5).reverse().map((c, i) => (
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
                      ))
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
                  <Link2 size={22} />
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
                    <MessageSquare size={22} />
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
        message={unlockTarget ? <>Unlock this premium content for <strong>{unlockTarget.coinPrice} Coins</strong>?</> : ''}
        deleting={unlocking}
        darkMode={darkMode}
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