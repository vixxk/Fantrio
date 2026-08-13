import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../components/Toast/Toast';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { BadgeCheck } from 'lucide-react';
import styles from './SuggestionsSidebar.module.css';

const formatFollowers = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

export const SuggestionsSidebar = () => {
  const { darkMode, setActiveTab, refreshBalance, navigateTo } = useApp();
  const { toast } = useToast();
  const [topCreators, setTopCreators] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer state (computed, never hardcoded)
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  // Calculate countdown from a fixed target 2 days ahead
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2); // 2 days from now

    let timer = null;
    const tick = () => {
      const difference = targetDate.getTime() - Date.now();

      if (difference <= 0) {
        if (timer) clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
        minutes: String(Math.floor((difference / (1000 * 60)) % 60)).padStart(2, '0'),
        seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0')
      });
    };

    tick(); // render the real countdown immediately (no hardcoded placeholder)
    timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Sidebar Data (both sections load in parallel)
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        // 1. Fetch Top Creators
        (async () => {
          try {
            const res = await api.get('/creators/trending?limit=6');
            if (res.status === 'success') {
              const formatted = (res.creators || []).map((c) => ({
                _id: c.userId?._id || c._id,
                displayName: c.displayName,
                username: `@${c.username}`,
                avatarUrl: c.avatarUrl,
                isVerified: c.isVerifiedBadge,
                stat: formatFollowers(c.followerCount)
              }));
              setTopCreators(formatted.slice(0, 6));
            }
          } catch (err) {
            console.error('Failed to fetch trending creators:', err);
            setTopCreators([]);
          }
        })(),
        // 2. Fetch Suggested Creators
        (async () => {
          try {
            const res = await api.get('/creators/suggested');
            if (res.status === 'success') {
              const formatted = (res.creators || []).map((c) => ({
                _id: c.userId?._id || c._id,
                displayName: c.displayName,
                username: `@${c.username}`,
                avatarUrl: c.avatarUrl,
                isVerified: c.isVerifiedBadge
              }));
              setSuggestedCreators(formatted.slice(0, 4));
            }
          } catch (err) {
            console.error('Failed to fetch suggested creators:', err);
            setSuggestedCreators([]);
          }
        })()
      ]);
    };

    fetchData().finally(() => setLoading(false));
  }, []);

  const handleCreatorClick = (rawUsername) => {
    const cleanUsername = rawUsername ? rawUsername.replace(/^@/, '') : '';
    if (cleanUsername) {
      navigateTo(`/creator/${cleanUsername}`);
    }
  };

  const handleSubscribe = (creator) => {
    handleCreatorClick(creator.username);
  };

  const handleBuyPromo = () => {
    setActiveTab('Buy Coins');
  };

  return (
    <aside className={`${styles.sidebar} ${darkMode ? styles.dark : styles.light}`}>
      
      {/* 1. Double Coins Weekend Promo Card */}
      <div className={styles.doublePromoCard}>
        <div className={styles.promoHeader}>
          <div className={styles.promoText}>
            <h3 className={styles.promoTitle}>Double Coins Weekend!</h3>
            <p className={styles.promoSubtitle}>Buy coins and get 20% extra coins!</p>
          </div>
          <img src="/Gift & Coins.png" alt="Promo pile" className={styles.promoImg} />
        </div>
        <div className={styles.countdownContainer}>
          <div className={styles.countdownBox}>
            <span className={styles.countdownVal}>{timeLeft.days}</span>
            <span className={styles.countdownLabel}>DAYS</span>
          </div>
          <div className={styles.countdownBox}>
            <span className={styles.countdownVal}>{timeLeft.hours}</span>
            <span className={styles.countdownLabel}>HRS</span>
          </div>
          <div className={styles.countdownBox}>
            <span className={styles.countdownVal}>{timeLeft.minutes}</span>
            <span className={styles.countdownLabel}>MINS</span>
          </div>
          <div className={styles.countdownBox}>
            <span className={styles.countdownVal}>{timeLeft.seconds}</span>
            <span className={styles.countdownLabel}>SECS</span>
          </div>
        </div>
        <button className={styles.buyNowBtn} onClick={handleBuyPromo}>
          Buy Now
        </button>
      </div>

      {/* 2. Quick Actions */}
      <div className={styles.sectionContainer}>
        <h4 className={styles.sectionHeading}>Quick Actions</h4>
        <div className={styles.quickActionsGrid}>
          <button className={styles.actionBtn} onClick={() => setActiveTab('1:1 Audio Calls')}>
            <div className={`${styles.actionIconWrapper} ${styles.audioBg}`}>
              <img src="/audio.png" alt="Audio Call" className={styles.actionIconImg} />
            </div>
            <span className={styles.actionLabel}>Audio Call</span>
          </button>

          <button className={styles.actionBtn} onClick={() => setActiveTab('1:1 Video Calls')}>
            <div className={`${styles.actionIconWrapper} ${styles.videoBg}`}>
              <img src="/video.png" alt="Video Call" className={styles.actionIconImg} />
            </div>
            <span className={styles.actionLabel}>Video Call</span>
          </button>

          <button className={styles.actionBtn} onClick={() => setActiveTab('Messages')}>
            <div className={`${styles.actionIconWrapper} ${styles.msgBg}`}>
              <img src="/message.png" alt="Messages" className={styles.actionIconImg} />
            </div>
            <span className={styles.actionLabel}>Messages</span>
          </button>

          <button className={styles.actionBtn} onClick={() => setActiveTab('Live Streams')}>
            <div className={`${styles.actionIconWrapper} ${styles.liveBg}`}>
              <img src="/live.png" alt="Live Streams" className={styles.actionIconImg} />
            </div>
            <span className={styles.actionLabel}>Live Streams</span>
          </button>
        </div>
      </div>

      {/* 3. Top Creators */}
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionHeading}>Top Creators</h4>
          <button className={styles.linkButton} onClick={() => setActiveTab('All Creators')}>View All</button>
        </div>
        <div className={styles.creatorList}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <ShimmerSkeleton variant="text" width="14px" height="12px" light={!darkMode} />
                  <ShimmerSkeleton variant="avatar" width="36px" height="36px" light={!darkMode} />
                  <div className={styles.skeletonTextCol}>
                    <ShimmerSkeleton variant="text" width="90px" height="12px" light={!darkMode} />
                    <ShimmerSkeleton variant="text" width="60px" height="10px" light={!darkMode} />
                  </div>
                </div>
              ))}
            </div>
          ) : topCreators.length > 0 ? topCreators.map((creator, i) => (
            <div
              key={creator._id}
              className={styles.creatorRow}
              onClick={() => handleCreatorClick(creator.username)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.creatorDetails}>
                <span className={styles.rankNum}>{i + 1}</span>
                <img src={creator.avatarUrl} alt={creator.displayName} className={styles.avatar} />
                <div className={styles.nameBlock}>
                  <div className={styles.nameLock}>
                    <span className={styles.displayName}>{creator.displayName}</span>
                    {creator.isVerified && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                  </div>
                  <span className={styles.username}>{creator.username}</span>
                </div>
              </div>
              <span className={styles.statVal}>{creator.stat}</span>
            </div>
          )) : (
            <p className={styles.emptyList}>No creators to show yet.</p>
          )}
        </div>
      </div>

      {/* 4. Suggested For You */}
      <div className={styles.sectionContainer}>
        <h4 className={styles.sectionHeading}>Suggested For You</h4>
        <div className={styles.suggestedList}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <ShimmerSkeleton variant="avatar" width="36px" height="36px" light={!darkMode} />
                  <div className={styles.skeletonTextCol}>
                    <ShimmerSkeleton variant="text" width="90px" height="12px" light={!darkMode} />
                    <ShimmerSkeleton variant="text" width="60px" height="10px" light={!darkMode} />
                  </div>
                  <ShimmerSkeleton variant="chip" width="76px" height="28px" light={!darkMode} />
                </div>
              ))}
            </div>
          ) : suggestedCreators.length > 0 ? suggestedCreators.map((c) => (
            <div
              key={c._id}
              className={styles.suggestedRow}
              onClick={() => handleCreatorClick(c.username)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.suggestedCreator}>
                <img src={c.avatarUrl} alt={c.displayName} className={styles.avatar} />
                <div className={styles.nameBlock}>
                  <div className={styles.nameLock}>
                    <span className={styles.displayName}>{c.displayName}</span>
                    {c.isVerified && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                  </div>
                  <span className={styles.username}>{c.username}</span>
                </div>
              </div>
              <button
                className={styles.subscribeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe(c);
                }}
              >
                <span className={styles.subscribeBtnText}>Subscribe</span>
              </button>
            </div>
          )) : (
            <p className={styles.emptyList}>No suggestions right now.</p>
          )}
        </div>
      </div>

    </aside>
  );
};
