import { useEffect, useState } from 'react';
import { MoreVertical, Eye } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

export const ContentPerformance = ({ isDark, contentPerformance = [], contentTabs = ['All'] }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openDetailId, setOpenDetailId] = useState(null);

  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);
  const closeDetail = () => setOpenDetailId(null);

  // Close the kebab dropdown when clicking anywhere outside the kebab wrapper
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDetails = (id) => {
    setOpenMenuId(null);
    setOpenDetailId(id);
  };

  const getStatusClass = (status) => (status === 'OPEN' ? styles.statusOpen : styles.statusLocked);
  const getTypeClass = (type) => {
    switch (type) {
      case 'Post': return styles.typePost;
      case 'PPV': return styles.typePPV;
      case 'Stream': return styles.typeStream;
      default: return '';
    }
  };

  const tabTypeMap = { Posts: 'Post', Streams: 'Stream', PPV: 'PPV' };
  const filtered = activeTab === 'All'
    ? contentPerformance
    : contentPerformance.filter((item) => item.type === (tabTypeMap[activeTab] || activeTab));

  return (
    <div className={`${styles.contentPerformanceCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.contentHeader}>
        <h3 className={styles.contentTitle}>Top Content Performance</h3>
        <div className={styles.contentTabs}>
          {contentTabs.map((tab) => (
            <button
              key={tab}
              className={`${styles.contentTab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.contentTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Content</th>
              <th className={styles.tableHeader}>Type</th>
              <th className={styles.tableHeader}>Views</th>
              <th className={styles.tableHeader}>Likes</th>
              <th className={styles.tableHeader}>Comments</th>
              <th className={styles.tableHeader}>Revenue</th>
              <th className={styles.tableHeader}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className={styles.tableRow}>
                <td className={styles.contentCell}>
                  <div className={styles.contentInfo}>
                    <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                    <div className={styles.contentDetails}>
                      <div className={styles.contentBadges}>
                        <span className={getStatusClass(item.status)}>{item.status}</span>
                        <span className={`${styles.typeBadge} ${styles.typeBadgeMobile} ${getTypeClass(item.type)}`}>{item.type}</span>
                      </div>
                      <span className={styles.contentName}>{item.title}</span>
                      <span className={styles.contentDate}>{item.date}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.typeBadge} ${getTypeClass(item.type)}`}>{item.type}</span>
                </td>
                <td className={styles.tableCell}>{item.views}</td>
                <td className={styles.tableCell}>{item.likes}</td>
                <td className={styles.tableCell}>{item.comments}</td>
                <td className={styles.tableCell}>{item.revenue}</td>
                <td className={styles.tableCell}>
                  <div className={styles.moreBtnWrap} data-kebab-menu>
                    <button className={styles.moreBtn} onClick={() => toggleMenu(item.id)} aria-label="More actions">
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === item.id && (
                      <div className={styles.actionMenu} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.actionMenuItem} onClick={() => openDetails(item.id)}>
                          <Eye size={13} /> View Details
                        </button>
                      </div>
                    )}
                  </div>
                  {openDetailId === item.id && (
                    <>
                      <div className={styles.mobileDetailBackdrop} onClick={closeDetail} />
                      <div className={styles.mobileDetailPopup}>
                        <div className={styles.mobileDetailHeader}>
                          <span className={getStatusClass(item.status)}>{item.status}</span>
                          <span className={`${styles.typeBadge} ${getTypeClass(item.type)}`}>{item.type}</span>
                        </div>
                        <div className={styles.mobileDetailTitle}>{item.title}</div>
                        <div className={styles.mobileDetailDate}>{item.date}</div>
                        <div className={styles.mobileDetailDivider} />
                        <div className={styles.mobileDetailRow}>
                          <span className={styles.mobileDetailLabel}>Views</span>
                          <span className={styles.mobileDetailValue}>{item.views}</span>
                        </div>
                        <div className={styles.mobileDetailRow}>
                          <span className={styles.mobileDetailLabel}>Likes</span>
                          <span className={styles.mobileDetailValue}>{item.likes}</span>
                        </div>
                        <div className={styles.mobileDetailRow}>
                          <span className={styles.mobileDetailLabel}>Comments</span>
                          <span className={styles.mobileDetailValue}>{item.comments}</span>
                        </div>
                        <div className={styles.mobileDetailRow}>
                          <span className={styles.mobileDetailLabel}>Revenue</span>
                          <span className={styles.mobileDetailValue}>{item.revenue}</span>
                        </div>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
