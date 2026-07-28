import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Film, Zap, DollarSign, Tag, Percent, Search, ChevronDown,
  MoreVertical, ArrowUp, ArrowDown, Check,
  Lightbulb, ArrowRight, Edit2, Clock, Lock
} from 'lucide-react';
import { ppvOverview, recentPPV, topPerforming, recentTransactions, pricingTips, ppvTabs } from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './PPVContentPage.module.css';

const iconMap = {
  film: Film,
  zap: Zap,
  dollar: DollarSign,
  tag: Tag,
  percent: Percent,
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Active': return styles.statusActive;
    case 'Scheduled': return styles.statusScheduled;
    case 'Expired': return styles.statusExpired;
    default: return '';
  }
};

export const PPVContentPage = () => {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('All PPV');
  const [visibleItems, setVisibleItems] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPPV = recentPPV.filter((item) => {
    if (activeTab === 'Active' && item.status !== 'Active') return false;
    if (activeTab === 'Scheduled' && item.status !== 'Scheduled') return false;
    if (activeTab === 'Expired' && item.status !== 'Expired') return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const displayedPPV = filteredPPV.slice(0, visibleItems);
  const hasMore = visibleItems < filteredPPV.length;

  return (
    <div className={`${styles.ppvContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Hero Card */}
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <div className={styles.heroIconWrap}>
                <Film size={32} className={styles.heroIcon} fill="currentColor" />
              </div>
              <div className={styles.heroInfo}>
                <h2 className={styles.heroTitle}>PPV Content</h2>
                <p className={styles.heroDesc}>Create exclusive pay-per-view content for your fans.</p>
                <div className={styles.rateInfo}>
                  <span className={styles.rateLabel}>Avg. unlock rate:</span>
                  <span className={styles.rateValue}>67%</span>
                </div>
                <div className={styles.onlineStatus}>
                  <span className={styles.onlineDot} /> 28 Active Offers
                </div>
              </div>
              <div className={styles.heroVisual}>
                <div className={styles.visualCard}>
                  <div className={styles.visualIcon}>
                    <Lock size={24} />
                  </div>
                  <div className={styles.visualText}>
                    <span className={styles.visualValue}>$3,240</span>
                    <span className={styles.visualLabel}>Total Revenue</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.createBtn}>
                <Zap size={18} /> Create PPV Offer
              </button>
              <button className={styles.scheduleBtn}>
                <Clock size={18} /> Schedule PPV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {ppvOverview.stats.map((stat) => {
              const Icon = iconMap[stat.icon];
              const changeNum = stat.change ? stat.change.replace(/[+$%]/g, '') : '';
              return (
                <div key={stat.label} className={styles.statCard}>
                  <div className={styles.statLabelRow}>
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                  <div className={styles.statValueRow}>
                    <Icon size={24} style={{ color: '#9b51e0' }} />
                    <div className={styles.statValueCol}>
                      <span className={styles.statValue}>{stat.value}</span>
                    </div>
                    {stat.change && (
                      <span className={`${styles.statChangeInline} ${stat.changeType === 'positive' ? styles.positive : styles.negative}`}>
                        {stat.changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {changeNum}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent PPV Table */}
          <div className={styles.ppvTableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Recent PPV Content</h3>
              <div className={styles.tableTabs}>
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

            {/* Search */}
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search PPV content..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.ppvTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Content</th>
                    <th className={styles.th}>Price</th>
                    <th className={styles.th}>Sent</th>
                    <th className={styles.th}>Unlocked</th>
                    <th className={`${styles.th} ${styles.hideMobile}`}>Revenue</th>
                    <th className={`${styles.th} ${styles.hideMobile}`}>Status</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPPV.map((item) => (
                    <tr key={item.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        <div className={styles.contentInfo}>
                          <img src={item.thumbnail} alt={item.title} className={styles.contentThumb} />
                          <div className={styles.contentDetails}>
                            <span className={styles.contentTitle}>{item.title}</span>
                            <span className={styles.contentMeta}>{item.type} • {item.date}</span>
                          </div>
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.price}`}>{item.price}</td>
                      <td className={styles.td}>{item.sent}</td>
                      <td className={styles.td}>{item.unlocked}</td>
                      <td className={`${styles.td} ${styles.revenue} ${styles.hideMobile}`}>{item.revenue}</td>
                      <td className={`${styles.td} ${styles.hideMobile}`}>
                        <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
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

            <div className={styles.loadMore}>
              {hasMore && (
                <button className={styles.loadMoreBtn} onClick={() => setVisibleItems(visibleItems + 4)}>
                  Load More <ChevronDown size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Revenue Card */}
          <div className={styles.revenueCard}>
            <div className={styles.revenueHeader}>
              <div className={styles.revenueTitleRow}>
                <DollarSign size={14} className={styles.revenueIcon} />
                <h3 className={styles.revenueTitle}>PPV Revenue</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.revenueAmount}>$3,240</div>
            <div className={styles.revenueChange}>
              <span className={styles.positive}>↑ 18%</span>
              <span className={styles.changeLabel}>vs last month</span>
            </div>
            <div className={styles.revenueStats}>
              <div className={styles.revenueStat}>
                <span className={styles.revenueStatLabel}>Total Sent</span>
                <span className={styles.revenueStatValue}>1,697</span>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueStatLabel}>Total Unlocked</span>
                <span className={styles.revenueStatValue}>1,265</span>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueStatLabel}>Avg. Unlock Rate</span>
                <span className={styles.revenueStatValue}>67%</span>
              </div>
              <div className={styles.revenueStat}>
                <span className={styles.revenueStatLabel}>Avg. Price</span>
                <span className={styles.revenueStatValue}>$8.50</span>
              </div>
            </div>
            <button className={styles.viewRevenueBtn}>View Full Revenue</button>
          </div>

          {/* Top Performing */}
          <div className={styles.topCard}>
            <h3 className={styles.topTitle}>Top Performing PPV</h3>
            <div className={styles.topList}>
              {topPerforming.map((item) => (
                <div key={item.id} className={styles.topItem}>
                  <img src={item.thumbnail} alt={item.title} className={styles.topThumb} />
                  <div className={styles.topInfo}>
                    <span className={styles.topItemTitle}>{item.title}</span>
                    <span className={styles.topItemRevenue}>{item.revenue}</span>
                  </div>
                  <div className={styles.topUnlockRate}>
                    <span className={styles.unlockRateValue}>{item.unlockRate}</span>
                    <span className={styles.unlockRateLabel}>unlocked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className={styles.transactionsCard}>
            <h3 className={styles.transactionsTitle}>Recent Purchases</h3>
            <div className={styles.transactionsList}>
              {recentTransactions.map((tx) => (
                <div key={tx.id} className={styles.transactionItem}>
                  <img src={tx.avatar} alt={tx.fan} className={styles.transactionAvatar} />
                  <div className={styles.transactionInfo}>
                    <span className={styles.transactionFan}>{tx.fan}</span>
                    <span className={styles.transactionContent}>{tx.content}</span>
                  </div>
                  <div className={styles.transactionRight}>
                    <span className={styles.transactionAmount}>{tx.amount}</span>
                    <span className={styles.transactionTime}>{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.viewAllTxBtn}>
              View All Transactions <ArrowRight size={14} />
            </button>
          </div>

          {/* Pricing Tips */}
          <div className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <div className={styles.tipsIconWrap}>
                <Lightbulb size={14} className={styles.tipsIcon} fill="currentColor" />
              </div>
              <h3 className={styles.tipsTitle}>PPV Pricing Tips</h3>
            </div>
            <ul className={styles.tipsList}>
              {pricingTips.map((tip, index) => (
                <li key={index} className={styles.tipItem}>
                  <span className={styles.tipCheck}>
                    <Check size={14} className={styles.tipCheckIcon} />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
            <button className={styles.viewAllTipsBtn}>
              View All Tips <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
