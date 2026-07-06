import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  BadgeCheck, 
  ChevronDown, 
  Check, 
  Mic, 
  Music, 
  Activity, 
  Volume2, 
  Gamepad2, 
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Star,
  Clock
} from 'lucide-react';
import styles from './LiveStreamsPage.module.css';

export const LiveStreamsPage = () => {
  const { darkMode } = useApp();
  
  // States
  const [allStreams, setAllStreams] = useState([]);
  const [streams, setStreams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all, trending, liveNow, topRated, new
  const [sortBy, setSortBy] = useState('Viewers High To Low');
  const [availability, setAvailability] = useState('all'); // all, live, upcoming
  const [category, setCategory] = useState('All Categories');
  const [language, setLanguage] = useState('All Languages');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // UI Open Dropdowns
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [sidebarSortOpen, setSidebarSortOpen] = useState(false);

  const toggleDropdown = (name) => {
    setSortOpen(name === 'sort' ? !sortOpen : false);
    setCategoryOpen(name === 'category' ? !categoryOpen : false);
    setLanguageOpen(name === 'language' ? !languageOpen : false);
    setSidebarSortOpen(name === 'sidebarSort' ? !sidebarSortOpen : false);
  };

  // Constant Options
  const categoriesList = ['All Categories', 'Just Chatting', 'Music', 'Dance', 'ASMR', 'Gaming', 'Others'];
  const languagesList = ['All Languages', 'English', 'Spanish', 'French', 'German', 'Japanese'];
  const sortOptions = ['Viewers High To Low', 'Viewers Low To High'];

  // Categories metadata for bottom row
  const categoryMetadata = [
    { name: 'Just Chatting', imageSrc: '/mic.png', liveCount: '12 Live' },
    { name: 'Music', imageSrc: '/music.png', liveCount: '7 Live' },
    { name: 'Dance', imageSrc: '/dance.png', liveCount: '7 Live' },
    { name: 'ASMR', imageSrc: '/asmr.png', liveCount: '12 Live' },
    { name: 'Gaming', imageSrc: '/gaming.png', liveCount: '12 Live' },
    { name: 'Others', imageSrc: '/others.png', liveCount: '12 Live' },
  ];

  // Fetch streams
  // Fetch streams
  const loadStreams = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (tab !== 'all') queryParams.append('tab', tab);
      if (category !== 'All Categories') queryParams.append('category', category);
      if (language !== 'All Languages') queryParams.append('language', language);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (availability !== 'all') queryParams.append('availability', availability);

      const res = await api.get(`/creators/live?${queryParams.toString()}`);
      if (res.status === 'success') {
        setAllStreams(res.liveStreams || []);
        const mappedLeaderboard = (res.leaderboard || []).slice(0, 5).map((c, idx) => ({
          rank: idx + 1,
          name: c.displayName || c.name || 'User',
          avatarUrl: c.avatarUrl,
          spentCoins: c.coinsEarned || c.spentCoins || '1,000'
        }));
        setLeaderboard(mappedLeaderboard);
      }
    } catch (err) {
      console.error('Failed to load live streams:', err);
      // Local fallback in case of connection failure
      const fallbackCovers = [
        '/Girl.png',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
      ];
      const fallbackNames = ['Savannah', 'Leslie', 'Jenny', 'Kristin', 'Molly Jane', 'Aria', 'Chloe', 'Emma', 'Sophia', 'Olivia', 'Isabella', 'Ava'];
      const fallbackUsernames = ['savannah', 'leslie', 'jenny', 'kristin', 'mollyjane', 'aria_live', 'chloe_stream', 'emma_xo', 'sophia_chat', 'olivia_star', 'isabella_d', 'ava_game'];
      const fallbackCategories = ['Just Chatting', 'Music', 'Dance', 'ASMR', 'Gaming', 'Others'];

      let localList = Array.from({ length: 12 }).map((_, idx) => ({
        _id: `fallback-id-${idx}`,
        username: fallbackUsernames[idx],
        displayName: fallbackNames[idx],
        isVerified: true,
        viewerCount: 432 - idx * 25,
        streamTitle: "Let's talk...",
        coverUrl: fallbackCovers[idx],
        category: fallbackCategories[idx % fallbackCategories.length],
        rate: 18,
        language: idx % 3 === 0 ? 'Spanish' : 'English',
        isLive: idx % 10 !== 9,
        isUpcoming: idx % 10 === 9,
        rating: 4.9
      }));

      // Apply local filters for rich preview
      if (category !== 'All Categories') {
        localList = localList.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }
      if (language !== 'All Languages') {
        localList = localList.filter(s => s.language.toLowerCase() === language.toLowerCase());
      }
      if (availability === 'live') {
        localList = localList.filter(s => s.isLive);
      } else if (availability === 'upcoming') {
        localList = localList.filter(s => s.isUpcoming);
      }
      if (tab === 'trending') {
        localList.sort((a, b) => b.viewerCount - a.viewerCount);
      } else if (tab === 'liveNow') {
        localList = localList.filter(s => s.isLive);
      } else if (tab === 'topRated') {
        localList.sort((a, b) => b.rating - a.rating);
      }
      if (sortBy === 'Viewers High To Low') {
        localList.sort((a, b) => b.viewerCount - a.viewerCount);
      } else if (sortBy === 'Viewers Low To High') {
        localList.sort((a, b) => a.viewerCount - b.viewerCount);
      }

      setAllStreams(localList);
      setLeaderboard([
        { rank: 1, name: 'Alex King', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', spentCoins: '132.67' },
        { rank: 2, name: 'Jane Cooper', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', spentCoins: '132.67' },
        { rank: 3, name: 'Robert Fox', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', spentCoins: '132.67' },
        { rank: 4, name: 'Jacob Jones', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', spentCoins: '132.67' },
        { rank: 5, name: 'Emily Smith', avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=100&q=80', spentCoins: '132.67' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
  }, [tab, category, language, sortBy, availability]);

  const STREAMS_PER_PAGE = 8;
  useEffect(() => {
    setTotalPages(Math.ceil(allStreams.length / STREAMS_PER_PAGE) || 1);
    const startIndex = (page - 1) * STREAMS_PER_PAGE;
    setStreams(allStreams.slice(startIndex, startIndex + STREAMS_PER_PAGE));
  }, [page, allStreams]);

  useEffect(() => {
    setPage(1);
  }, [tab, category, language, sortBy, availability]);

  const handleResetFilters = () => {
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
            <div className={styles.headerTitleArea}>
              <div className={styles.titleRow}>
                <img src="/live.png" alt="Live Streams" className={styles.liveHeaderIcon} />
                <h1 className={styles.pageTitle}>Live Streams</h1>
              </div>
              <p className={styles.pageSubtitle}>Join live now and chat with your favourite creators in real time.</p>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortWrapper}>
              <button 
                className={styles.sortButton}
                onClick={() => toggleDropdown('sort')}
              >
                Sort By Viewers: {sortBy === 'Viewers High To Low' ? 'High to Low' : 'Low to High'}
                <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <div className={styles.sortDropdown}>
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
              className={`${styles.pill} ${tab === 'trending' ? styles.activePill : ''}`}
              onClick={() => setTab('trending')}
            >
              <span role="img" aria-label="fire">🔥</span> Trending
            </button>
            <button 
              className={`${styles.pill} ${tab === 'liveNow' ? styles.activePill : ''}`}
              onClick={() => setTab('liveNow')}
            >
              <span role="img" aria-label="green dot">🟢</span> Live Now (242)
            </button>
            <button 
              className={`${styles.pill} ${tab === 'topRated' ? styles.activePill : ''}`}
              onClick={() => setTab('topRated')}
            >
              <span role="img" aria-label="star">⭐</span> Top Rated
            </button>
            <button 
              className={`${styles.pill} ${tab === 'new' ? styles.activePill : ''}`}
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
          ) : streams.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No live streams found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className={styles.streamsGrid}>
                {streams.map((stream) => (
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
                            <span>{stream.rate} Coin <span className={styles.rateLabel}>/ Min</span></span>
                          </div>
                          <button className={styles.joinBtn}>Join Stream</button>
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
          <div className={styles.filtersSidebar}>
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
                <button className={styles.dropdownButton} onClick={() => toggleDropdown('category')}>
                  {category}
                  <ChevronDown size={14} />
                </button>
                {categoryOpen && (
                  <div className={styles.dropdownMenu}>
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
                <button className={styles.dropdownButton} onClick={() => toggleDropdown('language')}>
                  {language}
                  <ChevronDown size={14} />
                </button>
                {languageOpen && (
                  <div className={styles.dropdownMenu}>
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
                <button className={styles.dropdownButton} onClick={() => toggleDropdown('sidebarSort')}>
                  {sortBy === 'Viewers High To Low' ? 'Viewers High To Low' : 'Viewers Low To High'}
                  <ChevronDown size={14} />
                </button>
                {sidebarSortOpen && (
                  <div className={styles.dropdownMenu}>
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

          {/* Leaderboard Card */}
          <div className={styles.leaderboardCard}>
            <h3 className={styles.leaderboardTitle}>Top Viewers This Week</h3>
            
            <div className={styles.leaderboardList}>
              {leaderboard.map((item) => (
                <div key={item.rank} className={styles.leaderboardItem}>
                  <div className={styles.leaderboardLeft}>
                    <span className={styles.rankNumber}>{item.rank}</span>
                    <img src={item.avatarUrl} alt={item.name} className={styles.viewerAvatar} />
                    <span className={styles.viewerName}>{item.name}</span>
                  </div>
                  <div className={styles.leaderboardRight}>
                    <img src="/coin.png" alt="Coin" className={styles.leaderboardCoin} />
                    <span>{item.spentCoins}</span>
                  </div>
                </div>
              ))}
            </div>

            <a className={styles.viewLeaderboardLink} href="#leaderboard">
              View Leaderboard
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Live Categories Bottom Row */}
      <div className={styles.categoriesSection}>
        <h2 className={styles.categoriesTitle}>Live Categories</h2>
        <div className={styles.categoriesGrid}>
          {categoryMetadata.map((cat) => {
            return (
              <div 
                key={cat.name} 
                className={styles.categoryCard}
                onClick={() => setCategory(cat.name)}
              >
                <div className={styles.categoryIconWrapper}>
                  <img src={cat.imageSrc} alt={cat.name} className={styles.categoryImgIcon} />
                </div>
                <h4 className={styles.categoryCardLabel}>{cat.name}</h4>
                <p className={styles.categoryCardLiveCount}>{cat.liveCount}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
