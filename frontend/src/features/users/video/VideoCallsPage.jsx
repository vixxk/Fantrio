import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { 
  Star, 
  Lock, 
  X, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  BadgeCheck,
  Check,
  Video,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './VideoCallsPage.module.css';

const MOCK_CALL_CREATORS = [
  {
    _id: 'creator-savannah',
    userId: '64b1f3c30a84e24cf8f83001',
    displayName: 'Savannah Nguyen',
    username: 'savannah_n',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    ratingCount: 125,
    videoCallMinute: 25,
    isTopRated: true,
    category: 'Model',
    language: 'English',
    country: 'United States'
  },
  {
    _id: 'creator-leslie',
    userId: '64b1f3c30a84e24cf8f83002',
    displayName: 'Leslie Alexander',
    username: 'leslie_alex',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    ratingCount: 125,
    videoCallMinute: 28,
    isTopRated: true,
    category: 'Dance',
    language: 'English',
    country: 'Canada'
  },
  {
    _id: 'creator-kristin',
    userId: '64b1f3c30a84e24cf8f83003',
    displayName: 'Kristin Watson',
    username: 'kristin_w',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: true,
    rating: 4.9,
    ratingCount: 125,
    videoCallMinute: 30,
    isTopRated: false,
    category: 'Music',
    language: 'English',
    country: 'United Kingdom'
  },
  {
    _id: 'creator-jenny',
    userId: '64b1f3c30a84e24cf8f83004',
    displayName: 'Jenny Wilson',
    username: 'jenny_wilson',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    ratingCount: 125,
    videoCallMinute: 26,
    isTopRated: false,
    category: 'Fitness',
    language: 'Spanish',
    country: 'Spain'
  },
  {
    _id: 'creator-dianne',
    userId: '64b1f3c30a84e24cf8f83005',
    displayName: 'Dianne Russell',
    username: 'dianne_r',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.8,
    ratingCount: 94,
    videoCallMinute: 22,
    isTopRated: false,
    category: 'Lifestyle',
    language: 'English',
    country: 'Australia'
  },
  {
    _id: 'creator-moly',
    userId: '64b1f3c30a84e24cf8f83006',
    displayName: 'Molly Jane',
    username: 'mollyjane',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isOnline: false,
    isBusy: false,
    rating: 4.7,
    ratingCount: 82,
    videoCallMinute: 20,
    isTopRated: false,
    category: 'Influencer',
    language: 'French',
    country: 'France'
  },
  {
    _id: 'creator-jessica',
    userId: '64b1f3c30a84e24cf8f83007',
    displayName: 'Jessica',
    username: 'jessica_model',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    ratingCount: 110,
    videoCallMinute: 35,
    isTopRated: true,
    category: 'Model',
    language: 'Italian',
    country: 'Italy'
  },
  {
    _id: 'creator-sarah',
    userId: '64b1f3c30a84e24cf8f83009',
    displayName: 'Sarah Connor',
    username: 'sarah_c',
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.8,
    ratingCount: 112,
    videoCallMinute: 40,
    isTopRated: true,
    category: 'Lifestyle',
    language: 'English',
    country: 'United States'
  },
  {
    _id: 'creator-michael',
    userId: '64b1f3c30a84e24cf8f83010',
    displayName: 'Michael Scott',
    username: 'best_boss',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.5,
    ratingCount: 89,
    videoCallMinute: 25,
    isTopRated: false,
    category: 'Influencer',
    language: 'English',
    country: 'United States'
  },
  {
    _id: 'creator-sophia',
    userId: '64b1f3c30a84e24cf8f83011',
    displayName: 'Sophia Loren',
    username: 'sophia_l',
    avatarUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=400&q=80',
    isOnline: false,
    isBusy: false,
    rating: 4.9,
    ratingCount: 140,
    videoCallMinute: 45,
    isTopRated: true,
    category: 'Model',
    language: 'Italian',
    country: 'Italy'
  },
  {
    _id: 'creator-david',
    userId: '64b1f3c30a84e24cf8f83012',
    displayName: 'David Beckham',
    username: 'db_seven',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: true,
    rating: 4.7,
    ratingCount: 95,
    videoCallMinute: 32,
    isTopRated: false,
    category: 'Fitness',
    language: 'English',
    country: 'United Kingdom'
  },
  {
    _id: 'creator-olivia',
    userId: '64b1f3c30a84e24cf8f83013',
    displayName: 'Olivia Rodrigo',
    username: 'liv_music',
    avatarUrl: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.9,
    ratingCount: 180,
    videoCallMinute: 50,
    isTopRated: true,
    category: 'Music',
    language: 'English',
    country: 'United States'
  },
  {
    _id: 'creator-carlos',
    userId: '64b1f3c30a84e24cf8f83014',
    displayName: 'Carlos Sainz',
    username: 'smooth_operator',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.6,
    ratingCount: 78,
    videoCallMinute: 27,
    isTopRated: false,
    category: 'Sports',
    language: 'Spanish',
    country: 'Spain'
  },
  {
    _id: 'creator-anna',
    userId: '64b1f3c30a84e24cf8f83015',
    displayName: 'Anna Shpak',
    username: 'anna_dance',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    isOnline: false,
    isBusy: false,
    rating: 4.8,
    ratingCount: 88,
    videoCallMinute: 24,
    isTopRated: false,
    category: 'Dance',
    language: 'Russian',
    country: 'Russia'
  },
  {
    _id: 'creator-yuki',
    userId: '64b1f3c30a84e24cf8f83016',
    displayName: 'Yuki Tanaka',
    username: 'yuki_asmr',
    avatarUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&q=80',
    isOnline: true,
    isBusy: false,
    rating: 4.7,
    ratingCount: 92,
    videoCallMinute: 20,
    isTopRated: false,
    category: 'ASMR',
    language: 'Japanese',
    country: 'Japan'
  }
];

export const VideoCallsPage = () => {
  const { darkMode, refreshBalance, balance } = useApp();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter States
  const [availability, setAvailability] = useState('all'); // 'all', 'online', 'busy'
  const [priceRange, setPriceRange] = useState(50);
  const [category, setCategory] = useState('All Categories');
  const [language, setLanguage] = useState('All Languages');
  const [country, setCountry] = useState('All Countries');

  // Pill sorting state
  const [activePill, setActivePill] = useState('All');

  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Popularity');

  // Active call states
  const [activeCall, setActiveCall] = useState(null); // { creator, callLogId, roomId, status: 'connecting'|'ringing'|'active' }
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const durationTimer = useRef(null);
  const heartbeatTimer = useRef(null);

  // Dropdowns lists (extracted from mock data)
  const categories = ['All Categories', 'Model', 'Dance', 'Music', 'Fitness', 'Lifestyle', 'Influencer', 'Gaming', 'Sports', 'ASMR'];
  const languages = ['All Languages', 'English', 'Spanish', 'French', 'Italian', 'Russian', 'Japanese'];
  const countries = ['All Countries', 'United States', 'Canada', 'United Kingdom', 'Spain', 'Australia', 'France', 'Italy', 'Russia', 'Japan'];

  const toggleDropdown = (type) => {
    setSortOpen(type === 'sort' ? !sortOpen : false);
    setCategoryOpen(type === 'category' ? !categoryOpen : false);
    setLanguageOpen(type === 'language' ? !languageOpen : false);
    setCountryOpen(type === 'country' ? !countryOpen : false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setCategoryOpen(false);
      setLanguageOpen(false);
      setCountryOpen(false);
      setSortOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter and sort mock creators locally
  const loadCreators = () => {
    setLoading(true);
    let filtered = [...MOCK_CALL_CREATORS];

    // Filter by Availability
    if (availability === 'online') {
      filtered = filtered.filter(c => c.isOnline && !c.isBusy);
    } else if (availability === 'busy') {
      filtered = filtered.filter(c => c.isOnline && c.isBusy);
    }

    // Filter by Price range
    filtered = filtered.filter(c => c.videoCallMinute <= priceRange);

    // Filter by Category
    if (category !== 'All Categories') {
      filtered = filtered.filter(c => c.category === category);
    }

    // Filter by Country
    if (country !== 'All Countries') {
      filtered = filtered.filter(c => c.country === country);
    }

    // Filter by Language
    if (language !== 'All Languages') {
      filtered = filtered.filter(c => c.language === language);
    }

    // Sort based on pill selection
    if (activePill === 'Popular') {
      filtered.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    } else if (activePill === 'Price: Low to High') {
      filtered.sort((a, b) => a.videoCallMinute - b.videoCallMinute);
    } else if (activePill === 'Price: High to Low') {
      filtered.sort((a, b) => b.videoCallMinute - a.videoCallMinute);
    }

    setCreators(filtered);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    loadCreators();
  }, [availability, priceRange, category, language, country, activePill]);

  const handleResetFilters = () => {
    setAvailability('all');
    setPriceRange(50);
    setCategory('All Categories');
    setLanguage('All Languages');
    setCountry('All Countries');
    setActivePill('All');
    setPage(1);
  };

  // Initiate a call
  const startCall = async (creator) => {
    if (creator.isBusy) {
      alert(`${creator.displayName} is currently busy on another call.`);
      return;
    }

    const rate = creator.videoCallMinute;
    if (balance < rate) {
      alert('Insufficient balance. You need at least 1 minute worth of coins to make a video call.');
      return;
    }

    try {
      setActiveCall({
        creator,
        status: 'connecting',
        rate
      });
      setCallDuration(0);

      // Simulate ringing and acceptance
      setTimeout(() => {
        setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
      }, 1500);

      setTimeout(async () => {
        setActiveCall(prev => {
          if (!prev) return null;
          // Start billing and duration timers
          startTimers(prev.rate);
          return {
            ...prev,
            status: 'active',
            roomId: 'mock_room_' + Date.now(),
            callLogId: 'mock_log_' + Date.now()
          };
        });
      }, 4000);

    } catch (err) {
      alert('Failed to connect call: ' + err.message);
      setActiveCall(null);
    }
  };

  const startTimers = (rate) => {
    // Duration timer increments every second
    durationTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Bill wallet balance once per minute
    heartbeatTimer.current = setInterval(async () => {
      try {
        await api.post('/wallet/add-coins', { amount: -rate });
        refreshBalance();
      } catch (e) {
        // Insufficient funds simulated/real trigger
        alert('Call disconnected due to insufficient balance.');
        hangUp();
      }
    }, 60000);
  };

  const hangUp = () => {
    if (durationTimer.current) clearInterval(durationTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    setActiveCall(null);
    setCallDuration(0);
    refreshBalance();
  };

  const formatDuration = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const itemsPerPage = 8;
  const totalPages = Math.ceil(creators.length / itemsPerPage);
  const displayedCreators = creators.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className={`${styles.pageContainer} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.mainFeed}>
        {/* Header section */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <img src="/video.png" alt="Video Calls" className={styles.headerVideoIcon} />
            <h1 className={styles.title}>1:1 Video Calls</h1>
          </div>
          <p className={styles.subtitle}>
            Connect with your favourite creators through high quality video calls.
          </p>
        </div>

        {/* Sort & Filter Controls Row (Mobile Only via CSS) */}
        <div className={styles.controlsRow}>
          {/* Sort Dropdown */}
          <div className={styles.sortWrapper}>
            <button 
              className={styles.sortButton}
              onClick={(e) => { e.stopPropagation(); toggleDropdown('sort'); }}
            >
              Sort By: {sortBy === 'Popularity' ? 'Popularity' : sortBy === 'Price: Low to High' ? 'Low to High' : 'High to Low'}
              <ChevronDown size={16} />
            </button>
            {sortOpen && (
              <div className={styles.sortDropdown} onClick={(e) => e.stopPropagation()}>
                {[
                  { value: 'Popularity', label: 'Popularity' },
                  { value: 'Price: Low to High', label: 'Price: Low to High' },
                  { value: 'Price: High to Low', label: 'Price: High to Low' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setActivePill(opt.value === 'Popularity' ? 'Popular' : opt.value);
                      setSortOpen(false);
                    }}
                    className={sortBy === opt.value ? styles.activeSortOption : ''}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className={styles.mobileFilterToggleBtn}
            onClick={() => setMobileFiltersOpen(true)}
          >
            Filters
          </button>
        </div>

        {/* Filters pills bar */}
        <div className={styles.pillsRow}>
          {['All', 'Online Now', 'Popular', 'New', 'Price: Low to High', 'Price: High to Low'].map((pill) => {
            const isDesktopOnly = ['Popular', 'Price: Low to High', 'Price: High to Low'].includes(pill);
            return (
              <button
                key={pill}
                className={`${styles.pillBtn} ${activePill === pill ? styles.pillActive : ''} ${isDesktopOnly ? styles.desktopOnlyPill : ''}`}
                onClick={() => {
                  setActivePill(pill);
                  if (pill === 'Popular') setSortBy('Popularity');
                  else if (pill === 'Price: Low to High') setSortBy('Price: Low to High');
                  else if (pill === 'Price: High to Low') setSortBy('Price: High to Low');
                }}
              >
                {pill === 'Online Now' && <span className={styles.pillGreenDot} />}
                {pill}
              </button>
            );
          })}
        </div>

        {/* Content counter info */}
        <div className={styles.resultCounterRow}>
          <span className={styles.resultText}>
            {creators.length} Creators Available For Video Call
          </span>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className={styles.creatorsGrid}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="skeleton-card" style={{ height: '350px' }}>
                <div className="skeleton-box skeleton-media" style={{ height: '180px', marginTop: 0, borderRadius: '8px' }} />
                <div className="skeleton-box skeleton-title" style={{ width: '120px' }} />
                <div className="skeleton-box skeleton-subtitle" style={{ width: '80px' }} />
                <div className="skeleton-box skeleton-content-line" style={{ height: '35px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No creators found matching your current filters.</p>
            <button className={styles.resetBtnInline} onClick={handleResetFilters}>Reset Filters</button>
          </div>
        ) : (
          <>
            <div className={styles.creatorsGrid}>
              {displayedCreators.map((creator) => {
                const statusLabel = creator.isBusy ? 'Busy' : creator.isOnline ? 'Online' : 'Offline';
                return (
                  <div key={creator._id} className={styles.creatorCard}>
                    {/* Status Indicator top left */}
                    <div className={styles.cardHeaderStatus}>
                      {creator.isOnline && (
                        <span className={creator.isBusy ? styles.busyBadge : styles.onlineBadge}>
                          <span className={styles.dot}></span> {statusLabel}
                        </span>
                      )}
                    </div>

                    {/* Top Rated Badge */}
                    {creator.isTopRated && (
                      <span className={styles.topRatedBadge}>Top Rated</span>
                    )}

                    {/* Profile Picture / Photo Cover */}
                    <div className={styles.cardImageWrapper}>
                      <img 
                        src={creator.avatarUrl} 
                        alt={creator.displayName} 
                        className={styles.creatorAvatar} 
                      />
                    </div>

                    {/* Info details */}
                    <div className={styles.cardBody}>
                      <div className={styles.nameBlock}>
                        <span className={styles.displayName}>
                          {creator.displayName}
                          <BadgeCheck className={styles.verifiedIcon} size={16} />
                        </span>
                      </div>

                      <div className={styles.statsRow}>
                        <span className={styles.ratingInfo}>
                          <Star className={styles.starIcon} size={14} fill="#ffb800" color="#ffb800" />
                          {creator.rating} ({creator.ratingCount})
                        </span>
                        <span className={styles.coinRateInfo}>
                          <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                          {creator.videoCallMinute} Coin/Min
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className={styles.actionsRow}>
                        {!creator.isOnline ? (
                          <button className={`${styles.actionBtn} ${styles.offlineBtn}`} disabled>
                            <Video className={styles.btnVideoIcon} size={16} />
                            <span>Offline</span>
                          </button>
                        ) : creator.isBusy ? (
                          <button className={`${styles.actionBtn} ${styles.busyBtn}`} disabled>
                            <Video className={styles.btnVideoIcon} size={16} />
                            <span>Busy Now</span>
                          </button>
                        ) : (
                          <button 
                            className={`${styles.actionBtn} ${styles.callBtn}`}
                            onClick={() => startCall(creator)}
                          >
                            <Video className={styles.btnVideoIcon} size={16} />
                            <span>Call Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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

      {/* Right filters sidebar */}
      <div className={styles.filtersSidebar}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>Filters</h3>
          <button onClick={handleResetFilters} className={styles.resetBtn}>Reset</button>
        </div>

        {/* Availability Section */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Availability</h4>
          <div className={styles.checkboxList}>
            <div className={styles.checkboxWrapper} onClick={() => setAvailability('all')}>
              <div className={`${styles.customCheckbox} ${availability === 'all' ? styles.checkboxChecked : ''}`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={styles.checkboxLabel}>Show All</span>
            </div>

            <div className={styles.checkboxWrapper} onClick={() => setAvailability('online')}>
              <div className={`${styles.customCheckbox} ${availability === 'online' ? styles.checkboxChecked : ''}`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={styles.checkboxLabel}>
                <span className={styles.sidebarOnlineDot}></span>
                Online Now
              </span>
            </div>

            <div className={styles.checkboxWrapper} onClick={() => setAvailability('busy')}>
              <div className={`${styles.customCheckbox} ${availability === 'busy' ? styles.checkboxChecked : ''}`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={styles.checkboxLabel}>
                <span className={styles.sidebarBusyDot}></span>
                Busy
              </span>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Price Per Minute</h4>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderMinText}>5 Coins</span>
            <span className={styles.sliderValText}>{priceRange} Coins</span>
            <span className={styles.sliderMaxText}>50 Coins</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={priceRange}
            onChange={(e) => setPriceRange(parseInt(e.target.value))}
            className={styles.filterSlider}
            style={{
              background: `linear-gradient(to right, #e10075 0%, #7e00f3 ${((priceRange - 5) / 45) * 100}%, ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} ${((priceRange - 5) / 45) * 100}%)`
            }}
          />
        </div>

        {/* Category Dropdown */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Category</h4>
          <div className={styles.dropdownWrapper}>
            <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
              <span>{category}</span>
              <ChevronDown size={14} />
            </button>
            {categoryOpen && (
              <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                {categories.map((c) => (
                  <button 
                    key={c} 
                    onClick={() => {
                      setCategory(c);
                      setCategoryOpen(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Country Dropdown */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Country</h4>
          <div className={styles.dropdownWrapper}>
            <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('country'); }}>
              <span>{country}</span>
              <ChevronDown size={14} />
            </button>
            {countryOpen && (
              <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                {countries.map((c) => (
                  <button 
                    key={c} 
                    onClick={() => {
                      setCountry(c);
                      setCountryOpen(false);
                    }}
                  >
                    {c}
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
              <span>{language}</span>
              <ChevronDown size={14} />
            </button>
            {languageOpen && (
              <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                {languages.map((l) => (
                  <button 
                    key={l} 
                    onClick={() => {
                      setLanguage(l);
                      setLanguageOpen(false);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className={styles.applyFiltersBtn} onClick={loadCreators}>
          Apply Filters
        </button>

        {/* How Video Calls Work Card */}
        <div className={styles.howItWorksCard}>
          <h3 className={styles.howItWorksTitle}>How Video Calls Work?</h3>
          
          <div className={styles.howItWorksList}>
            <div className={styles.howStep}>
              <Video size={20} className={styles.howStepIconVideo} />
              <p className={styles.howStepText}>
                Select a creator who is available for video calls.
              </p>
            </div>

            <div className={styles.howStep}>
              <img src="/coin.png" alt="Coin" className={styles.howStepIconCoin} />
              <p className={styles.howStepText}>
                Make the call and pay per minute.
              </p>
            </div>

            <div className={styles.howStep}>
              <Lock size={20} className={styles.howStepIconLock} />
              <p className={styles.howStepText}>
                Secure and private 1:1 conversations.
              </p>
            </div>

            <div className={styles.howStep}>
              <Phone size={20} className={styles.howStepIconPhone} />
              <p className={styles.howStepText}>
                You can end the call anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Call Fullscreen Overlay */}
      {activeCall && (
        <div className={styles.callModalOverlay}>
          <div className={styles.callModalContent}>
            <div className={styles.callAvatarWrapper}>
              <div className={styles.pulseRing} />
              <div className={`${styles.pulseRing} ${styles.ringDelayed}`} />
              <img 
                src={activeCall.creator.avatarUrl} 
                alt={activeCall.creator.displayName} 
                className={styles.callAvatar} 
              />
            </div>

            <h2 className={styles.callName}>{activeCall.creator.displayName}</h2>
            <span className={styles.callUsername}>@{activeCall.creator.username}</span>

            <div className={styles.callStatusBox}>
              {activeCall.status === 'connecting' && <span className={styles.statusBlink}>Connecting...</span>}
              {activeCall.status === 'ringing' && <span className={styles.statusBlink}>Ringing...</span>}
              {activeCall.status === 'active' && (
                <div className={styles.activeCallMeta}>
                  <span className={styles.duration}>{formatDuration(callDuration)}</span>
                  <span className={styles.billingRate}>
                    ({activeCall.rate} Coins / min)
                  </span>
                </div>
              )}
            </div>

            <div className={styles.callControls}>
              <button 
                className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button 
                className={styles.hangupBtn} 
                onClick={hangUp}
              >
                <Video size={26} className={styles.hangupIcon} style={{ transform: 'none', color: '#ffffff' }} />
              </button>

              <button 
                className={`${styles.controlBtn} ${!isSpeakerOn ? styles.controlActive : ''}`}
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              >
                {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div className={styles.mobileFiltersModalOverlay}>
          <div className={styles.mobileFiltersModal}>
            <div className={styles.mobileFiltersModalHeader}>
              <h3>Filters</h3>
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
                
                <div className={styles.checkboxList}>
                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('all')}>
                    <div className={`${styles.customCheckbox} ${availability === 'all' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>All Creators</span>
                  </div>

                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('online')}>
                    <div className={`${styles.customCheckbox} ${availability === 'online' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>
                      <span className={styles.sidebarOnlineDot}></span>
                      Online Now
                    </span>
                  </div>

                  <div className={styles.checkboxWrapper} onClick={() => setAvailability('busy')}>
                    <div className={`${styles.customCheckbox} ${availability === 'busy' ? styles.checkboxChecked : ''}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className={styles.checkboxLabel}>
                      <span className={styles.sidebarBusyDot}></span>
                      Busy
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Price Per Minute</h4>
                <div className={styles.priceOptionGrid}>
                  {[10, 15, 20, 30, 40, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`${styles.priceOptionBtn} ${priceRange === amt ? styles.priceOptionActive : ''}`}
                      onClick={() => setPriceRange(amt)}
                    >
                      {amt !== 50 && <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />}
                      <span>{amt === 50 ? 'Any' : `≤ ${amt}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Category</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
                    <span>{category}</span>
                    <ChevronDown size={14} />
                  </button>
                  {categoryOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {categories.map((c) => (
                        <button 
                          key={c} 
                          onClick={() => {
                            setCategory(c);
                            setCategoryOpen(false);
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Country</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('country'); }}>
                    <span>{country}</span>
                    <ChevronDown size={14} />
                  </button>
                  {countryOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {countries.map((c) => (
                        <button 
                          key={c} 
                          onClick={() => {
                            setCountry(c);
                            setCountryOpen(false);
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Languages</h4>
                <div className={styles.dropdownWrapper}>
                  <button className={styles.dropdownButton} onClick={(e) => { e.stopPropagation(); toggleDropdown('language'); }}>
                    <span>{language}</span>
                    <ChevronDown size={14} />
                  </button>
                  {languageOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {languages.map((l) => (
                        <button 
                          key={l} 
                          onClick={() => {
                            setLanguage(l);
                            setLanguageOpen(false);
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.mobileFiltersModalFooter}>
              <button className={styles.mobileApplyFiltersBtn} onClick={() => { loadCreators(); setMobileFiltersOpen(false); }}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
