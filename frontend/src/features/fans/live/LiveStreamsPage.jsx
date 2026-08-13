import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useLiveStreamSocket } from '../../../hooks/useLiveStreamSocket';
import { useLiveStreamViewer } from '../../../hooks/useLiveStreamViewer';
import { useStreamChat } from '../../../hooks/useStreamChat';
import {
  Eye,
  BadgeCheck,
  ChevronDown,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Gift,
  Coins,
  Send,
  MessageSquare,
  Search,
  Radio
} from 'lucide-react';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { GiftLeaderboard } from '../../gifts/GiftLeaderboard';
import { QuickRecharge } from '../../gifts/QuickRecharge';
import { FanLiveStreamOverlay } from './FanLiveStreamOverlay';
import { useToast } from '../../../components/Toast/Toast';
import styles from './LiveStreamsPage.module.css';

export const LiveStreamsPage = () => {
  const { darkMode, user, balance } = useApp();
  const { toast } = useToast();
  
  // States
  const [allStreams, setAllStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('all'); // all, upcoming, liveNow, topRated, new
  const [sortBy, setSortBy] = useState('Viewers High To Low');
  const [availability, setAvailability] = useState('all'); // all, live, upcoming
  const [category, setCategory] = useState('All Categories');
  const [language, setLanguage] = useState('All Languages');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({});

  // Join modal state
  const [joinStream, setJoinStream] = useState(null);
  const [joinResult, setJoinResult] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  // Passive Agora subscriber used to actually watch the stream inside the modal
  const viewer = useLiveStreamViewer();

  // Live gifts + recharge while watching a stream. Animations are broadcast to
  // the whole `live_stream_{id}` room so the host and every viewer see them.
  const { events: giftEvents, sendGift, leaderboard: giftLeaderboard, summary: giftSummary } = useGiftEvents({
    streamId: joinStream?._id || null,
    enabled: !!joinResult && joinResult.status === 'success',
    receiverId: joinStream?.creatorId || null
  });
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  // Live chat while watching — messages append in arrival order, one after
  // another, for every viewer and the host.
  const { messages: chatMessages, sendMessage: sendChatMessage, sending: chatSending } = useStreamChat({
    streamId: joinStream?._id || null,
    enabled: !!joinResult && joinResult.status === 'success'
  });
  const [chatDraft, setChatDraft] = useState('');
  const chatListRef = useRef(null);

  // Keep the chat pinned to the newest message.
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatDraft.trim()) return;
    const sent = await sendChatMessage(chatDraft);
    if (sent) setChatDraft('');
  };

  // Local "Notify Me" reminders for upcoming streams (browser-only)
  const REMINDERS_KEY = 'fantrio_stream_reminders';
  const loadReminders = () => {
    try { return new Set(JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]')); } catch { return new Set(); }
  };
  const [reminders, setReminders] = useState(loadReminders);

  const toggleNotify = (stream) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(stream._id)) {
        next.delete(stream._id);
        toast.info('You will no longer be notified for this stream.');
      } else {
        next.add(stream._id);
        toast.success(`We'll notify you when ${stream.displayName || 'this creator'} goes live!`);
      }
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const [streamEndedInfo, setStreamEndedInfo] = useState(null);

  const triggerStreamEnded = (targetStream) => {
    const info = {
      creatorName: targetStream?.displayName || targetStream?.username || 'The creator',
      streamTitle: targetStream?.streamTitle || targetStream?.title || 'Live Stream',
      coverUrl: targetStream?.coverUrl || targetStream?.thumbnail || '/Girl.png'
    };
    try { viewer.leave(); } catch (e) { /* noop */ }
    const streamId = joinStream?._id || targetStream?._id;
    setJoinStream(null);
    setJoinResult(null);
    if (streamId) {
      api.post(`/creators/live/${streamId}/leave`).catch(() => {});
    }
    setStreamEndedInfo(info);
    loadStreams();
  };

  const executeJoin = async (targetStream) => {
    if (!targetStream) return;
    setJoinLoading(true);
    setViewerError('');
    try {
      const res = await api.post(`/creators/live/${targetStream._id}/join`);
      if (res.status === 'success') {
        setJoinResult(res);
        setAllStreams((prev) => prev.map((s) =>
          s._id === targetStream._id ? { ...s, viewerCount: res.viewerCount } : s
        ));

        try {
          await viewer.join({
            channel: res.roomId,
            token: res.agoraToken,
            uid: user?.id,
            onStreamEnded: () => {
              triggerStreamEnded(targetStream);
            }
          });
        } catch (joinErr) {
          console.error('Failed to join live stream channel', joinErr);
          setViewerError('Live playback could not be started. Please try again.');
        }
      }
    } catch (err) {
      setJoinResult({ status: 'error', message: err.message || 'Failed to join stream' });
    } finally {
      setJoinLoading(false);
    }
  };

  const openJoinModal = (stream) => {
    setJoinResult(null);
    setViewerError('');
    setJoinStream(stream);

    // If the stream is free, or the fan has already paid for it previously,
    // or is a subscriber with free access, join immediately without prompting to pay again.
    if (stream.hasAccess || stream.alreadyPaid || !stream.entryPriceCoins || stream.entryPriceCoins === 0) {
      executeJoin(stream);
    }
  };

  const handleLeaveStream = async () => {
    try { viewer.leave(); } catch (e) { console.error('Failed to leave live channel', e); }
    const streamId = joinStream?._id;
    setJoinStream(null);
    setJoinResult(null);
    if (streamId) {
      try { await api.post(`/creators/live/${streamId}/leave`); } catch { /* noop */ }
    }
  };

  const handleJoin = async () => {
    if (joinStream) {
      await executeJoin(joinStream);
    }
  };

  // UI Open Dropdowns
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [sidebarSortOpen, setSidebarSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleDropdown = (name) => {
    setSortOpen(name === 'sort' ? !sortOpen : false);
    setCategoryOpen(name === 'category' ? !categoryOpen : false);
    setLanguageOpen(name === 'language' ? !languageOpen : false);
    setSidebarSortOpen(name === 'sidebarSort' ? !sidebarSortOpen : false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setSortOpen(false);
      setCategoryOpen(false);
      setLanguageOpen(false);
      setSidebarSortOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Constant Options
  const categoriesList = ['All Categories', 'Just Chatting', 'Music', 'Dance', 'ASMR', 'Gaming', 'Others'];
  const languagesList = ['All Languages', 'English', 'Spanish', 'French', 'German', 'Japanese'];
  const sortOptions = ['Viewers High To Low', 'Viewers Low To High'];

  // Categories metadata for bottom row (live counts come from the backend)
  const categoryMetadata = [
    { name: 'Just Chatting', imageSrc: '/mic.png' },
    { name: 'Music', imageSrc: '/music.png' },
    { name: 'Dance', imageSrc: '/dance.png' },
    { name: 'ASMR', imageSrc: '/asmr.png' },
    { name: 'Gaming', imageSrc: '/gaming.png' },
    { name: 'Others', imageSrc: '/others.png' },
  ].map((c) => ({
    ...c,
    liveCount: `${categoryCounts[c.name] || 0} Live`
  }));

  // Fetch streams
  const loadStreams = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (tab !== 'all') queryParams.append('tab', tab);
      if (category !== 'All Categories') queryParams.append('category', category);
      if (language !== 'All Languages') queryParams.append('language', language);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (availability !== 'all') queryParams.append('availability', availability);

      const res = await api.get(`/creators/live?${queryParams.toString()}`);
      if (res.status === 'success') {
        setAllStreams(res.liveStreams || []);
        const counts = {};
        (res.categories || []).forEach((c) => { counts[c.name] = c.liveCount; });
        setCategoryCounts(counts);
      }
    } catch (err) {
      console.error('Failed to load live streams:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const searchedStreams = searchQuery.trim()
    ? allStreams.filter((s) =>
        (s.streamTitle && s.streamTitle.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (s.displayName && s.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (s.username && s.username.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      )
    : allStreams;

  const STREAMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(searchedStreams.length / STREAMS_PER_PAGE));
  const startIndex = (page - 1) * STREAMS_PER_PAGE;
  const visibleStreams = searchedStreams.slice(startIndex, startIndex + STREAMS_PER_PAGE);
  const liveCount = searchedStreams.filter((s) => s.isLive).length;

  // Real-time viewer count updates + live list refreshes via Socket.io
  useLiveStreamSocket({
    streamIds: visibleStreams.map((s) => s._id),
    onViewerUpdate: (payload) => {
      if (!payload || !payload.streamId) return;
      setAllStreams((prev) => prev.map((s) =>
        s._id === payload.streamId ? { ...s, viewerCount: payload.viewerCount, isLive: payload.isLive } : s
      ));
      // Keep the open Join modal'viewer count in sync too
      setJoinStream((prev) => (prev && prev._id === payload.streamId ? { ...prev, viewerCount: payload.viewerCount } : prev));
    },
    onStreamEvent: (payload) => {
      if (payload && !payload.isLive && joinStream && String(payload.streamId) === String(joinStream._id)) {
        triggerStreamEnded(joinStream);
      } else {
        loadStreams();
      }
    }
  });

  useEffect(() => {
    Promise.resolve().then(() => {
      loadStreams();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, category, language, sortBy, availability, searchQuery]);

  // Reset to first page when filters change — adjusted during render
  const filtersKey = `${tab}|${category}|${language}|${sortBy}|${availability}|${searchQuery}`;
  const [prevFilters, setPrevFilters] = useState(filtersKey);
  if (filtersKey !== prevFilters) {
    setPrevFilters(filtersKey);
    setPage(1);
  }

  const handleResetFilters = () => {
    setSearchQuery('');
    setAvailability('all');
    setCategory('All Categories');
    setLanguage('All Languages');
    setSortBy('Viewers High To Low');
    setTab('all');
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.mainLayout}>
        {/* Left Feed */}
        <div className={styles.centerFeed}>
          {/* Header Area */}
          <div className={styles.feedHeader}>
            <div className={styles.headerTitleBlock}>
              <div className={styles.titleRow}>
                <img src="/live.png" alt="Live Streams" className={styles.liveHeaderIcon} />
                <h1 className={styles.pageTitle}>Live Streams</h1>
              </div>
              <p className={styles.pageSubtitle}>Join live now and chat with your favourite creators in real time.</p>
            </div>

            {/* Sort & Filter Controls Row */}
            <div className={styles.controlsRow}>
              {/* Sort Dropdown */}
              <div className={styles.sortWrapper}>
                <button 
                  className={styles.sortButton}
                  onClick={(e) => { e.stopPropagation(); toggleDropdown('sort'); }}
                >
                  Sort By: {sortBy === 'Viewers High To Low' ? 'High to Low' : 'Low to High'}
                  <ChevronDown size={14} />
                </button>
                {sortOpen && (
                  <div className={styles.sortDropdown} onClick={(e) => e.stopPropagation()}>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={sortBy === opt ? styles.activeSortOption : ''}
                      >
                        {opt === 'Viewers High To Low' ? 'Viewers: High to Low' : 'Viewers: Low to High'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Filter Button */}
              <button 
                className={styles.mobileFilterToggleBtn}
                onClick={() => setMobileFiltersOpen(true)}
              >
                Filters
              </button>
            </div>
          </div>

          {/* Search Bar & Count Row */}
          <div className={styles.searchLayoutRow}>
            <div className={styles.searchInputWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input 
                type="text" 
                placeholder="Search live streams by title, creator or @username..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className={styles.searchInput}
              />
            </div>
            
            <span className={styles.creatorsCountText}>
              {searchedStreams.length} Streams Found
            </span>
          </div>

          {/* Tab Pills Row */}
          <div className={styles.pillsRow}>
            <button 
              className={`${styles.pill} ${tab === 'all' ? styles.activePill : ''}`}
              onClick={() => setTab('all')}
            >
              All
            </button>
            <button 
              className={`${styles.pill} ${tab === 'upcoming' ? styles.activePill : ''}`}
              onClick={() => setTab('upcoming')}
            >
              <span role="img" aria-label="calendar">📅</span> Upcoming
            </button>
            <button 
              className={`${styles.pill} ${tab === 'liveNow' ? styles.activePill : ''}`}
              onClick={() => setTab('liveNow')}
            >
              <span role="img" aria-label="green dot">🟢</span> Live Now ({liveCount})
            </button>
            <button 
              className={`${styles.pill} ${tab === 'topRated' ? styles.activePill : ''} ${styles.desktopOnlyPill}`}
              onClick={() => setTab('topRated')}
            >
              <span role="img" aria-label="star">⭐</span> Top Rated
            </button>
            <button 
              className={`${styles.pill} ${tab === 'new' ? styles.activePill : ''} ${styles.desktopOnlyPill}`}
              onClick={() => setTab('new')}
            >
              New
            </button>
          </div>

          {/* Main Grid */}
          {loading ? (
            <div className={styles.streamsGrid}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="skeleton-card" style={{ height: '300px', padding: 0 }}>
                  <div className="skeleton-box skeleton-media" style={{ height: '100%', marginTop: 0, borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : visibleStreams.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>
                {error
                  ? 'Could not load live streams. Please check your connection and try again.'
                  : 'No live streams found matching your filters.'}
              </p>
              {error && (
                <button className={styles.retryBtn} onClick={loadStreams}>Try Again</button>
              )}
            </div>
          ) : (
            <>
              <div className={styles.streamsGrid}>
                {visibleStreams.map((stream) => (
                  <div key={stream._id} className={styles.streamCard}>
                    <div 
                      className={styles.cardBackground} 
                      style={{ backgroundImage: `url(${stream.coverUrl})` }}
                    >
                      {/* Header Tags */}
                      <div className={styles.cardHeader}>
                        {stream.isLive ? (
                          <span className={styles.liveBadge}>LIVE</span>
                        ) : (
                          <span className={styles.upcomingBadge}>UPCOMING</span>
                        )}
                        <div className={styles.viewerBadge}>
                          <Eye size={12} />
                          <span>{stream.viewerCount}</span>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className={styles.cardFooter}>
                        <div className={styles.nameRow}>
                          <span className={styles.displayName}>{stream.displayName}</span>
                          {stream.isVerified && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                        </div>
                        <p className={styles.bioText}>{stream.streamTitle}</p>
                        <div className={styles.categoryStatus}>
                          <span className={styles.statusDot}></span>
                          <span>{stream.category}</span>
                        </div>
                        
                        <div className={styles.cardFooterBottom}>
                          <div className={styles.rateContainer}>
                            <img src="/coin.png" alt="Coin" className={styles.rateCoin} />
                            <div className={styles.rateTextWrapper}>
                              <span className={styles.rateValue}>{stream.entryPriceCoins > 0 ? stream.entryPriceCoins : 'Free'}</span>
                              <span className={styles.rateLabel}>{stream.entryPriceCoins > 0 ? ' Coin Entry' : ''}</span>
                            </div>
                          </div>
                          {stream.isLive ? (
                            <button
                              className={styles.joinBtn}
                              onClick={() => openJoinModal(stream)}
                            >
                              Join Stream
                            </button>
                          ) : (
                            <button
                              className={`${styles.joinBtn} ${reminders.has(stream._id) ? styles.notifiedBtn : ''}`}
                              onClick={() => toggleNotify(stream)}
                            >
                              {reminders.has(stream._id) ? 'Notified ✓' : 'Notify Me'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!loading && totalPages > 1 && (
                <div className={styles.paginationRow}>
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.pageArrow}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (totalPages > 5 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className={styles.pageEllipsis}>....</span>;
                      }
                      return null;
                    }
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`${styles.pageNumBtn} ${page === pageNum ? styles.activePage : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={styles.pageArrow}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Filters & Stats Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Filters Card */}
          <div className={`${styles.filtersSidebar} ${styles.desktopFiltersSidebar}`}>
            <div className={styles.filtersHeader}>
              <h3 className={styles.filtersTitle}>Filters</h3>
              <button className={styles.resetBtn} onClick={handleResetFilters}>Reset</button>
            </div>

            {/* Availability */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionLabel}>Availability</h4>
              <div className={styles.checkboxesList}>
                <div className={styles.checkboxWrapper} onClick={() => setAvailability('all')}>
                  <div className={`${styles.customCheckbox} ${availability === 'all' ? styles.checkboxChecked : ''}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkboxLabel}>All Live Streams</span>
                </div>
                <div className={styles.checkboxWrapper} onClick={() => setAvailability('live')}>
                  <div className={`${styles.customCheckbox} ${availability === 'live' ? styles.checkboxChecked : ''}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkboxLabel}>
                    <span className={styles.checkboxLabelGreenDot}></span>
                    Live Now
                  </span>
                </div>
                <div className={styles.checkboxWrapper} onClick={() => setAvailability('upcoming')}>
                  <div className={`${styles.customCheckbox} ${availability === 'upcoming' ? styles.checkboxChecked : ''}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={styles.checkboxLabel}>
                    <span className={styles.checkboxLabelYellowDot}></span>
                    Upcoming
                  </span>
                </div>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionLabel}>Category</h4>
              <div className={styles.dropdownWrapper}>
                <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
                  {category}
                  <ChevronDown size={14} />
                </button>
                {categoryOpen && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    {categoriesList.map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => {
                          setCategory(cat);
                          setCategoryOpen(false);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Languages Dropdown */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionLabel}>Languages</h4>
              <div className={styles.dropdownWrapper}>
                <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('language'); }}>
                  {language}
                  <ChevronDown size={14} />
                </button>
                {languageOpen && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    {languagesList.map((lang) => (
                      <button 
                        key={lang} 
                        onClick={() => {
                          setLanguage(lang);
                          setLanguageOpen(false);
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionLabel}>Sort By</h4>
              <div className={styles.dropdownWrapper}>
                <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('sidebarSort'); }}>
                  {sortBy === 'Viewers High To Low' ? 'Viewers High To Low' : 'Viewers Low To High'}
                  <ChevronDown size={14} />
                </button>
                {sidebarSortOpen && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    {sortOptions.map((opt) => (
                      <button 
                        key={opt} 
                        onClick={() => {
                          setSortBy(opt);
                          setSidebarSortOpen(false);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className={styles.applyBtn} onClick={loadStreams}>Apply Filters</button>
          </div>
        </div>
      </div>

      {/* Live Categories Bottom Row */}
      <div className={styles.categoriesSection}>
        <h2 className={styles.categoriesTitle}>Live Categories</h2>
        <div className={styles.categoriesGrid}>
          {categoryMetadata.map((cat) => {
            const isActive = category === cat.name;
            return (
              <div 
                key={cat.name} 
                className={`${styles.categoryCard} ${isActive ? styles.activeCategoryCard : ''}`}
                onClick={() => {
                  setCategory(isActive ? 'All Categories' : cat.name);
                  document.querySelector('.scrollableContent')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className={styles.categoryIconWrapper}>
                  <div 
                    className={styles.categoryIcon} 
                    style={{
                      WebkitMaskImage: `url(${cat.imageSrc})`,
                      maskImage: `url(${cat.imageSrc})`
                    }}
                  />
                </div>
                <h4 className={styles.categoryCardLabel}>{cat.name}</h4>
                <p className={styles.categoryCardLiveCount}>{cat.liveCount}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Filters Popup Modal */}
      {mobileFiltersOpen && (
        <div className={styles.mobileFiltersBackdrop} onClick={() => setMobileFiltersOpen(false)}>
          <div className={styles.mobileFiltersModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileFiltersModalHeader}>
              <h3 className={styles.mobileFiltersModalTitle}>Filters</h3>
              <button className={styles.closeFiltersModalBtn} onClick={() => setMobileFiltersOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.mobileFiltersModalBody}>
              {/* Availability */}
              <div className={styles.filterSection}>
                <div className={styles.filterSectionHeader}>
                  <h4 className={styles.filterSectionLabel}>Availability</h4>
                  <button onClick={handleResetFilters} className={styles.mobileResetBtn}>Reset</button>
                </div>
                <div className={styles.checkboxesList}>
                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('all')}>
                    <div className={`${styles.customCheckbox} ${availability === 'all' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>All Live Streams</span>
                  </div>
                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('live')}>
                    <div className={`${styles.customCheckbox} ${availability === 'live' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>
                      <span className={styles.checkboxLabelGreenDot}></span>
                      Live Now
                    </span>
                  </div>
                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('upcoming')}>
                    <div className={`${styles.customCheckbox} ${availability === 'upcoming' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>
                      <span className={styles.checkboxLabelYellowDot}></span>
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Category</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
                    {category}
                    <ChevronDown size={14} />
                  </button>
                  {categoryOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {categoriesList.map((cat) => (
                        <button 
                          key={cat} 
                          onClick={() => {
                            setCategory(cat);
                            setCategoryOpen(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Languages Dropdown */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Languages</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('language'); }}>
                    {language}
                    <ChevronDown size={14} />
                  </button>
                  {languageOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {languagesList.map((lang) => (
                        <button 
                          key={lang} 
                          onClick={() => {
                            setLanguage(lang);
                            setLanguageOpen(false);
                          }}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sort By Dropdown */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Sort By</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('sidebarSort'); }}>
                    {sortBy === 'Viewers High To Low' ? 'Viewers High To Low' : 'Viewers Low To High'}
                    <ChevronDown size={14} />
                  </button>
                  {sidebarSortOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {sortOptions.map((opt) => (
                        <button 
                          key={opt} 
                          onClick={() => {
                            setSortBy(opt);
                            setSidebarSortOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.mobileFiltersModalFooter}>
              <button 
                className={styles.mobileApplyFiltersBtn} 
                onClick={() => {
                  loadStreams();
                  setMobileFiltersOpen(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Fan Instagram Live Overlay */}
      {joinStream && joinResult?.status === 'success' && (
        <FanLiveStreamOverlay
          stream={joinStream}
          viewer={viewer}
          giftEvents={giftEvents}
          sendGift={sendGift}
          giftLeaderboard={giftLeaderboard}
          giftSummary={giftSummary}
          chatMessages={chatMessages}
          sendChatMessage={sendChatMessage}
          chatSending={chatSending}
          onLeaveStream={handleLeaveStream}
          balance={balance}
        />
      )}

      {/* Pre-join Stream Confirmation Modal (or Error state) */}
      {joinStream && (!joinResult || joinResult.status === 'error') && (
        <div className={styles.joinModalBackdrop} onClick={handleLeaveStream}>
          <div className={styles.joinModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.joinModalHeader}>
              <h3 className={styles.joinModalTitle}>Join Stream</h3>
              <button className={styles.joinModalClose} onClick={handleLeaveStream}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.joinModalBody}>
              {!joinResult ? (
                <>
                  <div className={styles.joinStreamPreview}>
                    <div className={styles.joinStreamCover} style={{ backgroundImage: `url(${joinStream.coverUrl})` }} />
                    <div className={styles.joinStreamInfo}>
                      <span className={styles.joinStreamName}>{joinStream.displayName}</span>
                      <span className={styles.joinStreamTitle}>{joinStream.streamTitle}</span>
                      <span className={styles.joinStreamMeta}>
                        {joinStream.category} · {joinStream.viewerCount} watching
                      </span>
                    </div>
                  </div>
                  {joinStream.alreadyPaid ? (
                    <p className={styles.joinPriceNote}>You have already unlocked access to this live stream.</p>
                  ) : joinStream.entryPriceCoins > 0 ? (
                    <p className={styles.joinPriceNote}>
                      {joinStream.freeForSubscribers
                        ? `This stream costs ${joinStream.entryPriceCoins} coins to enter — free for active subscribers.`
                        : `Joining this stream will charge ${joinStream.entryPriceCoins} coins from your wallet.`}
                    </p>
                  ) : (
                    <p className={styles.joinPriceNote}>This stream is free to join.</p>
                  )}
                </>
              ) : (
                <div className={styles.joinErrorBox}>
                  <p className={styles.joinErrorText}>{joinResult.message}</p>
                </div>
              )}
            </div>

            <div className={styles.joinModalFooter}>
              {!joinResult ? (
                <button
                  className={styles.joinConfirmBtn}
                  onClick={handleJoin}
                  disabled={joinLoading}
                >
                  {joinLoading ? (
                    <span className={styles.joinLoading}><Loader2 size={16} className={styles.joinSpin} /> Joining…</span>
                  ) : joinStream.alreadyPaid || joinStream.hasAccess ? (
                    'Enter Stream (Unlocked)'
                  ) : joinStream.entryPriceCoins > 0 ? (
                    `Join for ${joinStream.entryPriceCoins} coins`
                  ) : (
                    'Join Stream'
                  )}
                </button>
              ) : (
                <button className={styles.joinConfirmBtn} onClick={handleLeaveStream}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gift animation layer + gift picker + recharge (watching live only) */}
      {joinResult && joinResult.status === 'success' && <GiftOverlay events={giftEvents} />}
      {giftOpen && (
        <GiftPanel
          receiverName={joinStream?.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => sendGift(gift)}
          onRecharge={() => setRechargeOpen(true)}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}

      {/* Stream Ended Themed Modal */}
      {streamEndedInfo && (
        <div className={styles.joinModalBackdrop} onClick={() => setStreamEndedInfo(null)}>
          <div className={styles.joinModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.joinModalHeader}>
              <h3 className={styles.joinModalTitle}>Stream Ended</h3>
              <button className={styles.joinModalClose} onClick={() => setStreamEndedInfo(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.joinModalBody}>
              <div className={styles.endedStreamBox}>
                <div className={styles.endedAvatarContainer}>
                  <Radio size={28} className={styles.endedRadioIcon} />
                </div>
                <h4 className={styles.endedTitle}>Live Stream Has Ended</h4>
                <p className={styles.endedDescription}>
                  <strong>{streamEndedInfo.creatorName}</strong> has ended the live stream <em>"{streamEndedInfo.streamTitle}"</em>. Thank you for watching!
                </p>
              </div>
            </div>

            <div className={styles.joinModalFooter}>
              <button
                className={styles.joinConfirmBtn}
                onClick={() => {
                  setStreamEndedInfo(null);
                  loadStreams();
                }}
              >
                Back to Live Streams
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
