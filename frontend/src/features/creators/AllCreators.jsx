import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  Search, Grid, List, Phone, Video, Radio, 
  ChevronDown, ChevronLeft, ChevronRight, Check, X,
  BadgeCheck, Star, Users, RefreshCw, MoreVertical
} from 'lucide-react';
import styles from './AllCreators.module.css';

const MOCK_CREATORS = [
  {
    _id: 'mock1',
    displayName: 'Savannah Nguyen',
    username: 'savannah_nguyen',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    categories: ['Model', 'Influencer'],
    isVerifiedBadge: true,
    rating: 4.9,
    ratingCount: 12500,
    followerCount: 50000,
    isOnline: true,
    isLive: true,
    audioAvailable: true,
    videoAvailable: true,
    country: 'United States',
    language: 'English',
    contentType: ['Photos', 'Videos', 'PPV']
  },
  {
    _id: 'mock2',
    displayName: 'Leslie Alexander',
    username: 'leslie_alexander',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    categories: ['Fashion', 'Lifestyle'],
    isVerifiedBadge: true,
    rating: 4.8,
    ratingCount: 15400,
    followerCount: 12500,
    isOnline: true,
    isLive: false,
    audioAvailable: true,
    videoAvailable: false,
    country: 'United States',
    language: 'English',
    contentType: ['Photos']
  },
  {
    _id: 'mock3',
    displayName: 'Jenny Wilson',
    username: 'jenny_wilson',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    categories: ['Gaming', 'Lifestyle'],
    isVerifiedBadge: true,
    rating: 4.9,
    ratingCount: 9500,
    followerCount: 22000,
    isOnline: false,
    isLive: false,
    audioAvailable: true,
    videoAvailable: true,
    country: 'Canada',
    language: 'English',
    contentType: ['Videos']
  },
  {
    _id: 'mock4',
    displayName: 'Kristin Watson',
    username: 'kristin_watson',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    categories: ['Music', 'Entertainment'],
    isVerifiedBadge: true,
    rating: 4.7,
    ratingCount: 11000,
    followerCount: 18500,
    isOnline: true,
    isLive: false,
    audioAvailable: false,
    videoAvailable: true,
    country: 'United Kingdom',
    language: 'English',
    contentType: ['Photos', 'Videos']
  },
  {
    _id: 'mock5',
    displayName: 'Dianne Russell',
    username: 'dianne_russell',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    categories: ['Dance', 'Lifestyle'],
    isVerifiedBadge: true,
    rating: 4.6,
    ratingCount: 8400,
    followerCount: 9500,
    isOnline: false,
    isLive: false,
    audioAvailable: true,
    videoAvailable: true,
    country: 'Australia',
    language: 'English',
    contentType: ['Photos']
  },
  {
    _id: 'mock6',
    displayName: 'Molly Jane',
    username: 'mollyjane',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    categories: ['Fitness', 'Lifestyle'],
    isVerifiedBadge: true,
    rating: 4.9,
    ratingCount: 15430,
    followerCount: 34200,
    isOnline: true,
    isLive: true,
    audioAvailable: true,
    videoAvailable: true,
    country: 'United States',
    language: 'English',
    contentType: ['Photos', 'Videos']
  },
  {
    _id: 'mock7',
    displayName: 'Jessica Williams',
    username: 'jessica_w',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    categories: ['Model'],
    isVerifiedBadge: false,
    rating: 4.5,
    ratingCount: 3100,
    followerCount: 15000,
    isOnline: true,
    isLive: false,
    audioAvailable: true,
    videoAvailable: true,
    country: 'Spain',
    language: 'Spanish',
    contentType: ['Photos', 'Videos']
  },
  {
    _id: 'mock8',
    displayName: 'Emily Smith',
    username: 'emily_s',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    categories: ['Gaming'],
    isVerifiedBadge: true,
    rating: 4.8,
    ratingCount: 7800,
    followerCount: 32000,
    isOnline: false,
    isLive: true,
    audioAvailable: true,
    videoAvailable: false,
    country: 'Germany',
    language: 'German',
    contentType: ['Videos']
  },
  {
    _id: 'mock9',
    displayName: 'Sophia Martinez',
    username: 'sophia_m',
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=300&q=80',
    categories: ['Lifestyle'],
    isVerifiedBadge: true,
    rating: 4.7,
    ratingCount: 12000,
    followerCount: 29000,
    isOnline: true,
    isLive: false,
    audioAvailable: false,
    videoAvailable: true,
    country: 'France',
    language: 'French',
    contentType: ['Photos']
  },
  {
    _id: 'mock10',
    displayName: 'Angelina Jolie',
    username: 'angelina_j',
    avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=300&q=80',
    categories: ['Fitness'],
    isVerifiedBadge: true,
    rating: 4.9,
    ratingCount: 22000,
    followerCount: 88000,
    isOnline: true,
    isLive: true,
    audioAvailable: true,
    videoAvailable: true,
    country: 'United States',
    language: 'English',
    contentType: ['Photos', 'Videos']
  },
  {
    _id: 'mock11',
    displayName: 'Mia Conti',
    username: 'mia_c',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
    categories: ['Art'],
    isVerifiedBadge: false,
    rating: 4.4,
    ratingCount: 1900,
    followerCount: 5000,
    isOnline: false,
    isLive: false,
    audioAvailable: true,
    videoAvailable: true,
    country: 'Italy',
    language: 'Italian',
    contentType: ['Photos']
  },
  {
    _id: 'mock12',
    displayName: 'Luna Star',
    username: 'luna_s',
    avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80',
    categories: ['Astrology'],
    isVerifiedBadge: true,
    rating: 4.8,
    ratingCount: 6500,
    followerCount: 14000,
    isOnline: true,
    isLive: false,
    audioAvailable: true,
    videoAvailable: true,
    country: 'United States',
    language: 'English',
    contentType: ['Photos', 'Videos']
  }
];

export const AllCreators = () => {
  const { darkMode, addCoins } = useApp();
  const [creators, setCreators] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity'); // popularity, newest, rating
  const [sortOpen, setSortOpen] = useState(false);

  // Grid/List View
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all'); // all, online, audio, video, live, new
  const [category, setCategory] = useState('All Categories');
  const [contentType, setContentType] = useState('All'); // All, Photos, Videos, PPV
  const [country, setCountry] = useState('All Countries');
  const [language, setLanguage] = useState('All Languages');
  const [followerRange, setFollowerRange] = useState(1000000); // Up to 1M
  const [sliderValue, setSliderValue] = useState(1000000);

  // Dropdown open states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleDropdown = (name) => {
    setSortOpen(name === 'sort' ? !sortOpen : false);
    setCategoryOpen(name === 'category' ? !categoryOpen : false);
    setCountryOpen(name === 'country' ? !countryOpen : false);
    setLanguageOpen(name === 'language' ? !languageOpen : false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFollowerRange(sliderValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [sliderValue]);

  // Options
  const categories = [
    'All Categories', 'Fitness', 'Lifestyle', 'Fashion', 'Gaming', 
    'Music', 'Model', 'Influencer', 'Art', 'Photography', 'Travel', 'Dance'
  ];
  const countries = [
    'All Countries', 'United States', 'Canada', 'United Kingdom', 'Australia', 'Spain', 'Germany', 'France', 'Italy'
  ];
  const languages = [
    'All Languages', 'English', 'Spanish', 'German', 'French', 'Italian'
  ];

  // Fetch creators
  const fetchCreators = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', '8');

      if (searchQuery) queryParams.append('search', searchQuery);
      if (category !== 'All Categories') queryParams.append('category', category);
      if (country !== 'All Countries') queryParams.append('country', country);
      if (language !== 'All Languages') queryParams.append('language', language);

      // Status filters
      if (statusFilter === 'online') queryParams.append('isOnline', 'true');
      if (statusFilter === 'live') queryParams.append('isLive', 'true');
      if (statusFilter === 'audio') queryParams.append('audioAvailable', 'true');
      if (statusFilter === 'video') queryParams.append('videoAvailable', 'true');
      if (statusFilter === 'new') queryParams.append('sortBy', 'newest');
      else queryParams.append('sortBy', sortBy);

      // Content Type
      if (contentType !== 'All') {
        queryParams.append('contentType', contentType);
      }

      // Follower range (we filter max followers up to followerRange)
      queryParams.append('maxFollowers', followerRange);

      const res = await api.get(`/creators/discover?${queryParams.toString()}`);
      if (res.status === 'success' && res.creators && res.creators.length > 0) {
        setCreators(res.creators);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      } else {
        // Fallback to mock data filtered client-side for rich preview
        let filtered = [...MOCK_CREATORS];
        if (searchQuery) {
          filtered = filtered.filter(c => 
            c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.username.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (category !== 'All Categories') {
          filtered = filtered.filter(c => c.categories.includes(category));
        }
        if (country !== 'All Countries') {
          filtered = filtered.filter(c => c.country === country);
        }
        if (language !== 'All Languages') {
          filtered = filtered.filter(c => c.language === language);
        }
        if (statusFilter === 'online') {
          filtered = filtered.filter(c => c.isOnline);
        }
        if (statusFilter === 'live') {
          filtered = filtered.filter(c => c.isLive);
        }
        if (statusFilter === 'audio') {
          filtered = filtered.filter(c => c.audioAvailable);
        }
        if (statusFilter === 'video') {
          filtered = filtered.filter(c => c.videoAvailable);
        }
        filtered = filtered.filter(c => c.followerCount <= followerRange);

        const mockLimit = 8;
        const totalItems = filtered.length;
        const pages = Math.ceil(totalItems / mockLimit);
        setTotalPages(pages || 1);
        
        const startIndex = (page - 1) * mockLimit;
        const endIndex = startIndex + mockLimit;
        setCreators(filtered.slice(startIndex, endIndex));
        setTotal(totalItems);
      }
    } catch (err) {
      console.error('Error loading discover creators, falling back to mock data:', err);
      // Fallback to mock data filtered client-side
      let filtered = [...MOCK_CREATORS];
      if (searchQuery) {
        filtered = filtered.filter(c => 
          c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (category !== 'All Categories') {
        filtered = filtered.filter(c => c.categories.includes(category));
      }
      if (country !== 'All Countries') {
        filtered = filtered.filter(c => c.country === country);
      }
      if (language !== 'All Languages') {
        filtered = filtered.filter(c => c.language === language);
      }
      if (statusFilter === 'online') {
        filtered = filtered.filter(c => c.isOnline);
      }
      if (statusFilter === 'live') {
        filtered = filtered.filter(c => c.isLive);
      }
      if (statusFilter === 'audio') {
        filtered = filtered.filter(c => c.audioAvailable);
      }
      if (statusFilter === 'video') {
        filtered = filtered.filter(c => c.videoAvailable);
      }
      filtered = filtered.filter(c => c.followerCount <= followerRange);

      const mockLimit = 8;
      const totalItems = filtered.length;
      const pages = Math.ceil(totalItems / mockLimit);
      setTotalPages(pages || 1);
      
      const startIndex = (page - 1) * mockLimit;
      const endIndex = startIndex + mockLimit;
      setCreators(filtered.slice(startIndex, endIndex));
      setTotal(totalItems);
    } finally {
      // Add artificial delay for smoother loading UX
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [page, searchQuery, sortBy, statusFilter, category, contentType, country, language, followerRange]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategory('All Categories');
    setContentType('All');
    setCountry('All Countries');
    setLanguage('All Languages');
    setFollowerRange(1000000);
    setSliderValue(1000000);
    setSearchQuery('');
    setSortBy('popularity');
    setPage(1);
    setCategoryOpen(false);
    setCountryOpen(false);
    setLanguageOpen(false);
  };

  const handleSubscribe = async (creatorId) => {
    try {
      const res = await api.post(`/creators/follow/${creatorId}`);
      if (res.status === 'success') {
        alert('Subscribed successfully!');
        fetchCreators();
      }
    } catch (err) {
      alert(err.message || 'Subscription failed');
    }
  };

  const handleViewProfile = (username) => {
    alert(`Viewing profile for @${username}`);
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : styles.light}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>
      <div className={styles.mainLayout}>
        
        {/* Left main content wrapper */}
        <div className={styles.centerFeed}>
          
          {/* Header Row */}
          <div className={styles.feedHeader}>
            <div className={styles.headerTitleBlock}>
              <div className={styles.titleRow}>
                <Users className={styles.headerUsersIcon} size={28} />
                <h1 className={styles.pageTitle}>All Creators</h1>
              </div>
              <p className={styles.pageSubtitle}>Discover and connect with amazing creators.</p>
            </div>
            
            {/* Sort & Filter Controls Row */}
            <div className={styles.controlsRow}>
              {/* Sort Dropdown */}
              <div className={styles.sortWrapper}>
                <button 
                  className={styles.sortButton}
                  onClick={() => toggleDropdown('sort')}
                >
                  Sort By: {sortBy === 'popularity' ? 'Popularity' : sortBy === 'newest' ? 'Newest' : 'Rating'}
                  <ChevronDown size={16} />
                </button>
                {sortOpen && (
                  <div className={styles.sortDropdown}>
                    <button onClick={() => { setSortBy('popularity'); setSortOpen(false); setPage(1); }}>Popularity</button>
                    <button onClick={() => { setSortBy('newest'); setSortOpen(false); setPage(1); }}>Newest</button>
                    <button onClick={() => { setSortBy('rating'); setSortOpen(false); setPage(1); }}>Rating</button>
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

          {/* Status Pills Filters */}
          <div className={styles.statusPillsRow}>
            <button 
              className={`${styles.pill} ${statusFilter === 'all' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              All
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'online' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('online'); setPage(1); }}
            >
              <span className={styles.onlineDot}></span>
              Online Now
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'audio' ? styles.activePill : ''} ${styles.desktopOnlyPill}`}
              onClick={() => { setStatusFilter('audio'); setPage(1); }}
            >
              <Phone size={14} />
              Audio Available
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'video' ? styles.activePill : ''} ${styles.desktopOnlyPill}`}
              onClick={() => { setStatusFilter('video'); setPage(1); }}
            >
              <Video size={14} />
              Video Available
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'live' ? styles.activePill : ''} ${styles.desktopOnlyPill}`}
              onClick={() => { setStatusFilter('live'); setPage(1); }}
            >
              <Radio size={14} />
              Live Now
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'new' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('new'); setPage(1); }}
            >
              <span className={styles.newBadge}>NEW</span>
              New
            </button>
          </div>

          {/* Search bar & Grid/List Layout toggle */}
          <div className={styles.searchLayoutRow}>
            <div className={styles.searchInputWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input 
                type="text" 
                placeholder="Search creators by name or @username..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className={styles.searchInput}
              />
            </div>
            
            <span className={styles.creatorsCountText}>
              {total.toLocaleString()} Creators Found
            </span>

            <div className={styles.layoutToggleWrapper}>
              <button 
                className={`${styles.layoutToggleBtn} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`${styles.layoutToggleBtn} ${viewMode === 'list' ? styles.activeToggle : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Creators display container */}
          {loading ? (
            <div className={viewMode === 'grid' ? styles.creatorsGrid : styles.creatorsList}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="skeleton-card" style={{ height: '320px' }}>
                  <div className="skeleton-box skeleton-media" style={{ height: '140px', marginTop: 0 }} />
                  <div className="skeleton-header">
                    <div className="skeleton-box skeleton-avatar" style={{ width: '40px', height: '40px' }} />
                    <div>
                      <div className="skeleton-box skeleton-title" style={{ width: '120px' }} />
                      <div className="skeleton-box skeleton-subtitle" style={{ width: '80px' }} />
                    </div>
                  </div>
                  <div className="skeleton-box skeleton-content-line" />
                  <div className="skeleton-box skeleton-content-line short" />
                </div>
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className={styles.emptyContainer}>
              <Users size={48} />
              <h3>No Creators Found</h3>
              <p>Try resetting or relaxing your filters.</p>
              <button onClick={handleResetFilters} className={styles.resetBtnText}>Reset Filters</button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.creatorsGrid : styles.creatorsList}>
              {creators.map((creator) => (
                <div key={creator._id} className={styles.creatorCard}>
                  {/* Status Indicator top left */}
                  <div className={styles.cardHeaderStatus}>
                    {creator.isOnline && (
                      <span className={styles.onlineBadge}>
                        <span className={styles.dot}></span> Online
                      </span>
                    )}
                  </div>
                  
                  {/* Option menu top right */}
                  <button className={styles.threeDotsBtn}>
                    <MoreVertical size={16} />
                  </button>

                  {/* Profile Picture / Photo Cover */}
                  <div className={styles.cardImageWrapper}>
                    <img 
                      src={creator.avatarUrl || '/Girl.png'} 
                      alt={creator.displayName} 
                      className={styles.creatorAvatar} 
                    />
                  </div>

                  {/* Info details */}
                  <div className={styles.cardBody}>
                    <div className={styles.nameBlock}>
                      <span className={styles.displayName}>
                        {creator.displayName}
                        {creator.isVerifiedBadge && (
                          <BadgeCheck className={styles.verifiedIcon} size={14} />
                        )}
                      </span>
                    </div>

                    <div className={styles.statsRow}>
                      <span className={styles.ratingInfo}>
                        <Star className={styles.starIcon} size={14} />
                        {(creator.rating || 4.9).toFixed(1)} ({(creator.ratingCount || 1200) >= 1000 ? `${((creator.ratingCount || 1200)/1000).toFixed(1)}K` : creator.ratingCount})
                      </span>
                      <span className={styles.followersInfo}>
                        {creator.followerCount >= 1000 ? `${(creator.followerCount/1000).toFixed(0)}K` : creator.followerCount} Followers
                      </span>
                    </div>

                    {/* Capabilities Badges */}
                    <div className={styles.capabilitiesRow}>
                      {creator.audioCap !== false && creator.audioAvailable && (
                        <span className={`${styles.capBadge} ${styles.audioCap}`}>
                          <Phone size={11} /> Audio
                        </span>
                      )}
                      {creator.videoCap !== false && creator.videoAvailable && (
                        <span className={`${styles.capBadge} ${styles.videoCap}`}>
                          <Video size={11} /> Video
                        </span>
                      )}
                      {creator.isLive && (
                        <span className={`${styles.capBadge} ${styles.liveCap}`}>
                          Live
                        </span>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className={styles.actionsRow}>
                      <button 
                        onClick={() => handleViewProfile(creator.username)} 
                        className={styles.viewProfileBtn}
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => handleSubscribe(creator.userId?._id || creator._id)} 
                        className={styles.subscribeCardBtn}
                      >
                        Subscribe
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
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
                // Basic pagination display logic for many pages
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
        </div>

        {/* Right Sidebar Filters */}
        <div className={`${styles.filtersSidebar} ${styles.desktopFiltersSidebar}`}>
          <div className={styles.filtersHeader}>
            <h3 className={styles.filtersTitle}>Filters</h3>
            <button onClick={handleResetFilters} className={styles.resetBtn}>Reset</button>
          </div>

          {/* Availability Checkboxes */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterSectionLabel}>Availability</h4>
            <div className={styles.checkboxList}>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter('all')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'all' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>All Creators</span>
              </div>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'online' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <span className={styles.sidebarOnlineDot}></span>
                  Online Now
                </span>
              </div>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'audio' ? 'all' : 'audio')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'audio' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <Phone size={13} className={styles.sidebarIconAudio} />
                  Audio Available
                </span>
              </div>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'video' ? 'all' : 'video')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'video' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <Video size={13} className={styles.sidebarIconVideo} />
                  Video Available
                </span>
              </div>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'live' ? 'all' : 'live')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'live' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <span className={styles.sidebarLiveDot}></span>
                  Live Now
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

          {/* Content Type Selector */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterSectionLabel}>Content Type</h4>
            <div className={styles.pillSelectorRow}>
              {['All', 'Photos', 'Videos', 'PPV'].map((type) => (
                <button
                  key={type}
                  className={`${styles.pillSelectOpt} ${contentType === type ? styles.pillSelectActive : ''}`}
                  onClick={() => setContentType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Country Dropdown */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterSectionLabel}>Country</h4>
            <div className={styles.dropdownWrapper}>
              <button className={styles.dropdownButton} onClick={() => toggleDropdown('country')}>
                {country}
                <ChevronDown size={14} />
              </button>
              {countryOpen && (
                <div className={styles.dropdownMenu}>
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

          {/* Language Dropdown */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterSectionLabel}>Language</h4>
            <div className={styles.dropdownWrapper}>
              <button className={styles.dropdownButton} onClick={() => toggleDropdown('language')}>
                {language}
                <ChevronDown size={14} />
              </button>
              {languageOpen && (
                <div className={styles.dropdownMenu}>
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

          {/* Followers Slider */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterSectionLabel}>Followers</h4>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderMinText}>Any</span>
              <span className={styles.sliderValText}>
                {sliderValue === 1000000 ? '1M' : `${(sliderValue/1000).toFixed(0)}K`}
              </span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="1000000" 
              step="5000"
              value={sliderValue} 
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className={styles.filterSlider}
              style={{
                background: `linear-gradient(to right, #e10075 0%, #7e00f3 ${((sliderValue - 1000) / 999000) * 100}%, ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} ${((sliderValue - 1000) / 999000) * 100}%)`
              }}
            />
          </div>

          {/* Apply Filters Button */}
          <button 
            onClick={fetchCreators} 
            className={styles.applyFiltersBtn}
          >
            Apply Filters
          </button>
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
                {/* Availability Checkboxes */}
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionHeader}>
                    <h4 className={styles.filterSectionLabel}>Availability</h4>
                    <button onClick={handleResetFilters} className={styles.mobileResetBtn}>Reset</button>
                  </div>
                  <div className={styles.checkboxList}>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter('all')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'all' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>All Creators</span>
                    </div>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'online' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <span className={styles.sidebarOnlineDot}></span>
                        Online Now
                      </span>
                    </div>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'audio' ? 'all' : 'audio')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'audio' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <Phone size={13} className={styles.sidebarIconAudio} />
                        Audio Available
                      </span>
                    </div>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'video' ? 'all' : 'video')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'video' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <Video size={13} className={styles.sidebarIconVideo} />
                        Video Available
                      </span>
                    </div>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'live' ? 'all' : 'live')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'live' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <span className={styles.sidebarLiveDot}></span>
                        Live Now
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

                {/* Content Type Selector */}
                <div className={styles.filterSection}>
                  <h4 className={styles.filterSectionLabel}>Content Type</h4>
                  <div className={styles.pillSelectorRow}>
                    {['All', 'Photos', 'Videos', 'PPV'].map((type) => (
                      <button
                        key={type}
                        className={`${styles.pillSelectOpt} ${contentType === type ? styles.pillSelectActive : ''}`}
                        onClick={() => setContentType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Dropdown */}
                <div className={styles.filterSection}>
                  <h4 className={styles.filterSectionLabel}>Country</h4>
                  <div className={styles.dropdownWrapper}>
                    <button className={styles.dropdownButton} onClick={() => toggleDropdown('country')}>
                      {country}
                      <ChevronDown size={14} />
                    </button>
                    {countryOpen && (
                      <div className={styles.dropdownMenu}>
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

                {/* Language Dropdown */}
                <div className={styles.filterSection}>
                  <h4 className={styles.filterSectionLabel}>Language</h4>
                  <div className={styles.dropdownWrapper}>
                    <button className={styles.dropdownButton} onClick={() => toggleDropdown('language')}>
                      {language}
                      <ChevronDown size={14} />
                    </button>
                    {languageOpen && (
                      <div className={styles.dropdownMenu}>
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

                {/* Followers Slider */}
                <div className={styles.filterSection}>
                  <h4 className={styles.filterSectionLabel}>Followers</h4>
                  <div className={styles.sliderHeader}>
                    <span className={styles.sliderMinText}>Any</span>
                    <span className={styles.sliderValText}>
                      {sliderValue === 1000000 ? '1M' : `${(sliderValue/1000).toFixed(0)}K`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="1000000" 
                    step="5000"
                    value={sliderValue} 
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className={styles.filterSlider}
                    style={{
                      background: `linear-gradient(to right, #e10075 0%, #7e00f3 ${((sliderValue - 1000) / 999000) * 100}%, ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} ${((sliderValue - 1000) / 999000) * 100}%)`
                    }}
                  />
                </div>
              </div>

              <div className={styles.mobileFiltersModalFooter}>
                <button 
                  className={styles.mobileApplyFiltersBtn} 
                  onClick={() => {
                    fetchCreators();
                    setMobileFiltersOpen(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
