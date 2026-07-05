import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
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
  Video
} from 'lucide-react';
import styles from './Feed.module.css';

const MOCK_POSTS = [
  {
    _id: 'mock-post-1',
    creatorId: {
      _id: '64b1f3c30a84e24cf8f83001',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      displayName: 'Savannah Nguyen',
      isVerifiedBadge: true,
      username: 'savannah_n'
    },
    postType: 'free',
    hasAccess: true,
    content: 'Had an amazing weekend photoshoot! 📸 Can\'t wait to share more with you guys. Which one is your favorite?',
    media: [
      {
        _id: 'media-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
      }
    ],
    likesCount: 142,
    isLiked: false,
    commentsCount: 2,
    comments: [
      {
        _id: 'comment-1-1',
        text: 'You look absolutely stunning! 😍',
        userId: { displayName: 'Alex King', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }
      },
      {
        _id: 'comment-1-2',
        text: 'Where was this taken?',
        userId: { displayName: 'Jane Cooper', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' }
      }
    ],
    sharesCount: 12
  },
  {
    _id: 'mock-post-2',
    creatorId: {
      _id: '64b1f3c30a84e24cf8f83002',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      displayName: 'Leslie Alexander',
      isVerifiedBadge: true,
      username: 'leslie_alex'
    },
    postType: 'ppv',
    hasAccess: false,
    coinPrice: 50,
    content: 'Behind the scenes video from my latest dance rehearsals! 💃 Unlock to see the full routine.',
    media: [
      {
        _id: 'media-2',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-front-of-a-pink-neon-light-41865-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
      }
    ],
    likesCount: 89,
    isLiked: false,
    commentsCount: 1,
    comments: [
      {
        _id: 'comment-2-1',
        text: 'So excited to see this!',
        userId: { displayName: 'Robert Fox', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }
      }
    ],
    sharesCount: 5
  },
  {
    _id: 'mock-post-3',
    creatorId: {
      _id: '64b1f3c30a84e24cf8f83003',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      displayName: 'Kristin Watson',
      isVerifiedBadge: true,
      username: 'kristin_w'
    },
    postType: 'free',
    hasAccess: true,
    content: 'Just recorded a new acoustic vocal cover! 🎙️ Grab your headphones and let me know what you think.',
    media: [
      {
        _id: 'media-3',
        type: 'audio',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80'
      }
    ],
    likesCount: 204,
    isLiked: false,
    commentsCount: 0,
    comments: [],
    sharesCount: 24
  },
  {
    _id: 'mock-post-4',
    creatorId: {
      _id: '64b1f3c30a84e24cf8f83004',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
      displayName: 'Jenny Wilson',
      isVerifiedBadge: false,
      username: 'jenny_wilson'
    },
    postType: 'ppv',
    hasAccess: false,
    coinPrice: 35,
    content: 'Exclusive high-resolution portrait from my latest studio set. ✨ Unlock to see the full unblurred image.',
    media: [
      {
        _id: 'media-4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    likesCount: 56,
    isLiked: false,
    commentsCount: 0,
    comments: [],
    sharesCount: 2
  },
  {
    _id: 'mock-post-5',
    creatorId: {
      _id: '64b1f3c30a84e24cf8f83005',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      displayName: 'Dianne Russell',
      isVerifiedBadge: true,
      username: 'dianne_r'
    },
    postType: 'free',
    hasAccess: true,
    content: 'Good morning everyone! Sending you all positive vibes for a productive and wonderful week ahead. Remember to stay hydrated and take small breaks! ☀️🌸',
    media: [],
    likesCount: 310,
    isLiked: false,
    commentsCount: 1,
    comments: [
      {
        _id: 'comment-5-1',
        text: 'Morning Dianne! Thanks for the positive energy!',
        userId: { displayName: 'Jacob Jones', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80' }
      }
    ],
    sharesCount: 45
  }
];

export const Feed = () => {
  const { darkMode, refreshBalance, balance } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for comments and tipping modals
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  
  const [activeTipCreator, setActiveTipCreator] = useState(null);
  const [tipAmount, setTipAmount] = useState('10');
  const [copiedPostId, setCopiedPostId] = useState(null);

  const fetchPosts = () => {
    setLoading(true);
    const stored = localStorage.getItem('fantrio_mock_posts');
    if (stored) {
      setPosts(JSON.parse(stored));
    } else {
      setPosts(MOCK_POSTS);
      localStorage.setItem('fantrio_mock_posts', JSON.stringify(MOCK_POSTS));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const savePosts = (newPosts) => {
    setPosts(newPosts);
    localStorage.setItem('fantrio_mock_posts', JSON.stringify(newPosts));
  };

  const handleLike = (postId) => {
    const updated = posts.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    });
    savePosts(updated);
  };

  const handleUnlock = async (postId, coinPrice) => {
    if (balance < coinPrice) {
      alert(`Insufficient coins! You need ${coinPrice} coins but have ${balance}. Add coins in the sidebar first!`);
      return;
    }

    if (!window.confirm(`Unlock this premium content for ${coinPrice} Coins?`)) {
      return;
    }

    const postObj = posts.find(p => p._id === postId);
    const creatorId = postObj?.creatorId?._id || '64b1f3c30a84e24cf8f83001';

    try {
      // Deduct coins using the backend tip route for matching wallet ledger
      await api.post(`/monetization/tip/${creatorId}`, { coins: coinPrice });
      
      const updated = posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            hasAccess: true,
            media: p.media.map(m => ({
              ...m,
              isLocked: false
            }))
          };
        }
        return p;
      });
      savePosts(updated);
      await refreshBalance();
      alert('Content unlocked successfully!');
    } catch (err) {
      alert('Failed to unlock content: ' + err.message);
    }
  };

  const handleCommentSubmit = (postId) => {
    if (!newComment.trim()) return;

    const newCommentObj = {
      _id: `comment-${Date.now()}`,
      text: newComment,
      userId: {
        displayName: 'Johnn',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
      },
      createdAt: new Date().toISOString()
    };

    const updated = posts.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...(p.comments || []), newCommentObj]
        };
      }
      return p;
    });
    
    savePosts(updated);
    setNewComment('');
  };

  const handleTipSubmit = async () => {
    const coinsVal = parseFloat(tipAmount);
    if (isNaN(coinsVal) || coinsVal <= 0) {
      alert('Please enter a valid positive number of coins.');
      return;
    }

    if (balance < coinsVal) {
      alert('Insufficient coins for this tip.');
      return;
    }

    try {
      await api.post(`/monetization/tip/${activeTipCreator}`, { coins: coinsVal });
      alert(`Successfully sent a ${coinsVal} coins tip!`);
      setActiveTipCreator(null);
      await refreshBalance();
    } catch (err) {
      alert('Failed to send tip: ' + err.message);
    }
  };

  const handleShare = async (postId) => {
    try {
      const shareUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      const updated = posts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            sharesCount: p.sharesCount + 1
          };
        }
        return p;
      });
      savePosts(updated);

      setCopiedPostId(postId);
      setTimeout(() => {
        setCopiedPostId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to share post:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your discover feed...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.feedContainer} ${darkMode ? styles.dark : styles.light}`}>
      
      {/* Posts List */}
      <div className={styles.postsList}>
        {posts.map((post) => {
          const creator = post.creatorId || {};
          const isPPV = post.postType === 'ppv';
          const isLocked = isPPV && !post.hasAccess;

          return (
            <article key={post._id} className={styles.postCard}>
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
                      <span className={styles.displayName}>{creator.displayName || 'Molly Jane'}</span>
                      {creator.isVerifiedBadge !== false && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                    </div>
                    <span className={styles.username}>@{creator.username || 'mollyjane'}</span>
                  </div>
                </div>

                <div className={styles.headerRight}>
                  <span className={styles.timestamp}>2h ago</span>
                  <button className={styles.moreBtn}>
                    <MoreVertical size={18} />
                  </button>
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
                      /* LOCKED STATE OVERLAY */
                      <div className={styles.lockedOverlay}>
                        <div className={styles.blurBg} style={{ backgroundImage: `url(${mediaItem.thumbnailUrl || mediaItem.url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=40&q=10'})` }} />
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
                      /* UNLOCKED STATE */
                      mediaItem.type === 'video' ? (
                        <div className={styles.videoPlayerWrapper}>
                          <video 
                            src={mediaItem.url} 
                            controls 
                            className={styles.postVideo} 
                            poster="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
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
                    className={styles.footerActionBtn}
                    onClick={() => setActiveTipCreator(creator._id)}
                  >
                    <Gift size={20} />
                    <span>{post.giftCount || 48}</span>
                  </button>
                </div>

                <button 
                  className={`${styles.shareActionBtn} ${copiedPostId === post._id ? styles.copied : ''}`} 
                  onClick={() => handleShare(post._id)}
                  title="Copy share link"
                >
                  <Share2 size={20} className={copiedPostId === post._id ? styles.copiedIcon : ''} />
                  <span>{copiedPostId === post._id ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Inline Comments Section */}
              {activeCommentPost === post._id && (
                <div className={styles.commentsSection}>
                  <div className={styles.commentInputRow}>
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
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  <div className={styles.commentsList}>
                    {post.comments && post.comments.slice(-5).reverse().map((c, i) => (
                      <div key={i} className={styles.commentItem}>
                        <img 
                          src={c.userId?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'} 
                          alt="Commenter avatar" 
                          className={styles.commentAvatar} 
                        />
                        <div className={styles.commentBubble}>
                          <span className={styles.commenterName}>{c.userId?.displayName || 'User'}</span>
                          <p className={styles.commentText}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Tip Creator Modal */}
      {activeTipCreator && (
        <div className={styles.modalBackdrop}>
          <div className={styles.tipModal}>
            <h3 className={styles.modalTitle}>Send a Tip</h3>
            <p className={styles.modalDesc}>Support this creator by sending some coins.</p>
            
            <div className={styles.tipOptions}>
              {['10', '20', '50', '100'].map((amt) => (
                <button 
                  key={amt}
                  className={`${styles.tipOptBtn} ${tipAmount === amt ? styles.selectedTip : ''}`}
                  onClick={() => setTipAmount(amt)}
                >
                  {amt} Coins
                </button>
              ))}
            </div>

            <div className={styles.customTipRow}>
              <span className={styles.customLabel}>Custom Amount:</span>
              <input 
                type="number" 
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className={styles.customTipInput}
                min="1"
              />
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setActiveTipCreator(null)}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleTipSubmit}
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
