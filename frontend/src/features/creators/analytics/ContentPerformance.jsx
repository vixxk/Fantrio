import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { contentPerformance, contentTabs } from './mockData';
import styles from './AnalyticsPage.module.css';

export const ContentPerformance = ({ isDark }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [openDetailId, setOpenDetailId] = useState(null);

  const toggleDetail = (id) => {
    setOpenDetailId(openDetailId === id ? null : id);
  };

  const closeDetail = () => setOpenDetailId(null);

  const getStatusClass = (status) => {
    return status === 'OPEN' ? styles.statusOpen : styles.statusLocked;
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'Post': return styles.typePost;
      case 'PPV': return styles.typePPV;
      case 'Stream': return styles.typeStream;
      default: return '';
    }
  };

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
              <th className={styles.tableHeader}>Conversion</th>
              <th className={styles.tableHeader}></th>
            </tr>
          </thead>
          <tbody>
            {contentPerformance.map((item) => (
              <tr key={item.id} className={styles.tableRow}>
                <td className={styles.contentCell}>
                  <div className={styles.contentInfo}>
                    <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                    <div className={styles.contentDetails}>
                      <span className={getStatusClass(item.status)}>{item.status}</span>
                      <span className={styles.contentName}>{item.title}</span>
                      <span className={styles.contentDate}>{item.date}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.typeBadge} ${getTypeClass(item.type)}`}>
                    {item.type}
                  </span>
                </td>
                <td className={styles.tableCell}>{item.views}</td>
                <td className={styles.tableCell}>{item.likes}</td>
                <td className={styles.tableCell}>{item.comments}</td>
                <td className={styles.tableCell}>{item.revenue}</td>
                <td className={styles.tableCell}>{item.conversion}</td>
                <td className={styles.tableCell}>
                  <div className={styles.moreBtnWrap}>
                    <button className={styles.moreBtn} onClick={() => toggleDetail(item.id)}>
                      <MoreVertical size={16} />
                    </button>
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
                          <div className={styles.mobileDetailRow}>
                            <span className={styles.mobileDetailLabel}>Conversion</span>
                            <span className={styles.mobileDetailValue}>{item.conversion}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
