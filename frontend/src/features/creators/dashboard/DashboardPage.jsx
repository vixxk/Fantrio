import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { getSocket, joinSocketRoom } from '../../../services/socket';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import {
  Phone, Video, MessageSquareText, Lock, Globe, CircleDot, FolderOpen,
  Plus, Eye, Heart, MoreVertical,
  Zap, Calendar, Radio, Check, Loader2, X, Pencil, Trash2
} from 'lucide-react';
import { PeriodDropdown } from '../analytics/PeriodDropdown';
import { DateTimePicker } from '../../../components/DateTimePicker/DateTimePicker';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useToast } from '../../../components/Toast/Toast';
import { CallRateDialog } from '../calls/CallRateDialog';
import { useInactivityOffline } from '../../../hooks/useInactivityOffline';
import styles from './DashboardPage.module.css';

import { DEFAULT_CATEGORIES } from '../live-streams/streamCategories';

const iconMap = { Phone, Video, MessageSquareText, Lock, Globe, CircleDot, FolderOpen };

const createContentCards = [
  {
    id: 'locked',
    title: 'Create Locked Content',
    description: 'Lock your content and set a price to unlock',
    icon: 'Lock',
    color: '#e10075',
    actions: [
      { label: 'Image', mediaType: 'image' },
      { label: 'Video', mediaType: 'video' }
    ]
  },
  {
    id: 'open',
    title: 'Post Open Content',
    description: 'Share content for free with all your fans',
    icon: 'Globe',
    color: '#3b82f6',
    actions: [
      { label: 'Image', mediaType: 'image' },
      { label: 'Video', mediaType: 'video' }
    ]
  },
  {
    id: 'story',
    title: 'Create Stories',
    description: 'Share moments that disappear in 24 hours',
    icon: 'CircleDot',
    color: '#8b5cf6',
    actions: [{ label: 'Create Story', mediaType: 'story' }]
  },
  {
    id: 'myContent',
    title: 'My Content',
    description: 'Manage all your content in one place',
    icon: 'FolderOpen',
    color: '#3b82f6',
    actions: [{ label: 'View All Content', navigate: 'Creator Content' }]
  }
];

export const DashboardPage = () => {
  const { darkMode, navigateTo, setActiveTab, user } = useApp();
  const { toast } = useToast();
  const [rateTarget, setRateTarget] = useState(null);

  useInactivityOffline(user?.role);

  // Real-time SSE listener for Creator presence & quickActions online status sync on Dashboard
  useEffect(() => {
    const sseUrl = `${import.meta.env.VITE_API_URL || '/api'}/creators/presence/sse`;
    const sse = new EventSource(sseUrl, { withCredentials: true });
    sse.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload) {
          setData((prev) => {
            if (!prev || !prev.quickActions) return prev;
            const updatedActions = prev.quickActions.map((action) => {
              if (action.id === 'audio') {
                return { ...action, isOnline: payload.isOnline && payload.audioAvailable !== false };
              }
              if (action.id === 'video') {
                return { ...action, isOnline: payload.isOnline && payload.videoAvailable !== false };
              }
              return action;
            });
            return { ...prev, quickActions: updatedActions };
          });
        }
      } catch { /* noop */ }
    };
    return () => sse.close();
  }, []);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeContentTab, setActiveContentTab] = useState('All');
  const [streamType, setStreamType] = useState('goLive');
  const [entryPrice, setEntryPrice] = useState('5');
  const [freeForSubs, setFreeForSubs] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [category, setCategory] = useState('Just Chatting');
  const [language, setLanguage] = useState('English');
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [popupError, setPopupError] = useState(null);
  const [data, setData] = useState({
    quickActions: [],
    streamOptions: {},
    recentContent: [],
    earningsOverview: {},
    upcomingStreams: [],
    quickStats: { stats: [] }
  });
  const [loading, setLoading] = useState(true);
  const thumbnailInputRef = useRef(null);

  // Earnings overview period
  const [earningsPeriod, setEarningsPeriod] = useState('All Time');

  // Quick stats period (independent of earnings overview)
  const [quickStatsPeriod, setQuickStatsPeriod] = useState('All Time');

  // Upcoming streams kebab menu state
  const [openStreamMenu, setOpenStreamMenu] = useState(null); // stream id

  // Recent content kebab menu state
  const [openRecentMenuId, setOpenRecentMenuId] = useState(null);
  const recentMenuRef = useRef(null);

  // Delete flows — shared confirm dialog state machines
  const {
    target: deleteStreamTarget,
    open: openDeleteStream,
    close: closeDeleteStream,
    confirm: confirmDeleteStream,
    deleting: deletingStream,
  } = useConfirmDelete({
    onConfirm: (stream) => api.delete(`/creators/live/${stream.id}`),
    successMessage: 'Scheduled stream deleted',
    errorMessage: 'Failed to delete stream',
    onSuccess: () => loadDashboard(),
  });

  const {
    target: deleteRecentTarget,
    open: openDeleteRecent,
    close: closeDeleteRecent,
    confirm: confirmDeleteRecent,
    deleting: deletingRecent,
  } = useConfirmDelete({
    onConfirm: (item) =>
      item.isStory
        ? api.delete(`/creators/stories/${item.id}`)
        : api.delete(`/posts/${item.id}`),
    successMessage: 'Content deleted',
    errorMessage: 'Failed to delete content',
    onSuccess: () => loadDashboard(),
  });

  // Create Content modal state
  const [createModal, setCreateModal] = useState(null); // null | { mode: 'locked'|'open'|'story', mediaType: 'image'|'video' }
  const [createFile, setCreateFile] = useState(null);
  const [createCaption, setCreateCaption] = useState('');
  const [createPrice, setCreatePrice] = useState('10');
  const [createUploading, setCreateUploading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const createFileInputRef = useRef(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/creators/dashboard?period=all');
      if (res.status === 'success') {
        const d = res.dashboard || {};
        const messagesAction = (d.quickActions || []).find((a) => a.id === 'messages');
        setUnreadMessages(messagesAction?.unreadCount || 0);
        setData({
          quickActions: d.quickActions || [],
          streamOptions: d.streamOptions || {},
          recentContent: d.recentContent || [],
          earningsOverview: d.earningsOverview || {},
          upcomingStreams: d.upcomingStreams || [],
          quickStats: d.quickStats || { stats: [] }
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load dashboard' });
    } finally {
      setLoading(false);
    }
  };

  // Map the dropdown label to the backend period key
  const PERIOD_QUERY = {
    'Today': 'today',
    'Last 7 Days': '7d',
    'Last 30 Days': '30d',
    'Last 90 Days': '90d',
    'All Time': 'all'
  };

  const fetchEarnings = async (periodLabel) => {
    try {
      const res = await api.get(`/creators/dashboard?period=${PERIOD_QUERY[periodLabel] || 'today'}`);
      if (res.status === 'success') {
        const d = res.dashboard || {};
        setData((prev) => ({
          ...prev,
          earningsOverview: d.earningsOverview || {},
          quickStats: d.quickStats || { stats: [] }
        }));
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
    }
  };

  const handleEarningsPeriodChange = (periodLabel) => {
    setEarningsPeriod(periodLabel);
    fetchEarnings(periodLabel);
  };

  const handleQuickStatsPeriodChange = (periodLabel) => {
    setQuickStatsPeriod(periodLabel);
    fetchEarnings(periodLabel);
  };

  // Save the new per-minute rate for the targeted call type (audio/video)
  const handleSaveRate = async (rate) => {
    const field = rateTarget === 'audio' ? 'audioCallPerMin' : 'videoCallPerMin';
    const res = await api.put('/creators/profile', { rates: { [field]: rate } });
    if (res.status !== 'success') {
      throw new Error(res.message || 'Failed to update rate');
    }
    setData((prev) => ({
      ...prev,
      quickActions: (prev.quickActions || []).map((a) =>
        a.id === rateTarget ? { ...a, rate: String(rate) } : a
      ),
    }));
    toast.success((rateTarget === 'audio' ? 'Audio' : 'Video') + ' call rate updated successfully.');
  };

  useEffect(() => {
    Promise.resolve().then(() => loadDashboard());
  }, []);

  // Real-time unread message count via Socket.io
  useEffect(() => {
    if (!user?.id) return;
    let socket = null;
    try {
      socket = getSocket();
      joinSocketRoom(user.id);
      const onNewMessage = (msg) => {
        if (msg && String(msg.receiverId) === String(user.id)) {
          setUnreadMessages((prev) => prev + 1);
        }
      };
      socket.on('new_message', onNewMessage);
      return () => { socket.off('new_message', onNewMessage); };
    } catch (err) {
      console.error('Socket init failed:', err);
    }
  }, [user?.id]);

  // Close the kebab menu when clicking anywhere outside it
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-stream-menu]')) setOpenStreamMenu(null);
      if (recentMenuRef.current && !recentMenuRef.current.contains(e.target)) setOpenRecentMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleEditRecent = () => {
    setOpenRecentMenuId(null);
    navigateTo('/creators/content');
  };

  // Open the delete confirmation popup for recent content
  const handleDeleteRecent = (item) => {
    setOpenRecentMenuId(null);
    if (!item.id) return;
    openDeleteRecent(item);
  };

  const handleEditStream = (stream) => {
    setOpenStreamMenu(null);
    navigateTo(`/creators/live-streams?edit=${stream.id}`);
  };



  const handleThumbnailClick = () => thumbnailInputRef.current?.click();

  const handleThumbnailChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(URL.createObjectURL(file));
    setUploadingThumb(true);
    try {
      const res = await api.post('/posts/upload-url', {
        fileName: (file.name || 'thumb.jpg').replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType: file.type || 'image/jpeg'
      });
      if (res.status === 'success') {
        const putRes = await fetch(res.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file
        });
        if (putRes.ok) setCoverUrl(res.fileUrl);
      }
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
    } finally {
      setUploadingThumb(false);
    }
  };

  const openCreateModal = (mode, mediaType) => {
    setCreateModal({ mode, mediaType });
    setCreateFile(null);
    setCreateCaption('');
    setCreatePrice('10');
    setCreateMsg(null);
  };

  const handleCreateCardAction = (card, action) => {
    if (action.navigate) {
      setActiveTab(action.navigate);
      return;
    }
    if (card.id === 'story') {
      openCreateModal('story', 'image');
      return;
    }
    openCreateModal(card.id, action.mediaType);
  };

  const handleCreateFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCreateFile(null);
      return;
    }
    setCreateFile(file);
    // For stories, auto-detect image vs video from the chosen file
    if (createModal && createModal.mode === 'story') {
      const isVideo = file.type?.startsWith('video');
      setCreateModal((m) => ({ ...m, mediaType: isVideo ? 'video' : 'image' }));
    }
  };

  const handleCreateUpload = async () => {
    if (!createFile) {
      setCreateMsg({ type: 'error', text: 'Please choose a file to upload' });
      return;
    }
    if (createModal.mode === 'locked' && (!createPrice || Number(createPrice) <= 0)) {
      setCreateMsg({ type: 'error', text: 'Please set an unlock price greater than 0' });
      return;
    }

    setCreateUploading(true);
    setCreateMsg(null);
    try {
      const fileType = createFile.type || (createModal.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
      const res = await api.post('/posts/upload-url', {
        fileName: (createFile.name || `upload.${createModal.mediaType}`).replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileType
      });
      if (res.status !== 'success') {
        setCreateMsg({ type: 'error', text: 'Failed to get upload URL' });
        setCreateUploading(false);
        return;
      }

      const putRes = await fetch(res.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: createFile
      });
      if (!putRes.ok) {
        setCreateMsg({ type: 'error', text: 'Upload to storage failed' });
        setCreateUploading(false);
        return;
      }

      if (createModal.mode === 'story') {
        await api.post('/creators/stories', {
          mediaUrl: res.fileUrl,
          mediaType: createModal.mediaType
        });
      } else {
        const postType = createModal.mode === 'locked' ? 'ppv' : 'free';
        await api.post('/posts', {
          content: createCaption.trim(),
          media: [{
            url: res.fileUrl,
            type: createModal.mediaType,
            thumbnailUrl: createModal.mediaType === 'video' ? '/video-thumb.png' : res.fileUrl,
            isLocked: postType === 'ppv'
          }],
          postType,
          coinPrice: postType === 'ppv' ? Number(createPrice) : 0
        });
      }

      setMessage({ type: 'success', text: createModal.mode === 'story' ? 'Story published successfully!' : 'Content published successfully!' });
      setCreateModal(null);
      setCreateFile(null);
      loadDashboard();
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setCreateUploading(false);
    }
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      setMessage({ type: 'error', text: 'Please enter a stream title' });
      return;
    }
    if (Number(entryPrice) < 1) {
      setMessage({ type: 'error', text: 'Entry price must be at least 1 coin' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post('/creators/live/start', {
        streamTitle: streamTitle.trim(),
        category,
        coverUrl,
        language,
        entryPriceCoins: Math.max(0, Number(entryPrice) || 0),
        freeForSubscribers: freeForSubs
      });
      setMessage({ type: 'success', text: `You are live! Room: ${res.roomId || 'created'}` });
      setStreamTitle('');
      setThumbnail(null);
      setCoverUrl('');
      loadDashboard();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to start stream' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleStream = async () => {
    if (!streamTitle.trim()) {
      setPopupError('Please enter a stream title');
      return;
    }
    if (!scheduleDate) {
      setPopupError('Please pick a date & time');
      return;
    }
    if (new Date(scheduleDate).getTime() <= Date.now()) {
      setPopupError('Scheduled time must be in the future');
      return;
    }
    if (Number(entryPrice) < 1) {
      setPopupError('Entry price must be at least 1 coin');
      return;
    }
    setSubmitting(true);
    setPopupError(null);
    try {
      await api.post('/creators/live/schedule', {
        streamTitle: streamTitle.trim(),
        category,
        coverUrl,
        language,
        scheduledAt: new Date(scheduleDate).toISOString(),
        entryPriceCoins: Math.max(0, Number(entryPrice) || 0),
        freeForSubscribers: freeForSubs
      });
      setMessage({ type: 'success', text: 'Stream scheduled successfully' });
      setShowSchedulePopup(false);
      setStreamTitle('');
      setThumbnail(null);
      setCoverUrl('');
      loadDashboard();
    } catch (err) {
      setPopupError(err.message || 'Failed to schedule stream');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecent = (data.recentContent || []).filter((item) => {
    if (activeContentTab === 'All') return true;
    if (activeContentTab === 'Open') return item.status === 'Open';
    if (activeContentTab === 'Locked') return item.status === 'Locked';
    if (activeContentTab === 'Stories') return item.type === 'Story';
    return true;
  });

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const streamOpts = data.streamOptions || {};

  return (
    <div className={`${styles.dashboardContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>

          {/* Quick Actions */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            {loading ? (
              <div className={styles.quickActionsGrid}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className={styles.skCard} style={{ height: '150px', padding: 0, marginBottom: 0 }}>
                    <ShimmerSkeleton variant="card" height="100%" marginTop="0" light={!darkMode} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.quickActionsGrid}>
                {data.quickActions.filter((action) => action.id !== 'stream').map((action) => {
                  const Icon = iconMap[action.id === 'audio' ? 'Phone' : action.id === 'video' ? 'Video' : action.id === 'messages' ? 'MessageSquareText' : 'Radio'] || Radio;
                  return (
                    <div key={action.id} className={styles.quickActionCard}>
                      <div className={styles.quickActionTop}>
                        <div className={styles.quickActionIconWrap} style={{ background: `${action.color}20`, position: 'relative' }}>
                          <Icon size={24} style={{ color: action.color }} />
                          {action.id === 'messages' && unreadMessages > 0 && (
                            <span className={styles.quickActionIconBadge}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>
                          )}
                        </div>
                        <div className={styles.quickActionInfo}>
                          <div className={styles.quickActionHeaderRow}>
                            <h3 className={styles.quickActionTitle}>{action.title}</h3>
                            {action.isOnline && (
                              <div className={styles.onlineStatus}>
                                <span className={styles.onlineDot} /> {action.id === 'stream' ? (action.goLiveBtnLabel === 'Streaming Now' ? 'LIVE' : 'Online') : 'Online'}
                              </div>
                            )}
                          </div>
                          {action.rate !== undefined && (
                            <p className={styles.quickActionRate}>
                              Your rate: <strong style={{ color: action.color }}>{action.rate}</strong> {action.rateUnit}
                            </p>
                          )}
                          {action.description && <p className={styles.quickActionDesc}>{action.description}</p>}
                        </div>
                      </div>
                      <div className={styles.quickActionButtons}>
                        {action.id === 'audio' || action.id === 'video' ? (
                          <>
                            <button
                              className={styles.goLiveBtn}
                              style={{ background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 90%, #ffffff 100%)` }}
                              onClick={() => navigateTo(action.id === 'audio' ? '/creators/audio-calls' : '/creators/video-calls')}
                            >
                              Manage Calls
                            </button>
                            <button
                              className={styles.editRateBtn}
                              style={{ borderColor: `${action.color}80`, color: action.color }}
                              onClick={() => setRateTarget(action.id)}
                            >
                              Edit Rate
                            </button>
                          </>
                        ) : action.id === 'messages' ? (
                          <button className={styles.openMessagesBtn} style={{ background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 90%, #ffffff 100%)` }} onClick={() => navigateTo('/creators/messages')}>
                            Open Messages
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.goLiveBtn}
                              style={{ background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 90%, #ffffff 100%)` }}
                              onClick={() => setActiveTab('Creator Live Streams')}
                            >
                              {action.goLiveBtnLabel || 'Go Live'}
                            </button>
                            <button className={styles.editRateBtn} style={{ borderColor: `${action.color}80`, color: action.color }} onClick={() => setActiveTab('Creator Live Streams')}>
                              {action.editRateLabel || 'Schedule'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Go Stream Live */}
          <div className={styles.section}>
            <div className={styles.streamHeader}>
              <div className={styles.streamHeaderLeft}>
                <h2 className={styles.sectionTitle}>Go Stream Live</h2>
              </div>
            </div>

            {loading ? (
              <div className={styles.streamBodySkeleton}>
                <ShimmerSkeleton variant="media" height="140px" marginTop="0" light={!darkMode} />
                <div className={styles.streamSkeletonForm}>
                  <ShimmerSkeleton variant="text" width="40%" height="14px" marginTop="0" light={!darkMode} />
                  <ShimmerSkeleton variant="button" height="38px" marginTop="0" light={!darkMode} />
                  <ShimmerSkeleton variant="text" width="30%" height="13px" marginTop="0.25rem" light={!darkMode} />
                  <ShimmerSkeleton variant="button" height="38px" marginTop="0" light={!darkMode} />
                </div>
                <div className={styles.streamSkeletonBottom}>
                  <ShimmerSkeleton variant="button" height="36px" marginTop="0" light={!darkMode} />
                  <ShimmerSkeleton variant="button" height="36px" marginTop="0" light={!darkMode} />
                  <ShimmerSkeleton variant="button" height="42px" width="50%" marginTop="0" light={!darkMode} />
                </div>
              </div>
            ) : (
            <div className={styles.streamBody}>
              {/* Stream Preview / Thumbnail Upload */}
              <div className={styles.streamPreview}>
                <button
                  type="button"
                  className={styles.streamPreviewInner}
                  onClick={handleThumbnailClick}
                  title="Upload thumbnail"
                >
                  {thumbnail && <img src={thumbnail} alt="Thumbnail preview" className={styles.thumbnailPreviewImg} />}
                  <div className={styles.liveBadge}>
                    <Radio size={10} /> LIVE
                  </div>
                  {uploadingThumb ? (
                    <div className={styles.playButton}>
                      <Loader2 size={28} className={styles.thumbnailSpin} />
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
                    placeholder={streamOpts.defaultTitle || 'e.g. Friday Night Show'}
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
                    {DEFAULT_CATEGORIES.map((c) => (
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
                      <span className={styles.toggleLabel}>{streamOpts.freeForSubscribersLabel || 'Make stream free for subscribers'}</span>
                      <span className={styles.toggleDesc}>{streamOpts.freeForSubscribersDesc || 'Active subscribers can join for free'}</span>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" checked={freeForSubs} onChange={() => setFreeForSubs(!freeForSubs)} />
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
                  <p className={styles.formHint}>Fans will pay {entryPrice} coins to join your stream</p>
                </div>
              </div>

              {/* Start Options */}
              <div className={styles.startOptionsSection}>
                <label className={styles.formLabel}>Start</label>
                <div className={styles.startOptions}>
                  <div className={styles.startOption} onClick={() => setStreamType('goLive')}>
                    <div className={`${styles.startOptionRadio} ${streamType === 'goLive' ? styles.startOptionActive : ''}`}>
                      {streamType === 'goLive' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Zap size={16} className={styles.startOptionIcon} />
                        {streamOpts.startGoLiveLabel || 'Go Live Now'}
                      </div>
                      <span className={styles.startOptionDesc}>{streamOpts.startGoLiveDesc || 'Start streaming immediately'}</span>
                    </div>
                  </div>
                  <div className={styles.startOption} onClick={() => setStreamType('schedule')}>
                    <div className={`${styles.startOptionRadio} ${streamType === 'schedule' ? styles.startOptionActive : ''}`}>
                      {streamType === 'schedule' && <Check size={14} />}
                    </div>
                    <div className={styles.startOptionInfo}>
                      <div className={styles.startOptionTitle}>
                        <Calendar size={16} className={styles.startOptionIcon} />
                        {streamOpts.scheduleForLaterLabel || 'Schedule for Later'}
                      </div>
                      <span className={styles.startOptionDesc}>{streamOpts.scheduleForLaterDesc || 'Pick a date and time'}</span>
                    </div>
                  </div>
                </div>

                <button
                  className={styles.startNowBtn}
                  onClick={() => (streamType === 'goLive' ? handleStartStream() : (setPopupError(null), setShowSchedulePopup(true)))}
                  disabled={submitting || !streamTitle.trim()}
                >
                  {submitting ? <span><Loader2 size={16} className={styles.thumbnailSpin} /> Working…</span> : streamType === 'goLive' ? 'Go Live Now' : 'Schedule Stream'}
                </button>

                {message && (
                  <p style={{ color: message.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    {message.text}
                  </p>
                )}

                {/* Schedule Popup */}
                <div className={`${styles.popupOverlay} ${showSchedulePopup ? styles.active : ''}`}>
                  <div className={styles.popupContainer}>
                    <div className={styles.popupHeader}>
                      <h3 className={styles.popupTitle}>Schedule Stream</h3>
                      <button className={styles.popupClose} onClick={() => setShowSchedulePopup(false)}>×</button>
                    </div>
                    <div className={styles.popupContent}>
                      <div className={styles.popupScheduleDetails}>
                        <DateTimePicker
                          value={scheduleDate}
                          onChange={setScheduleDate}
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
                      <button className={styles.popupSaveBtn} onClick={handleScheduleStream} disabled={submitting}>
                        {submitting ? 'Scheduling…' : 'Confirm Schedule'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Stream Confirmation Popup */}
                <ConfirmDeleteDialog
                  open={!!deleteStreamTarget}
                  itemName={deleteStreamTarget ? deleteStreamTarget.title : ''}
                  title="Delete Stream?"
                  confirmLabel="Delete Stream"
                  deleting={deletingStream}
                  darkMode={darkMode}
                  onCancel={closeDeleteStream}
                  onConfirm={confirmDeleteStream}
                />
              </div>
            </div>
            )}
          </div>

          {/* Create Content */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Create Content</h2>
            <div className={styles.createContentGrid}>
              {createContentCards.map((card) => {
                const Icon = iconMap[card.icon];
                return (
                  <div key={card.id} className={styles.createContentCard}>
                    <div className={styles.createCardTop}>
                      <div className={styles.createCardIconWrap} style={{ background: `${card.color}20` }}>
                        <Icon size={20} style={{ color: card.color }} />
                      </div>
                      <div className={styles.createCardInfo}>
                        <h3 className={styles.createCardTitle}>{card.title}</h3>
                        <p className={styles.createCardDesc}>{card.description}</p>
                      </div>
                    </div>
                    <div className={styles.createCardButtons}>
                      {card.actions.map((action) => (
                        <button
                          key={action.label}
                          className={`${styles.createCardBtn} ${card.actions.length === 1 ? styles.createCardBtnWide : ''}`}
                          onClick={() => handleCreateCardAction(card, action)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Content */}
          <div className={styles.section}>
            <div className={styles.recentHeader}>
              <h2 className={styles.sectionTitle}>Recent Content</h2>
              <button className={styles.viewAllLink} onClick={() => setActiveTab('Creator Content')}>View All</button>
            </div>
            <div className={styles.recentTabs}>
              {['All', 'Open', 'Locked', 'Stories'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.recentTab} ${activeContentTab === tab ? styles.recentTabActive : ''}`}
                  onClick={() => setActiveContentTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {loading ? (
              <div className={styles.recentGrid}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.skCard} style={{ padding: 0, marginBottom: 0 }}>
                    <ShimmerSkeleton variant="media" height="100px" marginTop="0" light={!darkMode} />
                    <div style={{ padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <ShimmerSkeleton variant="text" width="75%" height="14px" marginTop="0" light={!darkMode} />
                      <ShimmerSkeleton variant="text" width="45%" height="13px" marginTop="0" light={!darkMode} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className={styles.recentGrid}>
              {filteredRecent.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem 0' }}>No content yet.</p>}
              {filteredRecent.map((item) => (
                <div key={item.id} className={styles.recentCard}>
                  <div className={styles.recentThumbWrap}>
                    <img src={item.thumbnail} alt={item.title} className={styles.recentThumb} />
                    <span className={`${styles.recentStatusBadge} ${item.status === 'Open' ? styles.statusOpen : styles.statusLocked}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentTitleRow}>
                      <span className={styles.recentTitle}>{item.title}</span>
                      {item.price && <span className={styles.recentPrice}>{item.price}</span>}
                    </div>
                    <span className={styles.recentMeta}>{item.type} • {fmtDate(item.date)}</span>
                  </div>
                  <div className={styles.recentFooter}>
                    <span className={styles.recentStat}><Eye size={12} /> {item.views}</span>
                    <span className={styles.recentStat}><Heart size={12} /> {item.likes}</span>
                    <div className={styles.recentMenuWrap} ref={recentMenuRef}>
                      <button className={styles.recentMoreBtn} onClick={() => setOpenRecentMenuId(openRecentMenuId === item.id ? null : item.id)}><MoreVertical size={12} /></button>
                      {openRecentMenuId === item.id && (
                        <div className={styles.recentMenu}>
                          <button className={styles.recentMenuItem} onClick={() => handleEditRecent(item)}><Pencil size={12} /> Edit</button>
                          <button className={`${styles.recentMenuItem} ${styles.recentMenuDelete}`} onClick={() => handleDeleteRecent(item)}><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles.rightSidebar}>

          {/* Earnings Overview */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Earnings Overview</h3>
              <PeriodDropdown variant="text" value={earningsPeriod} onChange={handleEarningsPeriodChange} />
            </div>
            {loading ? (
              <div className={styles.earningsList}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.earningsItem}>
                    <ShimmerSkeleton variant="text" width="55%" height="12px" marginTop="0" light={!darkMode} />
                    <ShimmerSkeleton variant="text" width="35%" height="12px" marginTop="0" light={!darkMode} />
                  </div>
                ))}
              </div>
            ) : (
            <div className={styles.earningsList}>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>{data.earningsOverview.period || earningsPeriod} (coins)</span>
                <span className={styles.earningsValue}>{data.earningsOverview.totalCoins || 0}</span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Change</span>
                <span
                  className={`${styles.earningsPending} ${String(data.earningsOverview.change || '+0%').startsWith('-') ? styles.earningsNegative : styles.earningsPositive}`}
                >
                  {data.earningsOverview.change || '+0%'}
                </span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Subscribers</span>
                <span className={styles.earningsPaidOut}>{data.quickStats.stats?.[1]?.value || 0}</span>
              </div>
              <div className={styles.earningsItem}>
                <span className={styles.earningsLabel}>Followers</span>
                <span className={styles.earningsCalls}>{data.quickStats.stats?.[2]?.value || 0}</span>
              </div>
            </div>
            )}
            <button className={styles.viewEarningsBtn} onClick={() => setActiveTab('Creator Earnings')}>View Earnings</button>
          </div>

          {/* Upcoming Streams */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Upcoming Streams</h3>
              <button className={styles.viewAllSmall} onClick={() => setActiveTab('Creator Live Streams')}>View All</button>
            </div>
            {loading ? (
              <div className={styles.streamsList}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className={styles.streamItem} style={{ padding: 0 }}>
                    <ShimmerSkeleton variant="media" width="44px" height="44px" marginTop="0" style={{ borderRadius: '8px', flexShrink: 0 }} light={!darkMode} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <ShimmerSkeleton variant="text" width="70%" height="11px" marginTop="0" light={!darkMode} />
                      <ShimmerSkeleton variant="text" width="40%" height="10px" marginTop="0" light={!darkMode} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className={styles.streamsList}>
              {data.upcomingStreams.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '0.5rem 0' }}>No upcoming streams.</p>}
              {data.upcomingStreams.map((stream) => (
                <div key={stream.id} className={styles.streamItem}>
                  <img src={stream.thumbnail || '/Girl.png'} alt={stream.title} className={styles.streamThumb} />
                  <div className={styles.streamInfo}>
                    <span className={styles.streamTitle}>{stream.title}</span>
                    <span className={styles.streamDate}>{fmtDate(stream.date)}</span>
                  </div>
                  <span className={`${styles.streamPrice} ${stream.entryPrice === 0 ? styles.streamPriceFree : ''}`}>
                    {stream.entryPrice > 0 ? `${stream.entryPrice} coins` : 'Free'}
                  </span>
                  <div className={styles.streamMenuWrap} data-stream-menu={stream.id}>
                    <button
                      className={styles.streamMoreBtn}
                      onClick={() => setOpenStreamMenu(openStreamMenu === stream.id ? null : stream.id)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openStreamMenu === stream.id && (
                      <div className={styles.streamMenu}>
                        <button className={styles.streamMenuItem} onClick={() => handleEditStream(stream)}>
                          <Pencil size={14} /> Edit Stream
                        </button>
                        <button
                          className={`${styles.streamMenuItem} ${styles.streamMenuDelete}`}
                          onClick={() => { setOpenStreamMenu(null); openDeleteStream(stream); }}
                        >
                          <Trash2 size={14} /> Delete Stream
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className={styles.sidebarCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Quick Stats</h3>
              <PeriodDropdown variant="text" value={quickStatsPeriod} onChange={handleQuickStatsPeriodChange} />
            </div>
            {loading ? (
              <div className={styles.statsGrid}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={styles.statItem}>
                    <ShimmerSkeleton variant="text" width="60%" height="12px" marginTop="0" light={!darkMode} />
                    <div className={styles.statRow}>
                      <ShimmerSkeleton variant="text" width="40%" height="18px" marginTop="0" light={!darkMode} />
                      <ShimmerSkeleton variant="text" width="30%" height="12px" marginTop="0" light={!darkMode} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className={styles.statsGrid}>
              {(data.quickStats.stats || []).map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statRow}>
                    <span className={styles.statValue}>{stat.value}</span>
                    {stat.change ? (
                      <span className={`${styles.statChange} ${String(stat.change).startsWith('-') ? styles.statNegative : styles.statPositive}`}>
                        {stat.change}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Content Modal */}
      {createModal && (
        <div className={styles.createModalBackdrop} onClick={() => setCreateModal(null)}>
          <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createModalHeader}>
              <h3 className={styles.createModalTitle}>
                {createModal.mode === 'locked' ? 'Create Locked Content' : createModal.mode === 'open' ? 'Post Open Content' : 'Create Story'}
              </h3>
              <button className={styles.createModalClose} onClick={() => setCreateModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.createModalBody}>
              <p className={styles.createModalHint}>
                {createModal.mode === 'locked'
                  ? 'Lock your content and set a price fans pay to unlock it.'
                  : createModal.mode === 'open'
                    ? 'Share this content for free with all your fans.'
                    : 'Share a moment that disappears after 24 hours.'}
              </p>

              <input
                ref={createFileInputRef}
                type="file"
                accept={createModal.mode === 'story' ? 'image/*,video/*' : createModal.mediaType === 'video' ? 'video/*' : 'image/*'}
                style={{ display: 'none' }}
                onChange={handleCreateFileChange}
              />
              <button className={styles.createPickBtn} onClick={() => createFileInputRef.current?.click()}>
                {createFile
                  ? createFile.name
                  : createModal.mode === 'story'
                    ? 'Choose an image or video'
                    : `Choose ${createModal.mediaType === 'video' ? 'video' : 'image'} file`}
              </button>

              {createFile && (
                <div className={styles.createPreview}>
                  {createModal.mediaType === 'video' ? (
                    <video src={URL.createObjectURL(createFile)} muted controls className={styles.createPreviewMedia} />
                  ) : (
                    <img src={URL.createObjectURL(createFile)} alt="Preview" className={styles.createPreviewMedia} />
                  )}
                </div>
              )}

              {createModal.mode !== 'story' && (
                <input
                  type="text"
                  placeholder="Add a caption..."
                  className={styles.createInput}
                  value={createCaption}
                  onChange={(e) => setCreateCaption(e.target.value)}
                />
              )}

              {createModal.mode === 'locked' && (
                <div className={styles.createPriceRow}>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlock price (coins)"
                    className={styles.createInput}
                    value={createPrice}
                    onChange={(e) => setCreatePrice(e.target.value)}
                  />
                  <span className={styles.createPriceSuffix}>coins</span>
                </div>
              )}

              {createMsg && (
                <p style={{ color: createMsg.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.82rem', margin: 0 }}>
                  {createMsg.text}
                </p>
              )}
            </div>
            <div className={styles.createModalFooter}>
              <button className={styles.createModalCancel} onClick={() => setCreateModal(null)}>Cancel</button>
              <button
                className={styles.createModalPublish}
                onClick={handleCreateUpload}
                disabled={createUploading}
              >
                {createUploading ? <span><Loader2 size={14} className={styles.thumbnailSpin} /> Publishing…</span> : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Content Delete Confirmation Popup */}
      <ConfirmDeleteDialog
        open={!!deleteRecentTarget}
        itemName={deleteRecentTarget ? deleteRecentTarget.title : ''}
        deleting={deletingRecent}
        darkMode={darkMode}
        onCancel={closeDeleteRecent}
        onConfirm={confirmDeleteRecent}
      />

      {/* Edit call rate dialog */}
      <CallRateDialog
        callType={rateTarget}
        currentRate={rateTarget ? Number(data.quickActions.find((a) => a.id === rateTarget)?.rate || 0) : 0}
        darkMode={darkMode}
        onClose={() => setRateTarget(null)}
        onSave={handleSaveRate}
      />
    </div>
  );
};
