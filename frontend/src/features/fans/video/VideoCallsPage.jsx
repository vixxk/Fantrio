import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { getSocket } from '../../../services/socket';
import { useApp } from '../../../context/AppContext';
import { 
  Star, 
  Lock, 
  X, 
  ChevronDown, 
  BadgeCheck,
  Check,
  Video,
  Phone,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import styles from './VideoCallsPage.module.css';
import { ActiveCallOverlay } from '../../calls/ActiveCallOverlay/ActiveCallOverlay';
import { useOutgoingCall } from '../../../hooks/useOutgoingCall';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { QuickRecharge } from '../../gifts/QuickRecharge';

export const VideoCallsPage = () => {
  const { darkMode, balance, navigateTo } = useApp();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Active call state (real Agora + socket)
  const {
    activeCall,
    callDuration,
    isMuted,
    isSpeakerOn,
    remoteStream,
    startCall,
    endCall: hangUp,
    toggleMute,
    toggleCamera,
    isCameraOff,
    setIsSpeakerOn,
    attachRemote,
    attachLocal,
    formatDuration
  } = useOutgoingCall({ type: 'video' });

  // Live gifts + recharge inside the active call
  const { events: giftEvents, sendGift } = useGiftEvents({
    callRoomId: activeCall?.roomId || null,
    enabled: !!activeCall && activeCall.status === 'active',
    receiverId: activeCall?.creator?.userId || activeCall?.creator?._id || null
  });
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
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

  // Load callable creators from the backend
  const loadCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'video', page, limit: 20 });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (availability === 'online') params.set('availability', 'online');
      if (category !== 'All Categories') params.set('category', category);
      if (language !== 'All Languages') params.set('language', language);
      if (country !== 'All Countries') params.set('country', country);

      const res = await api.get(`/calls/creators?${params.toString()}`);
      let filtered = res.creators || [];

      // Client-side search filtering fallback (for instant responsiveness)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(c =>
          (c.displayName && c.displayName.toLowerCase().includes(q)) ||
          (c.username && c.username.toLowerCase().includes(q))
        );
      }

      filtered = filtered.filter(c => c.rate <= priceRange);
      if (availability === 'busy') {
        filtered = filtered.filter(c => c.isOnline && c.isBusy);
      }
      if (activePill === 'Online Now') {
        filtered = filtered.filter(c => c.isOnline && !c.isBusy);
      }

      // Prioritize online creators first on the cards list
      filtered = [...filtered].sort((a, b) => {
        const aOnline = a.isOnline && !a.isBusy ? 2 : a.isOnline ? 1 : 0;
        const bOnline = b.isOnline && !b.isBusy ? 2 : b.isOnline ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline;

        if (activePill === 'Popular') {
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        } else if (activePill === 'Price: Low to High') {
          return a.rate - b.rate;
        } else if (activePill === 'Price: High to Low') {
          return b.rate - a.rate;
        }
        return (b.ratingCount || 0) - (a.ratingCount || 0);
      });

      setCreators(filtered);
    } catch (err) {
      console.error('Failed to load callable creators:', err);
      setCreators([]);
    }
    setLoading(false);
  };

  const reloadWithFilters = () => {
    setPage(1);
    loadCreators();
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadCreators();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    let socket = null;
    try {
      socket = getSocket();
    } catch { /* noop */ }
    
    const handlePresence = ({ userId, isOnline }) => {
      setCreators((prev) =>
        prev.map((c) => {
          const cUserId = String(c.userId || c._id);
          if (cUserId === String(userId)) {
            return { ...c, isOnline };
          }
          return c;
        })
      );
    };

    const handleAvailability = ({ userId, creatorId, isBusy, isOnline, videoAvailable }) => {
      const targetId = String(userId || creatorId);
      if (videoAvailable === false) {
        setCreators((prev) => prev.filter((c) => String(c.userId || c._id) !== targetId));
      } else {
        setCreators((prev) =>
          prev.map((c) => {
            const cId = String(c.userId || c._id);
            if (cId === targetId) {
              return {
                ...c,
                ...(isBusy !== undefined ? { isBusy } : {}),
                ...(isOnline !== undefined ? { isOnline } : {})
              };
            }
            return c;
          })
        );
      }
    };

    if (socket) {
      socket.on('user_presence_change', handlePresence);
      socket.on('creator_availability_change', handleAvailability);
      return () => {
        socket.off('user_presence_change', handlePresence);
        socket.off('creator_availability_change', handleAvailability);
      };
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      reloadWithFilters();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, priceRange, category, language, country, activePill, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setAvailability('all');
    setPriceRange(50);
    setCategory('All Categories');
    setLanguage('All Languages');
    setCountry('All Countries');
    setActivePill('All');
    setPage(1);
  };

  const itemsPerPage = 8;
  const totalPages = Math.ceil(creators.length / itemsPerPage);
  const displayedCreators = creators.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className={`${styles.pageContainer} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.mainFeed}>
        {/* Header section */}
        <div className={styles.header}>
          <div className={styles.headerTitleBlock}>
            <div className={styles.headerTitleRow}>
              <img src="/video.png" alt="Video Calls" className={styles.headerVideoIcon} />
              <h1 className={styles.title}>1:1 Video Calls</h1>
            </div>
            <p className={styles.subtitle}>
              Connect with your favourite creators through high quality video calls.
            </p>
          </div>

          {/* Sort & Filter Controls Row */}
          <div className={styles.controlsRow}>
            {/* Sort Dropdown */}
            <div className={styles.sortWrapper}>
              <button 
                className={styles.sortButton}
                onClick={(e) => { e.stopPropagation(); toggleDropdown('sort'); }}
              >
                Sort By: {sortBy === 'Popularity' ? 'Popularity' : sortBy === 'Price: Low to High' ? 'Low to High' : 'High to Low'}
                <ChevronDown size={14} />
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
        </div>

        {/* Search bar & count row */}
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
            {creators.length} Creators Found
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
                  <div 
                    key={creator._id} 
                    className={styles.creatorCard}
                    onClick={() => {
                      if (creator.username) {
                        navigateTo(`/creator-profile/${creator.username}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
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
                          {creator.rate} Coin/Min
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className={styles.actionsRow} onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              startCall(creator);
                            }}
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

      {/* Active Call Fullscreen Overlay (shared component) */}
      <ActiveCallOverlay
        call={activeCall}
        type="video"
        balance={balance}
        duration={callDuration}
        formatDuration={formatDuration}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isSpeakerOn={isSpeakerOn}
        onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
        isCameraOff={isCameraOff}
        onToggleCamera={toggleCamera}
        onHangUp={hangUp}
        onOpenGift={() => setGiftOpen(true)}
        onRecharge={() => setRechargeOpen(true)}
        remoteStream={remoteStream}
        attachRemote={attachRemote}
        attachLocal={attachLocal}
      />

      {/* Gift animation layer + gift picker + recharge (active call only) */}
      {activeCall && activeCall.status === 'active' && <GiftOverlay events={giftEvents} />}
      {giftOpen && (
        <GiftPanel
          receiverName={activeCall?.creator?.displayName || 'this creator'}
          balance={balance}
          onSendGift={(gift) => sendGift(gift)}
          onRecharge={() => { setGiftOpen(false); setRechargeOpen(true); }}
          onClose={() => setGiftOpen(false)}
        />
      )}
      {rechargeOpen && <QuickRecharge onClose={() => setRechargeOpen(false)} />}

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
              {/* Sort By */}
              <div className={styles.filterSection}>
                <h4 className={styles.filterSectionLabel}>Sort By</h4>
                <div className={styles.priceOptionGrid}>
                  {[
                    { value: 'Popularity', label: 'Popularity' },
                    { value: 'Price: Low to High', label: 'Price: Low to High' },
                    { value: 'Price: High to Low', label: 'Price: High to Low' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.priceOptionBtn} ${sortBy === opt.value ? styles.priceOptionActive : ''}`}
                      onClick={() => {
                        setSortBy(opt.value);
                        setActivePill(opt.value === 'Popularity' ? 'Popular' : opt.value);
                      }}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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
