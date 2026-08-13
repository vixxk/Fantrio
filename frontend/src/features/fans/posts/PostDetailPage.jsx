import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { SuggestionsSidebar } from '../suggestions/SuggestionsSidebar';
import { GiftPanel } from '../../gifts/GiftPanel';
import { QuickRecharge } from '../../gifts/QuickRecharge';
import { useToast } from '../../../components/Toast/Toast';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Lock,
  Play,
  Video,
  BadgeCheck,
  MoreVertical,
  Send,
  Trash2,
  Check,
  Crown,
  Link2
} from 'lucide-react';
import styles from './PostDetailPage.module.css';

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
      return null;
  }
};

export const PostDetailPage = () => {
  const { darkMode, currentPath, navigateTo, setActiveTab, user, balance, refreshBalance } = useApp();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Kebab & Modal states
  const [showKebab, setShowKebab] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showQuickRecharge, setShowQuickRecharge] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [highlightCommentId, setHighlightCommentId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hl = params.get('highlight');
    if (hl) setHighlightCommentId(hl);
  }, []);

  const commentsEndRef = useRef(null);

  // Comments are displayed gift-first (most expensive → cheapest), then by
  // recency. `giftRanks` maps a gift comment id to its 1st/2nd/3rd place rank
  // (by coin value) so the top 3 gift cards can each get distinct styling.
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (a.isGift && !b.isGift) return -1;
      if (!a.isGift && b.isGift) return 1;
      if (a.isGift && b.isGift) {
        // Order gifts by coin value (most expensive first), then tier, then recency
        const coinsDiff = (b.giftCoins || 0) - (a.giftCoins || 0);
        if (coinsDiff !== 0) return coinsDiff;
        const tierDiff = (b.giftTier || 1) - (a.giftTier || 1);
        if (tierDiff !== 0) return tierDiff;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [comments]);

  const giftRanks = useMemo(() => {
    const map = {};
    let rank = 0;
    sortedComments.forEach((c) => {
      if (c.isGift) {
        rank += 1;
        if (rank <= 3) map[c._id] = rank;
      }
    });
    return map;
  }, [sortedComments]);

  // Extract postId from the actual browser URL, not from currentPath state
  // (currentPath updates when navigating away and would null out postId while still mounted)
  const getPostId = () => {
    const path = window.location.pathname;
    if (path.startsWith('/post/')) {
      return path.split('/post/')[1] || null;
    }
    return null;
  };

  const [postId, setPostId] = useState(getPostId);

  // Sync postId when currentPath changes back to a /post/ route
  useEffect(() => {
    const id = getPostId();
    if (id) {
      setPostId(id);
      setError(null);
    }
  }, [currentPath]);

  useEffect(() => {
    if (!postId) {
      // Only show error if we're actually on a /post/ route
      if (window.location.pathname.startsWith('/post/')) {
        setError('Invalid post link');
        setLoading(false);
      }
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/posts/${postId}`);
        if (res.status === 'success' && res.post) {
          const postData = res.post;
          setPost(postData);
          setIsLiked(postData.isLiked || false);
          setLikesCount(postData.likesCount || 0);
          setComments(postData.comments || []);
          setCommentsCount(postData.commentsCount || (postData.comments ? postData.comments.length : 0));
          setIsFollowing(postData.isFollowing || false);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Failed to load post:', err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (highlightCommentId && comments.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${highlightCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease, transform 0.4s ease';
          el.style.boxShadow = '0 0 28px rgba(255, 215, 0, 0.85), 0 0 12px rgba(255, 180, 0, 0.6)';
          el.style.borderColor = '#ffd700';
          el.style.transform = 'scale(1.01)';
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [highlightCommentId, comments]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/discover');
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => (newLikedState ? prev + 1 : prev - 1));

    try {
      const res = await api.post(`/posts/${post._id}/like`);
      if (res.status === 'success') {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
      // Rollback
      setIsLiked(!newLikedState);
      setLikesCount(prev => (newLikedState ? prev - 1 : prev + 1));
      toast?.showToast?.(err.message || 'Failed to update like status', 'error');
    }
  };

  const handleUnlock = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/posts/${post._id}/unlock`);
      if (res.status === 'success') {
        toast?.showToast?.('Post content unlocked successfully!', 'success');
        // Refresh post
        const refreshed = await api.get(`/posts/${post._id}`);
        if (refreshed.post) setPost(refreshed.post);
      }
    } catch (err) {
      console.error('Unlock failed:', err);
      toast?.showToast?.(err.message || 'Failed to unlock post', 'error');
    }
  };

  const handleSendComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !post || submittingComment) return;

    setSubmittingComment(true);
    const textToSend = commentText.trim();
    setCommentText('');

    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: textToSend });
      if (res.status === 'success' && res.comments) {
        setComments(res.comments);
        setCommentsCount(res.comments.length);
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setCommentText(textToSend);
      toast?.showToast?.(err.message || 'Failed to submit comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!post || !commentId) return;
    setDeleteConfirmId(null);
    try {
      const res = await api.delete(`/posts/${post._id}/comment/${commentId}`);
      if (res.status === 'success' && res.comments) {
        setComments(res.comments);
        setCommentsCount(res.comments.length);
        toast?.showToast?.('Comment deleted', 'success');
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast?.showToast?.(err.message || 'Failed to delete comment', 'error');
    }
  };

  const handleSendGift = async (gift) => {
    const creatorId = post?.creatorId?._id || post?.creatorId;
    if (!creatorId) return;
    if (balance < gift.coins) {
      setShowGiftPanel(false);
      setShowQuickRecharge(true);
      return;
    }
    try {
      await api.post(`/monetization/gift/${creatorId}`, { giftId: gift.id, postId: post._id });
      toast?.showToast?.(`${gift.name} sent!`, 'success');
      setShowGiftPanel(false);
      await refreshBalance();
      // Re-fetch post to get updated comments with the new gift card
      try {
        const updatedPost = await api.get(`/posts/${post._id}`);
        if (updatedPost?.post?.comments) {
          setComments(updatedPost.post.comments);
          setCommentsCount(updatedPost.post.comments.length);
        }
      } catch (_) { /* comment refresh is best-effort */ }
    } catch (err) {
      toast?.showToast?.('Failed to send gift: ' + (err.message || 'Please try again'), 'error');
      throw err;
    }
  };

  const handleOpenShare = () => {
    setShowKebab(false);
    setShowShareModal(true);
  };

  const handleCopyShareLink = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast?.showToast?.('Post link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
      api.post(`/posts/${post._id}/share`).catch(() => {});
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSharePlatform = (targetUrl) => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (post) {
      api.post(`/posts/${post._id}/share`).catch(() => {});
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast?.showToast?.(isFollowing ? 'Unfollowed creator' : 'Following creator', 'success');
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isPostOwner = post && user && String(post.creatorId?._id || post.creatorId) === String(user.id || user._id);

  return (
    <div className={`${styles.pageWrapper} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.layoutGrid}>
        
        {/* Main Post Column */}
        <div className={styles.mainColumn}>
          
          {/* Top Header Navigation */}
          <div className={styles.topNav}>
            <button className={styles.backBtn} onClick={handleBack} title="Back to Feed">
              <ArrowLeft size={20} />
            </button>
            <div className={styles.topNavTitleBlock}>
              <h2 className={styles.topNavTitle}>Post Detail</h2>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Loading post...</p>
            </div>
          ) : error || !post ? (
            <div className={styles.errorState}>
              <h3 className={styles.errorTitle}>Post Not Found</h3>
              <p className={styles.errorText}>{error || 'The post you are looking for does not exist or has been removed.'}</p>
              <button className={styles.goBackBtn} onClick={() => navigateTo('/discover')}>
                Back to Feed
              </button>
            </div>
          ) : (
            <div className={styles.postCard}>
              
              {/* Creator Info Header */}
              <div className={styles.postHeader}>
                <div className={styles.creatorProfile}>
                  <img 
                    src={post.creatorId?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                    alt={post.creatorId?.displayName || 'Creator'} 
                    className={styles.avatar}
                  />
                  <div className={styles.creatorInfo}>
                    <div className={styles.nameBlock}>
                      <span className={styles.displayName}>{post.creatorId?.displayName || 'Creator'}</span>
                      {(post.creatorId?.isVerifiedBadge || post.creatorId?.isVerified) && (
                        <BadgeCheck size={16} className={styles.verifiedIcon} />
                      )}
                    </div>
                    <span className={styles.username}>@{post.creatorId?.username || 'creator'}</span>
                  </div>
                </div>

                <div className={styles.headerRight}>
                  <div className={styles.headerActionCol}>
                    {!isPostOwner && (
                      <button className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ''}`} onClick={handleFollow}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                    <span className={styles.timestamp}>{formatTimestamp(post.createdAt)}</span>
                  </div>
                  <div className={styles.kebabWrapper}>
                    <button 
                      className={styles.moreBtn} 
                      onClick={() => setShowKebab(!showKebab)}
                      title="More Options"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showKebab && (
                      <div className={styles.kebabDropdown}>
                        <button className={styles.kebabOption} onClick={handleOpenShare}>
                          Share Post
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={`${styles.kebabOption} ${styles.kebabDanger}`}
                          onClick={() => {
                            setShowKebab(false);
                            toast?.showToast?.('Post reported to moderation team.', 'success');
                          }}
                        >
                          Report Post
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Caption */}
              {post.content && (
                <div className={styles.postCaption}>{post.content}</div>
              )}

              {/* Media Gallery / Locked Overlay */}
              {post.media && post.media.length > 0 && (
                <div className={styles.mediaContainer}>
                  {post.media.map((mediaItem) => {
                    const isLocked = mediaItem.isLocked && !post.hasAccess;

                    if (isLocked) {
                      return (
                        <div key={mediaItem._id} className={styles.lockedOverlay}>
                          <div 
                            className={mediaItem.isBlurred !== false ? styles.blurBg : styles.clearBg} 
                            style={{ backgroundImage: `url(${mediaItem.thumbnailUrl || mediaItem.url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=40&q=10'})` }} 
                          />
                          <div className={styles.lockBox}>
                            <div className={styles.lockIconCircle}>
                              <Lock size={38} className={styles.lockIcon} />
                            </div>
                            <p className={styles.lockMsg}>
                              Unlock this {mediaItem.type === 'video' ? 'video' : 'content'} <br /> for {post.coinPrice} Coins
                            </p>
                            <button className={styles.unlockBtn} onClick={handleUnlock}>
                              Unlock Now
                            </button>
                            <p className={styles.unlockNotice}>
                              This purchase is non-refundable and cannot be cancelled for a refund later.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (mediaItem.type === 'video') {
                      return (
                        <div key={mediaItem._id} className={styles.videoPlayerWrapper}>
                          <video 
                            src={mediaItem.url} 
                            poster={mediaItem.thumbnailUrl}
                            controls
                            className={styles.postVideo}
                          />
                          <span className={styles.videoLengthBadge}>
                            <Play size={10} fill="#ffffff" /> 01:45
                          </span>
                          <span className={styles.videoIndicatorBadge}>
                            <Video size={14} />
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={mediaItem._id} className={styles.mediaItemWrapper}>
                        <img 
                          src={mediaItem.url || mediaItem.thumbnailUrl} 
                          alt="Post Media" 
                          className={styles.postImage} 
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Post Action Bar */}
              <div className={styles.postFooter}>
                <div className={styles.actionGroup}>
                  <button 
                    className={`${styles.footerActionBtn} ${isLiked ? styles.liked : ''}`}
                    onClick={handleLike}
                  >
                    <Heart size={18} fill={isLiked ? '#ff007f' : 'none'} color={isLiked ? '#ff007f' : 'currentColor'} />
                    <span>{likesCount}</span>
                  </button>

                  <button className={styles.footerActionBtn}>
                    <MessageCircle size={18} />
                    <span>{commentsCount}</span>
                  </button>

                  <button 
                    className={`${styles.footerActionBtn} ${styles.giftBtn}`}
                    onClick={() => setShowGiftPanel(true)}
                  >
                    <Gift size={18} color="#ffb800" />
                    <span>Send Gift</span>
                  </button>
                </div>

                <button 
                  className={`${styles.shareActionBtn} ${copiedLink ? styles.copied : ''}`}
                  onClick={handleOpenShare}
                >
                  {copiedLink ? <Check size={16} /> : <Share2 size={18} />}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className={styles.commentsSection}>
                <div className={styles.commentsHeader}>
                  <span className={styles.commentsTitle}>Comments</span>
                  <span className={styles.commentsCount}>{commentsCount}</span>
                </div>

                {/* Comment Input */}
                <form className={styles.commentInputRow} onSubmit={handleSendComment}>
                  <img 
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                    alt="User" 
                    className={styles.commentInputAvatar} 
                  />
                  <input 
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className={styles.commentInput}
                  />
                  <button 
                    type="submit" 
                    className={styles.sendCommentBtn}
                    disabled={!commentText.trim() || submittingComment}
                    title="Send comment"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Comments List */}
                <div className={styles.commentsList}>
                  {comments.length === 0 ? (
                    <p className={styles.commentsEmpty}>No comments yet. Be the first to join the conversation!</p>
                  ) : (
                    sortedComments.map((comment) => {
                      const commenter = comment.userId || {};
                      const canDelete = user && (String(commenter._id || commenter) === String(user.id || user._id) || isPostOwner);

                      if (comment.isGift) {
                        const coins = comment.giftCoins || 0;
                        let giftTier = comment.giftTier || 1;
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
                        // Podium rank (1st/2nd/3rd most expensive gift) gets its own distinct card UI
                        const giftRank = giftRanks[comment._id] || 0;
                        const rankClass = giftRank ? styles[`giftRank${giftRank}`] || '' : '';
                        const medalClass = giftRank ? styles[`giftMedal${giftRank}`] || '' : '';

                        return (
                          <div key={comment._id} id={`comment-${comment._id}`} className={`${styles.giftCommentCard} ${tierClass} ${rankClass}`}>
                            <span className={styles.giftBgEmoji} aria-hidden="true">{comment.giftEmoji || '🎁'}</span>
                            <div className={styles.giftAvatarWrap}>
                              <img 
                                src={commenter.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                                alt={commenter.displayName || 'User'} 
                                className={styles.giftAvatar} 
                              />
                              {giftRank > 0 && (
                                <>
                                  <span
                                    className={`${styles.giftCrown} ${styles[`giftCrown${giftRank}`] || ''}`}
                                    title={`#${giftRank} fan`}
                                    aria-hidden="true"
                                  >
                                    <Crown size={13} fill="currentColor" strokeWidth={2} />
                                  </span>
                                  <span className={`${styles.giftMedal} ${medalClass}`} title={`#${giftRank} gift`}>
                                    {giftRank}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className={styles.giftCommentContent}>
                              <div className={styles.giftHeaderRow}>
                                <span className={styles.giftCommenterName}>{commenter.displayName || commenter.username || 'Fan'}</span>
                                {giftRank > 0 ? (
                                  <span className={`${styles.giftBadge} ${styles[`badgeRank${giftRank}`] || ''}`}>
                                    {giftRank === 1 ? 'Top Gift 🥇' : giftRank === 2 ? '2nd Gift' : '3rd Gift'}
                                  </span>
                                ) : tierLabels[giftTier] ? (
                                  <span className={`${styles.giftBadge} ${badgeClass}`}>
                                    {tierLabels[giftTier]}
                                  </span>
                                ) : null}
                              </div>
                              <div className={styles.giftBodyRow}>
                                <span className={styles.giftEmojiLarge}>{comment.giftEmoji || '🎁'}</span>
                                <span className={styles.giftMessage}>{comment.text || `Sent ${comment.giftName || 'a gift'}`}</span>
                                {comment.giftCoins > 0 && (
                                  <span className={styles.giftCoinPill}>
                                    <img src="/coin.png" alt="coin" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                                    {comment.giftCoins}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canDelete && (
                              <button 
                                className={styles.deleteCommentBtn} 
                                onClick={() => setDeleteConfirmId(comment._id)}
                                title="Delete comment"
                                style={{ marginTop: 2 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={comment._id} className={styles.commentItem}>
                          <img 
                            src={commenter.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                            alt={commenter.displayName || 'User'} 
                            className={styles.commentAvatar} 
                          />
                          <div className={styles.commentBubble}>
                            <div className={styles.commentMeta}>
                              <span className={styles.commenterName}>{commenter.displayName || commenter.username || 'User'}</span>
                              <span className={styles.commentTime}>{formatTimestamp(comment.createdAt)}</span>
                              {canDelete && (
                                <button 
                                  className={styles.deleteCommentBtn} 
                                  onClick={() => setDeleteConfirmId(comment._id)}
                                  title="Delete comment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <p className={styles.commentText}>{comment.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar Column */}
        <div className={styles.rightSidebarWrapper}>
          <SuggestionsSidebar />
        </div>

      </div>

      {/* Gift Panel Modal */}
      {showGiftPanel && post && (
        <GiftPanel
          type="comment"
          receiverName={post.creatorId?.displayName || 'Creator'}
          balance={balance}
          onSendGift={handleSendGift}
          onRecharge={() => {
            setShowGiftPanel(false);
            setShowQuickRecharge(true);
          }}
          onClose={() => setShowGiftPanel(false)}
        />
      )}

      {/* Quick Recharge Modal */}
      {showQuickRecharge && (
        <QuickRecharge
          isOpen={showQuickRecharge}
          onClose={() => setShowQuickRecharge(false)}
          requiredCoins={50}
        />
      )}

      {/* Share Sheet Modal */}
      {showShareModal && post && (
        <div className={styles.shareBackdrop} onClick={() => setShowShareModal(false)}>
          <div className={styles.shareSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shareHandle} />
            <h3 className={styles.shareTitle}>Share this post</h3>
            <div className={styles.sharePlatforms}>
              <button
                className={styles.sharePlatform}
                onClick={handleCopyShareLink}
              >
                <div className={`${styles.shareIconWrap} ${styles.shareIconCopy}`}>
                  <Link2 size={18} />
                </div>
                <span className={styles.shareLabel}>Copy Link</span>
              </button>
              {buildShareTargets(`${window.location.origin}/post/${post._id}`).map((target) => (
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
            <button className={styles.shareCancel} onClick={() => setShowShareModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {deleteConfirmId && (
        <div className={styles.shareBackdrop} onClick={() => setDeleteConfirmId(null)}>
          <div className={styles.deleteConfirmBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteConfirmIcon}>
              <Trash2 size={24} />
            </div>
            <h4 className={styles.deleteConfirmTitle}>Delete Comment?</h4>
            <p className={styles.deleteConfirmText}>
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className={styles.deleteConfirmActions}>
              <button
                type="button"
                className={styles.deleteConfirmCancelBtn}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmDeleteBtn}
                onClick={() => handleDeleteComment(deleteConfirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
