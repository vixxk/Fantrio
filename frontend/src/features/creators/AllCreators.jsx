import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import ShimmerSkeleton from '../../components/ShimmerSkeleton/ShimmerSkeleton';
import { 
  Search, Grid, List, Phone, Video, Radio, 
  ChevronDown, ChevronLeft, ChevronRight, Check, X,
  BadgeCheck, Star, Users, MoreVertical, Ban
} from 'lucide-react';
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../hooks/useConfirmDelete';
import { useToast } from '../../components/Toast/Toast';
import { useAppDialog } from '../../components/AppDialog/AppDialog';
import styles from './AllCreators.module.css';

export const AllCreators = () => {
  const { darkMode, navigateTo } = useApp();
  const { toast } = useToast();
  const { prompt } = useAppDialog();
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
  const [followerRange, setFollowerRange] = useState(100000); // Up to 100K+
  const [sliderValue, setSliderValue] = useState(100000);

  // Dropdown open states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeKebabCreatorId, setActiveKebabCreatorId] = useState(null);
  const sortRef = useRef(null);
  const filtersRef = useRef(null);
  const mobileFiltersRef = useRef(null);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveKebabCreatorId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inside =
        (sortRef.current && sortRef.current.contains(e.target)) ||
        (filtersRef.current && filtersRef.current.contains(e.target)) ||
        (mobileFiltersRef.current && mobileFiltersRef.current.contains(e.target));
      if (inside) return;
      setSortOpen(false);
      setCategoryOpen(false);
      setCountryOpen(false);
      setLanguageOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      if (statusFilter === 'subscribed') queryParams.append('isSubscribed', 'true');
      if (statusFilter === 'following') queryParams.append('isFollowing', 'true');
      if (statusFilter === 'new') queryParams.append('sortBy', 'newest');
      else queryParams.append('sortBy', sortBy);

      // Content Type
      if (contentType !== 'All') {
        queryParams.append('contentType', contentType);
      }

      // Follower range (we filter max followers up to followerRange)
      queryParams.append('maxFollowers', followerRange);

      const res = await api.get(`/creators/discover?${queryParams.toString()}`);
      if (res.status === 'success') {
        setCreators(res.creators || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setCreators([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error loading discover creators:', err);
      setCreators([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      // Add artificial delay for smoother loading UX
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchCreators());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, sortBy, statusFilter, category, contentType, country, language, followerRange]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategory('All Categories');
    setContentType('All');
    setCountry('All Countries');
    setLanguage('All Languages');
    setFollowerRange(100000);
    setSliderValue(100000);
    setSearchQuery('');
    setSortBy('popularity');
    setPage(1);
    setCategoryOpen(false);
    setCountryOpen(false);
    setLanguageOpen(false);
  };

  const handleSubscribe = (creator) => {
    const username = creator?.username;
    if (username) {
      navigateTo(`/creator-profile/${username}`);
    }
  };

  const handleUnfollow = async (creator) => {
    try {
      const res = await api.post(`/creators/follow/${creator.userId?._id || creator._id}`);
      if (res.status === 'success') {
        toast.success(res.following ? 'Subscribed to creator!' : `Unfollowed @${creator.username}`);
        fetchCreators();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update follow status');
    }
    setActiveKebabCreatorId(null);
  };

  // Block creator — shared confirm dialog state machine
  const {
    target: blockTarget,
    open: openBlock,
    close: closeBlock,
    confirm: confirmBlock,
    deleting: blocking,
  } = useConfirmDelete({
    onConfirm: (creator) => api.post(`/block/${creator.userId?._id || creator._id}`),
    successMessage: 'Creator blocked successfully.',
    errorMessage: 'Failed to block creator',
    onSuccess: (creator) => {
      setCreators((prev) => prev.filter((c) => c._id !== creator._id));
    },
  });

  const handleBlock = (creator) => {
    setActiveKebabCreatorId(null);
    openBlock(creator);
  };

  const handleReport = async (creator) => {
    const reason = await prompt({
      title: 'Report Creator',
      message: `Why are you reporting @${creator.username}?`,
      placeholder: 'Reason for reporting...',
      confirmLabel: 'Submit Report'
    });
    if (!reason || !reason.trim()) {
      setActiveKebabCreatorId(null);
      return;
    }
    try {
      const res = await api.post('/more/reports', {
        targetType: 'creator',
        targetId: creator.userId?._id || creator._id,
        reason: reason.trim()
      });
      if (res.status === 'success') {
        toast.success('Creator reported. Our team will review it shortly.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to report creator');
    }
    setActiveKebabCreatorId(null);
  };

  const handleViewProfile = (username) => {
    navigateTo(`/creator-profile/${username}`);
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
              <div className={styles.sortWrapper} ref={sortRef}>
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
              className={`${styles.pill} ${statusFilter === 'subscribed' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('subscribed'); setPage(1); }}
            >
              <Star size={14} />
              Subscribed
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'following' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('following'); setPage(1); }}
            >
              <Users size={14} />
              Following
            </button>
            <button 
              className={`${styles.pill} ${statusFilter === 'new' ? styles.activePill : ''}`}
              onClick={() => { setStatusFilter('new'); setPage(1); }}
            >
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
                 <div key={idx} className="skeleton-card" style={{ height: viewMode === 'grid' ? '320px' : 'auto', padding: '1rem' }}>
                   <ShimmerSkeleton variant="media" height="140px" marginTop="0" />
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                     <ShimmerSkeleton variant="avatar" width="40px" height="40px" />
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                       <ShimmerSkeleton variant="text" width="55%" height="14px" />
                       <ShimmerSkeleton variant="text" width="35%" height="11px" />
                     </div>
                   </div>
                   <ShimmerSkeleton variant="text" width="100%" height="12px" marginTop="0.5rem" />
                   <ShimmerSkeleton variant="text" width="60%" height="12px" marginTop="0.35rem" />
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                     <ShimmerSkeleton variant="chip" width="55px" height="22px" />
                     <ShimmerSkeleton variant="chip" width="50px" height="22px" />
                     <ShimmerSkeleton variant="chip" width="45px" height="22px" />
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                     <ShimmerSkeleton variant="button" height="32px" />
                     <ShimmerSkeleton variant="button" height="32px" />
                   </div>
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
                  <div className={styles.kebabWrapper}>
                    <button 
                      className={styles.threeDotsBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebabCreatorId(activeKebabCreatorId === creator._id ? null : creator._id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeKebabCreatorId === creator._id && (
                      <div className={styles.kebabDropdown} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={styles.kebabOption} 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/creator/${creator.username}`);
                            toast.success('Creator profile link copied to clipboard!');
                            setActiveKebabCreatorId(null);
                          }}
                        >
                          Copy creator link
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={styles.kebabOption} 
                          onClick={() => handleUnfollow(creator)}
                        >
                          Unfollow
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={styles.kebabOption} 
                          onClick={() => handleBlock(creator)}
                        >
                          Block
                        </button>
                        <div className={styles.kebabDivider} />
                        <button 
                          className={`${styles.kebabOption} ${styles.kebabDanger}`} 
                          onClick={() => handleReport(creator)}
                        >
                          Report
                        </button>
                      </div>
                    )}
                  </div>

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
                        onClick={() => handleSubscribe(creator)} 
                        className={`${styles.subscribeCardBtn} ${(creator.isFollowing || creator.isSubscribed) ? styles.dimmedSubscribedBtn : ''}`}
                      >
                        {(creator.isFollowing || creator.isSubscribed) ? 'Subscribed' : 'Subscribe'}
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
        <div className={`${styles.filtersSidebar} ${styles.desktopFiltersSidebar}`} ref={filtersRef}>
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
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'subscribed' ? 'all' : 'subscribed')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'subscribed' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <Star size={13} style={{ color: '#e10075' }} />
                  Subscribed
                </span>
              </div>
              <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'following' ? 'all' : 'following')}>
                <div className={`${styles.customCheckbox} ${statusFilter === 'following' ? styles.checkboxChecked : ''}`}>
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className={styles.checkboxLabel}>
                  <Users size={13} style={{ color: '#8b5cf6' }} />
                  Following
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
                {sliderValue === 100000 ? '100K+' : `${(sliderValue/1000).toFixed(0)}K`}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100000" 
              step="5000"
              value={sliderValue} 
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className={styles.filterSlider}
              style={{
                background: `linear-gradient(to right, #e10075 0%, #7e00f3 ${(sliderValue / 100000) * 100}%, ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} ${(sliderValue / 100000) * 100}%)`
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
            <div className={styles.mobileFiltersModal} onClick={(e) => e.stopPropagation()} ref={mobileFiltersRef}>
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
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'subscribed' ? 'all' : 'subscribed')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'subscribed' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <Star size={13} style={{ color: '#e10075' }} />
                        Subscribed
                      </span>
                    </div>
                    <div className={styles.checkboxWrapper} onClick={() => setStatusFilter(statusFilter === 'following' ? 'all' : 'following')}>
                      <div className={`${styles.customCheckbox} ${statusFilter === 'following' ? styles.checkboxChecked : ''}`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className={styles.checkboxLabel}>
                        <Users size={13} style={{ color: '#8b5cf6' }} />
                        Following
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
                      {sliderValue === 100000 ? '100K+' : `${(sliderValue/1000).toFixed(0)}K`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100000" 
                    step="5000"
                    value={sliderValue} 
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className={styles.filterSlider}
                    style={{
                      background: `linear-gradient(to right, #e10075 0%, #7e00f3 ${(sliderValue / 100000) * 100}%, ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} ${(sliderValue / 100000) * 100}%)`
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

      {/* Block Creator Confirmation */}
      <ConfirmDeleteDialog
        open={!!blockTarget}
        itemName={blockTarget ? blockTarget.displayName : ''}
        title="Block Creator?"
        confirmLabel="Block"
        busyLabel="Blocking…"
        icon={<Ban size={22} />}
        message={blockTarget ? <><strong>{blockTarget.displayName}</strong> will no longer appear in your lists.</> : ''}
        deleting={blocking}
        darkMode={darkMode}
        onCancel={closeBlock}
        onConfirm={confirmBlock}
      />
    </div>
  );
};
