import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useLiveStreamSocket } from '../../../hooks/useLiveStreamSocket';
import { Eye, BadgeCheck } from 'lucide-react';
import styles from './LiveStreams.module.css';

export const LiveStreams = () => {
  const { darkMode, setActiveTab } = useApp();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStreams = useCallback(async () => {
    try {
      const res = await api.get('/creators/live?availability=live');
      if (res.status === 'success') {
        setStreams(res.liveStreams || []);
      }
    } catch (err) {
      console.error('Failed to fetch streams from backend:', err);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchStreams();
    });
  }, [fetchStreams]);

  // Keep the Live Now ribbon's viewer counts fresh in real time
  useLiveStreamSocket({
    streamIds: streams.map((s) => s._id),
    onViewerUpdate: (payload) => {
      if (!payload || !payload.streamId) return;
      setStreams((prev) => prev.map((s) =>
        s._id === payload.streamId ? { ...s, viewerCount: payload.viewerCount, isLive: payload.isLive } : s
      ));
    },
    onStreamEvent: () => {
      // A stream went live or ended — refresh the ribbon
      fetchStreams();
    }
  });

  if (loading) {
    return (
      <section className={`${styles.liveSection} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.liveHeader}>
          <h2 className={styles.sectionTitle}>Live Now</h2>
        </div>
        <div className={styles.streamsScrollContainer}>
          <div className={styles.streamsScroll}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.streamCard}>
                <div className="skeleton-box skeleton-media" style={{ width: '100%', height: '100%', borderRadius: 14 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (streams.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.liveSection} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.liveHeader}>
        <h2 className={styles.sectionTitle}>Live Now</h2>
        <button className={styles.viewAllButton} onClick={() => setActiveTab('Live Streams')}>View All Live</button>
      </div>

      <div className={styles.streamsScrollContainer}>
        <div className={styles.streamsScroll}>
          {streams.map((stream) => {
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
                      <span>{stream.viewerCount || 0}</span>
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

                  <button
                    className={styles.joinButton}
                    onClick={() => setActiveTab('Live Streams')}
                  >
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
