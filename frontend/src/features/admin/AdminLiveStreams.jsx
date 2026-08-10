import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Radio,
  Ban,
  Trash2,
  Search,
  Users,
  Coins,
  Check,
  Eye,
  CalendarClock
} from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live now' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'ended', label: 'Ended' },
  { key: 'cancelled', label: 'Cancelled' }
];

const statusBadge = (status) => {
  if (status === 'live') return styles.badgeSuccess;
  if (status === 'scheduled') return styles.badgeInfo;
  if (status === 'cancelled') return styles.badgeDanger;
  return styles.badgeOutline;
};

const streamStartTime = (s) => {
  if (s.scheduledAt) return new Date(s.scheduledAt).toLocaleString();
  if (s.startedAt) return new Date(s.startedAt).toLocaleString();
  return new Date(s.createdAt).toLocaleString();
};

const viewerCount = (s) => s.viewerCount || s.viewers?.length || 0;

// Mock thumbnail shown while a streamer has not uploaded a cover image.
const MOCK_THUMB = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';

const streamCover = (s) => s.coverUrl || MOCK_THUMB;

export const AdminLiveStreams = () => {
  const { toast, confirm } = useAdminUI();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, period, page]);

  async function fetchStreams() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '15'
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      const res = await api.get(`/admin/streams?${params.toString()}`);
      if (res.status === 'success') {
        setStreams(res.streams || []);
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

  const handleTerminate = async (id) => {
    const ok = await confirm({
      title: 'Terminate live stream?',
      message: 'The connection will be broken for all viewers and the stream will end immediately.',
      confirmText: 'Terminate Stream',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/streams/${id}/terminate`);
      if (res.status === 'success') {
        toast.success('Live stream terminated successfully.');
        fetchStreams();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete live stream?',
      message: 'This stream record will be permanently removed. Viewers will lose access and this cannot be undone.',
      confirmText: 'Delete Stream',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/streams/${id}`);
      if (res.status === 'success') {
        toast.success('Live stream deleted successfully.');
        fetchStreams();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Live Streams</h2>
          <p className={styles.pageSub}>Monitor live broadcasts, scheduled shows and stream history across the platform.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search streams or creators..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={(p) => { setPeriod(p); setPage(1); }}
            onReset={() => { setStatusFilter('all'); setPage(1); }}
            activeCount={(statusFilter !== 'all' ? 1 : 0) + ((period.preset || period.from || period.to) ? 1 : 0)}
          >
            <div className={styles.filterSheetSection}>
              <span className={styles.filterSheetSectionLabel}>Stream status</span>
              <div className={styles.filterSheetOptions}>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`${styles.filterSheetOption} ${statusFilter === f.key ? styles.filterSheetOptionActive : ''}`}
                    onClick={() => { setStatusFilter(f.key); setPage(1); }}
                  >
                    <span>{f.label}</span>
                    {statusFilter === f.key && (
                      <span className={styles.filterSheetOptionCheck}><Check size={13} /></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </AdminFilterButton>
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />

      <div className={styles.filterTabs}>
        <span className={styles.filterLabel}>Status:</span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterTab} ${statusFilter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <SkeletonTable columns={7} rows={5} />
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Room ID</th>
                    <th>Viewers</th>
                    <th>Entry</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((stream) => (
                    <tr key={stream._id}>
                      <td>
                        <div className={styles.streamTableCell}>
                          <img
                            src={streamCover(stream)}
                            alt={stream.title || 'Stream thumbnail'}
                            className={styles.streamTableThumb}
                            loading="lazy"
                          />
                          <div className={styles.userCellText}>
                            <span className={styles.cellStrong}>{stream.creatorId?.displayName || 'Unknown'}</span>
                            {stream.creatorId?.username && <span className={styles.cellSub}>@{stream.creatorId.username}</span>}
                          </div>
                        </div>
                      </td>
                      <td className={styles.cellTruncate}>
                        <span className={styles.cellStrong}>{stream.title}</span>
                        {stream.language && <span className={styles.cellSub} style={{ display: 'block' }}>{stream.language}</span>}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeOutline}`}>{stream.category || '—'}</span>
                      </td>
                      <td className={styles.cellMono}>{stream.roomId}</td>
                      <td>
                        <span className={styles.walletCell}>
                          <Users size={13} style={{ color: 'var(--info)' }} />
                          {viewerCount(stream)}
                        </span>
                        {stream.peakViewers > 0 && (
                          <span className={styles.cellSub} style={{ display: 'block' }}>peak {stream.peakViewers}</span>
                        )}
                      </td>
                      <td>
                        {stream.entryPriceCoins > 0 ? (
                          <span className={styles.walletCell}>
                            <Coins size={13} style={{ color: 'var(--warning)' }} />
                            {stream.entryPriceCoins}
                          </span>
                        ) : (
                          <span className={styles.cellSub}>Free</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${statusBadge(stream.status)}`}>{stream.status}</span>
                      </td>
                      <td className={styles.cellSub}>{streamStartTime(stream)}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          {stream.status === 'live' && (
                            <button className={`${styles.buttonControl} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => handleTerminate(stream._id)}>
                              <Ban size={12} />
                              Terminate
                            </button>
                          )}
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleDelete(stream._id)}>
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {streams.length === 0 && (
                    <tr>
                      <td colSpan="9">
                        <div className={styles.emptyState}>
                          <Radio size={26} style={{ opacity: 0.5 }} />
                          {search || statusFilter !== 'all' || period.from
                            ? 'No streams match the current filters'
                            : 'No live streams created yet'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {streams.map((stream) => (
                <div key={stream._id} className={styles.streamCard}>
                  {/* Thumbnail header */}
                  <div className={styles.streamCardMedia}>
                    <img
                      src={streamCover(stream)}
                      alt={stream.title || 'Stream thumbnail'}
                      className={styles.streamCardImg}
                      loading="lazy"
                    />
                    <div className={styles.streamCardShade} />
                    <div className={styles.streamCardTopRow}>
                      <span className={`${styles.badge} ${styles.streamStatusBadge} ${statusBadge(stream.status)}`}>
                        <span className={styles.streamStatusDot} />
                        {stream.status}
                      </span>
                      {stream.entryPriceCoins > 0 ? (
                        <span className={styles.streamPriceBadge}>
                          <Coins size={11} /> {stream.entryPriceCoins}
                        </span>
                      ) : (
                        <span className={styles.streamPriceBadge}>Free</span>
                      )}
                    </div>
                    <div className={styles.streamCardBottomRow}>
                      <div className={styles.streamCardTitleWrap}>
                        <span className={styles.streamCardTitle}>{stream.title}</span>
                        <span className={styles.streamCardMeta}>
                          {stream.category || 'Stream'} · {stream.language || 'English'}
                        </span>
                      </div>
                      <span className={styles.streamViewersPill}>
                        <Eye size={12} /> {viewerCount(stream)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className={styles.streamCardBody}>
                    <div className={styles.streamCreatorRow}>
                      <img
                        src={stream.creatorId?.avatarUrl || '/profile.png'}
                        alt={stream.creatorId?.displayName || 'Creator'}
                        className={styles.streamCreatorAvatar}
                        loading="lazy"
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.streamCreatorName}>{stream.creatorId?.displayName || 'Unknown'}</div>
                        <div className={styles.streamCardMeta}>
                          {stream.roomId ? `Room ${stream.roomId}` : 'No room assigned'}
                        </div>
                      </div>
                    </div>
                    <div className={styles.streamStatGrid}>
                      <div className={styles.streamStatCell}>
                        <span className={styles.streamStatLabel}>
                          <Users size={12} /> Peak
                        </span>
                        <span className={styles.streamStatValue}>{stream.peakViewers || 0}</span>
                      </div>
                      <div className={styles.streamStatCell}>
                        <span className={styles.streamStatLabel}>
                          <CalendarClock size={12} />
                          {stream.status === 'scheduled' ? 'Scheduled' : 'Started'}
                        </span>
                        <span className={styles.streamStatValue}>{streamStartTime(stream)}</span>
                      </div>
                    </div>
                    <div className={styles.actionBtns} style={{ width: '100%' }}>
                      {stream.status === 'live' && (
                        <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleTerminate(stream._id)} style={{ flex: 1 }}>
                          <Ban size={14} /> Terminate
                        </button>
                      )}
                      <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={() => handleDelete(stream._id)} style={{ flex: 1 }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {streams.length === 0 && (
                <div className={styles.emptyState}>
                  {search || statusFilter !== 'all' || period.from
                    ? 'No streams match the current filters'
                    : 'No live streams created yet'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationRow}>
          <span className={styles.paginationInfo}>
            {total} stream{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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
