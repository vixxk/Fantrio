import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import {
  Star,
  MessageCircle,
  Trash2,
  MoreVertical,
  BadgeCheck,
  Camera,
  Phone,
  DollarSign,
  Headphones,
  Grid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  RefreshCw
} from 'lucide-react';
import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog/ConfirmDeleteDialog';
import { useConfirmDelete } from '../../../hooks/useConfirmDelete';
import { useToast } from '../../../components/Toast/Toast';
import styles from './SubscriptionsPage.module.css';

const PLAN_COLORS = { Basic: '#10b981', Premium: '#3b82f6', VIP: '#f59e0b' };

const formatDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString(undefined, opts) : '—';

export const SubscriptionsPage = () => {
  const { darkMode, navigateTo, currentPath } = useApp();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState('Active');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [activeKebabSubId, setActiveKebabSubId] = useState(null);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [spending, setSpending] = useState([]);
  const [spendingLoading, setSpendingLoading] = useState(false);
  // Creator ID to highlight/float to top (from ?highlight=<creatorId>)
  const [highlightId, setHighlightId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('highlight') || null;
  });

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/monetization/subscriptions');
      const data = res.data || res;
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setSubscriptions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSubscriptions();
    });
  }, [fetchSubscriptions]);

  useEffect(() => {
    const handleWindowClick = () => {
      setActiveKebabSubId(null);
      setSortOpen(false);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Read/update highlight param when URL changes (e.g. back-navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('highlight');
    if (id) {
      setHighlightId(id);
      // Remove param from URL without adding a history entry
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
      // Auto-clear highlight ring after 3s
      const t = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const openSpendingHistory = async () => {
    setSpendingOpen(true);
    setSpendingLoading(true);
    try {
      const res = await api.get('/monetization/subscriptions/spending');
      const data = res.data || res;
      setSpending(data.history || []);
    } catch (err) {
      console.error('Failed to load spending history:', err);
      setSpending([]);
    } finally {
      setSpendingLoading(false);
    }
  };

  const {
    target: renewTarget,
    open: openRenew,
    close: closeRenew,
    confirm: confirmRenew,
    deleting: renewing,
  } = useConfirmDelete({
    onConfirm: (sub) => api.post(`/monetization/renew/${sub.creatorId}`, { plan: sub.plan }),
    successMessage: 'Subscription renewed successfully!',
    errorMessage: 'Failed to renew subscription',
    onSuccess: () => fetchSubscriptions(),
  });

  const {
    target: cancelTarget,
    open: openCancel,
    close: closeCancel,
    confirm: confirmCancel,
    deleting: cancelling,
  } = useConfirmDelete({
    onConfirm: (sub) => api.post(`/monetization/unsubscribe/${sub.creatorId}`),
    successMessage: 'Subscription cancelled successfully!',
    errorMessage: 'Failed to unsubscribe',
    onSuccess: () => fetchSubscriptions(),
  });

  const isBusy = (sub) =>
    (renewTarget?._id === sub._id && renewing) ||
    (cancelTarget?._id === sub._id && cancelling);

  const getTabStatus = (tab) => {
    if (tab === 'Expiring Soon') return 'expiring';
    return tab.toLowerCase();
  };

  const filteredList = subscriptions
    .filter((sub) => sub.creator && sub.status === getTabStatus(activeTabFilter))
    .filter(Boolean);

  if (sortBy === 'newest') {
    filteredList.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
  } else if (sortBy === 'price-low') {
    filteredList.sort((a, b) => (a.priceCoins || 0) - (b.priceCoins || 0));
  } else if (sortBy === 'price-high') {
    filteredList.sort((a, b) => (b.priceCoins || 0) - (a.priceCoins || 0));
  }

  // Float highlighted creator card to the top of the list
  if (highlightId) {
    const idx = filteredList.findIndex(s => String(s.creatorId) === String(highlightId));
    if (idx > 0) {
      const [highlighted] = filteredList.splice(idx, 1);
      filteredList.unshift(highlighted);
    }
  }

  const limit = 4;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / limit));
  const paginatedList = filteredList.slice((page - 1) * limit, page * limit);

  const activeSubs = subscriptions.filter((s) => s.creator && s.status === 'active');
  const expiringSubs = subscriptions.filter((s) => s.creator && s.status === 'expiring');
  const expiredSubs = subscriptions.filter((s) => s.creator && s.status === 'expired');
  const cancelledSubs = subscriptions.filter((s) => s.creator && s.status === 'cancelled');

  const counts = {
    Active: activeSubs.length,
    'Expiring Soon': expiringSubs.length,
    Expired: expiredSubs.length,
    Cancelled: cancelledSubs.length
  };

  const renderKebab = (sub) => (
    <div className={styles.kebabWrapper}>
      <button
        className={styles.threeDotsBtn}
        onClick={(e) => {
          e.stopPropagation();
          setActiveKebabSubId(activeKebabSubId === sub._id ? null : sub._id);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {activeKebabSubId === sub._id && (
        <div className={styles.kebabDropdown} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.kebabOption}
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/creator-profile/${sub.creator.username}`);
              toast.success('Creator profile link copied to clipboard!');
              setActiveKebabSubId(null);
            }}
          >
            Copy creator link
          </button>
          {(sub.status === 'expired' || sub.status === 'cancelled') && (
            <>
              <button
                className={styles.kebabOption}
                onClick={() => {
                  openRenew(sub);
                  setActiveKebabSubId(null);
                }}
              >
                Resubscribe
              </button>
              <div className={styles.kebabDivider} />
            </>
          )}
          <button
            className={`${styles.kebabOption} ${styles.kebabDanger}`}
            onClick={async () => {
              setActiveKebabSubId(null);
              try {
                await api.post('/more/reports', {
                  targetType: 'creator',
                  targetId: sub.creatorId || sub.creator._id,
                  reason: 'Inappropriate Content',
                  description: `Report submitted for creator ${sub.creator?.displayName || ''}`
                });
                toast.success('Creator report submitted to safety team');
              } catch (err) {
                toast.error(err.message || 'Failed to submit report');
              }
            }}
          >
            Report Creator
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`${styles.pageContainer} ${darkMode ? styles.dark : styles.light}`}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="sub-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.mainFeed}>
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <Star className={styles.headerStarIcon} size={28} fill="url(#sub-gradient)" stroke="url(#sub-gradient)" />
            <h1 className={styles.title}>My Subscriptions</h1>
          </div>
          <p className={styles.subtitle}>
            Manage your creator subscriptions, renew before they expire, and review your spending.
          </p>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.tabsList}>
            {Object.keys(counts).map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTabFilter === tab ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTabFilter(tab);
                  setPage(1);
                }}
              >
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>

          <div className={styles.controlsRight}>
            <div className={styles.sortWrapper}>
              <button
                className={styles.sortButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen((prev) => !prev);
                }}
              >
                Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'price-low' ? 'Price Low to High' : 'Price High to Low'}
                <ChevronDown size={16} />
              </button>
              {sortOpen && (
                <div className={styles.sortDropdown} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setSortBy('newest'); setPage(1); setSortOpen(false); }}>Newest</button>
                  <button onClick={() => { setSortBy('price-low'); setPage(1); setSortOpen(false); }}>Price: Low to High</button>
                  <button onClick={() => { setSortBy('price-high'); setPage(1); setSortOpen(false); }}>Price: High to Low</button>
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
              {paginatedList.map((sub) => {
                const isHighlighted = highlightId && String(sub.creatorId) === String(highlightId);
                return (
                <div key={sub._id} className={`${styles.subCard}${isHighlighted ? ` ${styles.subCardHighlighted}` : ''}`}
                >
                  {renderKebab(sub)}
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
                      <span 
                        className={styles.statusDot} 
                        style={{
                          backgroundColor: sub.status === 'expiring' ? '#f59e0b' : sub.status === 'expired' || sub.status === 'cancelled' ? '#ef4444' : '#22c55e',
                          boxShadow: `0 0 6px ${sub.status === 'expiring' ? '#f59e0b' : sub.status === 'expired' || sub.status === 'cancelled' ? '#ef4444' : '#22c55e'}`
                        }}
                      />
                      <span 
                        className={styles.statusText}
                        style={{
                          color: sub.status === 'expiring' ? '#f59e0b' : sub.status === 'expired' || sub.status === 'cancelled' ? '#ef4444' : '#22c55e'
                        }}
                      >
                        {sub.status === 'expiring'
                          ? `Expires in ${sub.daysUntilExpiry}d`
                          : sub.status === 'expired'
                            ? 'Expired'
                            : sub.status === 'cancelled'
                              ? 'Cancelled'
                              : 'Active'}
                      </span>
                    </div>

                    <div className={styles.detailsBlock}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Plan</span>
                        <span className={styles.detailVal} style={{ color: PLAN_COLORS[sub.plan] || '#7e00f3' }}>
                          {sub.plan}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Price</span>
                        <span className={styles.detailVal}>
                          <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                          {sub.priceCoins} / Month
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                          {sub.status === 'expired' || sub.status === 'cancelled' ? 'Ended On' : 'Renew On'}
                        </span>
                        <span className={styles.detailVal}>{formatDate(sub.expiryDate)}</span>
                      </div>
                    </div>

                    <button 
                      className={styles.viewProfileBtn} 
                      onClick={() => navigateTo(`/creator-profile/${sub.creator.username}`)}
                    >
                      View Profile
                    </button>

                    <div className={styles.cardActionsFooter}>
                      <button 
                        className={styles.msgBtn} 
                        onClick={() => navigateTo(`/messages/${sub.creatorId || sub.creator?._id || sub.creator?.id}`)}
                      >
                        <MessageCircle size={16} />
                        <span>Message</span>
                      </button>
                      {sub.status === 'active' ? (
                        <button className={styles.unsubBtn} onClick={() => openCancel(sub)} disabled={isBusy(sub)}>
                          <Trash2 size={16} />
                          <span>{isBusy(sub) ? '...' : 'Unsubscribe'}</span>
                        </button>
                      ) : (
                        <button className={styles.unsubBtn} style={{ color: '#22c55e' }} onClick={() => openRenew(sub)} disabled={isBusy(sub)}>
                          <RefreshCw size={16} />
                          <span>{isBusy(sub) ? '...' : 'Resubscribe'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {!loading && totalPages > 1 && (
              <div className={styles.paginationRow}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={styles.pageArrow}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

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
                    <span className={styles.rowValue} style={{ color: PLAN_COLORS[sub.plan] || '#7e00f3' }}>
                      {sub.plan}
                    </span>
                  </div>

                  <div className={styles.rowRenewal}>
                    <span className={styles.rowLabel}>Renewal Date</span>
                    <span className={styles.rowValue}>{formatDate(sub.expiryDate)}</span>
                    <span className={styles.daysLeft}>{sub.daysUntilExpiry} Days</span>
                  </div>

                  <div className={styles.rowPrice}>
                    <span className={styles.rowLabel}>Price</span>
                    <span className={styles.rowValuePrice}>
                      <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                      {sub.priceCoins} / Month
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button className={styles.renewBtn} onClick={() => openRenew(sub)} disabled={isBusy(sub)}>
                      {isBusy(sub) ? 'Renewing...' : 'Renew Now'}
                    </button>
                    <button className={styles.rowThreeDots}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <span className={styles.rowValue} style={{ color: PLAN_COLORS[sub.plan] || '#7e00f3' }}>
                      {sub.plan}
                    </span>
                  </div>

                  <div className={styles.rowRenewal}>
                    <span className={styles.rowLabel}>Expired on</span>
                    <span className={styles.rowValue}>{formatDate(sub.expiryDate)}</span>
                    <span className={styles.daysExpired}>Expired</span>
                  </div>

                  <div className={styles.rowPrice}>
                    <span className={styles.rowLabel}>Price</span>
                    <span className={styles.rowValuePrice}>
                      <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                      {sub.priceCoins} / Month
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button className={styles.resubscribeBtn} onClick={() => openRenew(sub)} disabled={isBusy(sub)}>
                      {isBusy(sub) ? 'Resubscribing...' : 'Resubscribe'}
                    </button>
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

      <div className={styles.sidebarSection}>
        <div className={styles.sidebarCard}>
          <div className={styles.cardTitleRow}>
            <img src="/crown.png" alt="Crown" className={styles.crownIconSmall} />
            <h3 className={styles.cardTitle}>Subscriptions overview</h3>
          </div>
          <div className={styles.overviewList}>
            <div className={styles.overviewItem}>
              <span>Active Subscriptions</span>
              <span className={styles.overviewVal}>{summary ? summary.active : counts.Active}</span>
            </div>
            <div className={styles.overviewItem}>
              <span>Expiring Soon</span>
              <span className={styles.overviewVal}>{summary ? summary.expiring : counts['Expiring Soon']}</span>
            </div>
            <div className={styles.overviewItem}>
              <span>Expired</span>
              <span className={styles.overviewVal}>{summary ? summary.expired : counts.Expired}</span>
            </div>
            <div className={styles.overviewItem}>
              <span>Cancelled</span>
              <span className={styles.overviewVal}>{summary ? summary.cancelled : counts.Cancelled}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.overviewItem}>
              <span className={styles.boldText}>Monthly Spend</span>
              <span className={styles.totalSpentVal}>
                <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                {summary ? summary.monthlySpendCoins : 0} / Month
              </span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.boldText}>Total Spent</span>
              <span className={styles.totalSpentVal}>
                <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                {summary ? summary.totalSpentCoins : 0}
              </span>
            </div>
          </div>
          <button className={styles.spendingHistoryBtn} onClick={openSpendingHistory}>
            <History size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            View Spending History
          </button>
        </div>

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

        <div className={`${styles.sidebarCard} ${styles.safeHelpCard}`}>
          <h3 className={styles.cardTitle}>Need Help?</h3>
          <p className={styles.helpText}>We are here to help you with your subscription.</p>
          <button className={styles.contactSupportBtn} onClick={() => navigateTo('/more')}>
            <Headphones size={16} />
            <span>Contact Support</span>
          </button>
        </div>
      </div>

      {/* Renew Subscription Confirmation */}
      <ConfirmDeleteDialog
        open={!!renewTarget}
        itemName={renewTarget ? `${renewTarget.creator.displayName} · ${renewTarget.plan}` : ''}
        title="Renew Subscription?"
        confirmLabel="Renew"
        busyLabel="Renewing…"
        icon={<RefreshCw size={22} />}
        message={renewTarget ? (
          <>
            Renew your <strong>{renewTarget.plan}</strong> subscription to <strong>{renewTarget.creator.displayName}</strong> for <strong>{renewTarget.priceCoins} coins</strong>?
            <span className={styles.renewNotice}>This subscription is non-refundable and cannot be cancelled for a refund later.</span>
          </>
        ) : ''}
        deleting={renewing}
        darkMode={darkMode}
        onCancel={closeRenew}
        onConfirm={confirmRenew}
      />

      {/* Cancel Subscription Confirmation */}
      <ConfirmDeleteDialog
        open={!!cancelTarget}
        title="Cancel Subscription?"
        confirmLabel="Confirm"
        busyLabel="Cancelling…"
        icon={<Trash2 size={22} />}
        message={
          cancelTarget ? (
            <>
              Are you sure you want to cancel your <strong>{cancelTarget.plan}</strong> subscription to <strong>{cancelTarget.creator?.displayName || 'this creator'}</strong>?
              <span className={styles.cancelNotice}>
                Nothing will be refunded. The subscription will simply be cancelled.
              </span>
            </>
          ) : (
            'Are you sure you want to cancel this subscription? Nothing will be refunded.'
          )
        }
        deleting={cancelling}
        darkMode={darkMode}
        onCancel={closeCancel}
        onConfirm={confirmCancel}
      />

      {spendingOpen && (
        <div className={styles.spendingModalOverlay} onClick={() => setSpendingOpen(false)}>
          <div className={styles.spendingModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.spendingModalHeader}>
              <div className={styles.spendingModalTitleRow}>
                <History size={20} className={styles.spendingModalIcon} />
                <h3 className={styles.spendingModalTitle}>Spending History</h3>
              </div>
              <button className={styles.spendingCloseBtn} onClick={() => setSpendingOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {spendingLoading ? (
              <div className={styles.spendingEmpty}>Loading spending history...</div>
            ) : spending.length === 0 ? (
              <div className={styles.spendingEmpty}>No subscription spending yet.</div>
            ) : (
              <div className={styles.spendingList}>
                {spending.map((tx) => (
                  <div key={tx._id} className={styles.spendingItem}>
                    <img
                      src={tx.creator?.avatarUrl || '/coin.png'}
                      alt={tx.creator?.displayName || 'Creator'}
                      className={styles.spendingAvatar}
                    />
                    <div className={styles.spendingInfo}>
                      <span className={styles.spendingName}>
                        {tx.creator?.displayName || 'Creator'} @{tx.creator?.username || 'unknown'}
                      </span>
                      <span className={styles.spendingDate}>{formatDate(tx.createdAt)}</span>
                    </div>
                    <span className={styles.spendingAmount}>
                      <img src="/coin.png" alt="Coin" className={styles.coinIconSmall} />
                      {tx.amountCoins}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
