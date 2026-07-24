import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { Eye, BadgeCheck } from 'lucide-react';
import styles from './LiveStreams.module.css';

export const LiveStreams = () => {
  const { darkMode, setActiveTab } = useApp();
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await api.get('/creators/live');
        if (res.status === 'success') {
          setStreams(res.liveStreams || []);
        }
      } catch (err) {
        console.error('Failed to fetch streams from backend:', err);
        setStreams([
          {
            _id: '1',
            displayName: 'Molly Jane',
            username: '@mollyjane',
            viewerCount: '862',
            coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '2',
            displayName: 'Leslie Alexander',
            username: '@lesliealexander',
            viewerCount: '712',
            coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '3',
            displayName: 'Jenny Wilson',
            username: '@jennywilson',
            viewerCount: '524',
            coverUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '4',
            displayName: 'Kristin Watson',
            username: '@kristinwatson',
            viewerCount: '342',
            coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '5',
            displayName: 'Savanna',
            username: '@savanna',
            viewerCount: '432',
            coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '6',
            displayName: 'Charlotte',
            username: '@charlotte',
            viewerCount: '310',
            coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '7',
            displayName: 'Harper Live',
            username: '@harper_live',
            viewerCount: '290',
            coverUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '8',
            displayName: 'Amelia Star',
            username: '@amelia_star',
            viewerCount: '280',
            coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '9',
            displayName: 'Evelyn Game',
            username: '@evelyn_game',
            viewerCount: '210',
            coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          },
          {
            _id: '10',
            displayName: 'Grace VIP',
            username: '@grace_vip',
            viewerCount: '195',
            coverUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
            isVerified: true
          }
        ]);
      }
    };

    fetchStreams();
  }, []);

  const dataList = (streams && streams.length > 0) ? streams : [];

  return (
    <section className={`${styles.liveSection} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.liveHeader}>
        <h2 className={styles.sectionTitle}>Live Now</h2>
        <button className={styles.viewAllButton} onClick={() => setActiveTab('Live Streams')}>View All Live</button>
      </div>

      <div className={styles.streamsScrollContainer}>
        <div className={styles.streamsScroll}>
          {dataList.map((stream) => {
            return (
              <div key={stream._id} className={styles.streamCard}>
                <div 
                  className={styles.cardBackground} 
                  style={{ backgroundImage: `url(${stream.coverUrl})` }}
                >
                  {/* Overlay Top */}
                  <div className={styles.cardHeader}>
                    <span className={styles.liveTag}>
                      NEW
                    </span>
                    <div className={styles.viewerBadge}>
                      <Eye size={12} />
                      <span>{stream.viewerCount}</span>
                    </div>
                  </div>

                {/* Overlay Bottom */}
                <div className={styles.cardFooter}>
                  <div className={styles.creatorInfo}>
                    <div className={styles.nameContainer}>
                      <span className={styles.displayName}>{stream.displayName}</span>
                      {stream.isVerified && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                    </div>
                    <span className={styles.username}>
                      {stream.username && (stream.username.startsWith('@') ? stream.username : `@${stream.username}`)}
                    </span>
                  </div>

                  <button className={styles.joinButton}>
                    Join Stream
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
