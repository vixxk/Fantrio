import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Phone, Clock, Wallet, PhoneOff, Users, ChevronDown, Video, Edit2, MoreVertical, ArrowRight, Check, Lightbulb, ArrowUp, ArrowDown } from 'lucide-react';
import { audioCallStats, todayEarnings, peakHours, recentCalls, tips, callTabs } from './mockData';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './AudioCallsPage.module.css';

const iconMap = {
  phone: Phone,
  clock: Clock,
  dollar: Wallet,
  phoneMissed: PhoneOff,
  users: Users,
};

const GradientBadgeCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="badgeGradAudio" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e10075" />
        <stop offset="100%" stopColor="#7e00f3" />
      </linearGradient>
    </defs>
    <path 
      d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" 
      fill="url(#badgeGradAudio)" 
    />
    <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AudioCallsPage = () => {
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
                <Phone size={32} className={styles.heroIcon} fill="currentColor" />
              </div>
              <div className={styles.heroInfo}>
                <h2 className={styles.heroTitle}>Audio Calls</h2>
                <p className={styles.heroDesc}>Connect with fans through private audio calls.</p>
                <div className={styles.rateInfo}>
                  <span className={styles.rateLabel}>Your rate:</span>
                  <span className={styles.rateValue}>$0.50</span>
                  <span className={styles.rateUnit}>/ min</span>
                </div>
                <div className={styles.onlineStatus}>
                  <span className={styles.onlineDot} /> Online Now
                </div>
              </div>
              <div className={styles.heroWaveform}>
                {/* Mirrored waveform visualization */}
                <svg viewBox="0 0 280 80" className={styles.waveformSvg}>
                  <defs>
                    <linearGradient id="waveGradientLeft" x1="0%" y1="0%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#7e00f3" />
                      <stop offset="100%" stopColor="#9b51e0" />
                    </linearGradient>
                    <linearGradient id="waveGradientRight" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9b51e0" />
                      <stop offset="100%" stopColor="#e10075" />
                    </linearGradient>
                  </defs>
                  {/* Left cluster (smaller) */}
                  {[2,4,6,8,12,16,22,26,30,26,22,16,12,8,6,4,2,1,2,3,2,1].map((h, i) => (
                    <g key={`l${i}`}>
                      <rect x={4 + i * 6} y={40 - h} width="3" height={h} fill="url(#waveGradientLeft)" rx="1.5" />
                      <rect x={4 + i * 6} y={40} width="3" height={h * 0.9} fill="url(#waveGradientLeft)" rx="1.5" />
                    </g>
                  ))}
                  {/* Right cluster (larger, taller) */}
                  {[1,2,4,8,14,22,30,36,32,28,22,16,12,8,5,3,2,1].map((h, i) => (
                    <g key={`r${i}`}>
                      <rect x={140 + i * 6} y={40 - h} width="3" height={h} fill="url(#waveGradientRight)" rx="1.5" />
                      <rect x={140 + i * 6} y={40} width="3" height={h * 0.9} fill="url(#waveGradientRight)" rx="1.5" />
                    </g>
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
            {audioCallStats.map((stat) => {
              const Icon = iconMap[stat.icon];
              const changeNum = stat.change ? stat.change.replace(/[+\-]/g, '') : '';
              return (
                <div key={stat.id} className={styles.statCard}>
                  <div className={styles.statLabelRow}>
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                  <div className={styles.statValueRow}>
                    <Icon size={24} style={{ color: stat.color }} fill={stat.icon === 'clock' || stat.icon === 'dollar' ? 'none' : stat.color} />
                    <div className={styles.statValueCol}>
                      <span className={styles.statValue}>{stat.value}</span>
                      {stat.period && <span className={styles.statPeriod}>{stat.period}</span>}
                    </div>
                    {stat.change && (
                      <span className={`${styles.statChangeInline} ${stat.changeType === 'positive' ? styles.positive : styles.negative}`}>
                        {stat.changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {changeNum}
                      </span>
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
              <h3 className={styles.tableTitle}>Recent Audio Calls</h3>
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
                              {call.fan.isVerified && <GradientBadgeCheck size={18} />}
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
                  <Phone size={14} className={styles.earningsIcon} />
                </div>
                <h3 className={styles.earningsTitle}>Today's Audio Call Earnings</h3>
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

          {/* Peak Hours Chart */}
          <div className={styles.peakCard}>
            <div className={styles.peakHeader}>
              <div className={styles.peakTitleRow}>
                <h3 className={styles.peakTitle}>Peak Audio Call Hours</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.peakChartWrapper}>
              <div className={styles.peakYAxis}>
                {[peakHours.maxY, peakHours.maxY * 0.75, peakHours.maxY * 0.5, peakHours.maxY * 0.25, 0].map((val, i) => (
                  <span key={i} className={styles.peakYLabel}>{val}</span>
                ))}
              </div>
              <div className={styles.peakChart}>
                {peakHours.hours.map((hour, index) => (
                  <div key={index} className={styles.peakBar}>
                    <div
                      className={styles.peakBarFill}
                      style={{ height: `${(hour.value / peakHours.maxY) * 100}%` }}
                    />
                    {hour.label && <span className={styles.peakBarLabel}>{hour.label}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.peakLegend}>
              <span className={styles.peakLegendDot} />
              <span className={styles.peakLegendText}>Minutes</span>
            </div>
            <div className={styles.peakInfo}>
              <span className={styles.peakTime}>Peak time: {peakHours.peakTime}</span>
              <span className={styles.peakBoost}>You earn {peakHours.boostPercentage} more during this time.</span>
            </div>
          </div>

          {/* Tips Card */}
          <div className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <div className={styles.tipsIconWrap}>
                <Lightbulb size={14} className={styles.tipsIcon} fill="currentColor" />
              </div>
              <h3 className={styles.tipsTitle}>Tips to Boost Audio Call Earnings</h3>
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
