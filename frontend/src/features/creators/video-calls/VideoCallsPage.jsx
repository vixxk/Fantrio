import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { Phone, Clock, Wallet, PhoneOff, Users, ChevronDown, Video, Edit2, MoreVertical, ArrowRight, Lightbulb, Info, X, Loader2, Play } from 'lucide-react';
import { api, BASE_URL } from '../../../services/api';
import { useToast } from '../../../components/Toast/Toast';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { CallRateDialog } from '../calls/CallRateDialog';
import { ConfirmToggleDialog } from '../../../components/ConfirmToggleDialog/ConfirmToggleDialog';
import { buildCallInsights } from '../callInsights';
import { useInactivityOffline } from '../../../hooks/useInactivityOffline';
import styles from './VideoCallsPage.module.css';

const iconMap = {
  video: Video,
  clock: Clock,
  dollar: Wallet,
  phoneMissed: PhoneOff,
  users: Users,
  phone: Phone,
};

export const VideoCallsPage = () => {
  const { darkMode, navigateTo, user } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [period, setPeriod] = useState('All Time');
  const [visibleCalls, setVisibleCalls] = useState(8);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailsCall, setDetailsCall] = useState(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useInactivityOffline(user?.role);

  // Real-time SSE listener for Creator online/offline button state
  useEffect(() => {
    const sseUrl = `${BASE_URL}/creators/presence/sse`;
    const sse = new EventSource(sseUrl, { withCredentials: true });
    sse.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload) {
          setData((prev) => (prev ? {
            ...prev,
            videoAvailable: payload.videoAvailable,
            audioAvailable: payload.audioAvailable
          } : prev));
        }
      } catch { /* noop */ }
    };
    return () => sse.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  const videoAvailable = data ? data.videoAvailable !== false : true;

  const handleToggleLive = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await api.post('/creators/profile/toggle-calls', { type: 'video', available: !videoAvailable });
      if (res.status !== 'success') throw new Error(res.message || 'Failed to update status');
      setData((prev) => ({
        ...prev,
        audioAvailable: res.profile.audioAvailable,
        videoAvailable: res.profile.videoAvailable,
      }));
      toast.success(videoAvailable ? 'You are now offline for video calls.' : 'You are now live for video calls.');
    } catch (err) {
      toast.error(err?.message || 'Could not update status. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveRate = async (rate) => {
    const res = await api.put('/creators/profile', { rates: { videoCallPerMin: rate } });
    if (res.status !== 'success') {
      throw new Error(res.message || 'Failed to update rate');
    }
    setData((prev) => ({
      ...prev,
      audioRate: res.profile && res.profile.rates ? res.profile.rates.audioCallPerMin : prev.audioRate,
      videoRate: res.profile && res.profile.rates ? res.profile.rates.videoCallPerMin : rate,
    }));
    toast.success('Video call rate updated successfully.');
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      setLoading(true);
      api.get(`/creators/panel/calls/video?period=${encodeURIComponent(period)}`)
        .then((res) => { if (mounted) setData(res); })
        .catch(() => { if (mounted) setError('Could not load video call stats. Please try again.'); })
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; };
  }, [period]);

  const recentCalls = data?.recentCalls || [];
  const filteredCalls = recentCalls.filter((call) => activeTab === 'All' || call.status === activeTab);
  const visibleRecentCalls = filteredCalls.slice(0, visibleCalls);
  const hasMore = visibleCalls < filteredCalls.length;
  const stats = (data?.callStats || []).filter((s) => s.id !== 'pendingRequests');
  const earnings = data?.earnings || {};
  const performanceData = data?.performanceData || { completed: {}, missed: {}, pending: {} };
  const peakHours = data?.peakHours || { hours: [], maxY: 1, peakTime: '—', boostPercentage: '0%' };
  const dailyMinutes = data?.dailyMinutes || { period: 'This Week', days: [], maxY: 1 };
  const callTabs = data?.callTabs || ['All', 'Completed', 'Missed', 'Pending'];

  const todayChangePct = (() => {
    const raw = earnings.change || '';
    const sign = raw.startsWith('-') ? -1 : 1;
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : sign * n;
  })();
  const boostInsights = buildCallInsights({
    type: 'Video call',
    peakTime: peakHours.peakTime !== 'N/A' && peakHours.peakTime !== '—' ? peakHours.peakTime : null,
    boostPercentage: peakHours.boostPercentage || '0%',
    completionRate: performanceData.completed.percentage,
    completedCount: performanceData.completed.count,
    missedCount: performanceData.missed.count,
    todayChangePct,
    isOnline: data?.isOnline,
    rate: data?.videoRate || 0,
  });

  const getStatusClass = (status) => {
    if (!status) return styles.statusCompleted;
    const s = status.toLowerCase();
    if (s.includes('completed')) return styles.statusCompleted;
    if (s.includes('missed') || s.includes('rejected')) return styles.statusMissed;
    if (s.includes('pending')) return styles.statusPending;
    return styles.statusCompleted;
  };

  if (loading) {
    return (
      <div className={`${styles.callsContainer} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.heroCard}>
              <div className={styles.heroContent}>
                <div className={styles.heroIconWrap}>
                  <ShimmerSkeleton variant="circle" width="56px" height="56px" />
                </div>
                <div className={styles.heroInfo}>
                  <ShimmerSkeleton variant="text" width="40%" height="20px" />
                  <ShimmerSkeleton variant="text" width="65%" height="13px" marginTop="6px" />
                  <ShimmerSkeleton variant="text" width="30%" height="12px" marginTop="8px" />
                  <ShimmerSkeleton variant="text" width="25%" height="12px" marginTop="4px" />
                </div>
              </div>
              <div className={styles.heroActions}>
                <ShimmerSkeleton variant="button" height="38px" width="120px" />
                <ShimmerSkeleton variant="button" height="38px" width="120px" />
              </div>
            </div>

            <div className={styles.statsGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statIconWrap}>
                    <ShimmerSkeleton variant="circle" width="36px" height="36px" />
                  </div>
                  <div className={styles.statContent}>
                    <ShimmerSkeleton variant="text" width="55%" height="11px" />
                    <ShimmerSkeleton variant="text" width="35%" height="18px" marginTop="4px" />
                    <ShimmerSkeleton variant="text" width="25%" height="10px" marginTop="4px" />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.callsTableCard}>
              <div className={styles.tableHeader}>
                <ShimmerSkeleton variant="text" width="35%" height="16px" />
                <div className={styles.tableTabs}>
                  <ShimmerSkeleton variant="chip" width="50px" height="24px" />
                  <ShimmerSkeleton variant="chip" width="60px" height="24px" />
                  <ShimmerSkeleton variant="chip" width="55px" height="24px" />
                  <ShimmerSkeleton variant="chip" width="50px" height="24px" />
                </div>
              </div>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                  <ShimmerSkeleton variant="circle" width="36px" height="36px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <ShimmerSkeleton variant="text" width="50%" height="12px" />
                    <ShimmerSkeleton variant="text" width="30%" height="10px" />
                  </div>
                  <ShimmerSkeleton variant="text" width="55px" height="12px" />
                  <ShimmerSkeleton variant="text" width="45px" height="12px" />
                  <ShimmerSkeleton variant="chip" width="50px" height="20px" />
                  <ShimmerSkeleton variant="circle" width="28px" height="28px" />
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.rightSidebar}>
            <div className={styles.earningsCard}>
              <ShimmerSkeleton variant="text" width="50%" height="14px" />
              <ShimmerSkeleton variant="text" width="30%" height="26px" marginTop="0.75rem" />
              <ShimmerSkeleton variant="text" width="45%" height="11px" marginTop="0.5rem" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <ShimmerSkeleton variant="text" width="55%" height="10px" />
                    <ShimmerSkeleton variant="text" width="30%" height="12px" />
                  </div>
                ))}
              </div>
              <ShimmerSkeleton variant="button" height="36px" marginTop="1rem" />
            </div>

            <div className={styles.performanceCard}>
              <ShimmerSkeleton variant="text" width="40%" height="14px" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                <ShimmerSkeleton variant="circle" width="100px" height="100px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShimmerSkeleton variant="circle" width="10px" height="10px" />
                      <ShimmerSkeleton variant="text" width="75%" height="10px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.dailyCard}>
              <ShimmerSkeleton variant="text" width="35%" height="14px" />
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem', alignItems: 'flex-end', height: '100px' }}>
                {Array.from({ length: 24 }).map((_, idx) => (
                  <ShimmerSkeleton key={idx} variant="text" width="4px" height={`${15 + Math.random() * 70}px`} style={{ flex: 1 }} />
                ))}
              </div>
            </div>

            <div className={styles.tipsCard}>
              <ShimmerSkeleton variant="text" width="55%" height="14px" />
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <ShimmerSkeleton variant="circle" width="14px" height="14px" />
                  <ShimmerSkeleton variant="text" width="80%" height="11px" />
                </div>
              ))}
              <ShimmerSkeleton variant="text" width="40%" height="12px" marginTop="0.75rem" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`${styles.callsContainer} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.heroCard}>
              <div className={styles.heroContent}>
                <div className={styles.heroInfo}>
                  <h2 className={styles.heroTitle}>Video Calls</h2>
                  <p className={styles.heroDesc} style={{ color: '#ef4444' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <span className={styles.rateValue}>{data?.videoRate != null ? data.videoRate : '0'}</span>
                  <span className={styles.rateUnit}>coins / min</span>
                </div>
                <div className={styles.onlineStatus}>
                  <span className={videoAvailable ? styles.onlineDot : styles.offlineDot} />
                  {videoAvailable ? 'Online Now' : 'Offline'}
                </div>
              </div>
              <div className={styles.heroAiGraphic}>
                <img src="/video_call_ai.png" alt="Video Call Studio" className={styles.aiGraphicImg} />
                <div className={styles.aiGraphicBadge}>
                  <span className={styles.aiBadgeDot} />
                  HD Video Call
                </div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <button
                className={`${styles.goLiveBtn} ${videoAvailable ? styles.offlineBtn : ''}`}
                type="button"
                disabled={toggling}
                onClick={() => setConfirmOpen(true)}
              >
                {toggling ? (
                  <Loader2 size={16} className={styles.toggleSpinner} />
                ) : videoAvailable ? (
                  'Go Offline'
                ) : (
                  <>
                    <Play size={16} /> Go Live Now
                  </>
                )}
              </button>
              <button className={styles.editRateBtn} type="button" onClick={() => setRateOpen(true)}>
                <Edit2 size={18} /> Edit Rate
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {stats.map((stat) => {
              const Icon = iconMap[stat.icon] || Video;
              const changeNum = stat.change ? stat.change.replace(/[+-]/g, '') : '';
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
                        {stat.change.startsWith('-') ? '↓' : '↑'} {changeNum} <span className={styles.statPeriod}>{stat.period}</span>
                      </span>
                    ) : stat.period ? (
                      <span className={styles.statSubtitle}>{stat.period}</span>
                    ) : null}
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
                    onClick={() => { setActiveTab(tab); setVisibleCalls(8); }}
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
                    <th className={styles.th}>Gifts</th>
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
                      <td className={`${styles.td} ${styles.giftsCell}`}>{call.gifts || '0 coins'}</td>
                      <td className={`${styles.td} ${styles.earned}`}>{call.earned}</td>
                      <td className={`${styles.td} ${styles.hideMobile}`}>
                        <span className={`${styles.statusBadge} ${getStatusClass(call.status)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.menuWrap} data-kebab-menu>
                          <button className={styles.moreBtn} onClick={() => toggleMenu(call.id)}>
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === call.id && (
                            <div className={styles.actionMenu}>
                              <button className={styles.actionMenuItem} onClick={() => { setOpenMenuId(null); setDetailsCall(call); }}>
                                <Info size={13} /> View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleRecentCalls.length === 0 && (
                    <tr>
                      <td className={styles.td} colSpan={7} style={{ textAlign: 'center', padding: '32px 0', opacity: 0.6 }}>
                        No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}video calls yet.
                      </td>
                    </tr>
                  )}
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
          {/* Call Earnings (selected period) */}
          <div className={styles.earningsCard}>
            <div className={styles.earningsHeader}>
              <div className={styles.earningsTitleRow}>
                <div className={styles.earningsIconWrap}>
                  <Video size={20} className={styles.earningsIcon} fill="none" />
                </div>
                <h3 className={styles.earningsTitle}>Video Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.earningsAmount}>{earnings.amount || '0 coins'}</div>
            {period !== 'All Time' && (
              <div className={styles.earningsChange}>
                <span className={earnings.change && earnings.change.startsWith('-') ? styles.negative : styles.positive}>
                  {earnings.change && earnings.change.startsWith('-') ? '↓' : '↑'} {(earnings.change || '+0%').replace(/^[+-]/, '')}
                </span>
                <span className={styles.changeLabel}>{earnings.changeLabel}</span>
              </div>
            )}
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Total Minutes</span>
                <span className={styles.earningsStatValue}>{earnings.totalMinutes || 0} min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>{earnings.completedCalls || 0}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>{earnings.missedCalls || 0}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>{earnings.estimatedPayout || '0 coins'}</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn} onClick={() => navigateTo('/creators/earnings')}>View Earnings</button>
          </div>

          {/* Performance Donut Card */}
          <div className={styles.performanceCard}>
            <div className={styles.performanceHeader}>
              <h3 className={styles.performanceTitle}>Video Call Performance</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.performanceBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.completed.color || '#3b82f6'}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.completed.percentage * 2.51} ${251 - performanceData.completed.percentage * 2.51}`}
                      strokeDashoffset="62.75"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.missed.color || '#f43f5e'}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.missed.percentage * 2.51} ${251 - performanceData.missed.percentage * 2.51}`}
                      strokeDashoffset={62.75 - performanceData.completed.percentage * 2.51}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={performanceData.pending.color || '#eab308'}
                      strokeWidth="12"
                      strokeDasharray={`${performanceData.pending.percentage * 2.51} ${251 - performanceData.pending.percentage * 2.51}`}
                      strokeDashoffset={62.75 - (performanceData.completed.percentage + performanceData.missed.percentage) * 2.51}
                      strokeLinecap="round"
                    />
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{performanceData.totalMinutes || 0}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Minutes</text>
                  </svg>
                </div>
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.completed.color || '#3b82f6' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Completed</span>
                    <span className={styles.legendValue}>{performanceData.completed.minutes || 0} min ({performanceData.completed.percentage || 0}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.missed.color || '#f43f5e' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Missed</span>
                    <span className={styles.legendValue}>{performanceData.missed.count || 0} calls ({performanceData.missed.percentage || 0}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: performanceData.pending.color || '#eab308' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Pending</span>
                    <span className={styles.legendValue}>{performanceData.pending.count || 0} calls ({performanceData.pending.percentage || 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Minutes Chart */}
          <div className={styles.dailyCard}>
            <div className={styles.dailyHeader}>
              <h3 className={styles.dailyTitle}>Daily Minutes</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.dailyChartWrapper}>
              <div className={styles.dailyYAxis}>
                {[dailyMinutes.maxY, Math.round(dailyMinutes.maxY * 0.75), Math.round(dailyMinutes.maxY * 0.5), Math.round(dailyMinutes.maxY * 0.25), 0].map((val, i) => (
                  <span key={i} className={styles.dailyYLabel}>{val}</span>
                ))}
              </div>
              <div className={styles.dailyChart}>
                {(dailyMinutes.days || []).map((day, index) => (
                  <div key={index} className={styles.dailyBar}>
                    <div
                      className={styles.dailyBarFill}
                      style={{ height: `${(day.minutes / (dailyMinutes.maxY || 1)) * 100}%` }}
                    />
                    <span className={styles.dailyBarLabel}>{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Card */}
          <div className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <div className={styles.tipsIconWrap}>
                <Lightbulb size={14} className={styles.tipsIcon} fill="currentColor" />
              </div>
              <h3 className={styles.tipsTitle}>Boost Video Call Earnings</h3>
            </div>
            <ul className={styles.tipsList}>
              {boostInsights.map((ins) => (
                <li key={ins.id} className={styles.tipItem}>
                  <span className={`${styles.boostDot} ${styles[`tone${ins.tone.charAt(0).toUpperCase()}${ins.tone.slice(1)}`]}`} />
                  <div className={styles.boostBody}>
                    <span className={styles.boostTitle}>{ins.title}</span>
                    <span className={styles.boostDetail}>{ins.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button className={styles.viewAllTipsBtn} onClick={() => navigateTo('/creators/analytics')}>
              More Insights <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Call details modal */}
      {detailsCall && (
        <div className={styles.detailsOverlay} onClick={() => setDetailsCall(null)}>
          <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsHeader}>
              <h3 className={styles.detailsTitle}>Call Details</h3>
              <button className={styles.detailsClose} type="button" onClick={() => setDetailsCall(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.detailsBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Fan</span>
                <span className={styles.detailValue}>
                  <img src={detailsCall.fan.avatar} alt={detailsCall.fan.name} className={styles.detailAvatar} />
                  {detailsCall.fan.name}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date</span>
                <span className={styles.detailValue}>{detailsCall.dateTime}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Duration</span>
                <span className={styles.detailValue}>{detailsCall.duration}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Gifts</span>
                <span className={styles.detailValue}>{detailsCall.gifts || '0 coins'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Earned</span>
                <span className={styles.detailValue}>{detailsCall.earned}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>
                  <span className={`${styles.statusBadge} ${getStatusClass(detailsCall.status)}`}>
                    {detailsCall.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit call rate dialog */}
      <CallRateDialog
        callType={rateOpen ? 'video' : null}
        currentRate={data?.videoRate != null ? data.videoRate : 0}
        darkMode={darkMode}
        onClose={() => setRateOpen(false)}
        onSave={handleSaveRate}
      />

      {/* Go Live / Go Offline confirmation */}
      <ConfirmToggleDialog
        open={confirmOpen}
        title={videoAvailable ? 'Go Offline?' : 'Go Live Now?'}
        message={
          videoAvailable
            ? "Fans won't be able to request video calls while you're offline. Your rate stays the same."
            : 'Go live for video calls so fans can request private calls at your current rate.'
        }
        confirmLabel={videoAvailable ? 'Go Offline' : 'Go Live Now'}
        icon={videoAvailable ? <PhoneOff size={22} /> : <Video size={22} />}
        accent={videoAvailable ? '#f87171' : '#3b82f6'}
        busy={toggling}
        busyLabel="Updating…"
        darkMode={darkMode}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); handleToggleLive(); }}
      />
    </div>
  );
};
