import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  Star,
  MapPin,
  Languages,
  Eye,
  Users,
  Crown,
  Phone,
  Video,
  Check,
  Loader2,
  UserPlus,
  Sparkles,
  Lock,
  Play,
  X,
  Coins,
  ShieldAlert,
  Info,
  Images,
  Film,
  Camera
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../components/Toast/Toast';
import { api } from '../../../services/api';
import { getSocket } from '../../../services/socket';
import styles from './CreatorProfilePage.module.css';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

const getPlanRank = (planName) => {
  const name = (planName || '').toLowerCase();
  if (name.includes('vip') || name.includes('ultimate')) return 3;
  if (name.includes('premium') || name.includes('pro')) return 2;
  if (name.includes('basic') || name.includes('starter')) return 1;
  return 1;
};

export const CreatorProfilePage = () => {
  const { darkMode, currentPath, navigateTo, user, balance, refreshBalance } = useApp();
  const { toast } = useToast();
  const mountedRef = useRef(true);

  const pathParts = currentPath.split('?')[0].split('/').filter(Boolean);
  let username = (pathParts.length > 1 ? pathParts[pathParts.length - 1] : '').toLowerCase();
  if (username === 'creator' || username === 'creator-profile' || username === 'listener-profile') {
    username = '';
  }
  if (!username) {
    const params = new URLSearchParams(window.location.search);
    username = (params.get('username') || '').toLowerCase();
  }

  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [posts, setPosts] = useState([]);

  const [selectedPlan, setSelectedPlan] = useState('Premium');
  const [subscribedPlanName, setSubscribedPlanName] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeBusy, setSubscribeBusy] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const loadCreatorPosts = useCallback(async (creatorId) => {
    if (!creatorId) return;
    try {
      const feed = await api.get('/posts?limit=24');
      if (!mountedRef.current) return;
      const mine = (feed.posts || []).filter(
        (p) => String(p.creatorId?._id || '') === String(creatorId) && Array.isArray(p.media) && p.media.length > 0
      );
      setPosts(mine.slice(0, 9));
    } catch {
      /* posts preview is best-effort */
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!username) return;

    let mounted = true;

    const load = async () => {
      try {
        const res = await api.get(`/creators/profile/${username}`);
        if (!mounted) return;

        setCreator(res.creator || null);
        setSubscribed(!!res.isSubscribed);
        if (res.isSubscribed) {
          setSubscribedPlanName(res.subscribedPlan || 'Basic');
        }

        const plans = res.creator?.subscriptionPlans?.filter((p) => p.isActive) || [];
        const initialPlan = res.subscribedPlan || plans[0]?.name || 'Premium';
        setSelectedPlan(initialPlan);

        if (res.creator?.userId?._id) {
          try {
            const favs = await api.get('/creators/following');
            if (mounted) {
              const ids = (favs.creators || []).map((c) => String(c.userId?._id || ''));
              setFollowing(ids.includes(String(res.creator.userId._id)));
            }
          } catch {
            /* ignore following lookup failures */
          }

          loadCreatorPosts(res.creator.userId._id);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Could not load this creator.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [username, loadCreatorPosts]);

  useEffect(() => {
    let socket = null;
    try {
      socket = getSocket();
    } catch { /* noop */ }

    const handlePresence = ({ userId, creatorId, isOnline }) => {
      if (!creator) return;
      const targetId = String(userId || creatorId);
      const cUserId = String(creator.userId?._id || creator.userId || '');
      const cCreatorId = String(creator._id || '');
      if (cUserId === targetId || cCreatorId === targetId) {
        setCreator((prev) => (prev ? { ...prev, isOnline } : prev));
      }
    };

    const handleAvailability = ({ userId, creatorId, isOnline, audioAvailable, videoAvailable }) => {
      if (!creator) return;
      const targetId = String(userId || creatorId);
      const cUserId = String(creator.userId?._id || creator.userId || '');
      const cCreatorId = String(creator._id || '');
      if (cUserId === targetId || cCreatorId === targetId) {
        setCreator((prev) =>
          prev
            ? {
                ...prev,
                ...(isOnline !== undefined ? { isOnline } : {}),
                ...(audioAvailable !== undefined ? { audioAvailable } : {}),
                ...(videoAvailable !== undefined ? { videoAvailable } : {})
              }
            : prev
        );
      }
    };

    if (socket) {
      socket.on('user_presence_change', handlePresence);
      socket.on('creator_availability_change', handleAvailability);
      return () => {
        socket.off('user_presence_change', handlePresence);
        socket.off('creator_availability_change', handleAvailability);
      };
    }
  }, [creator]);

  const handleFollow = useCallback(async () => {
    const creatorId = creator?.userId?._id || creator?.userId;
    if (!creatorId || followBusy) return;

    setFollowBusy(true);
    try {
      await api.post(`/creators/follow/${creatorId}`);
      setFollowing((prev) => {
        const next = !prev;
        setCreator((c) => (c ? { ...c, followerCount: Math.max(0, (c.followerCount || 0) + (next ? 1 : -1)) } : c));
        return next;
      });
    } catch (err) {
      setError(err.message || 'Could not update follow status.');
    } finally {
      setFollowBusy(false);
    }
  }, [creator, followBusy]);

  const handleOpenSubModal = useCallback((planArg) => {
    if (!user) {
      navigateTo('/login');
      return;
    }

    const targetPlanName = typeof planArg === 'string' ? planArg : (planArg?.name || selectedPlan);
    setSelectedPlan(targetPlanName);

    if (subscribed && targetPlanName === subscribedPlanName) {
      toast?.info(`You are already subscribed to the ${targetPlanName} plan.`);
      return;
    }

    if (subscribed && subscribedPlanName) {
      const currentRank = getPlanRank(subscribedPlanName);
      const targetRank = getPlanRank(targetPlanName);
      if (targetRank < currentRank) {
        toast?.error(`Plan degradation is not allowed. You are currently on the ${subscribedPlanName} plan.`);
        return;
      }
    }

    setShowSubModal(true);
  }, [user, navigateTo, subscribed, subscribedPlanName, selectedPlan, toast]);

  const handleTopSubscribeClick = useCallback(() => {
    const plansSection = document.getElementById('membership-plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Go back to wherever the user came from (feed, messages, post page, etc.),
  // falling back to the messages page only when there is no history to go back to.
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/messages');
    }
  }, [navigateTo]);

  const handleConfirmSubscribe = useCallback(async () => {
    const creatorId = creator?.userId?._id || creator?.userId;
    if (!creatorId || subscribeBusy) return;

    setSubscribeBusy(true);
    try {
      const res = await api.post(`/monetization/subscribe/${creatorId}`, { plan: selectedPlan });
      setSubscribed(true);
      setSubscribedPlanName(selectedPlan);
      if (res.subscription && !subscribed) {
        setCreator((c) => (c ? { ...c, subscriberCount: (c.subscriberCount || 0) + 1 } : c));
      }
      if (refreshBalance) refreshBalance();
      loadCreatorPosts(creatorId);
      toast?.success(res.message || `Successfully subscribed to ${selectedPlan} plan!`);
      setShowSubModal(false);
    } catch (err) {
      toast?.error(err.message || 'Subscription failed. Check your coin balance.');
    } finally {
      setSubscribeBusy(false);
    }
  }, [creator, selectedPlan, subscribeBusy, subscribed, refreshBalance, loadCreatorPosts, toast]);

  if (!username) {
    return (
      <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.topBarTitle}>Creator Profile</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <UserPlus size={28} />
          </div>
          <h3 className={styles.emptyTitle}>No Creator Selected</h3>
          <p className={styles.emptyText}>Open a conversation and press "View Profile" to see a creator's public profile.</p>
          <button className={styles.primaryBtn} onClick={() => navigateTo('/messages')}>
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.topBarTitle}>Creator Profile</span>
          <span className={styles.topBarHint}>Public view</span>
        </div>

        <div className={styles.page}>
          {/* Hero skeleton */}
          <div className={styles.hero}>
            <div className={`${styles.skeleton} ${styles.skeletonCover}`} />
            <div className={styles.heroAvatarWrap}>
              <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
              <div className={styles.heroIdentity}>
                <div className={`${styles.skeleton} ${styles.skeletonName}`} />
                <div className={`${styles.skeleton} ${styles.skeletonHandle}`} />
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className={styles.actions}>
            <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`} />
            <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`} />
            <div className={`${styles.skeleton} ${styles.skeletonActionBtn}`} />
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonStatCard}`} />
            ))}
          </div>

          {/* Membership Plans section */}
          <div className={styles.card}>
            <div className={`${styles.skeleton} ${styles.skeletonCardTitle}`} />
            <div className={styles.plansList}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonPlanCard}`} />
              ))}
            </div>
          </div>

          {/* Call Rates section */}
          <div className={styles.card}>
            <div className={`${styles.skeleton} ${styles.skeletonCardTitle}`} />
            <div className={styles.ratesGrid}>
              <div className={`${styles.skeleton} ${styles.skeletonRateCard}`} />
              <div className={`${styles.skeleton} ${styles.skeletonRateCard}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !creator) {
    return (
      <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.topBarTitle}>Creator Profile</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <UserPlus size={28} />
          </div>
          <h3 className={styles.emptyTitle}>Profile Unavailable</h3>
          <p className={styles.emptyText}>{error}</p>
          <button className={styles.primaryBtn} onClick={() => navigateTo('/messages')}>
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const rates = creator.rates || {};
  const plans = (creator.subscriptionPlans || []).filter((p) => p.isActive);
  const defaultPlans = plans.length > 0 ? plans : [
    { name: 'Basic', priceCoins: 14, features: ['Exclusive posts', 'Community chat'] },
    { name: 'Premium', priceCoins: 26, features: ['Exclusive posts & videos', 'Priority messages', '1:1 chat'] },
    { name: 'VIP', priceCoins: 43, features: ['Everything in Premium', 'Monthly video call', 'Priority support'] }
  ];
  const categories = Array.isArray(creator.categories) ? creator.categories : [];
  const contentTypes = Array.isArray(creator.contentType) ? creator.contentType : [];

  const selectedPlanRank = selectedPlan ? getPlanRank(selectedPlan) : 0;
  const currentPlanRank = subscribed && subscribedPlanName ? getPlanRank(subscribedPlanName) : 0;
  const maxPlanRank = defaultPlans.length > 0 ? Math.max(...defaultPlans.map((p) => getPlanRank(p.name))) : 1;
  const canUpgrade = subscribed && currentPlanRank < maxPlanRank;
  const isHigherPlanSelected = !subscribed || (selectedPlanRank > currentPlanRank);

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <span className={styles.topBarTitle}>Creator Profile</span>
        <span className={styles.topBarHint}>Public view</span>
      </div>

      {error && <div className={styles.toast}>{error}</div>}

      <div className={styles.page}>
        {/* Cover + Avatar hero */}
        <div className={styles.hero}>
          {creator.coverBannerUrl ? (
            <img src={creator.coverBannerUrl} alt="" className={styles.cover} />
          ) : (
            <div className={`${styles.cover} ${styles.coverGradient}`} />
          )}
          <div className={styles.coverOverlay} />

          {/* Meta overlay (Country, Language, Content Types) */}
          {(creator.country || creator.language || contentTypes.length > 0) && (
            <div className={styles.coverMetaRow}>
              {creator.country && (
                <div className={styles.coverMetaItem}>
                  <MapPin size={16} className={styles.coverMetaIcon} />
                  <span>{creator.country}</span>
                </div>
              )}
              {creator.language && (
                <div className={styles.coverMetaItem}>
                  <Languages size={16} className={styles.coverMetaIcon} />
                  <span>{creator.language}</span>
                </div>
              )}
              {contentTypes.length > 0 && (
                <div className={styles.coverMetaItem}>
                  <Images size={16} className={styles.coverMetaIcon} />
                  <span>{contentTypes.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {creator.isLive && (
            <span className={styles.liveTag}>
              <span className={styles.livePulse} />
              LIVE
            </span>
          )}

          <div className={styles.heroAvatarWrap}>
            <div className={styles.avatarRing}>
              <img
                src={creator.avatarUrl || DEFAULT_AVATAR}
                alt={creator.displayName}
                className={styles.heroAvatar}
              />
              {creator.isOnline && <span className={styles.liveDot} />}
            </div>
            <div className={styles.heroIdentity}>
              <h1 className={styles.heroName}>
                {creator.displayName || creator.username}
                {creator.isVerifiedBadge && <BadgeCheck size={20} className={styles.verifiedBadge} />}
              </h1>
              <span className={styles.heroHandle}>@{creator.username}</span>
            </div>
          </div>
        </div>

        {/* Actions under image section */}
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              const targetUserId = typeof creator?.userId === 'object' ? creator?.userId?._id : creator?.userId;
              if (targetUserId) navigateTo(`/messages/${targetUserId}`);
            }}
          >
            <MessageCircle size={16} /> Message
          </button>
          <button
            className={`${styles.followBtn} ${following ? styles.followingBtn : ''}`}
            onClick={handleFollow}
            disabled={followBusy}
          >
            {followBusy ? <Loader2 size={16} className={styles.spinner} /> : following ? <Check size={16} /> : <UserPlus size={16} />}
            {following ? 'Following' : 'Follow'}
          </button>
          <button
            className={`${styles.subscribeBtn} ${subscribed && !canUpgrade ? styles.subscribedBtn : ''} ${canUpgrade ? styles.upgradeBtn : ''}`}
            onClick={handleTopSubscribeClick}
            disabled={subscribeBusy}
          >
            {subscribeBusy ? <Loader2 size={16} className={styles.spinner} /> : <Crown size={16} />}
            {subscribed ? (canUpgrade ? 'Upgrade' : 'Subscribed') : (
              <>
                <span className={styles.subLabelLong}>Subscribe · {selectedPlan}</span>
                <span className={styles.subLabelShort}>Subscribe</span>
              </>
            )}
          </button>
        </div>

        {/* Subscribers Only teaser banner */}
        {creator.profileVisibility === 'Subscribers Only' && !subscribed && (
          <section className={styles.subOnlyBanner}>
            <span className={styles.subOnlyIcon}><Crown size={20} /></span>
            <div className={styles.subOnlyBody}>
              <h2 className={styles.subOnlyTitle}>Subscribers Only</h2>
              <p className={styles.subOnlyText}>
                {creator.displayName || creator.username}'s posts, stories and media are only visible to
                subscribers. Subscribe below to unlock everything.
              </p>
            </div>
            <button
              className={styles.subOnlyBtn}
              onClick={() => handleOpenSubModal(selectedPlan)}
              disabled={subscribeBusy}
            >
              {subscribeBusy ? <Loader2 size={16} className={styles.spinner} /> : <Crown size={16} />}
              Subscribe
              <span className={styles.subOnlyPrice}>
                {(defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins ?? 0)} Coins/mon
              </span>
            </button>
          </section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className={styles.chipsRow}>
            {categories.map((c) => (
              <span key={c} className={styles.chip}>{c}</span>
            ))}
          </div>
        )}

        {/* Bio */}
        {creator.bio && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>About</h2>
            <p className={styles.bio}>{creator.bio}</p>
          </section>
        )}

        {/* Stats */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatCount(creator.followerCount)}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.statCard}>
            <Crown size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatCount(creator.subscriberCount)}</span>
            <span className={styles.statLabel}>Subscribers</span>
          </div>
          <div className={styles.statCard}>
            <Eye size={18} className={styles.statIcon} />
            <span className={styles.statValue}>{formatCount(creator.profileViews)}</span>
            <span className={styles.statLabel}>Profile Views</span>
          </div>
          <div className={styles.statCard}>
            <Star size={18} className={styles.statIcon} fill="#eab308" color="#eab308" />
            <span className={styles.statValue}>{creator.rating || '—'}</span>
            <span className={styles.statLabel}>({creator.ratingCount || 0} ratings)</span>
          </div>
        </section>

        {/* Subscription plans (Membership Plans before Call Rates) */}
        <section className={styles.card} id="membership-plans-section">
          <div className={styles.cardHeaderWithBtn}>
            <h2 className={styles.cardTitle}>Membership Plans</h2>
            <button
              className={`${styles.sectionSubscribeBtn} ${subscribed && (!canUpgrade || !isHigherPlanSelected) ? styles.disabledUpgradeBtn : ''}`}
              onClick={() => handleOpenSubModal(selectedPlan)}
              disabled={subscribeBusy || (subscribed && (!canUpgrade || !isHigherPlanSelected))}
            >
              {subscribeBusy ? <Loader2 size={14} className={styles.spinner} /> : <Crown size={14} />}
              {subscribed ? (canUpgrade ? (isHigherPlanSelected ? `Upgrade to ${selectedPlan}` : 'Upgrade') : 'Subscribed') : `Subscribe · ${selectedPlan}`}
            </button>
          </div>
          <div className={styles.plansList}>
            {defaultPlans.map((plan) => {
              const isSelected = selectedPlan === plan.name;
              const activePlanName = subscribedPlanName || (subscribed ? 'Basic' : '');
              const isCurrentSub = subscribed && !!activePlanName && plan.name.toLowerCase() === activePlanName.toLowerCase();
              return (
                <button
                  key={plan.name}
                  className={`${styles.plan} ${isSelected ? styles.planSelected : ''} ${isCurrentSub ? `${styles.currentPlanCard} ${styles.dimmedPlan}` : ''}`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <span className={styles.planTop}>
                    <span className={styles.planName}>
                      {plan.name}
                      {isCurrentSub && <span className={styles.currentPlanBadge}><Check size={11} /> Current Plan</span>}
                    </span>
                    <span className={styles.planPrice}>{plan.priceCoins || 0} Coins<span className={styles.planPer}>/mon</span></span>
                  </span>
                  {(plan.features || []).length > 0 && (
                    <span className={styles.planFeatures}>
                      {(plan.features || []).map((f) => (
                        <span key={f} className={styles.planFeature}><Check size={12} /> {f}</span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Call rates */}
        {(creator.audioAvailable || creator.videoAvailable || rates.audioCallPerMin > 0 || rates.videoCallPerMin > 0) && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Call Rates</h2>
            <div className={styles.ratesGrid}>
              <div className={styles.rateCard}>
                <span className={styles.rateIcon}><Phone size={16} /></span>
                <div>
                  <span className={styles.rateName}>1:1 Audio Call</span>
                  <span className={styles.ratePrice}>{rates.audioCallPerMin || 0} Coins/min</span>
                </div>
              </div>
              <div className={styles.rateCard}>
                <span className={styles.rateIcon}><Video size={16} /></span>
                <div>
                  <span className={styles.rateName}>1:1 Video Call</span>
                  <span className={styles.ratePrice}>{rates.videoCallPerMin || 0} Coins/min</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent content */}
        {posts.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Content</h2>
            <div className={styles.postsGrid}>
              {posts.map((post) => {
                const m = post.media?.[0] || {};
                const isClickable = !m.isLocked;
                return (
                  <div
                    key={post._id}
                    className={`${styles.postTile} ${isClickable ? styles.postTileClickable : ''}`}
                    onClick={() => { if (isClickable) navigateTo(`/post/${post._id}`); }}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={isClickable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateTo(`/post/${post._id}`);
                      }
                    } : undefined}
                    aria-label={isClickable ? 'Open post' : undefined}
                  >
                    {m.isLocked ? (
                      <div className={styles.postLocked}>
                        {m.thumbnailUrl || m.url ? (
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt=""
                            className={`${styles.postImg} ${m.isBlurred !== false ? styles.blurredMedia : ''}`}
                          />
                        ) : null}
                        <div className={styles.lockedOverlayContent}>
                          <Lock size={20} />
                          <span>Locked</span>
                        </div>
                      </div>
                    ) : m.type === 'video' ? (
                      <div className={styles.postMedia}>
                        <video src={m.url} className={styles.postImg} />
                        <span className={styles.playBadge}><Play size={14} fill="currentColor" /></span>
                      </div>
                    ) : (
                      <img src={m.thumbnailUrl || m.url} alt="" className={styles.postImg} loading="lazy" />
                    )}
                    {(post.coinPrice > 0 || m.isLocked) && (
                      <span className={styles.postPrice}>{post.coinPrice || 0} Coins</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <p className={styles.footnote}>
          <Sparkles size={12} /> You're viewing {creator.displayName || creator.username}'s public profile.
        </p>
      </div>

      {/* Confirmation Modal */}
      {showSubModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSubModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Crown size={20} color="#ff38af" />
                {subscribed ? 'Confirm Plan Upgrade' : 'Confirm Subscription'}
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowSubModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.creatorPreviewRow}>
              <img src={creator.avatarUrl || DEFAULT_AVATAR} alt="" className={styles.creatorModalAvatar} />
              <div>
                <div className={styles.creatorModalName}>{creator.displayName || creator.username}</div>
                <div className={styles.creatorModalHandle}>@{creator.username}</div>
              </div>
            </div>

            <div className={styles.planSummaryBox}>
              <div className={styles.planSummaryTop}>
                <span className={styles.planSummaryName}>{selectedPlan} Plan</span>
                <span className={styles.planSummaryPrice}>{(defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins || 0)} Coins/mon</span>
              </div>
              {((defaultPlans.find((p) => p.name === selectedPlan)?.features) || []).length > 0 && (
                <div className={styles.planFeatures}>
                  {((defaultPlans.find((p) => p.name === selectedPlan)?.features) || []).map((f) => (
                    <span key={f} className={styles.planFeature}><Check size={12} /> {f}</span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.coinBalanceRow}>
              <span>Your Coin Balance</span>
              <span className={styles.coinVal}>{(balance || 0)} Coins</span>
            </div>

            {(balance || 0) < (defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins || 0) ? (
              <div className={styles.insufficientAlert}>
                <ShieldAlert size={18} />
                <span>
                  Insufficient coins. You need{' '}
                  {(defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins || 0) - (balance || 0)} more coins.
                </span>
              </div>
            ) : (
              <div className={styles.coinBalanceRow}>
                <span>Balance After Charge</span>
                <span className={styles.coinVal}>
                  {(balance || 0) - (defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins || 0)} Coins
                </span>
              </div>
            )}

            <div className={styles.nonCancelNotice}>
              <Info size={16} />
              <span>This subscription is non-refundable and cannot be cancelled for a refund later.</span>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelModalBtn} onClick={() => setShowSubModal(false)}>
                Cancel
              </button>

              {(balance || 0) < (defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins || 0) ? (
                <button className={styles.rechargeModalBtn} onClick={() => navigateTo('/buy-coins')}>
                  <Coins size={16} /> Recharge Coins
                </button>
              ) : (
                <button
                  className={styles.confirmSubModalBtn}
                  onClick={handleConfirmSubscribe}
                  disabled={subscribeBusy}
                >
                  {subscribeBusy ? <Loader2 size={16} className={styles.spinner} /> : <Crown size={16} />}
                  {subscribed ? 'Confirm Upgrade' : 'Confirm & Pay'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
