import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Phone, PhoneCall, Video, Search, RefreshCw, ArrowUp, ArrowDown, ArrowRight, Gift } from 'lucide-react';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

export const AdminCalls = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('all'); // 'all' | 'audio' | 'video'

  const callTabLabel = {
    all: { placeholder: 'Search all calls...', empty: 'No calls placed yet' },
    audio: { placeholder: 'Search audio calls...', empty: 'No audio calls placed yet' },
    video: { placeholder: 'Search video calls...', empty: 'No video calls placed yet' }
  }[subTab];
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // Duration column sort: null = default (newest first) | 'asc' | 'desc'
  const [durationSort, setDurationSort] = useState(null);

  useEffect(() => {
    fetchCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, search, period, page, durationSort]);

  async function fetchCalls() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '15'
      });
      if (subTab !== 'all') params.set('type', subTab);
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      if (durationSort) {
        params.set('sortBy', 'duration');
        params.set('sortOrder', durationSort);
      }
      const res = await api.get(`/admin/calls?${params.toString()}`);
      if (res.status === 'success') {
        setCalls(res.calls || []);
        setTotal(res.total || 0);
        setTotalPages(Math.max(1, res.totalPages || 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const handleRefresh = () => { fetchCalls(); };

  // Cycle: default -> asc -> desc -> default
  const toggleDurationSort = () => {
    setDurationSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));
    setPage(1);
  };

  const participantRole = (u) => (u?.role === 'creator' ? 'Creator' : 'Fan');

  const renderParticipant = (user, fallback) => (
    <div className={styles.userCell}>
      <img
        src={user?.avatarUrl || '/profile.png'}
        alt={user?.displayName || fallback}
        className={styles.userAvatar}
        loading="lazy"
      />
      <div className={styles.userCellText}>
        <span className={styles.cellStrong}>{user?.displayName || fallback}</span>
        {user?.email && <span className={styles.cellSub}>{participantRole(user)}</span>}
      </div>
    </div>
  );

  // Format the billing duration (stored in minutes) as a readable string.
  const formatDuration = (mins) => {
    const m = Number(mins) || 0;
    if (m <= 0) return '—';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Call Logs</h2>
          <p className={styles.pageSub}>Inspect audio and video call history between fans and creators.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={callTabLabel.placeholder}
              className={styles.searchInput}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={(p) => { setPeriod(p); setPage(1); }}
            activeCount={(period.preset || period.from || period.to) ? 1 : 0}
          />
          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={handleRefresh} aria-label="Refresh call logs">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />

      <div className={styles.pillTabs}>
        <button
          className={`${styles.pillTab} ${subTab === 'all' ? styles.pillTabActive : ''}`}
          onClick={() => { setSubTab('all'); setPage(1); }}
        >
          <Phone size={14} />
          All Calls
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'audio' ? styles.pillTabActive : ''}`}
          onClick={() => { setSubTab('audio'); setPage(1); }}
        >
          <PhoneCall size={14} />
          Audio Calls
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'video' ? styles.pillTabActive : ''}`}
          onClick={() => { setSubTab('video'); setPage(1); }}
        >
          <Video size={14} />
          Video Calls
        </button>
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <SkeletonTable columns={6} rows={5} />
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Caller</th>
                    <th>Receiver</th>
                    <th>
                      <button
                        type="button"
                        className={styles.sortableHeader}
                        onClick={toggleDurationSort}
                        aria-label={`Sort by duration (currently ${durationSort === null ? 'default order' : durationSort})`}
                      >
                        Duration
                        {durationSort === 'asc' ? <ArrowUp size={11} /> : durationSort === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} className={styles.sortableHeaderIdle} />}
                      </button>
                    </th>
                    <th>Status</th>
                    <th>Rate</th>
                    <th>Gifts</th>
                    <th>Billable Coins</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call._id}>
                      <td>{renderParticipant(call.callerId, 'Caller')}</td>
                      <td>{renderParticipant(call.receiverId, 'Receiver')}</td>
                      <td>{formatDuration(call.totalMinutesBilling)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{call.status}</td>
                      <td className={styles.cellMuted}>{call.coinRatePerMinute || 0} coins/min</td>
                      <td>
                        {call.gifts && call.gifts.count > 0 ? (
                          <span className={styles.walletCell}>
                            <Gift size={13} style={{ color: 'var(--warning)' }} />
                            {call.gifts.count} · {call.gifts.totalCoins}c
                          </span>
                        ) : (
                          <span className={styles.cellMuted}>—</span>
                        )}
                      </td>
                      <td className={styles.cellStrong}>{call.totalCoinsBilled || 0} coins</td>
                      <td>{new Date(call.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {calls.length === 0 && (
                    <tr>
                      <td colSpan="8"><div className={styles.emptyState}>{callTabLabel.empty}</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {calls.map((call) => (
                <div key={call._id} className={styles.mobileCard}>
                  <div className={styles.chatParticipants}>
                    <div className={styles.chatParticipant}>
                      <img
                        src={call.callerId?.avatarUrl || '/profile.png'}
                        alt={call.callerId?.displayName || 'Caller'}
                        className={styles.chatParticipantAvatar}
                        loading="lazy"
                      />
                      <div className={styles.chatParticipantText}>
                        <span className={styles.chatParticipantName}>{call.callerId?.displayName || 'Caller'}</span>
                        <span className={styles.chatParticipantRole}>{participantRole(call.callerId)}</span>
                      </div>
                    </div>
                    <span className={styles.chatArrow}>
                      <ArrowRight size={14} />
                    </span>
                    <div className={styles.chatParticipant}>
                      <img
                        src={call.receiverId?.avatarUrl || '/profile.png'}
                        alt={call.receiverId?.displayName || 'Receiver'}
                        className={styles.chatParticipantAvatar}
                        loading="lazy"
                      />
                      <div className={styles.chatParticipantText}>
                        <span className={styles.chatParticipantName}>{call.receiverId?.displayName || 'Receiver'}</span>
                        <span className={styles.chatParticipantRole}>{participantRole(call.receiverId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={`${styles.badge} ${styles.badgeOutline}`} style={{ textTransform: 'capitalize' }}>{call.status}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Duration:</span>
                    <span className={styles.mobileVal}>{formatDuration(call.totalMinutesBilling)}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Rate:</span>
                    <span className={`${styles.mobileVal} ${styles.cellMuted}`}>{call.coinRatePerMinute || 0} coins/min</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Gifts:</span>
                    {call.gifts && call.gifts.count > 0 ? (
                      <span className={styles.mobileVal}>
                        <Gift size={12} style={{ verticalAlign: '-2px', color: 'var(--warning)' }} />{' '}
                        {call.gifts.count} · {call.gifts.totalCoins}c
                      </span>
                    ) : (
                      <span className={`${styles.mobileVal} ${styles.cellMuted}`}>—</span>
                    )}
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Billable:</span>
                    <span className={`${styles.mobileVal} ${styles.cellStrong}`}>{call.totalCoinsBilled || 0} coins</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Date:</span>
                    <span className={styles.mobileVal}>{new Date(call.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {calls.length === 0 && <div className={styles.emptyState}>{callTabLabel.empty}</div>}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationRow}>
          <span className={styles.paginationInfo}>
            {total} call{total === 1 ? '' : 's'} · Page {page} of {totalPages}
          </span>
          <div className={styles.paginationBtns}>
            <button
              className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`}
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              Prev
            </button>
            <button
              className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`}
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
