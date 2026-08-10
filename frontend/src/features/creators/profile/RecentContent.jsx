import { useState } from 'react';
import { MessageCircle, Heart, Play, Eye, ChevronRight } from 'lucide-react';
import styles from './ProfilePage.module.css';

export const RecentContent = ({ isDark, recentContent }) => {
  const content = recentContent || { title: 'Recent Content', tabs: [], items: [] };
  const [activeTab, setActiveTab] = useState('All');

  const filteredItems = content.items.filter((item) => {
    if (activeTab === 'All' || !content.tabs.includes(activeTab)) return true;
    if (activeTab === 'Photos') return item.badge !== 'VIDEO' && item.badge !== 'STORY';
    if (activeTab === 'Videos') return item.badge === 'VIDEO';
    if (activeTab === 'Stories') return item.badge === 'STORY';
    return true;
  });

  return (
    <div className={`${styles.contentCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.contentHeader}>
        <h3 className={styles.sectionTitle}>{content.title}</h3>
        <div className={styles.contentTabs}>
          {content.tabs.map((tab) => (
            <button
              key={tab}
              className={`${styles.contentTab} ${activeTab === tab ? styles.activeContentTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className={styles.viewAllLink}>View All</button>
      </div>
      <div className={styles.contentGrid}>
        {filteredItems.map((item) => (
          <div key={item.id} className={styles.contentItem}>
            <div className={styles.contentThumb}>
              <img src={item.thumbnail} alt={item.title} className={styles.thumbImg} />
              <span
                className={styles.contentBadge}
                style={{ background: item.badgeColor }}
              >
                {item.badge}
              </span>
              {(item.badge === 'VIDEO' || item.badge === 'STORY') && (
                <div className={styles.playOverlay}>
                  <Play size={24} fill="white" />
                </div>
              )}
              <div className={styles.contentStats}>
                {item.stats && item.stats.comments !== undefined && (
                  <span className={styles.statItem}>
                    <MessageCircle size={12} /> {item.stats.comments}
                  </span>
                )}
                {item.stats && item.stats.likes !== undefined && (
                  <span className={styles.statItem}>
                    <Heart size={12} /> {item.stats.likes}
                  </span>
                )}
                {item.stats && item.stats.duration && (
                  <span className={styles.statItem}>
                    <Play size={12} /> {item.stats.duration}
                  </span>
                )}
                {item.stats && item.stats.views && (
                  <span className={styles.statItem}>
                    <Eye size={12} /> {item.stats.views}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.contentInfo}>
              <h4 className={styles.contentTitle}>{item.title}</h4>
              <span className={styles.contentTime}>{item.timestamp}</span>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No content yet.</p>
        )}
        {filteredItems.length > 0 && (
          <button className={styles.carouselNext}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
