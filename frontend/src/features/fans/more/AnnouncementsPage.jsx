import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Megaphone, Calendar, Tag, Sparkles } from 'lucide-react';
import styles from './MorePage.module.css';

export const AnnouncementsPage = ({ setStatusMsg }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/announcements');
      if (res.status === 'success') setAnnouncements(res.announcements || []);
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to load announcements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadAnnouncements();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <SkeletonGrid />;
  }

  return (
    <div className={styles.subViewGrid}>
      <div className={styles.announcementsHero}>
        <Megaphone size={120} className={styles.legalBannerWatermark} aria-hidden="true" />
        <div className={styles.legalHeroContent}>
          <h3>Official Announcements</h3>
          <p>Stay informed with the latest updates, new features, and platform improvements from Fantrio.</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className={styles.emptyBox}>
          <Megaphone size={40} className={styles.emptyIcon} />
          <p>No new platform announcements available right now. Check back soon!</p>
        </div>
      ) : (
        <div className={styles.announcementsFeed}>
          {announcements.map((a) => (
            <div key={a._id} className={styles.announcementCard}>
              <div className={styles.announcementHeader}>
                <div className={styles.announcementTagPill}>
                  <Tag size={12} /> {a.category || 'Update'}
                </div>
                <span className={styles.announcementDate}>
                  <Calendar size={12} /> {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className={styles.announcementTitle}>{a.title}</h4>
              <p className={styles.announcementBody}>{a.content}</p>
              {a.isImportant && (
                <span className={styles.importantPill}>
                  <Sparkles size={12} /> Key Update
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SkeletonGrid = () => (
  <div className={styles.subViewGrid}>
    <div className="skeleton-card" style={{ height: '140px', borderRadius: '16px' }} />
    <div className="skeleton-card" style={{ height: '100px', borderRadius: '16px' }} />
  </div>
);
