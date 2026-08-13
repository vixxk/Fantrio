import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  ArrowRight,
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
  Info,
  X,
  Loader2,
  Play,
} from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../components/Toast/Toast';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { CallRateDialog } from '../calls/CallRateDialog';
import { ConfirmToggleDialog } from '../../../components/ConfirmToggleDialog/ConfirmToggleDialog';
import { buildCallInsights } from '../callInsights';
import styles from './LiveCallsPage.module.css';

const iconMap = {
  phone: Clock,
  earnings: Wallet,
  requests: Users,
  completed: Check,
  missed: PhoneOff,
};

export const LiveCallsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('All Calls');
  const [period, setPeriod] = useState('All Time');
  const [visibleCalls, setVisibleCalls] = useState(9);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailsRow, setDetailsRow] = useState(null);
  const [rateTarget, setRateTarget] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-kebab-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  const getStatusClass = (status) => {
    if (!status) return styles.statusCompleted;
    const s = status.toLowerCase();
    if (s.includes('completed')) return styles.statusCompleted;
    if (s.includes('missed') || s.includes('rejected')) return styles.statusMissed;
    if (s.includes('pending')) return styles.statusPending;
    return styles.statusCompleted;
  };

  const isAvailable = (type) =>
    type === 'audio' ? !!(merged && merged.audioAvailable) : !!(merged && merged.videoAvailable);

  // Go Live Now <-> Go Offline. Flips the creator's availability for the
  // given call type so fans can (or can no longer) request that call.
  const handleToggleLive = async (type) => {
    if (toggling || !merged) return;
    const available = isAvailable(type);
    setToggling(type);
    try {
      const res = await api.post('/creators/profile/toggle-calls', { type, available: !available });
      if (res.status !== 'success') throw new Error(res.message || 'Failed to update status');
      const availability = { audioAvailable: res.profile.audioAvailable, videoAvailable: res.profile.videoAvailable };
      setData((prev) => ({
        audio: { ...prev.audio, ...availability },
        video: { ...prev.video, ...availability },
      }));
      toast.success(
        !available
          ? 'You are now live for ' + (type === 'audio' ? 'audio' : 'video') + ' calls.'
          : 'You are now offline for ' + (type === 'audio' ? 'audio' : 'video') + ' calls.'
      );
    } catch (err) {
      toast.error(err?.message || 'Could not update status. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  const handleSaveRate = async (rate) => {
    const field = rateTarget === 'audio' ? 'audioCallPerMin' : 'videoCallPerMin';
    const res = await api.put('/creators/profile', { rates: { [field]: rate } });
    if (res.status !== 'success') {
      throw new Error(res.message || 'Failed to update rate');
    }
    const update = {
      audioRate: res.profile && res.profile.rates ? res.profile.rates.audioCallPerMin : rateTarget === 'audio' ? rate : undefined,
      videoRate: res.profile && res.profile.rates ? res.profile.rates.videoCallPerMin : rateTarget === 'video' ? rate : undefined,
    };
    setData((prev) => ({
      audio: { ...prev.audio, ...update },
      video: { ...prev.video, ...update },
    }));
    toast.success((rateTarget === 'audio' ? 'Audio' : 'Video') + ' call rate updated successfully.');
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
      Promise.all([
        api.get(`/creators/panel/calls/audio?period=${encodeURIComponent(period)}`),
        api.get(`/creators/panel/calls/video?period=${encodeURIComponent(period)}`)
      ])
        .then(([audio, video]) => {
          if (mounted) setData({ audio, video });
        })
        .catch(() => { if (mounted) setError('Could not load call stats. Please try again.'); })
        .finally(() => { if (mounted) setLoading(false); });
    });
    return () => { mounted = false; };
  }, [period]);

  const merged = useMemo(() => {
    if (!data) return null;
    const { audio, video } = data;

    const num = (v) => {
      if (v == null) return 0;
      const s = String(v).replace(/[^0-9.KkMm]/g, '');
      if (/[Kk]/.test(s)) return Number(parseFloat(s) * 1000) || 0;
      if (/[Mm]/.test(s)) return Number(parseFloat(s) * 1000000) || 0;
      return Number(parseFloat(s)) || 0;
    };
    const audioCalls = audio.callStats || [];
    const videoCalls = video.callStats || [];
    const get = (arr, id) => arr.find((s) => s.id === id) || {};

    const totalCalls = num(get(audioCalls, 'totalCalls').value) + num(get(videoCalls, 'totalCalls').value);
    const totalMinutes = num(get(audioCalls, 'totalMinutes').value) + num(get(videoCalls, 'totalMinutes').value);
    const totalEarned = num(get(audioCalls, 'earnings').value) + num(get(videoCalls, 'earnings').value);
    const missed = num(get(audioCalls, 'missedCalls').value) + num(get(videoCalls, 'missedCalls').value);
    const pending = num(get(audioCalls, 'pendingRequests').value) + num(get(videoCalls, 'pendingRequests').value);
    const completed = Math.max(0, totalCalls - missed - pending);

    const avg = (a, b) => Math.round(((a + b) / 2) * 100) / 100;

    // Week-over-week change, same formula the backend uses for the single-type stats
    const fmtPct = (cur, prev) => `${prev > 0 ? (cur >= prev ? '+' : '-') : cur > 0 ? '+' : ''}${prev > 0 ? Math.abs(Math.round(((cur - prev) / prev) * 100)) : cur > 0 ? 100 : 0}%`;


    // Combined raw totals so the aggregate cards derive real changes (no hardcoding)
    const aRaw = audio.rawTotals || {};
    const vRaw = video.rawTotals || {};
    const raw = {
      totalCalls: (aRaw.totalCalls || 0) + (vRaw.totalCalls || 0),
      totalMinutes: (aRaw.totalMinutes || 0) + (vRaw.totalMinutes || 0),
      totalEarned: (aRaw.totalEarned || 0) + (vRaw.totalEarned || 0),
      missedCalls: (aRaw.missedCalls || 0) + (vRaw.missedCalls || 0),
      pendingCalls: (aRaw.pendingCalls || 0) + (vRaw.pendingCalls || 0),
      prevTotalCalls: (aRaw.prevTotalCalls || 0) + (vRaw.prevTotalCalls || 0),
      prevTotalMinutes: (aRaw.prevTotalMinutes || 0) + (vRaw.prevTotalMinutes || 0),
      prevEarned: (aRaw.prevEarned || 0) + (vRaw.prevEarned || 0),
      prevMissed: (aRaw.prevMissed || 0) + (vRaw.prevMissed || 0),
    };
    const prevCompleted = Math.max(0, raw.prevTotalCalls - raw.prevMissed);
    // Comparison label comes from the backend ('' for All Time, when no change is shown)
    const audioPeriod = get(audioCalls, 'totalCalls').period || get(audioCalls, 'totalMinutes').period || '';
    const videoPeriod = get(videoCalls, 'totalCalls').period || get(videoCalls, 'totalMinutes').period || '';
    const prevLabel = audioPeriod || videoPeriod;
    const showChange = prevLabel !== '';
    const missedChange = showChange ? fmtPct(missed, raw.prevMissed) : '';

    const callStats = [
      {
        id: 'completed',
        label: 'Completed Calls',
        value: String(completed),
        change: showChange ? fmtPct(completed, prevCompleted) : '',
        changeType: 'positive',
        period: prevLabel,
        icon: 'completed',
        color: '#10b981',
      },
      {
        id: 'minutes',
        label: 'Total Call Minutes',
        value: totalMinutes.toLocaleString(),
        change: showChange ? fmtPct(totalMinutes, raw.prevTotalMinutes) : '',
        changeType: 'positive',
        period: prevLabel,
        icon: 'phone',
        color: '#a855f7',
      },
      {
        id: 'earnings',
        label: 'Earnings',
        value: `${totalEarned.toLocaleString()} coins`,
        change: showChange ? fmtPct(totalEarned, raw.prevEarned) : '',
        changeType: 'positive',
        period: prevLabel,
        icon: 'earnings',
        color: '#22c55e',
      },
      {
        id: 'missed',
        label: 'Missed Calls',
        value: String(missed),
        change: missedChange,
        changeType: missedChange.startsWith('-') ? 'positive' : 'negative',
        period: prevLabel,
        icon: 'missed',
        color: '#ef4444',
      },
    ];

    // Merge recent calls with a call type so the tabs can filter
    const recentCalls = [
      ...(audio.recentCalls || []).map((c) => ({ ...c, key: `audio-${c.id}`, typeLabel: 'Audio Calls', typeIcon: Phone })),
      ...(video.recentCalls || []).map((c) => ({ ...c, key: `video-${c.id}`, typeLabel: 'Video Calls', typeIcon: Video })),
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Peak hours: average both charts (use audio as the base shape)
    const audioHours = (audio.peakHours && audio.peakHours.hours) || [];
    const videoHours = (video.peakHours && video.peakHours.hours) || [];
    const topHours = audioHours.map((h, i) => ({
      value: avg(h.value, (videoHours[i] && videoHours[i].value) || 0) / Math.max(1, (audio.peakHours && audio.peakHours.maxY) || 1),
      label: h.label,
    }));

    const completedPct = totalCalls ? Math.round((completed / totalCalls) * 100) : 0;
    const missedPct = totalCalls ? Math.round((missed / totalCalls) * 100) : 0;
    const pendingPct = totalCalls ? Math.round((pending / totalCalls) * 100) : 0;

    const earningsAmount = (() => {
      const a = (audio.earnings && audio.earnings.totalEarnedRaw) || num((audio.earnings && audio.earnings.amount) || '0 coins');
      const v = (video.earnings && video.earnings.totalEarnedRaw) || num((video.earnings && video.earnings.amount) || '0 coins');
      return `${(a + v).toLocaleString()} coins`;
    })();
    const prevEarned = (() => {
      const a = (audio.earnings && audio.earnings.prevEarnedRaw) || 0;
      const v = (video.earnings && video.earnings.prevEarnedRaw) || 0;
      return a + v;
    })();
    const todayChangePct = showChange
      ? (prevEarned > 0
          ? Math.round(((num(earningsAmount) - prevEarned) / prevEarned) * 100)
          : (num(earningsAmount) > 0 ? 100 : 0))
      : 0;
    const estimatedPayoutRaw = ((audio.earnings && audio.earnings.estimatedPayoutRaw) || 0) + ((video.earnings && video.earnings.estimatedPayoutRaw) || 0);
    const todayMinutes = ((audio.earnings && audio.earnings.totalMinutes) || 0) + ((video.earnings && video.earnings.totalMinutes) || 0);
    const todayCompleted = ((audio.earnings && audio.earnings.completedCalls) || 0) + ((video.earnings && video.earnings.completedCalls) || 0);
    const todayMissed = ((audio.earnings && audio.earnings.missedCalls) || 0) + ((video.earnings && video.earnings.missedCalls) || 0);

    const peakEntry = topHours.length ? topHours.reduce((best, h) => (h.value > best.value ? h : best), topHours[0]) : null;
    const peakBoost = ((audio.peakHours && audio.peakHours.boostPercentage) || (video.peakHours && video.peakHours.boostPercentage) || '0%');
    const boostInsights = buildCallInsights({
      type: 'Call',
      peakTime: peakEntry && peakEntry.value > 0 ? peakEntry.label : null,
      boostPercentage: peakBoost,
      completionRate: completedPct,
      completedCount: completed,
      missedCount: missed,
      todayChangePct,
      isOnline: !!(audio.isOnline != null ? audio.isOnline : video.isOnline),
      rate: (audio.audioRate || 0) + (video.videoRate || 0),
    });

    return {
      callStats,
      recentCalls,
      topHours,
      maxHours: 1,
      todayAmount: earningsAmount,
      todayChangePct,
      changeLabel: prevLabel,
      estimatedPayout: `${estimatedPayoutRaw.toLocaleString()} coins`,
      todayMinutes,
      todayCompleted,
      todayMissed,
      completedPct,
      missedPct,
      pendingPct,
      totalMinutes,
      completed,
      missed,
      pending,
      audioRate: audio.audioRate != null ? audio.audioRate : 0,
      videoRate: video.videoRate != null ? video.videoRate : 0,
      audioAvailable: audio.audioAvailable != null ? audio.audioAvailable : true,
      videoAvailable: video.videoAvailable != null ? video.videoAvailable : true,
      isOnline: !!(audio.isOnline != null ? audio.isOnline : video.isOnline),
      boostInsights,
    };
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!merged) return [];
    if (activeTab === 'All Calls') return merged.recentCalls;
    return merged.recentCalls.filter((r) => r.typeLabel === activeTab);
  }, [merged, activeTab]);

  const recentCalls = filteredRows.slice(0, visibleCalls);
  const showMore = visibleCalls < filteredRows.length;
  const tabs = ['All Calls', 'Audio Calls', 'Video Calls'];
  const callStats = merged ? merged.callStats : [];
  const maxHours = merged ? merged.maxHours : 1;
  const topHours = merged ? merged.topHours : [];

  if (loading) {
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
                    <ShimmerSkeleton variant="text" width="60%" height="18px" />
                    <ShimmerSkeleton variant="text" width="80%" height="12px" marginTop="6px" />
                    <ShimmerSkeleton variant="text" width="45%" height="11px" marginTop="8px" />
                  </div>
                </div>
                <div className={styles.callActions}>
                  <ShimmerSkeleton variant="button" height="38px" />
                  <ShimmerSkeleton variant="button" height="38px" />
                </div>
              </article>

              <article className={styles.callCard}>
                <div className={styles.callCardTop}>
                  <div className={styles.callIconWrap} style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                    <Video size={28} className={styles.callIcon} />
                  </div>
                  <div className={styles.callCopy}>
                    <ShimmerSkeleton variant="text" width="55%" height="18px" />
                    <ShimmerSkeleton variant="text" width="75%" height="12px" marginTop="6px" />
                    <ShimmerSkeleton variant="text" width="40%" height="11px" marginTop="8px" />
                  </div>
                </div>
                <div className={styles.callActions}>
                  <ShimmerSkeleton variant="button" height="38px" />
                  <ShimmerSkeleton variant="button" height="38px" />
                </div>
              </article>
            </div>

            <div className={styles.mobileQuickActions}>
              <div className={styles.mobileQaCard}>
                <div className={styles.mobileQaTop}>
                  <ShimmerSkeleton variant="circle" width="44px" height="44px" />
                  <div className={styles.mobileQaInfo}>
                    <ShimmerSkeleton variant="text" width="50%" height="14px" />
                    <ShimmerSkeleton variant="text" width="35%" height="11px" marginTop="4px" />
                  </div>
                </div>
                <div className={styles.mobileQaButtons}>
                  <ShimmerSkeleton variant="button" height="36px" />
                  <ShimmerSkeleton variant="button" height="36px" />
                </div>
              </div>
              <div className={styles.mobileQaCard}>
                <div className={styles.mobileQaTop}>
                  <ShimmerSkeleton variant="circle" width="44px" height="44px" />
                  <div className={styles.mobileQaInfo}>
                    <ShimmerSkeleton variant="text" width="50%" height="14px" />
                    <ShimmerSkeleton variant="text" width="35%" height="11px" marginTop="4px" />
                  </div>
                </div>
                <div className={styles.mobileQaButtons}>
                  <ShimmerSkeleton variant="button" height="36px" />
                  <ShimmerSkeleton variant="button" height="36px" />
                </div>
              </div>
            </div>

            <div className={styles.statsGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statIconWrap}>
                    <ShimmerSkeleton variant="circle" width="36px" height="36px" />
                  </div>
                  <div className={styles.statContent}>
                    <ShimmerSkeleton variant="text" width="60%" height="11px" />
                    <ShimmerSkeleton variant="text" width="40%" height="18px" marginTop="4px" />
                    <ShimmerSkeleton variant="text" width="25%" height="10px" marginTop="4px" />
                  </div>
                </div>
              ))}
            </div>

            <section className={styles.activityCard}>
              <div className={styles.activityHeader}>
                <ShimmerSkeleton variant="text" width="30%" height="16px" />
                <div className={styles.activityTabs}>
                  <ShimmerSkeleton variant="chip" width="60px" height="28px" />
                  <ShimmerSkeleton variant="chip" width="70px" height="28px" />
                  <ShimmerSkeleton variant="chip" width="80px" height="28px" />
                </div>
              </div>
              <div className={styles.tableWrap}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.tableRow} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <ShimmerSkeleton variant="circle" width="36px" height="36px" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <ShimmerSkeleton variant="text" width="55%" height="12px" />
                      <ShimmerSkeleton variant="text" width="30%" height="10px" />
                    </div>
                    <ShimmerSkeleton variant="text" width="60px" height="12px" />
                    <ShimmerSkeleton variant="text" width="50px" height="12px" />
                    <ShimmerSkeleton variant="chip" width="55px" height="22px" />
                    <ShimmerSkeleton variant="circle" width="28px" height="28px" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.rightSidebar}>
            <section className={`${styles.sidebarCard} ${styles.desktopEarningsCard}`}>
              <div className={styles.earningsHeader}>
                <ShimmerSkeleton variant="text" width="45%" height="14px" />
              </div>
              <ShimmerSkeleton variant="text" width="35%" height="28px" marginTop="0.75rem" />
              <ShimmerSkeleton variant="text" width="50%" height="11px" marginTop="0.5rem" />
              <div className={styles.earningsStats}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.earningsStat}>
                    <ShimmerSkeleton variant="text" width="55%" height="10px" />
                    <ShimmerSkeleton variant="text" width="35%" height="14px" marginTop="4px" />
                  </div>
                ))}
              </div>
              <ShimmerSkeleton variant="button" height="36px" marginTop="1rem" />
            </section>

            <section className={`${styles.sidebarCard} ${styles.callPerformanceCard}`}>
              <ShimmerSkeleton variant="text" width="40%" height="14px" />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <ShimmerSkeleton variant="circle" width="100px" height="100px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShimmerSkeleton variant="circle" width="10px" height="10px" />
                      <ShimmerSkeleton variant="text" width="70%" height="10px" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${styles.sidebarCard} ${styles.topCallHoursCard}`}>
              <ShimmerSkeleton variant="text" width="35%" height="14px" />
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem', alignItems: 'flex-end', height: '120px' }}>
                {Array.from({ length: 24 }).map((_, idx) => (
                  <ShimmerSkeleton key={idx} variant="text" width="4px" height={`${20 + Math.random() * 80}px`} style={{ flex: 1 }} />
                ))}
              </div>
            </section>

            <section className={`${styles.sidebarCard} ${styles.tipsCard}`}>
              <ShimmerSkeleton variant="text" width="55%" height="14px" />
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <ShimmerSkeleton variant="circle" width="14px" height="14px" />
                  <ShimmerSkeleton variant="text" width="80%" height="11px" />
                </div>
              ))}
              <ShimmerSkeleton variant="text" width="40%" height="12px" marginTop="0.75rem" />
            </section>
          </aside>
        </div>
      </div>
    );
  }

  if (error && !merged) {
    return (
      <div className={`${styles.liveCallsContainer} ${!darkMode ? styles.light : ''}`}>
        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.callCardsGrid}>
              <article className={styles.callCard}>
                <div className={styles.callCardTop}>
                  <div className={styles.callCopy}>
                    <h3 className={styles.callTitle}>Live Calls</h3>
                    <p className={styles.callDesc} style={{ color: '#ef4444' }}>{error}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    <span className={styles.rateValue}>{merged?.audioRate != null ? merged.audioRate : '0'}</span>
                    <span className={styles.rateUnit}>coins / min</span>
                  </div>
                  <div className={styles.onlineLine}>
                    <span className={merged?.audioAvailable ? styles.onlineDot : styles.offlineDot} />
                    <span className={merged?.audioAvailable ? '' : styles.offlineText}>
                      {merged?.audioAvailable ? 'Online Now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.callActions}>
                <button
                  className={`${styles.primaryAction} ${merged?.audioAvailable ? styles.offlineAction : ''}`}
                  type="button"
                  disabled={!!toggling}
                  onClick={() => setConfirmTarget('audio')}
                  style={merged?.audioAvailable ? undefined : { background: 'linear-gradient(135deg, #047857 0%, #047857 90%, #ffffff 100%)' }}
                >
                  {toggling === 'audio' ? (
                    <Loader2 size={16} className={styles.toggleSpinner} />
                  ) : merged?.audioAvailable ? (
                    'Go Offline'
                  ) : (
                    <>
                      <Play size={16} /> Go Live Now
                    </>
                  )}
                </button>
                <button className={styles.secondaryAction} type="button" style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#10b981' }} onClick={() => setRateTarget('audio')}>
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
                    <span className={styles.rateValue}>{merged?.videoRate != null ? merged.videoRate : '0'}</span>
                    <span className={styles.rateUnit}>coins / min</span>
                  </div>
                  <div className={styles.onlineLine}>
                    <span className={merged?.videoAvailable ? styles.onlineDot : styles.offlineDot} />
                    <span className={merged?.videoAvailable ? '' : styles.offlineText}>
                      {merged?.videoAvailable ? 'Online Now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.callActions}>
                <button
                  className={`${styles.primaryAction} ${merged?.videoAvailable ? styles.offlineAction : ''}`}
                  type="button"
                  disabled={!!toggling}
                  onClick={() => setConfirmTarget('video')}
                  style={merged?.videoAvailable ? undefined : { background: 'linear-gradient(135deg, #2563eb 0%, #2563eb 90%, #ffffff 100%)' }}
                >
                  {toggling === 'video' ? (
                    <Loader2 size={16} className={styles.toggleSpinner} />
                  ) : merged?.videoAvailable ? (
                    'Go Offline'
                  ) : (
                    <>
                      <Play size={16} /> Go Live Now
                    </>
                  )}
                </button>
                <button className={styles.secondaryAction} type="button" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6' }} onClick={() => setRateTarget('video')}>
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
                      <span className={merged?.audioAvailable ? styles.mobileQaDot : styles.mobileQaDotOff} />
                      {merged?.audioAvailable ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <p className={styles.mobileQaRate}>Your rate: <strong style={{ color: '#10b981' }}>{merged?.audioRate ?? 0}</strong> coins / min</p>
                </div>
              </div>
              <div className={styles.mobileQaButtons}>
                <button
                  className={styles.mobileGoLiveBtn}
                  type="button"
                  disabled={!!toggling}
                  onClick={() => setConfirmTarget('audio')}
                  style={merged?.audioAvailable
                    ? { background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)', color: '#f87171' }
                    : { background: 'linear-gradient(135deg, #10b981 0%, #10b981 90%, #ffffff 100%)' }}
                >
                  {toggling === 'audio' ? (
                    <Loader2 size={14} className={styles.toggleSpinner} />
                  ) : merged?.audioAvailable ? (
                    'Go Offline'
                  ) : (
                    'Go Live Now'
                  )}
                </button>
                <button className={styles.mobileEditRateBtn} type="button" style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#10b981' }} onClick={() => setRateTarget('audio')}>
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
                      <span className={merged?.videoAvailable ? styles.mobileQaDot : styles.mobileQaDotOff} />
                      {merged?.videoAvailable ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <p className={styles.mobileQaRate}>Your rate: <strong style={{ color: '#3b82f6' }}>{merged?.videoRate ?? 0}</strong> coins / min</p>
                </div>
              </div>
              <div className={styles.mobileQaButtons}>
                <button
                  className={styles.mobileGoLiveBtn}
                  type="button"
                  disabled={!!toggling}
                  onClick={() => setConfirmTarget('video')}
                  style={merged?.videoAvailable
                    ? { background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)', color: '#f87171' }
                    : { background: 'linear-gradient(135deg, #3b82f6 0%, #3b82f6 90%, #ffffff 100%)' }}
                >
                  {toggling === 'video' ? (
                    <Loader2 size={14} className={styles.toggleSpinner} />
                  ) : merged?.videoAvailable ? (
                    'Go Offline'
                  ) : (
                    'Go Live Now'
                  )}
                </button>
                <button className={styles.mobileEditRateBtn} type="button" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6' }} onClick={() => setRateTarget('video')}>
                  Edit Rate
                </button>
              </div>
            </div>
          </div>

          <section className={styles.statsGrid}>
            {callStats.map((stat) => {
              const Icon = iconMap[stat.icon];
              const changeNum = stat.change ? stat.change.replace(/[+-]/g, '') : '';
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
                        {stat.change.startsWith('-') ? '↓' : '↑'} {changeNum} <span className={styles.statPeriod}>{stat.period}</span>
                      </span>
                    ) : stat.period ? (
                      <span className={styles.statSubtitle}>{stat.period}</span>
                    ) : null}
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
                    onClick={() => { setActiveTab(tab); setVisibleCalls(9); }}
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
                    <th>Gifts</th>
                    <th>Earned</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((row) => {
                    const TypeIcon = row.typeIcon || Phone;
                    const [date, time] = (row.dateTime || '\n').split('\n');
                    return (
                      <tr key={row.key}>
                        <td>
                          <div className={styles.fanInfo}>
                            <img src={row.fan.avatar} alt={row.fan.name} className={styles.fanAvatar} />
                            <div className={styles.fanDetails}>
                              <span className={styles.fanName}>
                                {row.fan.name}
                              </span>
                            </div>
                          </div>
                        </td>
                      <td>
                        <TypeIcon size={16} style={{ color: row.typeLabel === 'Video Calls' ? '#a78bfa' : '#34d399', verticalAlign: 'middle' }} />
                      </td>
                        <td>
                          <span className={styles.dateTime}>{`${date}\n${time || ''}`}</span>
                        </td>
                        <td>{row.duration}</td>
                        <td className={styles.giftsCell}>{row.gifts || '0 coins'}</td>
                        <td className={styles.earnedCell}>{row.earned}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.menuWrap} data-kebab-menu>
                            <button className={styles.moreBtn} type="button" aria-label="More actions" onClick={() => toggleMenu(row.key)}>
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === row.key && (
                              <div className={styles.actionMenu}>
                                <button className={styles.actionMenuItem} type="button" onClick={() => { setOpenMenuId(null); setDetailsRow(row); }}>
                                  <Info size={13} /> View Details
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {recentCalls.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', opacity: 0.6 }}>
                        No {activeTab === 'All Calls' ? '' : activeTab.toLowerCase() + ' '}calls yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileActivityList}>
              {recentCalls.map((row) => {
                const TypeIcon = row.typeIcon || Phone;
                const [date, time] = (row.dateTime || '\n').split('\n');
                return (
                <article key={row.key} className={styles.mobileActivityCard}>
                  <div className={styles.mobileActivityTop}>
                    <div className={styles.fanInfo}>
                      <img src={row.fan.avatar} alt={row.fan.name} className={styles.fanAvatar} />
                      <div className={styles.fanDetails}>
                        <span className={styles.fanName}>
                          {row.fan.name}
                        </span>
                      </div>
                    </div>
                    <div className={styles.mobileTopActions}>
                      <TypeIcon size={16} className={styles.mobileTypeIcon} style={{ color: row.typeLabel === 'Video Calls' ? '#3b82f6' : '#22c55e' }} />
                      <div className={styles.menuWrap} data-kebab-menu>
                        <button className={styles.moreBtn} type="button" aria-label="More actions" onClick={() => toggleMenu(row.key)}>
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === row.key && (
                          <div className={styles.actionMenu}>
                            <button className={styles.actionMenuItem} type="button" onClick={() => { setOpenMenuId(null); setDetailsRow(row); }}>
                              <Info size={13} /> View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.mobileActivityMeta}>
                    <span className={styles.mobileMetaLine}>{date} · {time}</span>
                    <span className={styles.mobileMetaLine}>{row.duration}</span>
                  </div>

                  <div className={styles.mobileActivityFooter}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className={styles.giftsCell}>{row.gifts || '0 coins'}</span>
                      <span className={styles.earnedCell}>{row.earned}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                </article>
                );
              })}
            </div>

            {showMore && (
              <button className={styles.loadMoreBtn} type="button" onClick={() => setVisibleCalls((count) => Math.min(count + 5, filteredRows.length))}>
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
                  <Wallet size={20} className={styles.earningsIcon} />
                </div>
                <h3 className={styles.earningsTitle}>Call Earnings</h3>
              </div>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.earningsAmount}>{merged ? merged.todayAmount : '0 coins'}</div>
            {merged && merged.changeLabel && (
              <div className={styles.earningsChange}>
                <span className={(merged ? merged.todayChangePct : 0) < 0 ? styles.earningsDown : styles.earningsUp}>
                  {(merged ? merged.todayChangePct : 0) < 0 ? '↓' : '↑'} {Math.abs(merged ? merged.todayChangePct : 0)}%
                </span>
                <span className={styles.changeLabel}>{merged.changeLabel}</span>
              </div>
            )}
            <div className={styles.earningsStats}>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Total Minutes</span>
                <span className={styles.earningsStatValue}>{merged ? merged.todayMinutes : 0} min</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Completed Calls</span>
                <span className={styles.earningsStatValue}>{merged ? merged.todayCompleted : 0}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Missed Calls</span>
                <span className={styles.earningsStatValue}>{merged ? merged.todayMissed : 0}</span>
              </div>
              <div className={styles.earningsStat}>
                <span className={styles.earningsStatLabel}>Estimated Payout</span>
                <span className={styles.earningsStatValue}>{merged ? merged.estimatedPayout : '0 coins'}</span>
              </div>
            </div>
            <button className={styles.viewEarningsBtn} type="button" onClick={() => navigateTo('/creators/dashboard')}>
              View Earnings
            </button>
          </section>



          <section className={`${styles.sidebarCard} ${styles.callPerformanceCard}`}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Call Performance</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.performanceBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutChart}>
                  <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${(merged?.completedPct || 0) * 2.51} ${251 - (merged?.completedPct || 0) * 2.51}`} strokeDashoffset="62.75" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${(merged?.missedPct || 0) * 2.51} ${251 - (merged?.missedPct || 0) * 2.51}`} strokeDashoffset={62.75 - (merged?.completedPct || 0) * 2.51} strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${(merged?.pendingPct || 0) * 2.51} ${251 - (merged?.pendingPct || 0) * 2.51}`} strokeDashoffset={62.75 - ((merged?.completedPct || 0) + (merged?.missedPct || 0)) * 2.51} strokeLinecap="round" />
                    <text x="50" y="48" textAnchor="middle" className={styles.donutValue}>{(merged?.totalMinutes || 0).toLocaleString()}</text>
                    <text x="50" y="58" textAnchor="middle" className={styles.donutLabel}>Total Minutes</text>
                  </svg>
                </div>
              </div>
              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#10b981' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Completed</span>
                    <span className={styles.legendValue}>{merged?.completed || 0} calls ({merged?.completedPct || 0}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Missed</span>
                    <span className={styles.legendValue}>{merged?.missed || 0} calls ({merged?.missedPct || 0}%)</span>
                  </div>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>Pending</span>
                    <span className={styles.legendValue}>{merged?.pending || 0} calls ({merged?.pendingPct || 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.sidebarCard} ${styles.topCallHoursCard}`}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Top Call Hours</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
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
                    <div className={styles.hoursBarFill} style={{ height: `${Math.min(100, hour.value * 100)}%` }} />
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
              <h3 className={styles.tipsTitle}>Boost Call Earnings</h3>
            </div>
            <ul className={styles.tipsList}>
              {(merged ? merged.boostInsights : []).map((ins) => (
                <li key={ins.id} className={styles.tipItem}>
                  <span className={`${styles.boostDot} ${styles[`tone${ins.tone.charAt(0).toUpperCase()}${ins.tone.slice(1)}`]}`} />
                  <div className={styles.boostBody}>
                    <span className={styles.boostTitle}>{ins.title}</span>
                    <span className={styles.boostDetail}>{ins.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button className={styles.viewAllTipsBtn} type="button" onClick={() => navigateTo('/creators/analytics')}>
              More Insights <ArrowRight size={14} />
            </button>
          </section>
        </aside>
      </div>

      {/* Call details modal */}
      {detailsRow && (
        <div className={styles.detailsOverlay} onClick={() => setDetailsRow(null)}>
          <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsHeader}>
              <h3 className={styles.detailsTitle}>Call Details</h3>
              <button className={styles.detailsClose} type="button" onClick={() => setDetailsRow(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.detailsBody}>
              {(() => {
                const [dDate, dTime] = (detailsRow.dateTime || '\n').split('\n');
                return (
                  <>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Fan</span>
                      <span className={styles.detailValue}>
                        <img src={detailsRow.fan.avatar} alt={detailsRow.fan.name} className={styles.detailAvatar} />
                        {detailsRow.fan.name}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue}>{detailsRow.typeLabel || detailsRow.type}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Date</span>
                      <span className={styles.detailValue}>{dDate}{dTime ? ` · ${dTime}` : ''}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Duration</span>
                      <span className={styles.detailValue}>{detailsRow.duration}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Gifts</span>
                      <span className={styles.detailValue}>{detailsRow.gifts || '0 coins'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Earned</span>
                      <span className={styles.detailValue}>{detailsRow.earned}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.detailValue}>
                        <span className={`${styles.statusBadge} ${getStatusClass(detailsRow.status)}`}>
                          {detailsRow.status}
                        </span>
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit call rate dialog */}
      <CallRateDialog
        callType={rateTarget}
        currentRate={rateTarget === 'audio' ? (merged?.audioRate ?? 0) : (merged?.videoRate ?? 0)}
        darkMode={darkMode}
        onClose={() => setRateTarget(null)}
        onSave={handleSaveRate}
      />

      {/* Go Live / Go Offline confirmation */}
      <ConfirmToggleDialog
        open={!!confirmTarget}
        title={confirmTarget && isAvailable(confirmTarget) ? 'Go Offline?' : 'Go Live Now?'}
        message={
          confirmTarget
            ? (isAvailable(confirmTarget)
                ? `Fans won't be able to request ${confirmTarget === 'audio' ? 'audio' : 'video'} calls while you're offline. Your rate stays the same.`
                : `Go live for ${confirmTarget === 'audio' ? 'audio' : 'video'} calls so fans can request private calls at your current rate.`)
            : ''
        }
        confirmLabel={confirmTarget && isAvailable(confirmTarget) ? 'Go Offline' : 'Go Live Now'}
        icon={
          confirmTarget
            ? (isAvailable(confirmTarget)
                ? <PhoneOff size={22} />
                : confirmTarget === 'audio' ? <Phone size={22} /> : <Video size={22} />)
            : null
        }
        accent={
          confirmTarget
            ? (isAvailable(confirmTarget)
                ? '#f87171'
                : confirmTarget === 'audio' ? '#10b981' : '#3b82f6')
            : '#e10075'
        }
        busy={!!toggling}
        busyLabel="Updating…"
        darkMode={darkMode}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => { const t = confirmTarget; setConfirmTarget(null); handleToggleLive(t); }}
      />
    </div>
  );
};
