import { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  DollarSign, Clock, CheckCircle, TrendingUp, Users, Gift,
  Lock, Video, Phone, Radio, ChevronLeft,
  ChevronRight, Download, Wallet, Banknote
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './EarningsPage.module.css';

const iconMap = {
  dollar: DollarSign,
  clock: Clock,
  check: CheckCircle,
  trending: TrendingUp,
  users: Users,
  gift: Gift,
  lock: Lock,
  video: Video,
  phone: Phone,
  radio: Radio
};

const typeIconMap = {
  subscription: Users,
  tip: Gift,
  ppv_unlock: Lock,
  call_billing: Video,
  live_entry: Radio,
  withdrawal: Wallet
};

const typeLabelMap = {
  subscription: 'Subscriptions',
  tip: 'Tips',
  ppv_unlock: 'PPV Unlocks',
  call_billing: 'Video Calls',
  live_entry: 'Live Streams',
  withdrawal: 'Withdrawal'
};

const getTxSourceMeta = (tx) => {
  if (tx.type === 'call_billing') {
    const isAudio = tx.callType === 'audio' || (tx.source && tx.source.toLowerCase().includes('audio'));
    return {
      label: isAudio ? 'Audio Calls' : 'Video Calls',
      Icon: isAudio ? Phone : Video
    };
  }
  return {
    label: typeLabelMap[tx.type] || tx.source || tx.type,
    Icon: typeIconMap[tx.type] || Users
  };
};

// Map a raw status to the matching badge class (pending = yellow, completed = green, failed/refunded = red)
const statusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return 'statusPending';
  if (s === 'failed' || s === 'refunded') return 'statusFailed';
  if (s === 'withdrawal') return 'statusInfo';
  return 'statusCompleted';
};

export const EarningsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('All Transactions');
  const [period, setPeriod] = useState('All Time');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({
    earningsOverviewStats: [],
    revenueBreakdown: [],
    earningsTabs: [],
    transactionHistory: [],
    topSubscribers: [],
    payoutHistory: [],
    quickStats: {},
    nextPayout: null
  });
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/creators/panel/earnings?tab=${encodeURIComponent(activeTab)}&period=${encodeURIComponent(period)}`);
      if (res.status === 'success') {
        setData({
          earningsOverviewStats: res.earningsOverviewStats || [],
          revenueBreakdown: res.revenueBreakdown || [],
          earningsTabs: res.earningsTabs || [],
          transactionHistory: res.transactionHistory || [],
          topSubscribers: res.topSubscribers || [],
          payoutHistory: res.payoutHistory || [],
          quickStats: res.quickStats || {},
          nextPayout: res.nextPayout || null
        });
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadEarnings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, period]);

  const totalPages = Math.max(1, Math.ceil(data.transactionHistory.length / pageSize));
  const currentTransactions = data.transactionHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('start-ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('end-ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const fmtPayoutDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Export the currently visible transaction history as a CSV file
  const handleExport = () => {
    if (!data.transactionHistory.length) return;
    const headers = ['User', 'Description', 'Source', 'Date', 'Time', 'Amount', 'Status'];
    const rows = data.transactionHistory.map((tx) => [
      tx.user || '',
      tx.description || '',
      typeLabelMap[tx.type] || tx.source || '',
      tx.date || '',
      tx.time || '',
      tx.amount || '',
      tx.status || ''
    ]);
    const escapeCell = (cell) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-${activeTab.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
       {/* Stats Cards */}
       {loading ? (
         <div className={styles.statsRow}>
           {Array.from({ length: 4 }).map((_, idx) => (
             <div key={idx} className="skeleton-card" style={{ height: '110px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ))}
         </div>
       ) : (
        <div className={styles.statsRow}>
          {data.earningsOverviewStats.map((stat, idx) => {
            const Icon = iconMap[stat.icon] || DollarSign;
            return (
              <div key={idx} className={styles.statCard}>
                <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : stat.changeType === 'negative' ? styles.changeNegative : styles.changeInfo}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <>
          {/* Revenue Breakdown Skeleton */}
          <div className={`${styles.section} ${styles.revenueSection}`}>
            <div className={styles.sectionHeader}>
              <ShimmerSkeleton variant="text" width="160px" height="20px" />
              <ShimmerSkeleton variant="text" width="120px" height="28px" />
            </div>
            <div className={styles.revenueGrid}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className={styles.revenueCard}>
                  <ShimmerSkeleton variant="text" width="100%" height="16px" marginBottom="0.75rem" />
                  <ShimmerSkeleton variant="text" width="80px" height="24px" marginBottom="0.5rem" />
                  <ShimmerSkeleton variant="text" width="60px" height="12px" marginBottom="0.35rem" />
                  <ShimmerSkeleton variant="text" width="90px" height="12px" />
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History Skeleton */}
          <div className={`${styles.section} ${styles.transactionSection}`}>
            <div className={styles.sectionHeader}>
              <ShimmerSkeleton variant="text" width="160px" height="20px" />
              <ShimmerSkeleton variant="button" width="100px" height="34px" />
            </div>
            <div className={styles.tabsRow}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <ShimmerSkeleton key={idx} variant="text" width="100px" height="20px" marginBottom="0" />
              ))}
            </div>
            <div className={styles.tableCard}>
              <div className={styles.tableContainer}>
                <table className={styles.contentTable}>
                  <thead>
                    <tr>
                      <th className={styles.th}><ShimmerSkeleton variant="text" width="60px" height="12px" /></th>
                      <th className={styles.th}><ShimmerSkeleton variant="text" width="60px" height="12px" /></th>
                      <th className={styles.th}><ShimmerSkeleton variant="text" width="50px" height="12px" /></th>
                      <th className={styles.th}><ShimmerSkeleton variant="text" width="70px" height="12px" /></th>
                      <th className={styles.th}><ShimmerSkeleton variant="text" width="70px" height="12px" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, rowIdx) => (
                      <tr key={rowIdx} className={styles.tableRow}>
                        <td className={styles.td}>
                          <div className={styles.userInfo}>
                            <ShimmerSkeleton variant="avatar" width="36px" height="36px" marginRight="0.75rem" />
                            <ShimmerSkeleton variant="text" width="100px" height="14px" />
                          </div>
                        </td>
                        <td className={styles.td}>
                          <ShimmerSkeleton variant="chip" width="100px" height="24px" />
                        </td>
                        <td className={styles.td}>
                          <ShimmerSkeleton variant="text" width="80px" height="14px" />
                          <ShimmerSkeleton variant="text" width="50px" height="12px" marginTop="0.15rem" />
                        </td>
                        <td className={styles.td}>
                          <ShimmerSkeleton variant="text" width="80px" height="16px" />
                        </td>
                        <td className={styles.td}>
                          <ShimmerSkeleton variant="chip" width="80px" height="24px" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <ShimmerSkeleton variant="button" width="34px" height="34px" marginRight="0.4rem" />
                {Array.from({ length: 5 }).map((_, idx) => (
                  <ShimmerSkeleton key={idx} variant="button" width="34px" height="34px" marginRight="0.4rem" />
                ))}
                <ShimmerSkeleton variant="button" width="34px" height="34px" />
              </div>
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className={styles.rightSidebar}>
            {/* Payout Info Skeleton */}
            <div className={`${styles.sidebarCard} ${styles.payoutInfoCard}`}>
              <div className={styles.sidebarCardHeader}>
                <ShimmerSkeleton variant="text" width="140px" height="18px" />
              </div>
              <div className={styles.payoutInfo}>
                <div className={styles.payoutMain}>
                  <ShimmerSkeleton variant="text" width="100px" height="14px" marginBottom="0.25rem" />
                  <ShimmerSkeleton variant="text" width="120px" height="28px" marginBottom="0.25rem" />
                  <ShimmerSkeleton variant="text" width="180px" height="14px" />
                </div>
              </div>
              <ShimmerSkeleton variant="button" width="100%" height="40px" marginTop="1rem" />
            </div>

            {/* Top Subscribers Skeleton */}
            <div className={`${styles.sidebarCard} ${styles.subscribersCard}`}>
              <div className={styles.sidebarCardHeader}>
                <ShimmerSkeleton variant="text" width="120px" height="18px" />
              </div>
              <div className={styles.subscribersList}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.subscriberItem}>
                    <ShimmerSkeleton variant="chip" width="22px" height="22px" marginRight="0.75rem" />
                    <ShimmerSkeleton variant="avatar" width="36px" height="36px" marginRight="0.75rem" />
                    <div className={styles.subscriberInfo}>
                      <ShimmerSkeleton variant="text" width="100px" height="14px" marginBottom="0.15rem" />
                      <ShimmerSkeleton variant="text" width="80px" height="12px" />
                    </div>
                    <ShimmerSkeleton variant="text" width="80px" height="16px" />
                  </div>
                ))}
              </div>
            </div>

            {/* Payout History Skeleton */}
            <div className={`${styles.sidebarCard} ${styles.payoutHistoryCard}`}>
              <div className={styles.sidebarCardHeader}>
                <ShimmerSkeleton variant="text" width="120px" height="18px" />
              </div>
              <div className={styles.payoutList}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.payoutItem}>
                    <ShimmerSkeleton variant="circle" width="32px" height="32px" marginRight="0.75rem" />
                    <div className={styles.payoutItemInfo}>
                      <ShimmerSkeleton variant="text" width="80px" height="16px" marginBottom="0.15rem" />
                      <ShimmerSkeleton variant="text" width="100px" height="12px" />
                    </div>
                    <ShimmerSkeleton variant="chip" width="80px" height="24px" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className={`${styles.sidebarCard} ${styles.quickStatsCard}`}>
              <div className={styles.sidebarCardHeader}>
                <ShimmerSkeleton variant="text" width="100px" height="18px" />
              </div>
              <div className={styles.quickStatsGrid}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.quickStatItem}>
                    <ShimmerSkeleton variant="text" width="80px" height="12px" marginBottom="0.25rem" />
                    <ShimmerSkeleton variant="text" width="100px" height="20px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && (
        <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Revenue Breakdown */}
          <div className={`${styles.section} ${styles.revenueSection}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Revenue Breakdown</h2>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.revenueGrid}>
              {data.revenueBreakdown.map((item, idx) => {
                const Icon = iconMap[item.icon] || DollarSign;
                return (
                  <div key={idx} className={styles.revenueCard}>
                    <div className={styles.revenueCardTop}>
                      <div className={styles.revenueIconWrap} style={{ background: `${item.color}20` }}>
                        <Icon size={16} style={{ color: item.color }} />
                      </div>
                      <span className={styles.revenueSource}>{item.source}</span>
                    </div>
                    <div className={styles.revenueCardMiddle}>
                      <span className={styles.revenueAmount}>{item.amount}</span>
                      <span className={`${styles.revenueChange} ${item.changeType === 'positive' ? styles.changePositive : item.changeType === 'negative' ? styles.changeNegative : styles.changeInfo}`}>{item.change}</span>
                    </div>
                    <div className={styles.revenueBarWrap}>
                      <div
                        className={styles.revenueBar}
                        style={{ width: `${item.percentage}%`, background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}90 100%)` }}
                      />
                    </div>
                    <span className={styles.revenuePercentage}>{item.percentage}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction History */}
          <div className={`${styles.section} ${styles.transactionSection}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Transaction History</h2>
              <div className={styles.headerActions}>
                <button className={styles.exportBtn} onClick={handleExport}>
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsRow}>
              {data.earningsTabs.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transaction Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableContainer}>
                <table className={styles.contentTable}>
                  <thead>
                    <tr>
                      <th className={styles.th}>User</th>
                      <th className={styles.th}>Source</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Amount</th>
                      <th className={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.length === 0 && (
                      <tr><td colSpan={5} className={styles.td} style={{ textAlign: 'center', color: darkMode ? 'rgba(255,255,255,0.45)' : '#4b5563', fontWeight: 500 }}>No transactions in this category yet.</td></tr>
                    )}
                    {currentTransactions.map((tx) => {
                      const { label: sourceLabel, Icon: TypeIcon } = getTxSourceMeta(tx);
                      return (
                        <tr key={tx.id} className={styles.tableRow}>
                          <td className={styles.td}>
                            <div className={styles.userInfo}>
                              <img src={tx.avatar} alt={tx.user} className={styles.userAvatar} />
                              <span className={styles.userName}>{tx.user}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.sourceBadge}>
                              <TypeIcon size={12} />
                              <span>{sourceLabel}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.dateInfo}>
                              <span className={styles.txDate}>{tx.date}</span>
                              <span className={styles.txTime}>{tx.time}</span>
                            </div>
                          </td>
                          <td className={`${styles.td} ${tx.amountType === 'positive' ? styles.amountPositive : styles.amountNegative}`}>
                            {tx.amount}
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${styles[statusBadgeClass(tx.status)]}`}>{tx.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
{getPageNumbers().map((page, idx) =>
                typeof page === 'number' ? (
                  <button
                    key={`page-${page}`}
                    className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={`ellipsis-${page}-${idx}`} className={styles.pageDots}>...</span>
                )
              )}
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Payout Info */}
          <div className={`${styles.sidebarCard} ${styles.payoutInfoCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Payout <span className={styles.payoutTitleInfo}>Information</span></h3>
            </div>
            <div className={styles.payoutInfo}>
              <div className={styles.payoutMain}>
                <span className={styles.payoutLabel}>{data.nextPayout ? 'Next Payout' : 'No Payouts Yet'}</span>
                <span className={styles.payoutAmount}>{data.nextPayout ? `${data.nextPayout.amountCoins} coins` : '0 coins'}</span>
                <span className={styles.payoutDate}>
                  {data.nextPayout ? `Requested: ${fmtPayoutDate(data.nextPayout.date)}` : 'Request a withdrawal from Settings'}
                </span>
              </div>
            </div>
            <button className={styles.viewPayoutsBtn} onClick={() => navigateTo('/creators/settings')}>
              <span className={styles.desktopBtnText}>Manage Payout Settings</span>
              <span className={styles.mobileBtnText}>Manage Payout</span>
            </button>
          </div>

          {/* Top Subscribers */}
          <div className={`${styles.sidebarCard} ${styles.subscribersCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Top Subscribers</h3>
            </div>
            <div className={styles.subscribersList}>
              {data.topSubscribers.length === 0 && <p style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : '#4b5563', padding: '0.5rem 0', fontWeight: 500 }}>No data yet.</p>}
              {data.topSubscribers.map((sub) => (
                <div key={sub.rank} className={styles.subscriberItem}>
                  <div className={styles.rankBadge} data-rank={sub.rank}>{sub.rank}</div>
                  <img src={sub.avatar} alt={sub.name} className={styles.subscriberAvatar} />
                  <div className={styles.subscriberInfo}>
                    <span className={styles.subscriberName}>{sub.name}</span>
                    <span className={styles.subscriberPlan}>@{sub.username}</span>
                  </div>
                  <span className={styles.subscriberSpent}>{sub.spent}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payout History */}
          <div className={`${styles.sidebarCard} ${styles.payoutHistoryCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Payout History</h3>
            </div>
            <div className={styles.payoutList}>
              {data.payoutHistory.length === 0 && <p style={{ color: darkMode ? 'rgba(255,255,255,0.45)' : '#4b5563', padding: '0.5rem 0', fontWeight: 500 }}>No payouts yet.</p>}
              {data.payoutHistory.slice(0, 4).map((payout) => (
                <div key={payout.id} className={styles.payoutItem}>
                  <div className={styles.payoutItemIcon}>
                    <Banknote size={14} />
                  </div>
                  <div className={styles.payoutItemInfo}>
                    <span className={styles.payoutItemAmount}>{payout.amount}</span>
                    <span className={styles.payoutItemDate}>{payout.date}</span>
                  </div>
                  <span className={`${styles.payoutItemStatus} ${styles[statusBadgeClass(payout.status)]}`}>{payout.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`${styles.sidebarCard} ${styles.quickStatsCard}`}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Quick Stats</h3>
            </div>
            <div className={styles.quickStatsGrid}>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Avg. Order</span>
                <span className={styles.quickStatValue}>{data.quickStats.averageOrderValue || '0 coins'}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Conversion</span>
                <span className={styles.quickStatValue}>{data.quickStats.conversionRate || '—'}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Refund Rate</span>
                <span className={styles.quickStatValue}>{data.quickStats.refundRate || '—'}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Avg. Rating</span>
                <span className={styles.quickStatValue}>{data.quickStats.averageRating || '—'}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
