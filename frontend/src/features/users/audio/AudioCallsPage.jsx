import { useState, useEffect } from 'react';
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
  Phone,
  Gift,
  Coins,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './AudioCallsPage.module.css';
import { useOutgoingCall } from '../../../hooks/useOutgoingCall';
import { useGiftEvents } from '../../../hooks/useGiftEvents';
import { GiftOverlay } from '../../gifts/GiftOverlay';
import { GiftPanel } from '../../gifts/GiftPanel';
import { QuickRecharge } from '../../gifts/QuickRecharge';

export const AudioCallsPage = () => {
  const { darkMode, balance } = useApp();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Active call state (real Agora + socket)
  const {
    activeCall,
    callDuration,
    isMuted,
    isSpeakerOn,
    startCall,
    endCall: hangUp,
    toggleMute,
    setIsSpeakerOn,
    formatDuration
  } = useOutgoingCall({ type: 'audio' });

  // Live gifts + recharge inside the active call
  const { events: giftEvents, sendGift } = useGiftEvents({
    callRoomId: activeCall?.roomId || null,
    enabled: !!activeCall && activeCall.status === 'active',
    receiverId: activeCall?.creator?.userId || activeCall?.creator?._id || null
  });
  const [giftOpen, setGiftOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  // Filter States
  const [availability, setAvailability] = useState('all'); // 'all', 'online', 'busy'
  const [priceRange, setPriceRange] = useState(50);
  const [category, setCategory] = useState('All Categories');
  const [language, setLanguage] = useState('All Languages');
  const [country, setCountry] = useState('All Countries');

  // Pill filter selection
  const [activePill, setActivePill] = useState('All');

  // Dropdown UI states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Popularity');

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

  const categories = [
    'All Categories', 'Fitness', 'Lifestyle', 'Fashion', 'Gaming', 
    'Music', 'Model', 'Influencer', 'Art', 'Dance'
  ];
  const countries = [
    'All Countries', 'United States', 'Canada', 'United Kingdom', 'Australia', 'Spain', 'France', 'Italy'
  ];
  const languages = [
    'All Languages', 'English', 'Spanish', 'French', 'Italian'
  ];

  const toggleDropdown = (dropdownName) => {
    setSortOpen(dropdownName === 'sort' ? !sortOpen : false);
    setCategoryOpen(dropdownName === 'category' ? !categoryOpen : false);
    setLanguageOpen(dropdownName === 'language' ? !languageOpen : false);
    setCountryOpen(dropdownName === 'country' ? !countryOpen : false);
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'audio', page, limit: 20 });
      if (availability === 'online') params.set('availability', 'online');
      if (category !== 'All Categories') params.set('category', category);
      if (language !== 'All Languages') params.set('language', language);
      if (country !== 'All Countries') params.set('country', country);

      const res = await api.get(`/calls/creators?${params.toString()}`);
      let filtered = res.creators || [];

      // Client-side price/sort/availability handling on the fetched page
      filtered = filtered.filter(c => c.rate <= priceRange);
      if (availability === 'busy') {
        filtered = filtered.filter(c => c.isOnline && c.isBusy);
      }
      if (activePill === 'Online Now') {
        filtered = filtered.filter(c => c.isOnline && !c.isBusy);
      }
      if (activePill === 'Popular') {
        filtered = [...filtered].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
      } else if (activePill === 'Price: Low to High') {
        filtered = [...filtered].sort((a, b) => a.rate - b.rate);
      } else if (activePill === 'Price: High to Low') {
        filtered = [...filtered].sort((a, b) => b.rate - a.rate);
      }

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
    Promise.resolve().then(() => {
      reloadWithFilters();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const itemsPerPage = 8;
    const totalPages = Math.ceil(creators.length / itemsPerPage);
    const displayedCreators = creators.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
      <div className={`${styles.pageContainer} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.mainFeed}>
          {/* Header section */}
          <div className={styles.header}>
            <div className={styles.headerTitleRow}>
              <img src="/audio.png" alt="Audio Calls" className={styles.headerAudioIcon} />
              <h1 className={styles.title}>1:1 Audio Calls</h1>
            </div>
            <p className={styles.subtitle}>
              Connect with your favourite creators through private audio calls.
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
              {creators.length} Creators Available For Audio Call
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
                            {creator.rate} Coin/Min
                          </span>
                        </div>

                        {/* Card Actions */}
                        <div className={styles.actionsRow}>
                          {!creator.isOnline ? (
                            <button className={`${styles.actionBtn} ${styles.offlineBtn}`} disabled>
                              <Phone className={styles.btnPhoneIcon} size={16} />
                              <span>Offline</span>
                            </button>
                          ) : creator.isBusy ? (
                            <button className={`${styles.actionBtn} ${styles.busyBtn}`} disabled>
                              <Phone className={styles.btnPhoneIcon} size={16} />
                              <span>Busy Now</span>
                            </button>
                          ) : (
                            <button 
                              className={`${styles.actionBtn} ${styles.callBtn}`}
                              onClick={() => startCall(creator)}
                            >
                              <Phone className={styles.btnPhoneIcon} size={16} />
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

        {/* Availability */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Availability</h4>
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

        {/* Price Range */}          <div className={styles.filterSection}>
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
            <button className={styles.dropdownButton} onClick={() => toggleDropdown('category')}>
              <span>{category}</span>
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

        {/* Country Dropdown */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Country</h4>
          <div className={styles.dropdownWrapper}>
            <button className={styles.dropdownButton} onClick={() => toggleDropdown('country')}>
              <span>{country}</span>
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

        {/* Languages Dropdown */}
        <div className={styles.filterSection}>
          <h4 className={styles.filterSectionLabel}>Languages</h4>
          <div className={styles.dropdownWrapper}>
            <button className={styles.dropdownButton} onClick={() => toggleDropdown('language')}>
              <span>{language}</span>
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

        <button className={styles.applyFiltersBtn} onClick={loadCreators}>
          Apply Filters
        </button>

        {/* How Audio Calls Work Card */}
        <div className={styles.howItWorksCard}>
          <h3 className={styles.howItWorksTitle}>How Audio Calls Work?</h3>
          
          <div className={styles.howItWorksList}>
            <div className={styles.howStep}>
              <Phone size={20} className={styles.howStepIconPhone} />
              <p className={styles.howStepText}>
                Select a creator who is available for audio calls.
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

            <div className={styles.callTopBar}>
              <span className={styles.callBalanceChip}>
                <img src="/coin.png" alt="Coin" className={styles.callCoinImg} />
                {balance.toLocaleString()}
                <button
                  className={styles.callRechargeBtn}
                  onClick={() => setRechargeOpen(true)}
                  title="Recharge coins"
                >
                  <Coins size={11} /> Recharge
                </button>
              </span>
            </div>

            <div className={styles.callControls}>
              <button
                className={`${styles.controlBtn} ${styles.controlBtnGift}`}
                onClick={() => setGiftOpen(true)}
                aria-label="Send a gift"
              >
                <Gift size={22} />
              </button>

              <button 
                className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button 
                className={styles.hangupBtn} 
                onClick={hangUp}
              >
                <Phone size={26} className={styles.hangupIcon} />
              </button>

              <button 
                className={`${styles.controlBtn} ${!isSpeakerOn ? styles.controlActive : ''}`}
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              >
                {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>

              <button
                className={`${styles.controlBtn} ${styles.controlBtnCoins}`}
                onClick={() => setRechargeOpen(true)}
                aria-label="Recharge coins"
              >
                <Coins size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

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
