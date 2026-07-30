import React, { useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  MoreVertical,
  Phone,
  Video,
  Wallet,
  Users,
  Check,
  Clock,
  PhoneOff,
  Lightbulb,
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import styles from './LiveCallsPage.module.css';

const GradientBadgeCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="badgeGradLive" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e10075" />
        <stop offset="100%" stopColor="#7e00f3" />
      </linearGradient>
    </defs>
    <path 
      d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" 
      fill="url(#badgeGradLive)" 
    />
    <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const iconMap = {
  phone: Clock,
  earnings: Wallet,
  requests: Users,
  completed: Check,
  missed: PhoneOff,
};

const callRows = [
  {
    id: 1,
    fan: { name: 'Bella Rose', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '10:24 PM',
    duration: '18:32',
    earned: '$9.16',
    status: 'Completed',
  },
  {
    id: 2,
    fan: { name: 'Michael_23', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '9:41 PM',
    duration: '12:07',
    earned: '$6.04',
    status: 'Completed',
  },
  {
    id: 3,
    fan: { name: 'ChrisFit', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '8:58 PM',
    duration: '07:45',
    earned: '$3.88',
    status: 'Completed',
  },
  {
    id: 4,
    fan: { name: 'Alex_World', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '8:12 PM',
    duration: '22:18',
    earned: '$11.09',
    status: 'Missed',
  },
  {
    id: 5,
    fan: { name: 'DannyBoy', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '6:55 PM',
    duration: '05:10',
    earned: '$2.58',
    status: 'Completed',
  },
  {
    id: 6,
    fan: { name: 'Jake_88', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '6:55 PM',
    duration: '15:31',
    earned: '$7.76',
    status: 'Missed',
  },
  {
    id: 7,
    fan: { name: 'NickVibes', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '5:35 PM',
    duration: '10:03',
    earned: '$5.02',
    status: 'Completed',
  },
  {
    id: 8,
    fan: { name: 'FitLover', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '4:48 PM',
    duration: '09:14',
    earned: '$4.57',
    status: 'Completed',
  },
  {
    id: 9,
    fan: { name: 'SunsetKing', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '4:00 PM',
    duration: '14:20',
    earned: '$8.52',
    status: 'Completed',
  },
  {
    id: 10,
    fan: { name: 'DeepConvo', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '3:20 PM',
    duration: '07:55',
    earned: '$4.79',
    status: 'Missed',
  },
  {
    id: 11,
    fan: { name: 'QuietStorm', isVerified: true },
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    type: 'Video Call',
    typeIcon: Video,
    date: 'May 26, 2024',
    time: '2:10 PM',
    duration: '05:30',
    earned: '$3.30',
    status: 'Completed',
  },
  {
    id: 12,
    fan: { name: 'StarGazer', isVerified: false },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    type: 'Audio Call',
    typeIcon: Phone,
    date: 'May 26, 2024',
    time: '1:05 PM',
    duration: '11:42',
    earned: '$5.85',
    status: 'Completed',
  },
];

const topHours = [
  { value: 0.28, label: '12am' },
  { value: 0.50, label: '2am' },
  { value: 0.74, label: '4am' },
  { value: 0.42, label: '6am' },
  { value: 0.70, label: '8am' },
  { value: 0.62, label: '10am' },
  { value: 0.52, label: '12pm' },
  { value: 0.95, label: '2pm' },
  { value: 0.71, label: '4pm' },
  { value: 0.57, label: '6pm' },
  { value: 0.69, label: '8pm' },
];

export const LiveCallsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('All Calls');
  const [visibleCalls, setVisibleCalls] = useState(9);

  const maxHours = Math.ceil(Math.max(...topHours.map(h => h.value)) * 4) / 4;

  const callStats = useMemo(
    () => [
      {
        id: 'completed',
        label: 'Completed Calls',
        value: '86',
        change: '+18%',
        changeType: 'positive',
        period: 'vs last week',
        icon: 'completed',
        color: '#10b981',
      },
      {
        id: 'minutes',
        label: 'Total Call Minutes',
        value: '1,250',
        change: '+18%',
        changeType: 'positive',
        period: 'vs last week',
        icon: 'phone',
        color: '#a855f7',
      },
      {
        id: 'earnings',
        label: 'Earnings',
        value: '$2,540.00',
        change: '+22%',
        changeType: 'positive',
        period: 'vs last week',
        icon: 'earnings',
        color: '#22c55e',
      },
      {
        id: 'missed',
        label: 'Missed Calls',
        value: '5',
        change: '17%',
        changeType: 'negative',
        period: 'vs last week',
        icon: 'missed',
        color: '#ef4444',
      },
      {
        id: 'pending',
        label: 'Pending Requests',
        value: '12',
        link: 'View Requests',
        icon: 'requests',
        color: '#f59e0b',
      },
    ],
    []
  );

  const recentCalls = useMemo(() => callRows.slice(0, visibleCalls), [visibleCalls]);
  const showMore = visibleCalls < callRows.length;
  const tabs = ['All Calls', 'Audio Calls', 'Video Calls'];

  return (
    <div className={`${styles.liveCallsContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.callCardsGrid}>
            <article className={styles.callCard}>
              <div className={styles.callCardTop}>
                <div className={styles.callIconWrap} style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <Phone size={28} className={styles.callIcon} />
                </div>
                <div className={styles.callCopy}>
                  <h3 className={styles.callTitle}>Audio Calls</h3>
                  <p className={styles.callDesc}>Connect with fans through private audio calls.</p>
                  <div className={styles.rateLine}>
                    <span className={styles.rateLabel}>Your rate:</span>
                    <span className={styles.rateValue}>$0.50</span>
                    <span className={styles.rateUnit}>/ min</span>
                  </div>
                  <div className={styles.onlineLine}>
                    <span className={styles.onlineDot} />
                    <span>Online Now</span>
                  </div>
                </div>
              </div>

              <div className={styles.callActions}>
                <button className={styles.primaryAction} type="button" style={{ background: 'linear-gradient(135deg, #047857 0%, #047857 90%, #ffffff 100%)' }}>
                  Go Live Now
                </button>
                <button className={styles.secondaryAction} type="button" style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#10b981' }}>
                  Edit Rate
                </button>
              </div>
            </article>

            <article className={styles.callCard}>
              <div className={styles.callCardTop}>
                <div className={styles.callIconWrap} style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                  <Video size={28} className={styles.callIcon} />
                </div>
                <div className={styles.callCopy}>
                  <h3 className={styles.callTitle}>Video Calls</h3>
                  <p className={styles.callDesc}>Connect face-to-face with your fans.</p>
                  <div className={styles.rateLine}>
                    <span className={styles.rateLabel}>Your rate:</span>
                    <span className={styles.rateValue}>$2.00</span>
                    <span className={styles.rateUnit}>/ min</span>
                  </div>
                  <div className={styles.onlineLine}>
                    <span className={styles.onlineDot} />
                    <span>Online Now</span>
                  </div>
                </div>
              </div>

              <div className={styles.callActions}>
                <button className={styles.primaryAction} type="button" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #2563eb 90%, #ffffff 100%)' }}>
                  Go Live Now
                </button>
                <button className={styles.secondaryAction} type="button" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6' }}>
                  Edit Rate
                </button>
              </div>
            </article>
          </div>

          {/* Mobile quick action cards - exact dashboard style */}
          <div className={styles.mobileQuickActions}>
            <div className={styles.mobileQaCard}>
              <div className={styles.mobileQaTop}>
                <div className={styles.mobileQaIconWrap} style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <Phone size={24} style={{ color: '#10b981' }} />
                </div>
                <div className={styles.mobileQaInfo}>
                  <div className={styles.mobileQaHeaderRow}>
                    <h3 className={styles.mobileQaTitle}>Audio Calls</h3>
                    <div className={styles.mobileQaStatus}>
                      <span className={styles.mobileQaDot} /> Online
                    </div>
                  </div>
                  <p className={styles.mobileQaRate}>Your rate: <strong style={{ color: '#10b981' }}>$0.50</strong> / min</p>
                </div>
              </div>
              <div className={styles.mobileQaButtons}>
                <button className={styles.mobileGoLiveBtn} type="button" style={{ background: 'linear-gradient(135deg, #10b981 0%, #10b981 90%, #ffffff 100%)' }}>
                  Go Live Now
                </button>
                <button className={styles.mobileEditRateBtn} type="button" style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#10b981' }}>
                  Edit Rate
                </button>
              </div>
            </div>
            <div className={styles.mobileQaCard}>
              <div className={styles.mobileQaTop}>
                <div className={styles.mobileQaIconWrap} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Video size={24} style={{ color: '#3b82f6' }} />
                </div>
                <div className={styles.mobileQaInfo}>
                  <div className={styles.mobileQaHeaderRow}>
                    <h3 className={styles.mobileQaTitle}>Video Calls</h3>
                    <div className={styles.mobileQaStatus}>
                      <span className={styles.mobileQaDot} /> Online
                    </div>
                  </div>
                  <p className={styles.mobileQaRate}>Your rate: <strong style={{ color: '#3b82f6' }}>$2.00</strong> / min</p>
                </div>
              </div>
              <div className={styles.mobileQaButtons}>
                <button className={styles.mobileGoLiveBtn} type="button" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #3b82f6 90%, #ffffff 100%)' }}>
                  Go Live Now
                </button>
                <button className={styles.mobileEditRateBtn} type="button" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6' }}>
                  Edit Rate
                </button>
              </div>
            </div>
          </div>

          <section className={styles.statsGrid}>
            {callStats.map((stat) => {
              const Icon = iconMap[stat.icon];
              const changeNum = stat.change ? stat.change.replace(/[+\-]/g, '') : '';
              return (
                <div key={stat.id} className={`${styles.statCard} ${stat.id === 'missed' ? styles.missedStatMobile : ''}`}>
                  <div className={styles.statIconWrap} style={{ background: `${stat.color}20` }}>
                    <Icon size={20} style={{ color: stat.color }} fill={stat.icon === 'earnings' || stat.icon === 'phone' ? 'none' : stat.color} />
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
                  {stat.link && (
                    <span className={styles.statLink}>
                      {stat.link} <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </section>

          <section className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h3 className={styles.activityTitle}>Recent Call Activity</h3>
              <div className={styles.activityTabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${styles.activityTab} ${activeTab === tab ? styles.activityTabActive : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.activityTable}>
                <thead>
                  <tr>
                    <th>Fan</th>
                    <th>Type</th>
                    <th>Date &amp; Time</th>
                    <th>Duration</th>
                    <th>Earned</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((row) => {
                    const TypeIcon = row.typeIcon;
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className={styles.fanInfo}>
                            <img src={row.avatar} alt={row.fan.name} className={styles.fanAvatar} />
                            <div className={styles.fanDetails}>
                              <span className={styles.fanName}>
                                {row.fan.name}
                                {row.fan.isVerified && <GradientBadgeCheck size={18} />}
                              </span>
                            </div>
                          </div>
                        </td>
                      <td>
                        <TypeIcon size={16} style={{ color: row.type === 'Video Call' ? '#a78bfa' : '#34d399', verticalAlign: 'middle' }} />
                      </td>
                        <td>
                          <span className={styles.dateTime}>{`${row.date}\n${row.time}`}</span>
                        </td>
                        <td>{row.duration}</td>
                        <td className={styles.earnedCell}>{row.earned}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${row.status === 'Completed' ? styles.statusCompleted : styles.statusMissed}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <button className={styles.moreBtn} type="button" aria-label="More actions">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileActivityList}>
              {recentCalls.map((row) => (
                <article key={row.id} className={styles.mobileActivityCard}>
                  <div className={styles.mobileActivityTop}>
                    <div className={styles.fanInfo}>
                      <img src={row.avatar} alt={row.fan.name} className={styles.fanAvatar} />
                      <div className={styles.fanDetails}>
                        <span className={styles.fanName}>
                          {row.fan.name}
                        </span>
                      </div>
                    </div>
                    <div className={styles.mobileTopActions}>
                      <row.typeIcon size={16} className={styles.mobileTypeIcon} style={{ color: row.type === 'Video Call' ? '#3b82f6' : '#22c55e' }} />
                      <button className={styles.moreBtn} type="button" aria-label="More actions">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.mobileActivityMeta}>
                    <span className={styles.mobileMetaLine}>{row.date} · {row.time}</span>
                    <span className={styles.mobileMetaLine}>{row.duration}</span>
                  </div>

                  <div className={styles.mobileActivityFooter}>
                    <span className={styles.earnedCell}>{row.earned}</span>
                    <span className={`${styles.statusBadge} ${row.status === 'Completed' ? styles.statusCompleted : styles.statusMissed}`}>
                      {row.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {showMore && (
              <button className={styles.loadMoreBtn} type="button" onClick={() => setVisibleCalls((count) => Math.min(count + 5, callRows.length))}>
                Load More <ChevronDown size={16} />
              </button>
            )}
          </section>
        </div>

        <aside className={styles.rightSidebar}>
          {/* Desktop combined earnings card */}
          <section className={`${styles.sidebarCard} ${styles.desktopEarningsCard}`}>
            <div className={styles.earningsHeader}>
              <div className={styles.earningsTitleRow}>
                <div className={styles.earningsIconWrap}>
                  <Wallet size={14} className={styles.earningsIcon} />
                </div>
                <h3 className={styles.earningsTitle}>Today's Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.earningsAmount}>$412.80</div>
            <div className={styles.earningsChange}>
              <span className={styles.earningsUp}>↑ 26%</span>
              <span className={styles.changeLabel}>vs last yesterday</span>
            </div>
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Total Minutes</span>
                <span className={styles.earningsStatValue}>1,250 min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>86</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>5</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>$330.24</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn} type="button" onClick={() => navigateTo('/creators/dashboard')}>
              View Earnings
            </button>
          </section>

          {/* Mobile separate audio earnings card */}
          <section className={`${styles.sidebarCard} ${styles.mobileAudioEarningsCard}`}>
            <div className={styles.earningsHeader}>
              <div className={styles.earningsTitleRow}>
                <div className={styles.earningsIconWrap}>
                  <Phone size={14} className={styles.earningsIcon} style={{ color: '#10b981' }} />
                </div>
                <h3 className={styles.earningsTitle}>Today's Audio Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.earningsAmount}>$185.40</div>
            <div className={styles.earningsChange}>
              <span className={styles.earningsUp}>↑ 18%</span>
              <span className={styles.changeLabel}>vs last yesterday</span>
            </div>
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Audio Minutes</span>
                <span className={styles.earningsStatValue}>370 min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>42</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>3</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>$148.00</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn} type="button" onClick={() => navigateTo('/creators/dashboard')}>
              View Earnings
            </button>
          </section>

          {/* Mobile separate video earnings card */}
          <section className={`${styles.sidebarCard} ${styles.mobileVideoEarningsCard}`}>
            <div className={styles.earningsHeader}>
              <div className={styles.earningsTitleRow}>
                <div className={styles.earningsIconWrap}>
                  <Video size={14} className={styles.earningsIcon} style={{ color: '#3b82f6' }} />
                </div>
                <h3 className={styles.earningsTitle}>Today's Video Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.earningsAmount}>$227.40</div>
            <div className={styles.earningsChange}>
              <span className={styles.earningsUp}>↑ 32%</span>
              <span className={styles.changeLabel}>vs last yesterday</span>
            </div>
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Video Minutes</span>
                <span className={styles.earningsStatValue}>880 min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>44</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>2</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>$182.24</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn} type="button" onClick={() => navigateTo('/creators/dashboard')}>
              View Earnings
            </button>
          </section>

          <section className={`${styles.sidebarCard} ${styles.callPerformanceCard}`}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Call Performance</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.performanceBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="173.19 77.81" strokeDashoffset="62.75" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="10.04 240.96" strokeDashoffset="-110.44" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="67.77 183.23" strokeDashoffset="-120.48" strokeLinecap="round" />
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>1,250</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Minutes</text>
                  </svg>
                </div>
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#10b981' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Completed</span>
                    <span className={styles.legendValue}>860 min (69%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Missed</span>
                    <span className={styles.legendValue}>50 min (4%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Pending</span>
                    <span className={styles.legendValue}>340 min (27%)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.sidebarCard} ${styles.topCallHoursCard}`}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Top Call Hours</h3>
              <PeriodDropdown variant="text" />
            </div>
            <div className={styles.hoursChartWrapper}>
              <div className={styles.hoursYAxis}>
                {[maxHours, +(maxHours * 0.75).toFixed(2), +(maxHours * 0.5).toFixed(2), +(maxHours * 0.25).toFixed(2), 0].map((val, i) => (
                  <span key={i} className={styles.hoursYLabel}>{val}</span>
                ))}
              </div>
              <div className={styles.hoursChart}>
                {topHours.map((hour, index) => (
                  <div key={index} className={styles.hoursBar}>
                    <div className={styles.hoursBarFill} style={{ height: `${(hour.value / maxHours) * 100}%` }} />
                    <span className={styles.hoursBarLabel}>{hour.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${styles.sidebarCard} ${styles.tipsCard}`}>
            <div className={styles.tipsHeader}>
              <div className={styles.tipsIconWrap}>
                <Lightbulb size={14} className={styles.tipsIcon} fill="currentColor" />
              </div>
              <h3 className={styles.tipsTitle}>Tips to Boost Call Earnings</h3>
            </div>
            <ul className={styles.tipsList}>
              <li className={styles.tipItem}>
                <span className={styles.tipCheck}><Check size={14} className={styles.tipCheckIcon} /></span>
                Go live during peak hours (6PM - 12AM)
              </li>
              <li className={styles.tipItem}>
                <span className={styles.tipCheck}><Check size={14} className={styles.tipCheckIcon} /></span>
                Keep your online status active
              </li>
              <li className={styles.tipItem}>
                <span className={styles.tipCheck}><Check size={14} className={styles.tipCheckIcon} /></span>
                Offer engaging conversations
              </li>
              <li className={styles.tipItem}>
                <span className={styles.tipCheck}><Check size={14} className={styles.tipCheckIcon} /></span>
                Promote your call rate on feed
              </li>
              <li className={styles.tipItem}>
                <span className={styles.tipCheck}><Check size={14} className={styles.tipCheckIcon} /></span>
                Respond to call requests quickly
              </li>
            </ul>
            <button className={styles.viewAllTipsBtn} type="button">
              View All Tips <ArrowRight size={14} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
