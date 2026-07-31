import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Phone, Clock, Wallet, PhoneOff, Users, ChevronDown, Video, Edit2, MoreVertical, ArrowRight, Check, Lightbulb, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { videoCallStats, todayEarnings, performanceData, dailyMinutes, recentCalls, tips, callTabs } from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './VideoCallsPage.module.css';

const iconMap = {
  video: Video,
  clock: Clock,
  dollar: Wallet,
  phoneMissed: PhoneOff,
  users: Users,
};

export const VideoCallsPage = () => {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('All');
  const [visibleCalls, setVisibleCalls] = useState(8);
  const visibleRecentCalls = recentCalls.slice(0, visibleCalls);
  const hasMore = visibleCalls < recentCalls.length;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return styles.statusCompleted;
      case 'Missed': return styles.statusMissed;
      case 'Pending': return styles.statusPending;
      default: return '';
    }
  };

  return (
    <div className={`${styles.callsContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Hero Card */}
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <div className={styles.heroIconWrap}>
                <Video size={32} className={styles.heroIcon} fill="currentColor" />
              </div>
              <div className={styles.heroInfo}>
                <h2 className={styles.heroTitle}>Video Calls</h2>
                <p className={styles.heroDesc}>Connect face-to-face with your fans.</p>
                <div className={styles.rateInfo}>
                  <span className={styles.rateLabel}>Your rate:</span>
                  <span className={styles.rateValue}>$2.00</span>
                  <span className={styles.rateUnit}>/ min</span>
                </div>
                <div className={styles.onlineStatus}>
                  <span className={styles.onlineDot} /> Online Now
                </div>
              </div>
              <div className={styles.heroWaveform}>
                <svg viewBox="0 0 200 80" className={styles.waveformSvg}>
                  <defs>
                    <linearGradient id="camGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#e10075" />
                    </linearGradient>
                  </defs>
                  {[25,30,35,40,45,50,55,50,45,40,35,30,25,22,20,18,16,14,12,10,8,6,4,2].map((h, i) => (
                    <rect key={i} x={4 + i * 8} y={40 - h/2} width="4" height={h} fill="url(#camGrad)" rx="2" opacity={0.15 + (i/24) * 0.35} />
                  ))}
                </svg>
              </div>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.goLiveBtn}>
                Go Live Now
              </button>
              <button className={styles.editRateBtn}>
                <Edit2 size={18} /> Edit Rate
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {videoCallStats.map((stat) => {
              const Icon = iconMap[stat.icon];
              const changeNum = stat.change ? stat.change.replace(/[+\-]/g, '') : '';
              return (
                <div key={stat.id} className={`${styles.statCard} ${stat.id === 'missedCalls' ? styles.missedStatMobile : ''}`}>
                  <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} fill={stat.icon === 'clock' || stat.icon === 'dollar' ? 'none' : stat.color} />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <span className={styles.statValue}>{stat.value}</span>
                    {stat.change ? (
                      <span className={`${styles.statChange} ${stat.changeType === 'positive' ? styles.positive : styles.negative}`}>
                        ↑ {changeNum} <span className={styles.statPeriod}>{stat.period}</span>
                      </span>
                    ) : (
                      <span className={styles.statSubtitle}>{stat.period}</span>
                    )}
                  </div>
                  {stat.showLink && (
                    <span className={styles.statLink}>
                      {stat.linkText} <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Calls Table */}
          <div className={styles.callsTableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Recent Video Calls</h3>
              <div className={styles.tableTabs}>
                {callTabs.map((tab) => (
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
            <div className={styles.tableContainer}>
              <table className={styles.callsTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Fan</th>
                    <th className={styles.th}>Date & Time</th>
                    <th className={styles.th}>Duration</th>
                    <th className={styles.th}>Earned</th>
                    <th className={`${styles.th} ${styles.hideMobile}`}>Status</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecentCalls.map((call) => (
                    <tr key={call.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        <div className={styles.fanInfo}>
                          <img src={call.fan.avatar} alt={call.fan.name} className={styles.fanAvatar} />
                          <div className={styles.fanDetails}>
                            <span className={styles.fanName}>
                              {call.fan.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateTime}>{call.dateTime}</span>
                      </td>
                      <td className={styles.td}>{call.duration}</td>
                      <td className={`${styles.td} ${styles.earned}`}>{call.earned}</td>
                      <td className={`${styles.td} ${styles.hideMobile}`}>
                        <span className={`${styles.statusBadge} ${getStatusClass(call.status)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <button className={styles.moreBtn}>
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.loadMore}>
              {hasMore && (
                <button className={styles.loadMoreBtn} onClick={() => setVisibleCalls(visibleCalls + 5)}>
                  Load More <ChevronDown size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Today's Earnings */}
          <div className={styles.earningsCard}>
            <div className={styles.earningsHeader}>
              <div className={styles.earningsTitleRow}>
                <div className={styles.earningsIconWrap}>
                  <Video size={20} className={styles.earningsIcon} fill="none" />
                </div>
                <h3 className={styles.earningsTitle}>Today's Video Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.earningsAmount}>{todayEarnings.amount}</div>
            <div className={styles.earningsChange}>
              <span className={styles.positive}>↑ {todayEarnings.change}</span>
              <span className={styles.changeLabel}>{todayEarnings.changeLabel}</span>
            </div>
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Total Minutes</span>
                <span className={styles.earningsStatValue}>{todayEarnings.totalMinutes} min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>{todayEarnings.completedCalls}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>{todayEarnings.missedCalls}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>{todayEarnings.estimatedPayout}</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn}>View Earnings</button>
          </div>

          {/* Performance Donut Card */}
          <div className={styles.performanceCard}>
            <div className={styles.performanceHeader}>
              <h3 className={styles.performanceTitle}>Video Call Performance</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.performanceBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.completed.color}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.completed.percentage * 2.51} ${251 - performanceData.completed.percentage * 2.51}`}
                      strokeDashoffset="62.75"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.missed.color}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.missed.percentage * 2.51} ${251 - performanceData.missed.percentage * 2.51}`}
                      strokeDashoffset={62.75 - performanceData.completed.percentage * 2.51}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.pending.color}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.pending.percentage * 2.51} ${251 - performanceData.pending.percentage * 2.51}`}
                      strokeDashoffset={62.75 - (performanceData.completed.percentage + performanceData.missed.percentage) * 2.51}
                      strokeLinecap="round"
                    />
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{performanceData.totalMinutes}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Minutes</text>
                  </svg>
                </div>
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.completed.color }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Completed</span>
                    <span className={styles.legendValue}>{performanceData.completed.minutes} min ({performanceData.completed.percentage}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.missed.color }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Missed</span>
                    <span className={styles.legendValue}>{performanceData.missed.minutes} min ({performanceData.missed.percentage}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.pending.color }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Pending</span>
                    <span className={styles.legendValue}>{performanceData.pending.minutes} min ({performanceData.pending.percentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Minutes Chart */}
          <div className={styles.dailyCard}>
            <div className={styles.dailyHeader}>
              <h3 className={styles.dailyTitle}>Daily Minutes</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.dailyChartWrapper}>
              <div className={styles.dailyYAxis}>
                {[dailyMinutes.maxY, Math.round(dailyMinutes.maxY * 0.75), Math.round(dailyMinutes.maxY * 0.5), Math.round(dailyMinutes.maxY * 0.25), 0].map((val, i) => (
                  <span key={i} className={styles.dailyYLabel}>{val}</span>
                ))}
              </div>
              <div className={styles.dailyChart}>
                {dailyMinutes.days.map((day, index) => (
                  <div key={index} className={styles.dailyBar}>
                    <div
                      className={styles.dailyBarFill}
                      style={{ height: `${(day.value / dailyMinutes.maxY) * 100}%` }}
                    />
                    <span className={styles.dailyBarLabel}>{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <div className={styles.tipsIconWrap}>
                <Lightbulb size={14} className={styles.tipsIcon} fill="currentColor" />
              </div>
              <h3 className={styles.tipsTitle}>Tips to Boost Video Call Earnings</h3>
            </div>
            <ul className={styles.tipsList}>
              {tips.map((tip, index) => (
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
