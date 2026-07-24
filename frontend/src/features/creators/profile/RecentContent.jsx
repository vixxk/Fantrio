import React, { useState } from 'react';
import { MessageCircle, Heart, Play, Eye, ChevronRight } from 'lucide-react';
import { recentContent } from './mockData';
import styles from './ProfilePage.module.css';

export const RecentContent = ({ isDark }) => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className={`${styles.contentCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.contentHeader}>
        <h3 className={styles.sectionTitle}>{recentContent.title}</h3>
        <div className={styles.contentTabs}>
          {recentContent.tabs.map((tab) => (
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
        {recentContent.items.map((item) => (
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
                {item.stats.comments !== undefined && (
                  <span className={styles.statItem}>
                    <MessageCircle size={12} /> {item.stats.comments}
                  </span>
                )}
                {item.stats.likes !== undefined && (
                  <span className={styles.statItem}>
                    <Heart size={12} /> {item.stats.likes}
                  </span>
                )}
                {item.stats.duration && (
                  <span className={styles.statItem}>
                    <Play size={12} /> {item.stats.duration}
                  </span>
                )}
                {item.stats.views && (
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
        <button className={styles.carouselNext}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
