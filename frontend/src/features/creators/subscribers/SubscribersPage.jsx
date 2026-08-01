import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Users, UserPlus, UserMinus, DollarSign, Search, Filter, ChevronDown, ChevronUp,
  Eye, MessageSquare, MoreVertical, ArrowLeft, ArrowRight, Download
} from 'lucide-react';
import {
  subscriberTabs, subscriberStats, subscribers, subscribersOverview,
  planBreakdown, topSubscribers, engagementInsights, pagination
} from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './SubscribersPage.module.css';

const iconMap = {
  Users, UserPlus, UserMinus, DollarSign,
};

export const SubscribersPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('All Subscribers');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Renewal Date');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleSubscribers, setVisibleSubscribers] = useState(10);

  const filteredSubscribers = subscribers.filter((sub) => {
    if (activeTab === 'Active' && sub.status !== 'Active') return false;
    if (activeTab === 'Expiring Soon' && sub.status !== 'Expiring Soon') return false;
    if (activeTab === 'Expired' && sub.status !== 'Expired') return false;
    if (activeTab === 'Cancelled' && sub.status !== 'Cancelled') return false;
    if (searchQuery && !sub.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !sub.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const displayedSubscribers = filteredSubscribers.slice(0, visibleSubscribers);
  const hasMoreSubscribers = visibleSubscribers < filteredSubscribers.length;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return styles.statusActive;
      case 'Expiring Soon': return styles.statusExpiring;
      case 'Expired': return styles.statusExpired;
      case 'Cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>


      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {subscriberStats.map((stat, idx) => {
              const Icon = iconMap[stat.icon];
              return (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <span className={styles.statValue}>{stat.value}</span>
                    <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : styles.negative}`}>
                      {stat.changeType === 'positive' ? '↑' : '↓'} {stat.change} <span className={styles.changePeriod}>vs last 30 days</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Tabs */}
          <div className={styles.tabsRow}>
            {subscriberTabs.map((tab) => (
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
                placeholder="Search subscribers..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.toolbarRight}>
              <button className={styles.filterBtn}>
                <Filter size={14} /> Filter
              </button>
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.dropdownBtn}
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                >
                  <span className={styles.sortLabel}>Sort by:</span> {selectedSort} <ChevronDown size={14} />
                </button>
                {sortDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {['Renewal Date', 'Newest First', 'Most Spent', 'Plan Type'].map((opt) => (
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
            </div>
          </div>

          {/* Subscribers Table */}
          <div className={styles.tableCard}>
            {/* Desktop Table */}
            <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
              <table className={styles.contentTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Subscriber</th>
                    <th className={styles.th}>Plan</th>
                    <th className={styles.th}>Renewal Date</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Total Spent</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubscribers.map((sub) => (
                    <tr key={sub.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        <div className={styles.subscriberInfo}>
                          <img src={sub.avatar} alt={sub.name} className={styles.subscriberAvatar} />
                          <div className={styles.subscriberDetails}>
                            <span className={styles.subscriberName}>{sub.name}</span>
                            <span className={styles.subscriberUsername}>{sub.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.planBadge} style={{ background: `${sub.planColor}20`, color: sub.planColor }}>
                          <span>{sub.plan}</span>
                          <span className={styles.planPriceLine}>{sub.planPrice}</span>
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.renewalDate}>{sub.renewalDate}</span>
                        <span className={styles.renewalDays}>{sub.daysUntilRenewal}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.spentValue}>{sub.totalSpent}</span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          <button className={styles.actionBtn} title="View Profile"><Eye size={14} /></button>
                          <button className={styles.actionBtn} title="Send Message"><MessageSquare size={14} /></button>
                          <button className={styles.actionBtn} title="More Options"><MoreVertical size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className={`${styles.mobileCards} ${styles.showMobile}`}>
              {displayedSubscribers.map((sub) => (
                <div key={sub.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardTop}>
                    <img src={sub.avatar} alt={sub.name} className={styles.mobileCardImage} />
                    <div className={styles.mobileCardContent}>
                      <div className={styles.mobileCardTitleRow}>
                        <span className={styles.mobileCardName}>{sub.name}</span>
                        <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      <span className={styles.mobileCardUsername}>{sub.username}</span>
                      <div className={styles.mobileCardFooter}>
                        <span className={styles.mobileRenewal}>{sub.renewalDate}</span>
                        <span className={styles.mobilePriceTag} style={{ color: sub.planColor }}>{sub.planPrice}</span>
                        <div className={styles.mobileActions}>
                          <button className={styles.actionBtn}><Eye size={13} /></button>
                          <button className={styles.actionBtn}><MessageSquare size={13} /></button>
                          <button className={styles.actionBtn}><MoreVertical size={13} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

          {/* Subscribers Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Subscribers Overview</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.growthSection}>
              <span className={styles.growthLabel}>Growth</span>
              <div className={styles.growthRow}>
                <span className={styles.growthValue}>{subscribersOverview.total}</span>
                <span className={`${styles.growthChange} ${subscribersOverview.changeType === 'positive' ? styles.positive : styles.negative}`}>
                  ↑ {subscribersOverview.change}
                </span>
              </div>
            </div>
            <div className={styles.miniChart}>
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" className={styles.chartSvg}>
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#e10075" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#e10075" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const data = subscribersOverview.chartData;
                  const values = data.map(d => d.value);
                  const minVal = Math.min(...values);
                  const maxVal = Math.max(...values);
                  const range = maxVal - minVal || 1;
                  const width = 200;
                  const height = 60;
                  const paddingY = 5;
                  const points = data.map((d, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
                    return { x, y };
                  });
                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
                  return (
                    <>
                      <path d={areaPath} fill="url(#chartGradient)" />
                      <path d={linePath} fill="none" stroke="#e10075" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}
              </svg>
              <div className={styles.chartLabels}>
                {subscribersOverview.chartData.map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>Plan Breakdown</h3>
            <div className={styles.breakdownBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    {(() => {
                      const circumference = 2 * Math.PI * 40;
                      let accumulatedOffset = 0;
                      return planBreakdown.categories.map((cat, idx) => {
                        const segmentLength = (cat.percentage / 100) * circumference;
                        const dashOffset = -accumulatedOffset;
                        accumulatedOffset += segmentLength;
                        return (
                          <circle
                            key={idx}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="12"
                            strokeDasharray={`${segmentLength} ${circumference}`}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                          />
                        );
                      });
                    })()}
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{planBreakdown.total}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Subscribers</text>
                  </svg>
                </div>
              </div>
              <div className={styles.breakdownLegend}>
                {planBreakdown.categories.map((cat, idx) => (
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

          {/* Engagement Insights */}
          <div className={styles.insightsCard}>
            <div className={styles.insightsHeader}>
              <h3 className={styles.insightsTitle}>Engagement Insights</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.insightsList}>
              {engagementInsights.map((insight, idx) => (
                <div key={idx} className={styles.insightItem}>
                  <span className={styles.insightLabel}>{insight.label}</span>
                  <div className={styles.insightRow}>
                    <span className={styles.insightValue}>{insight.value}</span>
                    <span className={`${styles.insightChange} ${insight.changeType === 'positive' ? styles.positive : styles.negative}`}>
                      ↑ {insight.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Subscribers */}
          <div className={styles.topCard}>
            <div className={styles.topHeader}>
              <h3 className={styles.topTitle}>Top Subscribers</h3>
              <button className={styles.viewAllLink}>View All</button>
            </div>
            <div className={styles.topList}>
              {topSubscribers.map((sub, idx) => (
                <div key={sub.id} className={styles.topItem}>
                  <span className={styles.topRank}>{idx + 1}</span>
                  <img src={sub.avatar} alt={sub.name} className={styles.topAvatar} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemName}>{sub.name}</span>
                    <span className={styles.topItemUsername}>{sub.username}</span>
                  </div>
                  <span className={styles.topSpent}>{sub.spent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
