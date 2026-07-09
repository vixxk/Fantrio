import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  Phone, 
  Video, 
  MessageSquare, 
  Radio, 
  BadgeCheck, 
  Flame, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import styles from './SuggestionsSidebar.module.css';

export const SuggestionsSidebar = () => {
  const { darkMode, setActiveTab, refreshBalance } = useApp();
  const [topCreators, setTopCreators] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [suggestedCreators, setSuggestedCreators] = useState([]);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: '02',
    hours: '14',
    minutes: '35',
    seconds: '52'
  });

  // Calculate countdown
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2); // 2 days from now

    const timer = setInterval(() => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Sidebar Data
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Top Creators
      try {
        const res = await api.get('/creators/trending');
        if (res.status === 'success') {
          // Format
          const formatted = res.creators.map((c) => ({
            _id: c.userId?._id || c._id,
            displayName: c.displayName,
            username: `@${c.username}`,
            avatarUrl: c.avatarUrl,
            isVerified: c.isVerifiedBadge,
            stat: '12.5K'
          }));
          setTopCreators(formatted.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to fetch trending creators:', err);
        setTopCreators([
          { _id: '1', displayName: 'Leslie Alexander', username: '@lesliejane', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' },
          { _id: '2', displayName: 'Jenny Wilson', username: '@jennywilson', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' },
          { _id: '3', displayName: 'Kristin Watson', username: '@kristinwatson', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' },
          { _id: '4', displayName: 'Savannah Nguyen', username: '@savannah', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' },
          { _id: '5', displayName: 'Leslie Alexander', username: '@lesliejane', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' },
          { _id: '6', displayName: 'Dianne Russell', username: '@diannerussell', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', isVerified: true, stat: '12.5K' }
        ]);
      }

      // 2. Fetch Trending Hashtags
      try {
        const res = await api.get('/posts/hashtags');
        if (res.status === 'success') {
          setHashtags(res.hashtags);
        }
      } catch (err) {
        console.error('Failed to fetch hashtags:', err);
        setHashtags([
          { tag: 'hot', postCount: '12.5K posts' },
          { tag: 'bikini', postCount: '12.5K posts' },
          { tag: 'fitness', postCount: '12.5K posts' },
          { tag: 'booty', postCount: '12.5K posts' }
        ]);
      }

      // 3. Fetch Suggested Creators
      try {
        const res = await api.get('/creators/suggested');
        if (res.status === 'success') {
          const formatted = res.creators.map((c) => ({
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
        setSuggestedCreators([
          { _id: 's1', displayName: 'Savannah', username: '@savannah', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', isVerified: true },
          { _id: 's2', displayName: 'Savannah', username: '@savannah', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', isVerified: true },
          { _id: 's3', displayName: 'Savannah', username: '@savannah', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', isVerified: true },
          { _id: 's4', displayName: 'Savannah', username: '@savannah', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', isVerified: true }
        ]);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (creatorId) => {
    try {
      const res = await api.post(`/monetization/subscribe/${creatorId}`);
      if (res.status === 'success') {
        alert('Subscribed successfully!');
        refreshBalance();
      }
    } catch (err) {
      alert('Subscription failed: ' + err.message);
    }
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
          {topCreators.map((creator, i) => (
            <div key={creator._id} className={styles.creatorRow}>
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
          ))}
        </div>
      </div>

      {/* 4. Trending Hashtags */}
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionHeading}>Trending Hastags</h4>
        </div>
        <div className={styles.hashtagList}>
          {hashtags.map((h, i) => (
            <div key={i} className={styles.hashtagRow}>
              <span className={styles.hashtagName}>#{h.tag}</span>
              <span className={styles.hashtagCount}>{h.postCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Suggested For You */}
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionHeading}>Suggested For You</h4>
          <button className={styles.linkButton} onClick={() => setActiveTab('All Creators')}>View All</button>
        </div>
        <div className={styles.suggestedList}>
          {suggestedCreators.map((c) => (
            <div key={c._id} className={styles.suggestedRow}>
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
                onClick={() => handleSubscribe(c._id)}
              >
                <span className={styles.subscribeBtnText}>Subscribe</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};
