import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Search, ChevronDown, Image, Video, Edit2, MoreVertical, ArrowLeft,
  ArrowRight, Upload, Eye, Heart, ChevronUp, Zap, BarChart2
} from 'lucide-react';
import {
  contentTabs, contentTypes, sortOptions, contentOverview,
  contentBreakdown, topPerformingContent, recentContent, pagination
} from './mockData';
import styles from './ContentPage.module.css';

export const ContentPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('Open Content');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const getTypeIcon = (type) => {
    return type === 'Video' ? <Video size={16} /> : <Image size={16} />;
  };

  const filteredContent = recentContent.filter((item) => {
    if (activeTab === 'Open Content' && item.status !== 'Open') return false;
    if (activeTab === 'Locked Content' && item.status !== 'Locked') return false;
    if (activeTab === 'Stories' && item.type !== 'Story') return false;
    if (selectedType !== 'All Types' && item.type !== selectedType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.welcomeRow}>
            <span className={styles.welcomeText}>Welcome back, Bella! 👋</span>
          </div>
          <p className={styles.welcomeSubtitle}>Here's what's happening with your content.</p>
          <h1 className={styles.pageTitle}>Content</h1>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Tabs */}
          <div className={styles.tabsRow}>
            {contentTabs.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search your content..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.toolbarRight}>
              {/* Type Dropdown */}
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.dropdownBtn}
                  onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setSortDropdownOpen(false); }}
                >
                  {selectedType} <ChevronDown size={14} />
                </button>
                {typeDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {contentTypes.map((type) => (
                      <button
                        key={type}
                        className={`${styles.dropdownItem} ${selectedType === type ? styles.dropdownItemActive : ''}`}
                        onClick={() => { setSelectedType(type); setTypeDropdownOpen(false); }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.dropdownBtn}
                  onClick={() => { setSortDropdownOpen(!sortDropdownOpen); setTypeDropdownOpen(false); }}
                >
                  {selectedSort} <ChevronDown size={14} />
                </button>
                {sortDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        className={`${styles.dropdownItem} ${selectedSort === opt ? styles.dropdownItemActive : ''}`}
                        onClick={() => { setSelectedSort(opt); setSortDropdownOpen(false); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className={styles.uploadImageBtn}>
                <Image size={14} /> Upload Image
              </button>
              <button className={styles.uploadVideoBtn}>
                <Video size={14} /> Upload Video
              </button>
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
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>
                      Date <ChevronUp size={12} className={styles.sortIcon} />
                    </th>
                    <th className={styles.th}>Views</th>
                    <th className={styles.th}>Likes</th>
                    <th className={styles.th}>Price</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((item) => (
                    <tr key={item.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        <div className={styles.contentInfo}>
                          <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                          <div className={styles.contentDetails}>
                            <span className={styles.contentTitle}>{item.title}</span>
                            <span className={styles.contentMeta}>
                              {item.type}{item.duration ? ` • ${item.duration}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.typeIcon}>{getTypeIcon(item.type)}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.statusCell}>
                          <span className={`${styles.statusBadge} ${item.status === 'Open' ? styles.statusOpen : styles.statusLocked}`}>
                            {item.status.toUpperCase()}
                          </span>
                          {item.price && <span className={styles.priceTag}>{item.price}</span>}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateTime}>{item.date}</span>
                      </td>
                      <td className={styles.td}>{item.views}</td>
                      <td className={styles.td}>{item.likes}</td>
                      <td className={styles.td}>
                        {item.price ? <span className={styles.priceValue}>{item.price}</span> : '—'}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          <button className={styles.actionBtn}><Edit2 size={14} /></button>
                          <button className={styles.actionBtn}><MoreVertical size={14} /></button>
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
                <ArrowLeft size={14} />
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
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Content Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Content Overview</h3>
              <button className={styles.periodBtn}>
                {contentOverview.period} <ChevronDown size={14} />
              </button>
            </div>
            <div className={styles.overviewGrid}>
              {contentOverview.stats.map((stat, idx) => (
                <div key={idx} className={styles.overviewStat}>
                  <span className={styles.overviewStatLabel}>{stat.label}</span>
                  <div className={styles.overviewStatRow}>
                    <span className={styles.overviewStatValue}>{stat.value}</span>
                    <span className={`${styles.overviewStatChange} ${styles.positive}`}>
                      ↑ {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Breakdown */}
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Content Breakdown</h3>
            <div className={styles.breakdownContainer}>
              <div className={styles.donutChart}>
                <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                  {(() => {
                    const circumference = 2 * Math.PI * 40;
                    let accumulatedOffset = 0;
                    return contentBreakdown.categories.map((cat, idx) => {
                      const segmentLength = (cat.percentage / 100) * circumference;
                      const dashOffset = -accumulatedOffset;
                      accumulatedOffset += segmentLength;
                      return (
                        <circle
                          key={idx}
                          cx="50" cy="50" r="40"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="14"
                          strokeDasharray={`${segmentLength} ${circumference}`}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
              <div className={styles.breakdownLegend}>
                {contentBreakdown.categories.map((cat, idx) => (
                  <div key={idx} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: cat.color }} />
                    <div className={styles.legendInfo}>
                      <span className={styles.legendLabel}>{cat.label}</span>
                      <span className={styles.legendValue}>{cat.percentage}% ({cat.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing Content */}
          <div className={styles.topCard}>
            <h3 className={styles.topTitle}>Top Performing Content</h3>
            <div className={styles.topList}>
              {topPerformingContent.map((item) => (
                <div key={item.id} className={styles.topItem}>
                  <img src={item.thumbnail} alt={item.title} className={styles.topThumb} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemTitle}>{item.title}</span>
                    <span className={styles.topItemType}>{item.type}</span>
                  </div>
                  <div className={styles.topStats}>
                    <span className={styles.topStat}><Eye size={12} /> {item.views}</span>
                    <span className={styles.topStat}><Heart size={12} /> {item.likes}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.viewAnalyticsBtn}
              onClick={() => navigateTo('/creators/analytics')}
            >
              View All Content Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
