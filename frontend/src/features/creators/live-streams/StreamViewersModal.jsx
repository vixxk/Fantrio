import { useState, useEffect } from 'react';
import { Eye, X, Search, BadgeCheck } from 'lucide-react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import styles from './StreamViewersModal.module.css';

export const StreamViewersModal = ({ streamId, totalCount = 0, chatMessages = [], onClose, darkMode: propDarkMode }) => {
  const { darkMode: appDarkMode } = useApp();
  const darkMode = propDarkMode !== undefined ? propDarkMode : appDarkMode;

  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchViewers = async () => {
      try {
        if (streamId) {
          const res = await api.get(`/creators/live/${streamId}/viewers`);
          if (isMounted && res.viewers) {
            setViewers(res.viewers);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch stream viewers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchViewers();
    return () => {
      isMounted = false;
    };
  }, [streamId]);

  // Combine fetched viewers with recent chat senders to guarantee a rich list
  const combinedViewers = [...viewers];
  const existingIds = new Set(combinedViewers.map((v) => String(v._id)));

  chatMessages.forEach((msg) => {
    if (msg.userId && !existingIds.has(String(msg.userId))) {
      existingIds.add(String(msg.userId));
      combinedViewers.push({
        _id: msg.userId,
        displayName: msg.displayName || 'Fan',
        username: msg.username || '',
        avatarUrl: msg.avatarUrl || '/Girl.png',
        isVerified: false
      });
    }
  });

  const filteredViewers = combinedViewers.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.displayName && v.displayName.toLowerCase().includes(q)) ||
      (v.username && v.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`${styles.backdrop} ${!darkMode ? styles.light : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Eye size={18} className={styles.eyeIcon} />
            <h3 className={styles.title}>
              Live Viewers ({Math.max(totalCount, combinedViewers.length)})
            </h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close viewers popup">
            <X size={16} />
          </button>
        </div>

        {combinedViewers.length > 5 && (
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search viewers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingState}>Loading viewers...</div>
          ) : filteredViewers.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? 'No matching viewers found.' : 'No active viewers currently in stream.'}
            </div>
          ) : (
            filteredViewers.map((viewer) => (
              <div key={viewer._id} className={styles.row}>
                <img
                  src={viewer.avatarUrl || '/Girl.png'}
                  alt={viewer.displayName || 'Viewer'}
                  className={styles.avatar}
                />
                <div className={styles.userInfo}>
                  <div className={styles.nameLine}>
                    <span className={styles.name}>{viewer.displayName || viewer.username || 'Fan'}</span>
                    {viewer.isVerified && <BadgeCheck size={13} color="#e10075" />}
                  </div>
                  {viewer.username && <span className={styles.username}>@{viewer.username}</span>}
                </div>
                <div className={styles.watchingBadge}>
                  <span className={styles.livePulseDot} /> Watching
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
