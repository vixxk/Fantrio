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
  FileText,
  Play
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import styles from './ListenerProfilePage.module.css';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

export const ListenerProfilePage = () => {
  const { darkMode, currentPath, navigateTo, token } = useApp();
  const mountedRef = useRef(true);

  const username = (currentPath.split('/').filter(Boolean)[1] || '').toLowerCase();

  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [posts, setPosts] = useState([]);

  const [selectedPlan, setSelectedPlan] = useState('Premium');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeBusy, setSubscribeBusy] = useState(false);

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

        const plans = res.creator?.subscriptionPlans?.filter((p) => p.isActive) || [];
        setSelectedPlan(plans[0]?.name || 'Premium');

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

  const handleFollow = useCallback(async () => {
    const creatorId = creator?.userId?._id;
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

  const handleSubscribe = useCallback(async () => {
    const creatorId = creator?.userId?._id;
    if (!creatorId || subscribeBusy) return;

    // Subscribing requires an authenticated session
    if (!token) {
      navigateTo('/login');
      return;
    }

    setSubscribeBusy(true);
    try {
      const res = await api.post(`/monetization/subscribe/${creatorId}`, { plan: selectedPlan });
      setSubscribed(true);
      if (res.subscription) {
        setCreator((c) => (c ? { ...c, subscriberCount: (c.subscriberCount || 0) + 1 } : c));
      }
      // Unlock the creator's posts now that we're subscribed
      loadCreatorPosts(creatorId);
    } catch (err) {
      setError(err.message || 'Subscription failed. Check your coin balance.');
    } finally {
      setSubscribeBusy(false);
    }
  }, [creator, selectedPlan, subscribeBusy, loadCreatorPosts, token, navigateTo]);

  if (!username) {
    return (
      <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigateTo('/messages')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.topBarTitle}>Listener Profile</span>
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
        <div className={styles.skeletonWrap}>
          <div className={`${styles.skeleton} ${styles.skeletonBanner}`} />
          <div className={styles.skeletonCard}>
            <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonName}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonSub}`} />
          </div>
        </div>
      </div>
    );
  }

  if (error && !creator) {
    return (
      <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigateTo('/messages')} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span className={styles.topBarTitle}>Listener Profile</span>
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
  const defaultPlans = plans.length > 0 ? plans : [{ name: 'Premium', priceCoins: rates.subscriptionMonthly || 0, features: [] }];
  const categories = Array.isArray(creator.categories) ? creator.categories : [];
  const contentTypes = Array.isArray(creator.contentType) ? creator.contentType : [];

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigateTo('/messages')} aria-label="Back to messages">
          <ArrowLeft size={20} />
        </button>
        <span className={styles.topBarTitle}>Listener Profile</span>
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

          {creator.isLive && (
            <span className={styles.liveTag}>
              <span className={styles.livePulse} />
              LIVE
            </span>
          )}
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
              onClick={handleSubscribe}
              disabled={subscribeBusy}
            >
              {subscribeBusy ? <Loader2 size={16} className={styles.spinner} /> : <Crown size={16} />}
              Subscribe
              <span className={styles.subOnlyPrice}>
                {(defaultPlans.find((p) => p.name === selectedPlan)?.priceCoins ?? 0)} Coins/mo
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

        {/* Meta info */}
        {(creator.country || creator.language || contentTypes.length > 0) && (
          <section className={styles.metaCard}>
            {creator.country && (
              <div className={styles.metaItem}>
                <MapPin size={16} className={styles.metaIcon} />
                <span>{creator.country}</span>
              </div>
            )}
            {creator.language && (
              <div className={styles.metaItem}>
                <Languages size={16} className={styles.metaIcon} />
                <span>{creator.language}</span>
              </div>
            )}
            {contentTypes.length > 0 && (
              <div className={styles.metaItem}>
                <Sparkles size={16} className={styles.metaIcon} />
                <span>{contentTypes.join(', ')}</span>
              </div>
            )}
          </section>
        )}

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

        {/* Subscription plans */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Membership Plans</h2>
          <div className={styles.plansList}>
            {defaultPlans.map((plan) => {
              const isSelected = selectedPlan === plan.name;
              return (
                <button
                  key={plan.name}
                  className={`${styles.plan} ${isSelected ? styles.planSelected : ''}`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <span className={styles.planTop}>
                    <span className={styles.planName}>{plan.name}</span>
                    <span className={styles.planPrice}>{plan.priceCoins || 0} Coins<span className={styles.planPer}>/mo</span></span>
                  </span>
                  {(plan.features || []).length > 0 && (
                    <span className={styles.planFeatures}>
                      {(plan.features || []).map((f) => (
                        <span key={f} className={styles.planFeature}><Check size={12} /> {f}</span>
                      ))}
                    </span>
                  )}
                  {isSelected && <Check size={16} className={styles.planCheck} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent content */}
        {posts.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Content</h2>
            <div className={styles.postsGrid}>
              {posts.map((post) => {
                const m = post.media?.[0] || {};
                return (
                  <div key={post._id} className={styles.postTile}>
                    {m.isLocked ? (
                      <div className={styles.postLocked}>
                        <FileText size={18} />
                        <span>Locked</span>
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






        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => creator?.userId?._id && navigateTo(`/messages/${creator.userId._id}`)}
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
            className={`${styles.subscribeBtn} ${subscribed ? styles.subscribedBtn : ''}`}
            onClick={handleSubscribe}
            disabled={subscribeBusy}
          >
            {subscribeBusy ? <Loader2 size={16} className={styles.spinner} /> : <Crown size={16} />}
            {subscribed ? 'Subscribed' : `Subscribe · ${selectedPlan}`}
          </button>
        </div>

        <p className={styles.footnote}>
          <Sparkles size={12} /> You're viewing {creator.displayName || creator.username}'s public profile.
        </p>
      </div>
    </div>
  );
};
