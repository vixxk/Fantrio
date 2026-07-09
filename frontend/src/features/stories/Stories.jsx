import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import styles from './Stories.module.css';

export const Stories = () => {
  const { darkMode } = useApp();
  const [stories, setStories] = useState([]);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get('/creators/stories');
        if (res.status === 'success') {
          setStories(res.stories);
        }
      } catch (err) {
        console.error('Failed to fetch stories from backend:', err);
        // Fallback mock stories if backend is offline/empty
        setStories([
          { _id: '1', displayName: 'Jessica', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80', isLive: true, isOnline: true },
          { _id: '2', displayName: 'Emily', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80', isLive: true, isOnline: true },
          { _id: '3', displayName: 'Sophia', avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80', isLive: true, isOnline: true },
          { _id: '4', displayName: 'Angelina', avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '5', displayName: 'Mia', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '6', displayName: 'Luna', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '7', displayName: 'Emmy', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '8', displayName: 'Ava', avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '9', displayName: 'Charlotte', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '10', displayName: 'Harper', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '11', displayName: 'Amelia', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', isLive: true, isOnline: true },
          { _id: '12', displayName: 'Evelyn', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '13', displayName: 'Abigail', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '14', displayName: 'Ella', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '15', displayName: 'Elizabeth', avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '16', displayName: 'Camila', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80', isLive: true, isOnline: true },
          { _id: '17', displayName: 'Scarlett', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '18', displayName: 'Victoria', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '19', displayName: 'Madison', avatarUrl: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true },
          { _id: '20', displayName: 'Grace', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80', isLive: false, isOnline: true }
        ]);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className={`${styles.storiesSection} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.storiesHeader}>
        <h2 className={styles.sectionTitle}>Stories</h2>
      </div>

      <div className={styles.storiesListContainer} ref={containerRef}>
        <div className={styles.storiesScroll}>
          {stories.map((story) => (
            <div key={story._id} className={styles.storyBubble}>
              <div className={`${styles.avatarRing} ${story.isLive ? styles.liveRing : styles.storyRing}`}>
                <img src={story.avatarUrl} alt={story.displayName} className={styles.storyAvatar} />
                {story.isLive && <span className={styles.liveBadge}>Live</span>}
                {(story.isOnline || story.isLive) && <span className={styles.onlineDot} />}
              </div>
              <span className={styles.storyName}>{story.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
