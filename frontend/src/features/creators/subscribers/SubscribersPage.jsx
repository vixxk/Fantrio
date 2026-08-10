import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Users, UserPlus, UserMinus, DollarSign, Search, SlidersHorizontal, ChevronDown,
  Eye, MessageSquare, ArrowLeft, ArrowRight, Ban
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { SubscriberFiltersSheet } from './SubscriberFiltersSheet';
import {
  DEFAULT_SUBSCRIBER_FILTERS,
  countActiveSubscriberFilters,
  buildSubscriberQuery,
} from './subscriberFilters';
import styles from './SubscribersPage.module.css';

const iconMap = {
  Users, UserPlus, UserMinus, DollarSign,
};

const PLAN_COLORS = { Basic: '#10b981', Premium: '#3b82f6', VIP: '#f59e0b' };

const STATUS_LABELS = { active: 'Active', expiring: 'Expiring Soon', expired: 'Expired', cancelled: 'Cancelled' };

const STATUS_TABS = [
  { key: 'all', label: 'All Subscribers' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = ['Renewal Date', 'Newest First', 'Most Spent', 'Plan Type'];

const formatDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString(undefined, opts) : '—';

export const SubscribersPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [filters, setFilters] = useState(DEFAULT_SUBSCRIBER_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Renewal Date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [period, setPeriod] = useState('All Time');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    target: blockTarget,
    open: openBlock,
    close: closeBlock,
    confirm: confirmBlock,
    deleting: blocking,
  } = useConfirmDelete({
    onConfirm: (sub) => {
      if (!sub.userId) return null;
      return api.post(`/block/${sub.userId}`);
    },
    successMessage: 'Subscriber blocked successfully.',
    errorMessage: 'Failed to block subscriber. Please try again.',
    onSuccess: () => fetchSubscribers(),
  });

  const activeTab = STATUS_TABS.find((t) => t.key === filters.status)?.label || 'All Subscribers';
  const activeFilterCount = countActiveSubscriberFilters(filters);
  const sortParam = selectedSort === 'Newest First' ? 'newest'
    : selectedSort === 'Most Spent' ? 'spent'
      : selectedSort === 'Plan Type' ? 'plan'
        : 'renewal';

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildSubscriberQuery(filters);
      params.set('sort', sortParam);
      params.set('page', String(currentPage));
      params.set('limit', '10');
      params.set('period', period);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await api.get(`/creators/subscribers?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, sortParam, currentPage, searchQuery, period]);

  useEffect(() => {
    Promise.resolve().then(() => fetchSubscribers());
  }, [fetchSubscribers]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchSubscribers();
    }, 400);
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Live count shown inside the filter sheet while editing draft filters
  const getResultCount = useCallback(async (draft) => {
    try {
      const params = buildSubscriberQuery(draft);
      params.set('sort', sortParam);
      params.set('page', '1');
      params.set('limit', '1');
      params.set('period', period);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await api.get(`/creators/subscribers?${params.toString()}`);
      return res?.pagination?.total ?? null;
    } catch (err) {
      return null;
    }
  }, [sortParam, period, searchQuery]);

  const handleTabClick = (key) => {
    setFilters((prev) => ({ ...prev, status: key }));
    setCurrentPage(1);
  };

  const handleApplyFilters = (next) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_SUBSCRIBER_FILTERS);
    setCurrentPage(1);
  };

  const subscribers = data?.subscribers || [];
  const stats = data?.stats || { active: 0, expiring: 0, expired: 0, cancelled: 0, mrr: 0, newThisMonth: 0 };
  const overview = data?.overview || { total: 0, chartData: [] };
  const planBreakdown = data?.planBreakdown || { total: 0, categories: [] };
  const topSubscribers = data?.topSubscribers || [];
  const engagementInsights = data?.engagementInsights || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  const subscriberStats = [
    { label: 'Active Subscribers', value: String(stats.active), change: '', changeType: 'positive', icon: 'Users', color: '#10b981' },
    { label: 'Monthly Recurring Revenue', value: String(stats.mrr), change: '', changeType: 'positive', icon: 'DollarSign', color: '#3b82f6' },
    { label: 'New Subscribers', value: String(stats.newThisMonth), change: '', changeType: 'positive', icon: 'UserPlus', color: '#9b51e0' },
    { label: 'Cancelled', value: String(stats.cancelled), change: '', changeType: 'negative', icon: 'UserMinus', color: '#ef4444' },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return styles.statusActive;
      case 'expiring': return styles.statusExpiring;
      case 'expired': return styles.statusExpired;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const statusLabel = (status) => STATUS_LABELS[status] || status;

  const renewalText = (days) => {
    if (!days && days !== 0) return '';
    if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
    if (days === 0) return 'Today';
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  };

  const pageNums = [];
  for (let p = 1; p <= pagination.totalPages && p <= 5; p++) pageNums.push(p);

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
                    {stat.change && (
                      <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : styles.negative}`}>
                        {stat.changeType === 'positive' ? '↑' : '↓'} {stat.change} <span className={styles.changePeriod}>vs last 30 days</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Tabs */}
          <div className={styles.tabsRow}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.label ? styles.activeTab : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
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
              <button
                className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
                onClick={() => setFilterSheetOpen(true)}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && <span className={styles.filterBtnBadge}>{activeFilterCount}</span>}
              </button>
              <div className={styles.dropdownWrapper} ref={sortRef}>
                <button
                  className={styles.dropdownBtn}
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                >
                  <span className={styles.sortLabel}>Sort by:</span> {selectedSort} <ChevronDown size={14} />
                </button>
                {sortDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        className={`${styles.dropdownItem} ${selectedSort === opt ? styles.dropdownItemActive : ''}`}
                        onClick={() => { setSelectedSort(opt); setSortDropdownOpen(false); setCurrentPage(1); }}
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                    <ShimmerSkeleton variant="avatar" width="40px" height="40px" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <ShimmerSkeleton variant="text" width="45%" height="12px" />
                      <ShimmerSkeleton variant="text" width="30%" height="10px" />
                    </div>
                    <ShimmerSkeleton variant="chip" width="60px" height="22px" />
                    <ShimmerSkeleton variant="text" width="50px" height="12px" />
                    <ShimmerSkeleton variant="text" width="60px" height="12px" />
                    <ShimmerSkeleton variant="circle" width="28px" height="28px" />
                  </div>
                ))}
              </div>
            ) : subscribers.length === 0 ? (
              <div className={styles.emptyContainer}>
                <p className={styles.emptyText}>No subscribers found.</p>
                {activeFilterCount > 0 && (
                  <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
                  <table className={styles.contentTable}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Subscriber</th>
                        <th className={`${styles.th} ${styles.planTh}`}>Plan</th>
                        <th className={styles.th}>Renewal Date</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Total Spent</th>
                        <th className={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub._id} className={styles.tableRow}>
                          <td className={styles.td}>
                            <div className={styles.subscriberInfo}>
                              <img src={sub.avatar} alt={sub.name} className={styles.subscriberAvatar} />
                              <div className={styles.subscriberDetails}>
                                <span className={styles.subscriberName}>{sub.name}</span>
                                <span className={styles.subscriberUsername}>@{sub.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.planBadge} style={{ background: `${PLAN_COLORS[sub.plan] || '#7e00f3'}20`, color: PLAN_COLORS[sub.plan] || '#7e00f3' }}>
                              <span>{sub.plan}</span>
                              <span className={styles.planPriceLine}>{sub.planPrice} coins</span>
                            </span>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.renewalDate}>{formatDate(sub.renewalDate)}</span>
                            <span className={styles.renewalDays}>{renewalText(sub.daysUntilRenewal)}</span>
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                              {statusLabel(sub.status)}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.spentValue}>
                              <img src="/coin.png" alt="Coin" style={{ width: 12, height: 12, objectFit: 'contain', verticalAlign: 'middle', marginRight: 3 }} />
                              {sub.totalSpentCoins}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.actions}>
                              <button className={styles.actionBtn} title="View Profile" onClick={() => navigateTo('/creators/profile')}><Eye size={14} /></button>
                              <button className={styles.actionBtn} title="Send Message" onClick={() => navigateTo(`/creators/messages/${sub.userId}`)}><MessageSquare size={14} /></button>
                              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Block Subscriber" onClick={() => openBlock(sub)}><Ban size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className={`${styles.mobileCards} ${styles.showMobile}`}>
                  {subscribers.map((sub) => (
                    <div key={sub._id} className={styles.mobileCard}>
                      <div className={styles.mobileCardTop}>
                        <img src={sub.avatar} alt={sub.name} className={styles.mobileCardImage} />
                        <div className={styles.mobileCardContent}>
                          <div className={styles.mobileCardTitleRow}>
                            <span className={styles.mobileCardName}>{sub.name}</span>
                            <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                              {statusLabel(sub.status)}
                            </span>
                          </div>
                          <span className={styles.mobileCardUsername}>@{sub.username}</span>
                          <div className={styles.mobileCardFooter}>
                            <span className={styles.mobileRenewal}>{formatDate(sub.renewalDate)}</span>
                            <span className={styles.mobilePriceTag} style={{ color: PLAN_COLORS[sub.plan] || '#7e00f3' }}>{sub.planPrice} coins</span>
                            <div className={styles.mobileActions}>
                              <button className={styles.actionBtn} onClick={() => navigateTo('/creators/profile')}><Eye size={13} /></button>
                              <button className={styles.actionBtn} onClick={() => navigateTo(`/creators/messages/${sub.userId}`)}><MessageSquare size={13} /></button>
                              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Block Subscriber" onClick={() => openBlock(sub)}><Ban size={13} /></button>
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
                  {pageNums.map((page) => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  {pagination.totalPages > 5 && <span className={styles.pageDots}>...</span>}
                  {pagination.totalPages > 5 && (
                    <button
                      className={`${styles.pageBtn} ${currentPage === pagination.totalPages ? styles.pageBtnActive : ''}`}
                      onClick={() => setCurrentPage(pagination.totalPages)}
                    >
                      {pagination.totalPages}
                    </button>
                  )}
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>

          {/* Subscribers Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Subscribers Overview</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.growthSection}>
              <span className={styles.growthLabel}>Growth</span>
              <div className={styles.growthRow}>
                <span className={styles.growthValue}>{overview.total}</span>
                <span className={styles.growthChange}>{stats.active + stats.expiring} active</span>
              </div>
            </div>
            {overview.chartData && overview.chartData.length > 1 ? (
              <div className={styles.miniChart}>
                <svg viewBox="0 0 200 60" preserveAspectRatio="none" className={styles.chartSvg}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e10075" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#e10075" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const data = overview.chartData;
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
                  {overview.chartData.map((d, i) => (
                    <span key={i}>{d.label}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.chartLabels}><span>No growth data yet</span></div>
            )}
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
                      return planBreakdown.categories.reduce((acc, cat, idx) => {
                        const segmentLength = (cat.percentage / 100) * circumference;
                        const dashOffset = -acc.offset;
                        acc.offset += segmentLength;
                        acc.segments.push(
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
                        return acc;
                      }, { offset: 0, segments: [] }).segments;
                    })()}
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{planBreakdown.total}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Active Subs</text>
                  </svg>
                </div>
              </div>
              <div className={styles.breakdownLegend}>
                {planBreakdown.categories.length === 0 ? (
                  <div className={styles.legendLabel}>No active plans</div>
                ) : planBreakdown.categories.map((cat, idx) => (
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
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.insightsList}>
              {engagementInsights.length === 0 ? (
                <div className={styles.legendLabel}>No data yet</div>
              ) : engagementInsights.map((insight, idx) => (
                <div key={idx} className={styles.insightItem}>
                  <span className={styles.insightLabel}>{insight.label}</span>
                  <div className={styles.insightRow}>
                    <span className={styles.insightValue}>{insight.value}</span>
                    <span className={`${styles.insightChange} ${insight.changeType === 'positive' ? styles.positive : styles.negative}`}>
                      {insight.changeType === 'positive' ? '↑' : '↓'} {insight.change}
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
            </div>
            <div className={styles.topList}>
              {topSubscribers.length === 0 ? (
                <div className={styles.legendLabel}>No subscribers yet</div>
              ) : topSubscribers.map((sub, idx) => (
                <div key={sub.id || idx} className={styles.topItem}>
                  <span className={styles.topRank}>{idx + 1}</span>
                  <img src={sub.avatar} alt={sub.name} className={styles.topAvatar} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemName}>{sub.name}</span>
                    <span className={styles.topItemUsername}>@{sub.username}</span>
                  </div>
                  <span className={styles.topSpent}>
                    <img src="/coin.png" alt="Coin" style={{ width: 11, height: 11, objectFit: 'contain', verticalAlign: 'middle', marginRight: 3 }} />
                    {sub.spent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscriber Filters Sheet */}
      <SubscriberFiltersSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        stats={stats}
        dark={darkMode}
        desktop={!isMobile}
        getResultCount={getResultCount}
      />

      {/* Block Subscriber Confirmation */}
      <ConfirmDeleteDialog
        open={!!blockTarget}
        itemName={blockTarget ? blockTarget.name : ''}
        title="Block Subscriber?"
        confirmLabel="Block"
        busyLabel="Blocking…"
        icon={<Ban size={22} />}
        message={blockTarget ? <><strong>{blockTarget.name}</strong> won't be able to message you anymore.</> : ''}
        deleting={blocking}
        darkMode={darkMode}
        onCancel={closeBlock}
        onConfirm={confirmBlock}
      />
    </div>
  );
};
