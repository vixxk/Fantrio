import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { useLiveStreamSocket } from '../../../hooks/useLiveStreamSocket';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { useStreamChat } from '../../../hooks/useStreamChat';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftLeaderboard } from '../../gifts/GiftLeaderboard';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Radio, Calendar, Plus, Eye, TrendingUp, Edit2, Zap, Check,
  MessageSquare, Music, Dumbbell, MoreHorizontal, X, Trash2, Loader2,
  ChevronLeft, ChevronRight, ChevronUp, Send, Gift, BarChart2
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { DateTimePicker } from '../../../components/DateTimePicker/DateTimePicker';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { CreatorLiveStreamOverlay } from './CreatorLiveStreamOverlay';
import { StreamDetailsModal } from './StreamDetailsModal';
import { DEFAULT_CATEGORIES } from './streamCategories';
import styles from './CreatorLiveStreamsPage.module.css';

const categoryIconMap = {
  'Just Chatting': MessageSquare,
  Music,
  'Workout & Fitness': Dumbbell,
  Fitness: Dumbbell,
  Others: MoreHorizontal,
  Gaming: MoreHorizontal,
  Fashion: MoreHorizontal,
  ASMR: MoreHorizontal,
  Dance: MoreHorizontal,
};

const categoryColorMap = {
  'Just Chatting': '#e10075',
  Music: '#3b82f6',
  'Workout & Fitness': '#f97316',
  Fitness: '#f97316',
  Gaming: '#8b5cf6',
  Fashion: '#ec4899',
  ASMR: '#14b8a6',
  Dance: '#f59e0b',
  Others: '#6b7280',
};

const formatCoins = (n) => (n > 0 ? `${n} coins` : 'Free');

const formatViews = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

const formatDuration = (secs) => {
  const s = Number(secs) || 0;
  if (s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const toLocalInputValue = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDayKey = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const CreatorLiveStreamsPage = () => {
  const { darkMode, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('goLive');
  const pageRef = useRef(null);
  const [period, setPeriod] = useState('All Time');
  const [editingId, setEditingId] = useState(null);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [popupError, setPopupError] = useState(null);

  // Stream calendar popup
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calSelected, setCalSelected] = useState(() => toDayKey(new Date()));

  // Client-side pagination for the recent streams table
  const [recentPage, setRecentPage] = useState(1);
  const RECENT_PAGE_SIZE = 6;

  // Form state
  const [streamTitle, setStreamTitle] = useState('');
  const [category, setCategory] = useState('Just Chatting');
  const [entryPrice, setEntryPrice] = useState('5');
  const [freeForSubs, setFreeForSubs] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [language, setLanguage] = useState('English');
  const thumbnailInputRef = useRef(null);

  // Data
  const [overview, setOverview] = useState({ stats: {}, upcoming: [], recent: [], categories: [], topStreams: [], quickStats: {}, liveNow: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  // Pending destructive action — drives the custom confirmation popup
  // shape: { type: 'cancel' | 'delete' | 'end', stream }
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [detailsStreamId, setDetailsStreamId] = useState(null);

  // Category options from API (overview.categories) with fallback to defaults
  const categoryOptions = useMemo(() => {
    if (overview.categories && overview.categories.length > 0) {
      const apiCategories = overview.categories.map(c => c.label).filter(Boolean);
      // Combine API categories with defaults, removing duplicates
      const combined = [...new Set([...apiCategories, ...DEFAULT_CATEGORIES])];
      return combined;
    }
    return DEFAULT_CATEGORIES;
  }, [overview.categories]);

  // Map each calendar day -> streams happening that day (upcoming + ended + live now)
  const calendarStreams = useMemo(() => {
    const map = {};
    const push = (key, stream) => {
      if (!key) return;
      (map[key] = map[key] || []).push(stream);
    };
    const nowIso = new Date().toISOString();
    (overview.upcoming || []).forEach((s) => push(toDayKey(s.date), { ...s, kind: 'upcoming' }));
    (overview.recent || []).forEach((s) => push(toDayKey(s.date), { ...s, kind: 'recent' }));
    if (overview.liveNow) {
      push(toDayKey(overview.liveNow.startedAt || nowIso), {
        _id: overview.liveNow._id,
        title: overview.liveNow.streamTitle || 'Live Stream',
        thumbnail: overview.liveNow.coverUrl || '/Girl.png',
        date: overview.liveNow.startedAt || nowIso,
        category: overview.liveNow.category || '',
        viewerCount: overview.liveNow.viewerCount || 0,
        roomId: overview.liveNow.roomId || '',
        kind: 'live'
      });
    }
    return map;
  }, [overview]);

  // Days in the currently viewed month (null = leading blank cells)
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const offset = first.getDay();
    const count = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(new Date(calYear, calMonth, d));
    return cells;
  }, [calYear, calMonth]);

  const calMoveMonth = (delta) => {
    let y = calYear;
    let m = calMonth + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCalYear(y);
    setCalMonth(m);
  };

  const calGoToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setCalSelected(toDayKey(now));
  };

  // Streams on the selected calendar day, live first then by time
  const selectedDayStreams = useMemo(() => {
    const list = calendarStreams[calSelected] || [];
    return [...list].sort((a, b) => {
      const rank = { live: 0, upcoming: 1, recent: 2 };
      if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
      return new Date(a.date) - new Date(b.date);
    });
  }, [calendarStreams, calSelected]);

  const loadOverview = async () => {
    try {
      const res = await api.get(`/creators/live/my?period=${encodeURIComponent(period)}`);
      if (res.status === 'success') {
        setOverview(res);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load your live streams' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      setLoading(true);
      setRecentPage(1);
    });
    const init = async () => {
      try {
        const res = await api.get(`/creators/live/my?period=${encodeURIComponent(period)}`);
        if (active && res.status === 'success') {
          setOverview(res);

          // Deep link from the dashboard: ?edit=<streamId> opens the edit form
          const editId = new URLSearchParams(window.location.search).get('edit');
          if (editId) {
            const target = (res.upcoming || []).find((s) => String(s._id) === editId);
            if (target) {
              setEditingId(target._id);
              setActiveTab('schedule');
              setStreamTitle(target.title);
              setCategory(target.category);
              setEntryPrice(String(target.entryPrice || 0));
              setFreeForSubs(!!target.freeForSubscribers);
              setScheduledAt(toLocalInputValue(target.date));
              setThumbnail(target.thumbnail);
              setCoverUrl(target.thumbnail);
              setLanguage(target.language || 'English');
              setMessage({ type: 'success', text: `Editing "${target.title}" — save to apply changes` });
            }
            window.history.replaceState(null, '', '/creators/live-streams');
          }
        }
      } catch (err) {
        if (active) setMessage({ type: 'error', text: err.message || 'Failed to load your live streams' });
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, [period]);

  // Real-time gift animations while live — the host sees every gift their
  // viewers send (socket events land on the creator's own user room).
  const { events: giftEvents, leaderboard: giftLeaderboard, summary: giftSummary } = useGiftEvents({
    streamId: overview.liveNow?._id || null,
    enabled: !!overview.liveNow
  });

  // Live chat with viewers — messages append one after another while live.
  const { messages: hostChatMessages, sendMessage: sendHostChat, sending: hostChatSending } = useStreamChat({
    streamId: overview.liveNow?._id || null,
    enabled: !!overview.liveNow
  });
  const [hostChatOpen, setHostChatOpen] = useState(true);
  const [hostChatDraft, setHostChatDraft] = useState('');
  const hostChatListRef = useRef(null);

  useEffect(() => {
    if (hostChatListRef.current) {
      hostChatListRef.current.scrollTop = hostChatListRef.current.scrollHeight;
    }
  }, [hostChatMessages]);

  const handleHostChatSend = async (e) => {
    e.preventDefault();
    if (!hostChatDraft.trim()) return;
    const sent = await sendHostChat(hostChatDraft);
    if (sent) setHostChatDraft('');
  };

  // Real-time viewer count for the "Live Now" banner + auto-refresh when
  // the stream is started/ended from another device or by an admin.
  useLiveStreamSocket({
    streamIds: [],
    joinGlobal: false,
    onViewerUpdate: (payload) => {
      if (!payload || !payload.streamId) return;
      setOverview((prev) => {
        if (!prev.liveNow || prev.liveNow._id !== payload.streamId) return prev;
        return { ...prev, liveNow: { ...prev.liveNow, viewerCount: payload.viewerCount, isLive: payload.isLive } };
      });
    },
    onStreamEvent: () => {
      loadOverview();
    }
  });

  const handleThumbnailClick = () => thumbnailInputRef.current?.click();

  const uploadCover = async (file) => {
    try {
      const res = await api.post('/posts/upload-url', {
        fileName: (file.name || 'thumbnail.jpg').replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType: file.type || 'image/jpeg'
      });
      if (res.status === 'success') {
        const putRes = await fetch(res.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file
        });
        if (putRes.ok) return res.fileUrl;
      }
      return null;
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
      return null;
    }
  };

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(URL.createObjectURL(file));
    setUploadingThumb(true);
    const url = await uploadCover(file);
    setUploadingThumb(false);
    if (url) {
      setCoverUrl(url);
      setMessage({ type: 'success', text: 'Thumbnail uploaded successfully' });
    } else {
      setCoverUrl('');
      setMessage({ type: 'error', text: 'Thumbnail upload failed — stream will use your banner as cover.' });
    }
  };

  const resetForm = () => {
    setStreamTitle('');
    setCategory('Just Chatting');
    setEntryPrice('5');
    setFreeForSubs(false);
    setScheduledAt('');
    setThumbnail(null);
    setCoverUrl('');
    setLanguage('English');
    setEditingId(null);
  };

  const handleEdit = (stream) => {
    setEditingId(stream._id);
    setActiveTab('schedule');
    setStreamTitle(stream.title);
    setCategory(stream.category);
    setEntryPrice(String(stream.entryPrice || 0));
    setFreeForSubs(!!stream.freeForSubscribers);
    setScheduledAt(toLocalInputValue(stream.date));
    setThumbnail(stream.thumbnail);
    setCoverUrl(stream.thumbnail);
    setLanguage(stream.language || 'English');
    setMessage({ type: 'success', text: `Editing "${stream.title}" — save to apply changes` });

    // Mobile: the edit form lives at the top of the page, so scroll up to
    // reveal the populated form. The page's own container is the real scroll
    // element on mobile (overflow-x: hidden makes overflow-y compute to auto),
    // so target it directly instead of the app-level .scrollableContent.
    // Defer one frame so React has re-rendered the edit form before scrolling.
    if (window.innerWidth <= 768) {
      requestAnimationFrame(() => {
        const scroller = pageRef.current;
        if (scroller && scroller.scrollHeight > scroller.clientHeight) {
          scroller.scrollTo({ top: 0, behavior: 'smooth' });
          // Safety net for browsers without smooth element scrolling support.
          setTimeout(() => {
            if (scroller.scrollTop > 0) scroller.scrollTop = 0;
          }, 700);
        }
      });
    }
  };

  // Open the confirmation popup for the given action
  const openConfirm = (type, stream) => setConfirmAction({ type, stream });

  // Perform the confirmed action
  const confirmActionRun = async () => {
    if (!confirmAction) return;
    const { type } = confirmAction;
    // Re-read the live stream at confirm time so the 'end' action can't act on a stale snapshot
    const stream = type === 'end' ? overview.liveNow : confirmAction.stream;
    if (!stream) {
      setConfirmAction(null);
      return;
    }
    setConfirmBusy(true);
    try {
      if (type === 'end') {
        await api.post('/creators/live/end', { streamId: stream._id });
        setMessage({ type: 'success', text: 'Live stream ended successfully' });
      } else {
        await api.delete(`/creators/live/${stream._id}`);
        setMessage({
          type: 'success',
          text: type === 'cancel' ? 'Scheduled stream cancelled' : 'Stream record deleted'
        });
      }
      setConfirmAction(null);
      loadOverview();
    } catch (err) {
      setConfirmAction(null);
      setMessage({
        type: 'error',
        text: err.message || (type === 'end' ? 'Failed to end stream' : type === 'cancel' ? 'Failed to cancel stream' : 'Failed to delete stream')
      });
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleStartLive = async () => {
    if (!streamTitle.trim()) {
      setMessage({ type: 'error', text: 'Please enter a stream title' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        streamTitle: streamTitle.trim(),
        category,
        coverUrl,
        language,
        entryPriceCoins: Math.max(0, Number(entryPrice) || 0),
        freeForSubscribers: freeForSubs
      };
      const res = await api.post('/creators/live/start', payload);
      setMessage({
        type: 'success',
        text: `You are live! Room: ${res.roomId || 'created'}`
      });
      resetForm();
      loadOverview();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  // The calendar only opens here — same flow as the dashboard's live stream card
  const openSchedulePopup = () => {
    if (!streamTitle.trim()) {
      setMessage({ type: 'error', text: 'Please enter a stream title' });
      return;
    }
    if (!editingId && !scheduledAt) {
      // Default to one hour from now for a fresh schedule
      const d = new Date(Date.now() + 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
    setPopupError(null);
    setShowSchedulePopup(true);
  };

  const handleConfirmSchedule = async () => {
    if (!streamTitle.trim()) {
      setPopupError('Please enter a stream title');
      return;
    }
    if (!scheduledAt) {
      setPopupError('Please pick a date and time for the stream');
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setPopupError('Scheduled time must be in the future');
      return;
    }

    setSubmitting(true);
    setPopupError(null);
    try {
      const payload = {
        streamTitle: streamTitle.trim(),
        category,
        coverUrl,
        language,
        entryPriceCoins: Math.max(0, Number(entryPrice) || 0),
        freeForSubscribers: freeForSubs,
        scheduledAt: new Date(scheduledAt).toISOString()
      };

      if (editingId) {
        await api.put(`/creators/live/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Scheduled stream updated successfully' });
      } else {
        await api.post('/creators/live/schedule', payload);
        setMessage({ type: 'success', text: 'Stream scheduled successfully' });
      }
      setShowSchedulePopup(false);
      resetForm();
      loadOverview();
    } catch (err) {
      setPopupError(err.message || 'Failed to schedule stream');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = overview.stats || {};
  const streamStats = [
    { label: 'Total Streams', value: String(stats.totalStreams || 0) },
    { label: 'Total Views', value: formatViews(stats.totalViews) },
    { label: 'Total Earnings', value: `${stats.totalEarnings || 0} coins` },
    { label: 'Avg. Duration', value: formatDuration(stats.avgDurationSeconds) },
  ];

  const quickStats = [
    { label: 'Total Views', value: formatViews(overview.quickStats?.totalViews || 0) },
    { label: 'Total Watch Time', value: formatDuration(overview.quickStats?.totalWatchTimeSeconds || 0) },
    { label: 'Followers', value: formatViews(overview.quickStats?.followers || 0) },
  ];

  const recentStreams = overview.recent || [];
  const recentTotalPages = Math.max(1, Math.ceil(recentStreams.length / RECENT_PAGE_SIZE));
  const recentPageNums = [];
  for (let p = 1; p <= recentTotalPages && p <= 5; p++) recentPageNums.push(p);
  const displayedRecent = recentStreams.slice((recentPage - 1) * RECENT_PAGE_SIZE, recentPage * RECENT_PAGE_SIZE);

  return (
    <div ref={pageRef} className={`${styles.pageContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Active Host Instagram Live Stream Overlay */}
      {overview.liveNow && (
        <CreatorLiveStreamOverlay
          liveStream={overview.liveNow}
          onEndStream={() => openConfirm('end', overview.liveNow)}
        />
      )}

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>

          {/* Live Now Banner */}
          {overview.liveNow && (
            <div className={styles.liveBanner}>
              <div className={styles.liveBannerInfo}>
                <span className={styles.liveBannerBadge}><Radio size={12} /> LIVE NOW</span>
                <span className={styles.liveBannerTitle}>{overview.liveNow.streamTitle}</span>
                <span className={styles.liveBannerMeta}>
                  {overview.liveNow.viewerCount || 0} viewers · {overview.liveNow.category} · {overview.liveNow.roomId}
                </span>
                {/* Per-stream gift summary — the host sees gifts received */}
                {giftSummary && giftSummary.receivedCount > 0 && (
                  <span className={styles.hostGiftSummary}>
                    <Gift size={13} />
                    <span>Received</span>
                    <strong>{giftSummary.receivedCount}</strong>
                    <img src="/coin.png" alt="Coin" className={styles.hostCoinImgSm} />
                    <span>{giftSummary.receivedCoins.toLocaleString()}</span>
                  </span>
                )}
              </div>
              <button className={styles.endStreamBtn} onClick={() => openConfirm('end', overview.liveNow)}>
                End Stream
              </button>
            </div>
          )}          {/* Host Live Chat (visible while streaming) */}
          {overview.liveNow && (
            <div className={styles.hostChatCard}>
              <div className={styles.hostChatHeader}>
                <div className={styles.hostChatHeaderTitle}>
                  <MessageSquare size={14} />
                  <span>Live Chat</span>
                  <span className={styles.hostChatCount}>{hostChatMessages.length}</span>
                </div>
                <button
                  className={styles.hostChatToggle}
                  onClick={() => setHostChatOpen(!hostChatOpen)}
                  aria-label={hostChatOpen ? 'Collapse chat' : 'Expand chat'}
                >
                  <ChevronUp size={15} className={hostChatOpen ? '' : styles.hostChatToggleClosed} />
                </button>
              </div>
              {hostChatOpen && (
                <>
                  {/* Pinned top-gifters — always visible above the messages */}
                  <GiftLeaderboard leaderboard={giftLeaderboard} />
                  <div ref={hostChatListRef} className={styles.hostChatList}>
                    {hostChatMessages.length === 0 ? (
                      <span className={styles.hostChatEmpty}>No messages yet — chat with your viewers here.</span>
                    ) : (
                      hostChatMessages.map((m) => (
                        <div key={m._id} className={styles.hostChatMsg}>
                          <span className={styles.hostChatName}>{m.displayName}</span>
                          <span className={styles.hostChatText}>{m.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <form className={styles.hostChatComposer} onSubmit={handleHostChatSend}>
                    <input
                      type="text"
                      className={styles.hostChatInput}
                      placeholder="Reply to viewers…"
                      maxLength={500}
                      value={hostChatDraft}
                      onChange={(e) => setHostChatDraft(e.target.value)}
                    />
                    <button
                      type="submit"
                      className={styles.hostChatSend}
                      disabled={!hostChatDraft.trim() || hostChatSending}
                      aria-label="Send message"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`${styles.statusMessage} ${message.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
              {message.text}
              <button className={styles.statusClose} onClick={() => setMessage(null)}><X size={14} /></button>
            </div>
          )}

          {/* Live gift animations (visible while streaming) */}
          {overview.liveNow && <GiftOverlay events={giftEvents} />}

          {/* Go Live / Schedule Card */}
          <div className={styles.streamCard}>
            <div className={styles.streamBody}>
              {/* Stream Preview / Thumbnail Upload */}
              <div className={styles.streamPreview}>
                <button
                  type="button"
                  className={styles.streamPreviewInner}
                  onClick={handleThumbnailClick}
                  title="Upload thumbnail"
                >
                  {thumbnail && (
                    <img src={thumbnail} alt="Thumbnail preview" className={styles.thumbnailPreviewImg} />
                  )}
                  <div className={styles.liveBadge}>
                    <Radio size={10} /> {editingId ? 'EDIT' : 'LIVE'}
                  </div>
                  {uploadingThumb ? (
                    <div className={styles.playButton}>
                      <Loader2 size={28} className={styles.spin} />
                    </div>
                  ) : (
                    !thumbnail && (
                      <div className={styles.playButton}>
                        <Plus size={28} />
                      </div>
                    )
                  )}
                </button>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.thumbnailInput}
                  onChange={handleThumbnailChange}
                />
              </div>

              {/* Stream Form */}
              <div className={styles.streamForm}>
                <div className={`${styles.formGroup} ${styles.titleField}`}>
                  <label className={styles.formLabel}>Stream Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Friday Night Show"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.categoryField}`}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.toggleLanguageRow}>
                  <div className={`${styles.formGroup} ${styles.languageField}`}>
                    <label className={styles.formLabel}>Language</label>
                    <select
                      className={`${styles.formInput} ${styles.formSelect}`}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Italian">Italian</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Make stream free for subscribers</span>
                      <span className={styles.toggleDesc}>Active subscribers can join for free</span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={freeForSubs}
                        onChange={() => setFreeForSubs(!freeForSubs)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.priceField}`}>
                  <label className={styles.formLabel}>Entry Price (coins)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={styles.formInput}
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                  <p className={styles.formHint}>
                    Fans will pay {Math.max(0, Number(entryPrice) || 0)} coins to join{freeForSubs ? ' (subscribers free)' : ''}
                  </p>
                </div>
              </div>

              {/* Start Options */}
              <div className={styles.startOptionsSection}>
                <label className={styles.formLabel}>Start</label>
                <div className={styles.startOptions}>
                  <div
                    className={`${styles.startOption} ${activeTab === 'goLive' ? styles.startOptionActive : ''}`}
                    onClick={() => { setActiveTab('goLive'); setEditingId(null); }}
                  >
                    <div className={`${styles.startOptionRadio} ${activeTab === 'goLive' ? styles.startOptionRadioActive : ''}`}>
                      {activeTab === 'goLive' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Zap size={16} className={styles.startOptionIcon} />
                        Go Live Now
                      </div>
                      <span className={styles.startOptionDesc}>Start instantly</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.startOption} ${activeTab === 'schedule' ? styles.startOptionActive : ''}`}
                    onClick={() => setActiveTab('schedule')}
                  >
                    <div className={`${styles.startOptionRadio} ${activeTab === 'schedule' ? styles.startOptionRadioActive : ''}`}>
                      {activeTab === 'schedule' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Calendar size={16} className={styles.startOptionIcon} />
                        {editingId ? 'Edit Scheduled Stream' : 'Schedule For Later'}
                      </div>
                      <span className={styles.startOptionDesc}>{editingId ? 'Update details and save' : 'Pick date and time'}</span>
                    </div>
                  </div>
                </div>

                {editingId && (
                  <button className={styles.cancelEditBtn} onClick={resetForm}>
                    <X size={14} /> Cancel Edit
                  </button>
                )}

                <button
                  className={styles.startNowBtn}
                  onClick={() => {
                    if (editingId || activeTab === 'schedule') {
                      openSchedulePopup();
                    } else {
                      handleStartLive();
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting
                    ? <span className={styles.submitLoading}><Loader2 size={16} className={styles.spin} /> Working…</span>
                    : editingId ? 'Save Changes'
                    : activeTab === 'goLive' ? 'Go Live Now' : 'Schedule Stream'}
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Streams */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Streams</h2>
              <button className={styles.viewCalendarBtn} onClick={() => setShowCalendar(true)}>View Calendar</button>
            </div>
            <div className={styles.upcomingCard}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ShimmerSkeleton variant="card" height="90px" />
                  <ShimmerSkeleton variant="card" height="90px" />
                  <ShimmerSkeleton variant="card" height="90px" />
                </div>
              ) : overview.upcoming.length === 0 ? (
                <div className={styles.emptyState}>No upcoming streams. Schedule one above.</div>
              ) : (
                <>
                  <div className={`${styles.upcomingList} ${styles.hideMobile}`}>
                    {overview.upcoming.map((stream) => (
                      <div key={stream._id} className={styles.upcomingItem}>
                        <div className={styles.upcomingItemTop}>
                          <img src={stream.thumbnail} alt={stream.title} className={styles.upcomingThumb} />
                          <div className={styles.upcomingInfo}>
                            <div className={styles.upcomingTitleRow}>
                              <span className={styles.upcomingTitle}>{stream.title}</span>
                              <span className={styles.scheduledBadge}>{stream.status}</span>
                            </div>
                            <span className={styles.upcomingDate}>{formatDate(stream.date)}</span>
                            <span className={styles.upcomingCategory}>
                              <span className={styles.categoryDot} style={{ background: categoryColorMap[stream.category] || '#6b7280' }} />
                              {stream.category}
                            </span>
                          </div>
                          <div className={styles.upcomingRight}>
                            <div className={styles.upcomingPrice}>
                              <div className={styles.entryPriceLabel}>Entry Price</div>
                              <div className={styles.entryPriceValue}>{formatCoins(stream.entryPrice)}</div>
                            </div>
                            <div className={styles.upcomingActions}>
                              <button className={styles.editBtn} onClick={() => handleEdit(stream)}>Edit</button>
                              <button className={styles.moreBtn} title="Cancel stream" onClick={() => openConfirm('cancel', stream)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Upcoming Streams Cards */}
                  <div className={`${styles.upcomingMobileList} ${styles.showMobile}`}>
                    {overview.upcoming.map((stream) => (
                      <article key={stream._id} className={styles.mobileUpcomingCard}>
                        <div className={styles.mobileUpcomingTop}>
                          <img src={stream.thumbnail} alt={stream.title} className={styles.mobileUpcomingThumb} />
                          <div className={styles.mobileUpcomingContent}>
                            <div className={styles.mobileUpcomingTitleRow}>
                              <span className={styles.mobileUpcomingTitle}>{stream.title}</span>
                              <span className={styles.scheduledBadge}>{stream.status}</span>
                            </div>
                            <div className={styles.mobileRecentMetaRow}>
                              <span className={styles.mobileRecentMeta}>{formatDate(stream.date)}</span>
                              <span className={styles.mobileRecentCategory} style={{ color: categoryColorMap[stream.category] || '#6b7280' }}>
                                {stream.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.mobileUpcomingFooter}>
                          <div className={styles.mobileUpcomingPrice}>
                            <span className={styles.mobileUpcomingPriceLabel}>Entry Price</span>
                            <span className={styles.mobileUpcomingPriceValue}>{formatCoins(stream.entryPrice)}</span>
                          </div>
                          <div className={styles.mobileUpcomingActions}>
                            <button className={styles.actionBtn} onClick={() => handleEdit(stream)}><Edit2 size={13} /></button>
                            <button className={styles.actionBtn} title="Cancel stream" onClick={() => openConfirm('cancel', stream)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Recent Streams */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Streams</h2>
            </div>
            <div className={styles.recentTableCard}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <ShimmerSkeleton variant="card" height="120px" />
                  <ShimmerSkeleton variant="card" height="120px" />
                  <ShimmerSkeleton variant="card" height="120px" />
                  <ShimmerSkeleton variant="card" height="120px" />
                </div>
              ) : overview.recent.length === 0 ? (
                <div className={styles.emptyState}>No streams ended yet.</div>
              ) : (
                <>
                  <div className={`${styles.tableContainer} ${styles.hideMobile}`}>
                    <table className={styles.contentTable}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Stream Title</th>
                          <th className={styles.th}>Category</th>
                          <th className={styles.th}>Date</th>
                          <th className={styles.th}>Duration</th>
                          <th className={styles.th}>Views</th>
                          <th className={styles.th}>Earnings</th>
                          <th className={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRecent.map((stream) => (
                          <tr key={stream._id} className={styles.tableRow}>
                            <td className={styles.td}>
                              <div className={styles.streamInfo}>
                                <img src={stream.thumbnail} alt={stream.title} className={styles.streamThumb} />
                                <span className={styles.streamTitle}>{stream.title}</span>
                              </div>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.categoryBadge}>
                                <span className={styles.categoryDot} style={{ background: categoryColorMap[stream.category] || '#6b7280' }} />
                                {stream.category}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.dateText}>{formatDate(stream.date)}</span>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.durationText}>{stream.duration}</span>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.viewsText}>{formatViews(stream.views)}</span>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.earningsValue}>{formatCoins(stream.earnings)}</span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.actions}>
                                <button className={styles.actionBtn} title="View stream audit & tipping logs" onClick={() => setDetailsStreamId(stream._id)}><BarChart2 size={14} /></button>
                                <button className={styles.actionBtn} title="View analytics" onClick={() => navigateTo('/creators/analytics')}><TrendingUp size={14} /></button>
                                <button className={styles.actionBtn} title="Delete stream" onClick={() => openConfirm('delete', stream)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Recent Streams Cards */}
                  <div className={`${styles.mobileRecentList} ${styles.showMobile}`}>
                    {displayedRecent.map((stream) => (
                      <article key={stream._id} className={styles.mobileRecentCard}>
                        <div className={styles.mobileRecentTop}>
                          <div className={styles.mobileRecentThumbCol}>
                            <img src={stream.thumbnail} alt={stream.title} className={styles.mobileRecentThumb} />
                          </div>
                          <div className={styles.mobileRecentContent}>
                            <div className={styles.mobileRecentTitleRow}>
                              <span className={styles.mobileRecentTitle}>{stream.title}</span>
                              <div className={styles.mobileRecentActions}>
                                <button className={styles.actionBtn} title="View stream audit & tipping logs" onClick={() => setDetailsStreamId(stream._id)}><BarChart2 size={13} /></button>
                                <button className={styles.actionBtn} onClick={() => navigateTo('/creators/analytics')}><TrendingUp size={13} /></button>
                                <button className={styles.actionBtn} title="Delete stream" onClick={() => openConfirm('delete', stream)}><Trash2 size={13} /></button>
                              </div>
                            </div>
                            <div className={styles.mobileRecentMetaRow}>
                              <span className={styles.mobileRecentMeta}>
                                {stream.duration} • {formatDate(stream.date)}
                              </span>
                              <span className={styles.mobileRecentCategory} style={{ color: categoryColorMap[stream.category] || '#6b7280' }}>
                                {stream.category}
                              </span>
                            </div>
                            <div className={styles.mobileRecentStatsRow}>
                              <div className={styles.mobileRecentStats}>
                                <div className={styles.mobileStatItem}>
                                  <Eye size={11} />
                                  <span>{formatViews(stream.views)} views</span>
                                </div>
                              </div>
                              <span className={styles.mobileRecentEarnings}>{formatCoins(stream.earnings)}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {recentStreams.length > 0 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setRecentPage(Math.max(1, recentPage - 1))}
                    disabled={recentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {recentPageNums.map((page) => (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${recentPage === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setRecentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  {recentTotalPages > 5 && <span className={styles.pageDots}>...</span>}
                  {recentTotalPages > 5 && (
                    <button
                      className={`${styles.pageBtn} ${recentPage === recentTotalPages ? styles.pageBtnActive : ''}`}
                      onClick={() => setRecentPage(recentTotalPages)}
                    >
                      {recentTotalPages}
                    </button>
                  )}
                  <button
                    className={styles.pageBtn}
                    onClick={() => setRecentPage(Math.min(recentTotalPages, recentPage + 1))}
                    disabled={recentPage === recentTotalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>

          {/* Stream Overview */}
          <div className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <h3 className={styles.overviewTitle}>Stream Overview</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.overviewGrid}>
              {streamStats.map((stat, idx) => (
                <div key={idx} className={styles.overviewStat}>
                  <span className={styles.overviewStatLabel}>{stat.label}</span>
                  <div className={styles.overviewStatRow}>
                    <span className={styles.overviewStatValue}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.viewAnalyticsBtn}
              onClick={() => navigateTo('/creators/analytics')}
            >
              View Analytics
            </button>
          </div>

          {/* Stream Categories */}
          <div className={styles.categoriesCard}>
            <h3 className={styles.categoriesTitle}>Stream Categories</h3>
            <div className={styles.categoriesList}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <ShimmerSkeleton variant="row" height="48px" />
                  <ShimmerSkeleton variant="row" height="48px" />
                  <ShimmerSkeleton variant="row" height="48px" />
                </div>
              ) : overview.categories.length === 0 ? (
                <div className={styles.emptyStateSmall}>No streams yet.</div>
              ) : (
                overview.categories.map((cat, idx) => {
                  const Icon = categoryIconMap[cat.label] || Radio;
                  const color = categoryColorMap[cat.label] || '#6b7280';
                  return (
                    <div key={idx} className={styles.categoryItem}>
                      <div className={styles.categoryItemLeft}>
                        <div className={styles.categoryIconWrap} style={{ background: `${color}20` }}>
                          <Icon size={16} style={{ color }} />
                        </div>
                        <div className={styles.categoryInfo}>
                          <span className={styles.categoryName}>{cat.label}</span>
                          <span className={styles.categoryCount}>{cat.count} streams</span>
                        </div>
                      </div>
                      <div className={styles.categoryRight}>
                        <span className={styles.categoryPercentage}>{cat.percentage}%</span>
                        <div className={styles.categoryProgressBar}>
                          <div
                            className={styles.categoryProgressFill}
                            style={{ width: `${cat.percentage}%`, background: color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Streams */}
          <div className={styles.topCard}>
            <div className={styles.topHeader}>
              <h3 className={styles.topTitle}>Top Streams (You)</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.topList}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <ShimmerSkeleton variant="row" height="40px" />
                  <ShimmerSkeleton variant="row" height="40px" />
                  <ShimmerSkeleton variant="row" height="40px" />
                </div>
              ) : overview.topStreams.length === 0 ? (
                <div className={styles.emptyStateSmall}>No earnings yet — go live to earn.</div>
              ) : (
                overview.topStreams.map((stream, idx) => (
                  <div key={stream._id || idx} className={styles.topItem}>
                    <span className={styles.topRank}>{idx + 1}</span>
                    <div className={styles.topInfo}>
                      <span className={styles.topItemTitle}>{stream.title}</span>
                      <span className={styles.topItemCategory}>{stream.category}</span>
                    </div>
                    <div className={styles.topEarnings}>
                      <span className={styles.topEarningsLabel}>Earnings</span>
                      <span className={styles.topEarningsValue}>{formatCoins(stream.earnings)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
           </div>

          {/* Quick Stats */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <h3 className={styles.statsTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" value={period} onChange={setPeriod} />
            </div>
            <div className={styles.statsGrid}>
              {quickStats.map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statRow}>
                    <span className={styles.statValue}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>          </div>
        </div>
      </div>

      {/* Confirmation Popup (cancel / delete / end) */}
      <ConfirmDeleteDialog
        open={!!confirmAction}
        itemName={confirmAction && confirmAction.stream ? confirmAction.stream.title : ''}
        title={confirmAction && confirmAction.type === 'end' ? 'End Live Stream?' : confirmAction && confirmAction.type === 'cancel' ? 'Cancel Scheduled Stream?' : 'Delete Stream?'}
        confirmLabel={confirmAction && confirmAction.type === 'end' ? 'End Stream' : confirmAction && confirmAction.type === 'cancel' ? 'Cancel Stream' : 'Delete Stream'}
        busyLabel={confirmAction && confirmAction.type === 'end' ? 'Ending…' : confirmAction && confirmAction.type === 'cancel' ? 'Cancelling…' : 'Deleting…'}
        message={confirmAction && confirmAction.type === 'end'
          ? 'End your current live stream? Viewers will be disconnected.'
          : confirmAction && confirmAction.type === 'cancel'
            ? <>Are you sure you want to cancel <strong>"{confirmAction.stream.title}"</strong>? This cannot be undone.</>
            : undefined}
        deleting={confirmBusy}
        darkMode={darkMode}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirmActionRun}
      />

      {/* Schedule Stream Popup — calendar opens here, not inline (same as dashboard) */}
      <div className={`${styles.popupOverlay} ${showSchedulePopup ? styles.active : ''}`}>
        <div className={styles.popupContainer}>
          <div className={styles.popupHeader}>
            <h3 className={styles.popupTitle}>{editingId ? 'Edit Scheduled Stream' : 'Schedule Stream'}</h3>
            <button className={styles.popupClose} onClick={() => setShowSchedulePopup(false)}>×</button>
          </div>
          <div className={styles.popupContent}>
            <div className={styles.popupScheduleDetails}>
              <DateTimePicker
                value={scheduledAt}
                onChange={setScheduledAt}
                minDate={new Date()}
                light={!darkMode}
              />
              <div className={styles.infoRow}>
                <span className={styles.infoDot} />
                <p>
                  <strong>Stream entry fee:</strong> {entryPrice} coins
                </p>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoDot} />
                <p>
                  <strong>Status:</strong> Scheduled
                </p>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoDot} />
                <p>You'll receive a notification 15 minutes before your scheduled stream</p>
              </div>
              {popupError && (
                <p className={styles.popupError}>
                  {popupError}
                </p>
              )}
            </div>
          </div>
          <div className={styles.popupFooter}>
            <button className={styles.popupCancelBtn} onClick={() => setShowSchedulePopup(false)}>Cancel</button>
            <button className={styles.popupSaveBtn} onClick={handleConfirmSchedule} disabled={submitting}>
              {submitting ? 'Scheduling…' : editingId ? 'Save Changes' : 'Confirm Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Stream Calendar Popup — thumbnail per day + day details */}
      <div className={`${styles.popupOverlay} ${showCalendar ? styles.active : ''}`}>
        <div className={`${styles.popupContainer} ${styles.calendarPopup}`}>
          <div className={styles.popupHeader}>
            <h3 className={styles.popupTitle}>Stream Calendar</h3>
            <button className={styles.popupClose} onClick={() => setShowCalendar(false)}>×</button>
          </div>
          <div className={styles.calendarWrap}>
            {/* Month navigation */}
            <div className={styles.calendarNav}>
              <button className={styles.calNavBtn} onClick={() => calMoveMonth(-1)} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span className={styles.calMonthLabel}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button className={styles.calNavBtn} onClick={() => calMoveMonth(1)} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
              <button className={styles.calTodayBtn} onClick={calGoToday}>Today</button>
            </div>

            {/* Weekday header */}
            <div className={styles.calWeekRow}>
              {WEEKDAY_LABELS.map((w) => <span key={w} className={styles.calWeekDay}>{w}</span>)}
            </div>

            {/* Day grid — stream days show the thumbnail instead of the plain date */}
            <div className={styles.calGrid}>
              {calDays.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} className={styles.calEmpty} />;
                const key = toDayKey(day);
                const dayStreams = calendarStreams[key] || [];
                const isToday = key === toDayKey(new Date());
                const isSelected = key === calSelected;
                const hasLive = dayStreams.some((s) => s.kind === 'live');
                const hasUpcoming = dayStreams.some((s) => s.kind === 'upcoming');
                const hasRecent = dayStreams.some((s) => s.kind === 'recent');
                return (
                  <button
                    key={key}
                    className={`${styles.calDay} ${dayStreams.length ? styles.calDayHasStreams : ''} ${isToday ? styles.calDayToday : ''} ${isSelected ? styles.calDaySelected : ''}`}
                    onClick={() => setCalSelected(key)}
                    title={dayStreams.length ? `${dayStreams.length} stream${dayStreams.length > 1 ? 's' : ''}` : undefined}
                  >
                    {dayStreams.length > 0 ? (
                      <>
                        <img
                          src={dayStreams[0].thumbnail || '/Girl.png'}
                          alt=""
                          className={styles.calDayThumb}
                          loading="lazy"
                        />
                        <span className={styles.calDayNum}>{day.getDate()}</span>
                        <span className={styles.calDayDots}>
                          {hasLive && <i className={`${styles.calDot} ${styles.calDotLive}`} />}
                          {hasUpcoming && <i className={`${styles.calDot} ${styles.calDotUpcoming}`} />}
                          {hasRecent && <i className={`${styles.calDot} ${styles.calDotRecent}`} />}
                        </span>
                      </>
                    ) : (
                      <span className={styles.calDayNum}>{day.getDate()}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className={styles.calLegend}>
              <span><i className={`${styles.calDot} ${styles.calDotLive}`} /> Live</span>
              <span><i className={`${styles.calDot} ${styles.calDotUpcoming}`} /> Scheduled</span>
              <span><i className={`${styles.calDot} ${styles.calDotRecent}`} /> Ended</span>
            </div>
          </div>

          {/* Selected day details */}
          <div className={styles.calDetails}>
            <div className={styles.calDetailsHeader}>
              <span className={styles.calDetailsTitle}>
                {calSelected
                  ? new Date(`${calSelected}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                  : 'Select a day'}
              </span>
              {selectedDayStreams.length > 0 && (
                <span className={styles.calDetailsCount}>
                  {selectedDayStreams.length} stream{selectedDayStreams.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {selectedDayStreams.length === 0 ? (
              <p className={styles.calDetailsEmpty}>No streams on this day.</p>
            ) : (
              <div className={styles.calDetailsList}>
                {selectedDayStreams.map((s) => (
                  <div key={`${s.kind}-${s._id}`} className={styles.calDetailItem}>
                    <img src={s.thumbnail || '/Girl.png'} alt={s.title} className={styles.calDetailThumb} />
                    <div className={styles.calDetailInfo}>
                      <div className={styles.calDetailTop}>
                        <span className={styles.calDetailTitle}>{s.title}</span>
                        <span className={`${styles.calDetailBadge} ${s.kind === 'live' ? styles.calBadgeLive : s.kind === 'upcoming' ? styles.calBadgeUpcoming : styles.calBadgeRecent}`}>
                          {s.kind === 'live' ? 'LIVE' : s.kind === 'upcoming' ? 'Scheduled' : 'Ended'}
                        </span>
                      </div>
                      <div className={styles.calDetailMeta}>
                        <span>{formatTime(s.date)}</span>
                        {s.category && <span> · {s.category}</span>}
                      </div>
                      {s.kind === 'live' && (
                        <div className={styles.calDetailStats}>
                          <span>{s.viewerCount || 0} viewers · Room {s.roomId}</span>
                        </div>
                      )}
                      {s.kind === 'upcoming' && (
                        <div className={styles.calDetailStats}>
                          <span>Entry: {s.entryPrice > 0 ? `${s.entryPrice} coins` : 'Free'}{s.freeForSubscribers ? ' · subs free' : ''}</span>
                        </div>
                      )}
                      {s.kind === 'recent' && (
                        <div className={styles.calDetailStats}>
                          <span>{s.duration} · {formatViews(s.views)} views · {formatCoins(s.earnings)}</span>
                        </div>
                      )}
                    </div>
                    {s.kind === 'upcoming' && (
                      <button
                        className={styles.calDetailAction}
                        onClick={() => { setShowCalendar(false); handleEdit(s); }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailsStreamId && (
        <StreamDetailsModal
          streamId={detailsStreamId}
          onClose={() => setDetailsStreamId(null)}
        />
      )}
    </div>
  );
};
