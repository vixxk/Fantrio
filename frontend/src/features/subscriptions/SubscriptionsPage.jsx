import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  Star, 
  Lock, 
  MessageCircle, 
  Trash2, 
  MoreVertical, 
  BadgeCheck, 
  Crown, 
  Camera, 
  Phone, 
  DollarSign, 
  Headphones, 
  Grid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './SubscriptionsPage.module.css';

const MOCK_SUBSCRIPTIONS = [
  // Active
  {
    _id: 'sub-1',
    creatorId: 'creator-savannah',
    status: 'active',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-2',
    creatorId: 'creator-leslie',
    status: 'active',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-3',
    creatorId: 'creator-kristin',
    status: 'active',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-4',
    creatorId: 'creator-jenny',
    status: 'active',
    startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-5',
    creatorId: 'creator-dianne',
    status: 'active',
    startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-6',
    creatorId: 'creator-molly',
    status: 'active',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    priceCoins: 18,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  // Expiring Soon
  {
    _id: 'sub-exp-1',
    creatorId: 'creator-molly-exp1',
    status: 'expiring',
    startDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days left
    priceCoins: 29.99,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  {
    _id: 'sub-exp-2',
    creatorId: 'creator-molly-exp2',
    status: 'expiring',
    startDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days left
    priceCoins: 29.99,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  // Expired
  {
    _id: 'sub-expired-1',
    creatorId: 'creator-molly-exp3',
    status: 'expired',
    startDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // expired 12 days ago
    priceCoins: 29.99,
    creator: {
      displayName: 'Savannah Nguyen',
      username: 'mollyjane',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      isVerifiedBadge: true,
      rates: { voiceCallMinute: 18, videoCallMinute: 25 }
    }
  },
  // Cancelled (Mocked for dashboard tabs count)
  { _id: 'sub-can-1', status: 'cancelled' },
  { _id: 'sub-can-2', status: 'cancelled' },
  { _id: 'sub-can-3', status: 'cancelled' },
  { _id: 'sub-can-4', status: 'cancelled' }
];

export const SubscriptionsPage = () => {
  const { darkMode } = useApp();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState('Active'); // 'Active', 'Expiring Soon', 'Expired', 'Cancelled'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/monetization/subscriptions');
        const dbSubs = res.data?.subscriptions || [];
        
        // Merge DB subscriptions with Mock subscriptions to make a fully populated premium UI
        const merged = [...dbSubs];
        MOCK_SUBSCRIPTIONS.forEach(mock => {
          // Check if mock already exists to avoid duplicates
          if (!merged.find(m => m._id === mock._id)) {
            merged.push(mock);
          }
        });
        setSubscriptions(merged);
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
        // Fallback to purely mock data on error or offline
        setSubscriptions(MOCK_SUBSCRIPTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const handleUnsubscribe = async (creatorId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await api.post(`/monetization/unsubscribe/${creatorId}`);
      alert('Subscription cancelled successfully!');
      // Update state
      setSubscriptions(prev => prev.map(sub => {
        if (sub.creatorId === creatorId && sub.status === 'active') {
          return { ...sub, status: 'cancelled' };
        }
        return sub;
      }));
    } catch (err) {
      alert('Failed to unsubscribe: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered Lists
  const activeSubs = subscriptions.filter(sub => sub.status === 'active' && sub.creator);
  const expiringSubs = subscriptions.filter(sub => sub.status === 'expiring' && sub.creator);
  const expiredSubs = subscriptions.filter(sub => sub.status === 'expired' && sub.creator);
  const cancelledSubs = subscriptions.filter(sub => sub.status === 'cancelled' && sub.creator);

  // Counts
  const counts = {
    Active: activeSubs.length,
    'Expiring Soon': expiringSubs.length,
    Expired: expiredSubs.length,
    Cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length
  };

  // Filtered array based on current tab select
  let displayedList = [];
  if (activeTabFilter === 'Active') {
    displayedList = activeSubs;
  } else if (activeTabFilter === 'Expiring Soon') {
    displayedList = expiringSubs;
  } else if (activeTabFilter === 'Expired') {
    displayedList = expiredSubs;
  } else if (activeTabFilter === 'Cancelled') {
    displayedList = cancelledSubs;
  }

  // Sorting
  if (sortBy === 'newest') {
    displayedList.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
  } else if (sortBy === 'price-low') {
    displayedList.sort((a, b) => (a.priceCoins || 0) - (b.priceCoins || 0));
  } else if (sortBy === 'price-high') {
    displayedList.sort((a, b) => (b.priceCoins || 0) - (a.priceCoins || 0));
  }

  // Pagination Calculations
  const limit = 4;
  const totalPages = Math.ceil(displayedList.length / limit);
  const paginatedList = displayedList.slice((page - 1) * limit, page * limit);

  return (
    <div className={`${styles.pageContainer} ${darkMode ? styles.dark : styles.light}`}>
      {/* SVG Gradient Defs */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="sub-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.mainFeed}>
        
        {/* Header Block */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <Star className={styles.headerStarIcon} size={28} fill="url(#sub-gradient)" stroke="url(#sub-gradient)" />
            <h1 className={styles.title}>My Subscriptions</h1>
          </div>
          <p className={styles.subtitle}>
            Connect with your favourite creators through private video calls.
          </p>
        </div>

        {/* Tab Selection & Sort/View Row */}
        <div className={styles.filterRow}>
          <div className={styles.tabsList}>
            {Object.keys(counts).map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTabFilter === tab ? styles.tabActive : ''}`}
                onClick={() => { setActiveTabFilter(tab); setPage(1); }}
              >
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>

          <div className={styles.controlsRight}>
            <div className={styles.sortWrapper}>
              <button className={styles.sortButton} onClick={() => setSortOpen(!sortOpen)}>
                Sort By Price: {sortBy === 'newest' ? 'Newest' : sortBy === 'price-low' ? 'Low to High' : 'High to Low'}
                <ChevronDown size={16} />
              </button>
              {sortOpen && (
                <div className={styles.sortDropdown} onClick={() => setSortOpen(false)}>
                  <button onClick={() => { setSortBy('newest'); setPage(1); }}>Newest</button>
                  <button onClick={() => { setSortBy('price-low'); setPage(1); }}>Price: Low to High</button>
                  <button onClick={() => { setSortBy('price-high'); setPage(1); }}>Price: High to Low</button>
                </div>
              )}
            </div>

            <div className={styles.viewToggle}>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
                onClick={() => { setViewMode('grid'); setPage(1); }}
              >
                <Grid size={18} />
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
                onClick={() => { setViewMode('list'); setPage(1); }}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Subscriptions Display Grid/List */}
        {loading ? (
          <div className={styles.subscriptionsGrid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton-card" style={{ height: '350px' }}>
                <div className="skeleton-header" style={{ justifyContent: 'center' }}>
                  <div className="skeleton-box skeleton-avatar" style={{ width: '80px', height: '80px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="skeleton-box skeleton-title" style={{ width: '120px' }} />
                  <div className="skeleton-box skeleton-subtitle" style={{ width: '80px' }} />
                </div>
                <div className="skeleton-box skeleton-content-line" style={{ height: '20px' }} />
                <div className="skeleton-box skeleton-content-line" style={{ height: '20px' }} />
                <div className="skeleton-box skeleton-media" style={{ height: '40px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : paginatedList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No subscriptions found under this filter.</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? styles.subscriptionsGrid : styles.subscriptionsList}>
              {paginatedList.map((sub) => (
                <div key={sub._id} className={styles.subCard}>
                  
                  <button className={styles.threeDotsBtn}>
                    <MoreVertical size={16} />
                  </button>

                  <div className={styles.cardImageWrapper}>
                    <img src={sub.creator.avatarUrl} alt={sub.creator.displayName} className={styles.creatorAvatar} />
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.nameBlock}>
                      <span className={styles.displayName}>
                        {sub.creator.displayName}
                        {sub.creator.isVerifiedBadge && <BadgeCheck className={styles.verifiedIcon} size={15} />}
                      </span>
                      <span className={styles.username}>@{sub.creator.username}</span>
                    </div>

                    <div className={styles.cardStatusRow}>
                      <span className={styles.statusDot} />
                      {viewMode === 'grid' && <span className={styles.statusText}>Active Now</span>}
                    </div>

                    <div className={styles.detailsBlock}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Plan</span>
                        <span className={styles.detailVal}>Premium</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Price</span>
                        <span className={styles.detailVal}>
                          <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                          {sub.priceCoins} Coin / Min
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Renew On</span>
                        <span className={styles.detailVal}>
                          {new Date(sub.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <button className={styles.viewProfileBtn}>View Profile</button>

                    <div className={styles.cardActionsFooter}>
                      <button className={styles.msgBtn}>
                        <MessageCircle size={16} />
                        <span>Message</span>
                      </button>
                      <button className={styles.unsubBtn} onClick={() => handleUnsubscribe(sub.creatorId)}>
                        <Trash2 size={16} />
                        <span>Unsubscribe</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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

        {/* Expiring Soon Section */}
        {expiringSubs.length > 0 && activeTabFilter === 'Active' && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>Expiring Soon</h2>
            <div className={styles.horizontalList}>
              {expiringSubs.map((sub) => (
                <div key={sub._id} className={styles.horizontalRow}>
                  <div className={styles.leftInfo}>
                    <img src={sub.creator.avatarUrl} alt="Avatar" className={styles.rowAvatar} />
                    <div className={styles.rowNameBlock}>
                      <span className={styles.rowDisplayName}>
                        {sub.creator.displayName}
                        {sub.creator.isVerifiedBadge && <BadgeCheck className={styles.verifiedIcon} size={14} />}
                      </span>
                      <span className={styles.rowUsername}>@{sub.creator.username}</span>
                    </div>
                  </div>

                  <div className={styles.rowPlan}>
                    <span className={styles.rowLabel}>Plan</span>
                    <span className={styles.rowValue}>Premium</span>
                  </div>

                  <div className={styles.rowRenewal}>
                    <span className={styles.rowLabel}>Renewal Date</span>
                    <span className={styles.rowValue}>
                      {new Date(sub.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={styles.daysLeft}>5 Days</span>
                  </div>

                  <div className={styles.rowPrice}>
                    <span className={styles.rowLabel}>Price</span>
                    <span className={styles.rowValuePrice}>
                      <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                      {sub.priceCoins} / Month
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button className={styles.renewBtn}>Renew Now</button>
                    <button className={styles.rowThreeDots}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Expired Section */}
        {expiredSubs.length > 0 && activeTabFilter === 'Active' && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>Recently Expired</h2>
            <div className={styles.horizontalList}>
              {expiredSubs.map((sub) => (
                <div key={sub._id} className={styles.horizontalRow}>
                  <div className={styles.leftInfo}>
                    <img src={sub.creator.avatarUrl} alt="Avatar" className={styles.rowAvatar} />
                    <div className={styles.rowNameBlock}>
                      <span className={styles.rowDisplayName}>
                        {sub.creator.displayName}
                        {sub.creator.isVerifiedBadge && <BadgeCheck className={styles.verifiedIcon} size={14} />}
                      </span>
                      <span className={styles.rowUsername}>@{sub.creator.username}</span>
                    </div>
                  </div>

                  <div className={styles.rowPlan}>
                    <span className={styles.rowLabel}>Plan</span>
                    <span className={styles.rowValue}>Premium</span>
                  </div>

                  <div className={styles.rowRenewal}>
                    <span className={styles.rowLabel}>Expired on</span>
                    <span className={styles.rowValue}>
                      {new Date(sub.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={styles.daysExpired}>12 Days ago</span>
                  </div>

                  <div className={styles.rowPrice}>
                    <span className={styles.rowLabel}>Price</span>
                    <span className={styles.rowValuePrice}>
                      <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                      {sub.priceCoins} / Month
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button className={styles.resubscribeBtn}>Resubscribe</button>
                    <button className={styles.rowThreeDots}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



      </div>

      {/* Right Sidebar Section */}
      <div className={styles.sidebarSection}>
        
        {/* Subscriptions Overview */}
        <div className={styles.sidebarCard}>
          <div className={styles.cardTitleRow}>
            <img src="/crown.png" alt="Crown" className={styles.crownIconSmall} />
            <h3 className={styles.cardTitle}>Subscriptions overview</h3>
          </div>
          <div className={styles.overviewList}>
            <div className={styles.overviewItem}>
              <span>Active Subscriptions</span>
              <span className={styles.overviewVal}>{counts.Active}</span>
            </div>
            <div className={styles.overviewItem}>
              <span>Expiring Soon</span>
              <span className={styles.overviewVal}>{counts['Expiring Soon']}</span>
            </div>
            <div className={styles.overviewItem}>
              <span>Expired</span>
              <span className={styles.overviewVal}>{counts.Expired}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.overviewItem}>
              <span className={styles.boldText}>Total Spent</span>
              <span className={styles.totalSpentVal}>
                <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                135 / Month
              </span>
            </div>
          </div>
          <button className={styles.spendingHistoryBtn}>View Spending History</button>
        </div>

        {/* Subscription Perks */}
        <div className={styles.sidebarCard}>
          <h3 className={styles.cardTitle}>Subscription Perks</h3>
          <div className={styles.perksList}>
            <div className={styles.perkItem}>
              <Camera size={22} className={styles.perkIcon} />
              <div className={styles.perkContent}>
                <h4 className={styles.perkName}>Exclusive Content</h4>
                <p className={styles.perkDesc}>Access premium photos, videos, and PPV.</p>
              </div>
            </div>
            
            <div className={styles.perkItem}>
              <Phone size={22} className={styles.perkIcon} />
              <div className={styles.perkContent}>
                <h4 className={styles.perkName}>1:1 Interaction</h4>
                <p className={styles.perkDesc}>Chat, call and connect privately with creators.</p>
              </div>
            </div>

            <div className={styles.perkItem}>
              <DollarSign size={22} className={styles.perkIcon} />
              <div className={styles.perkContent}>
                <h4 className={styles.perkName}>Special Offer</h4>
                <p className={styles.perkDesc}>Get discounts and early access to new content.</p>
              </div>
            </div>

            <div className={styles.perkItem}>
              <Headphones size={22} className={styles.perkIcon} />
              <div className={styles.perkContent}>
                <h4 className={styles.perkName}>Priority Support</h4>
                <p className={styles.perkDesc}>Get faster responses and dedicated supports.</p>
              </div>
            </div>
          </div>
        </div>



        {/* Need Help? Card */}
        <div className={`${styles.sidebarCard} ${styles.safeHelpCard}`}>
          <h3 className={styles.cardTitle}>Need Help?</h3>
          <p className={styles.helpText}>We are here to help you with your subscription.</p>
          <button className={styles.contactSupportBtn}>
            <Headphones size={16} />
            <span>Contact Support</span>
          </button>
        </div>

      </div>
    </div>
  );
};
