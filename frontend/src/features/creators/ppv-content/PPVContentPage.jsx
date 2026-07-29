import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Lock, Eye, DollarSign, Flame, Image, Video,
  MoreVertical, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { ppvStats, recentPPV, ppvTabs, pagination } from './mockData';
import styles from './PPVContentPage.module.css';

const iconMap = {
  lock: Lock,
  unlock: Eye,
  dollar: DollarSign,
  flame: Flame,
};

export const PPVContentPage = () => {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('All Content');
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Stats Cards */}
      <div className={styles.statsRow}>
        {ppvStats.map((stat, idx) => {
          const Icon = iconMap[stat.icon];
          return (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
                <span
                  className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : stat.changeType === 'info' ? styles.changeInfo : styles.changeEarnings}`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Add Button (below stats) */}
      <button className={styles.mobileAddBtn}>
        <Plus size={16} />
        Add New PPV Content
      </button>

      {/* Add Button */}
      <button className={styles.addBtn}>
        <span className={styles.addBtnText}>Add New PPV Content</span>
        <span className={styles.addBtnIcon}><Plus size={16} /></span>
      </button>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <div className={styles.tabsRow}>
          <div className={styles.tabsLeft}>
            {ppvTabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.contentTable}>
            <thead>
              <tr>
                <th className={styles.th}>Content</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Price</th>
                <th className={styles.th}>Unlocks</th>
                <th className={styles.th}>Revenue</th>
                <th className={`${styles.th} ${styles.dateAddedHeader}`}>Date Added</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentPPV.map((item) => (
                <tr key={item.id} className={styles.tableRow}>
                  <td className={styles.td}>
                    <div className={styles.contentInfo}>
                      <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                      <div className={styles.contentDetails}>
                        <span className={styles.contentTitle}>{item.title}</span>
                        <span className={styles.contentMeta}>
                          {item.type} • 8:45 <span className={styles.lockedBadge}>LOCKED</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.typeCell}>
                      {item.type === 'Video' ? (
                        <Video size={16} style={{ color: '#3b82f6' }} />
                      ) : (
                        <Image size={16} style={{ color: '#10b981' }} />
                      )}
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.price}`}>{item.price}</td>
                  <td className={styles.td}>{item.unlocks}</td>
                  <td className={`${styles.td} ${styles.revenue}`}>{item.revenue}</td>
                  <td className={`${styles.td} ${styles.dateAdded}`}>{item.date}</td>
                  <td className={styles.td}>
                    <div className={styles.statusCell}>
                      <span className={styles.statusDot} />
                      <span className={styles.statusText}>{item.status}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button className={styles.editPriceBtn}>Edit Price</button>
                      <button className={styles.moreBtn}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <span className={styles.pageDots}>...</span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(pagination.totalPages)}
          >
            {pagination.totalPages}
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
