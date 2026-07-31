import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  DollarSign, Clock, CheckCircle, TrendingUp, Users, Gift,
  Lock, Video, Phone, Radio, ShoppingBag, ChevronLeft,
  ChevronRight, Filter, Download, MoreVertical, ArrowUpRight,
  ArrowDownRight, Wallet, CreditCard, Banknote, Eye
} from 'lucide-react';
import {
  earningsOverviewStats, revenueBreakdown, earningsTabs,
  transactionHistory, monthlyEarnings, topSubscribers,
  payoutHistory, quickStats
} from './mockData';
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
  radio: Radio,
  shopping: ShoppingBag,
};

const typeIconMap = {
  subscription: Users,
  tip: Gift,
  ppv: Lock,
  video_call: Video,
  audio_call: Phone,
  live_stream: Radio,
  store: ShoppingBag,
  payout: Wallet,
};

export const EarningsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('All Transactions');
  const [currentPage, setCurrentPage] = useState(1);
  const [activePeriod, setActivePeriod] = useState('monthly');

  const filteredTransactions = transactionHistory.filter((tx) => {
    if (activeTab === 'All Transactions') return true;
    if (activeTab === 'Subscriptions') return tx.type === 'subscription';
    if (activeTab === 'Tips') return tx.type === 'tip';
    if (activeTab === 'PPV Unlocks') return tx.type === 'ppv';
    if (activeTab === 'Video Calls') return tx.type === 'video_call';
    if (activeTab === 'Audio Calls') return tx.type === 'audio_call';
    if (activeTab === 'Live Streams') return tx.type === 'live_stream';
    if (activeTab === 'Store') return tx.type === 'store';
    return true;
  });

  return (
    <div className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Stats Cards */}
      <div className={styles.statsRow}>
        {earningsOverviewStats.map((stat, idx) => {
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
                  className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.changePositive : styles.changeInfo}`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Revenue Breakdown */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Revenue Breakdown</h2>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.revenueGrid}>
              {revenueBreakdown.map((item, idx) => {
                const Icon = iconMap[item.icon];
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
                      <span className={`${styles.revenueChange} ${styles.changePositive}`}>
                        {item.change}
                      </span>
                    </div>
                    <div className={styles.revenueBarWrap}>
                      <div
                        className={styles.revenueBar}
                        style={{
                          width: `${item.percentage}%`,
                          background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}90 100%)`,
                        }}
                      />
                    </div>
                    <span className={styles.revenuePercentage}>{item.percentage}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Earnings Chart */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Monthly Earnings</h2>
              <div className={styles.periodTabs}>
                <button
                  className={`${styles.periodTab} ${activePeriod === 'weekly' ? styles.periodTabActive : ''}`}
                  onClick={() => setActivePeriod('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`${styles.periodTab} ${activePeriod === 'monthly' ? styles.periodTabActive : ''}`}
                  onClick={() => setActivePeriod('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`${styles.periodTab} ${activePeriod === 'yearly' ? styles.periodTabActive : ''}`}
                  onClick={() => setActivePeriod('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <div className={styles.chartBars}>
                {monthlyEarnings.map((item, idx) => {
                  const maxAmount = Math.max(...monthlyEarnings.map((m) => m.amount));
                  const height = (item.amount / maxAmount) * 100;
                  return (
                    <div key={idx} className={styles.chartBarGroup}>
                      <div className={styles.chartBarWrap}>
                        <div
                          className={styles.chartBar}
                          style={{
                            height: `${height}%`,
                            background: idx === monthlyEarnings.length - 1
                              ? 'linear-gradient(180deg, #e10075 0%, #ff6b9d 100%)'
                              : 'rgba(225, 0, 117, 0.3)',
                          }}
                        >
                          <span className={styles.chartBarValue}>
                            ${(item.amount / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </div>
                      <span className={styles.chartBarLabel}>{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Transaction History</h2>
              <div className={styles.headerActions}>
                <button className={styles.exportBtn}>
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsRow}>
              {earningsTabs.map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
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
                      <th className={styles.th}>Description</th>
                      <th className={styles.th}>Source</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Amount</th>
                      <th className={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const TypeIcon = typeIconMap[tx.type];
                      return (
                        <tr key={tx.id} className={styles.tableRow}>
                          <td className={styles.td}>
                            <div className={styles.userInfo}>
                              <img src={tx.avatar} alt={tx.user} className={styles.userAvatar} />
                              <span className={styles.userName}>{tx.user}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.txDescription}>{tx.description}</span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.sourceBadge}>
                              <TypeIcon size={12} />
                              <span>{tx.source}</span>
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
                            <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                  onClick={() => setCurrentPage(8)}
                >
                  8
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(Math.min(8, currentPage + 1))}
                  disabled={currentPage === 8}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Payout Info */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Payout Information</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.payoutInfo}>
              <div className={styles.payoutMain}>
                <span className={styles.payoutLabel}>Next Payout</span>
                <span className={styles.payoutAmount}>$3,245.80</span>
                <span className={styles.payoutDate}>Estimated: Jan 31, 2024</span>
              </div>
              <div className={styles.payoutMethod}>
                <div className={styles.payoutMethodIcon}>
                  <CreditCard size={16} />
                </div>
                <div className={styles.payoutMethodInfo}>
                  <span className={styles.payoutMethodLabel}>Bank Transfer</span>
                  <span className={styles.payoutMethodValue}>**** 5678</span>
                </div>
              </div>
            </div>
            <button className={styles.viewPayoutsBtn} onClick={() => navigateTo('/creators/settings')}>
              Manage Payout Settings
            </button>
          </div>

          {/* Top Subscribers */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Top Subscribers</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.subscribersList}>
              {topSubscribers.map((sub) => (
                <div key={sub.rank} className={styles.subscriberItem}>
                  <div className={styles.rankBadge} data-rank={sub.rank}>
                    {sub.rank}
                  </div>
                  <img src={sub.avatar} alt={sub.name} className={styles.subscriberAvatar} />
                  <div className={styles.subscriberInfo}>
                    <span className={styles.subscriberName}>{sub.name}</span>
                    <span className={styles.subscriberPlan}>{sub.plan} • {sub.since}</span>
                  </div>
                  <span className={styles.subscriberSpent}>{sub.totalSpent}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payout History */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Payout History</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
            <div className={styles.payoutList}>
              {payoutHistory.slice(0, 4).map((payout) => (
                <div key={payout.id} className={styles.payoutItem}>
                  <div className={styles.payoutItemIcon}>
                    <Banknote size={14} />
                  </div>
                  <div className={styles.payoutItemInfo}>
                    <span className={styles.payoutItemAmount}>{payout.amount}</span>
                    <span className={styles.payoutItemDate}>{payout.date}</span>
                  </div>
                  <span className={`${styles.payoutItemStatus} ${styles.statusCompleted}`}>
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <h3 className={styles.sidebarCardTitle}>Quick Stats</h3>
            </div>
            <div className={styles.quickStatsGrid}>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Avg. Order</span>
                <span className={styles.quickStatValue}>{quickStats.averageOrderValue}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Conversion</span>
                <span className={styles.quickStatValue}>{quickStats.conversionRate}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Refund Rate</span>
                <span className={styles.quickStatValue}>{quickStats.refundRate}</span>
              </div>
              <div className={styles.quickStatItem}>
                <span className={styles.quickStatLabel}>Avg. Rating</span>
                <span className={styles.quickStatValue}>{quickStats.averageRating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
