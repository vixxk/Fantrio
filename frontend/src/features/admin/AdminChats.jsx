import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Trash2,
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  Lock,
  X,
  Play,
  Check,
  MessageSquareText,
  Film,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

const DEFAULT_AVATAR = '/profile.png';

const MEDIA_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'gif', label: 'GIFs' },
  { key: 'paywall', label: '🔒 Paywalled' }
];

const mediaLabel = (type) => (type && type !== 'none' ? type : 'text');

const mediaIcon = (type) => {
  if (type === 'video') return <Video size={13} />;
  if (type === 'image') return <ImageIcon size={13} />;
  if (type === 'gif') return <Film size={13} />;
  return <FileText size={13} />;
};

/** Small clickable attachment preview inside the table. */
const MediaThumb = ({ msg, onView }) => {
  if (!msg.mediaUrl) {
    return (
      <span className={`${styles.badge} ${styles.badgeOutline}`}>
        {mediaIcon(msg.mediaType)}
        {mediaLabel(msg.mediaType)}
      </span>
    );
  }

  // Generic 'media' attachments (audio, documents, etc.) may not be previewable
  // images/videos — render a clickable chip instead of a potentially-broken img.
  if (msg.mediaType === 'media') {
    return (
      <a
        href={msg.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.mediaChip}
        title="Open attachment"
      >
        {mediaIcon('media')}
        <span>Attachment</span>
      </a>
    );
  }

  const isVideo = msg.mediaType === 'video';
  return (
    <button
      type="button"
      className={styles.mediaThumb}
      onClick={() => onView(msg)}
      aria-label={`View ${msg.mediaType} attachment`}
    >
      {isVideo ? (
        <>
          <video src={msg.mediaUrl} preload="metadata" muted playsInline />
          <span className={styles.mediaThumbPlay}><Play size={16} /></span>
        </>
      ) : (
        <img src={msg.mediaUrl} alt="Message attachment" loading="lazy" />
      )}
      <span className={styles.mediaThumbType}>
        {mediaIcon(msg.mediaType)}
        {mediaLabel(msg.mediaType)}
      </span>
    </button>
  );
};

/** Full-screen media lightbox for previewing attachments. */
const MediaLightbox = ({ msg, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const isVideo = msg.mediaType === 'video';
  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lightboxHead}>
          <div className={styles.lightboxMeta}>
            <span className={`${styles.badge} ${msg.isPaywall ? styles.badgeWarning : styles.badgeInfo}`}>
              {mediaIcon(msg.mediaType)}
              {mediaLabel(msg.mediaType)}
            </span>
            {msg.isPaywall && (
              <span className={`${styles.badge} ${styles.badgeWarning}`}>
                <Lock size={11} /> {msg.coinPrice} coins
              </span>
            )}
            <span className={styles.lightboxSub}>
              {msg.senderId?.displayName || 'Unknown'} → {msg.receiverId?.displayName || 'Unknown'}
            </span>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.lightboxMedia}>
          {isVideo ? (
            <video src={msg.mediaUrl} controls autoPlay muted playsInline />
          ) : (
            <img src={msg.mediaUrl} alt="Message attachment" />
          )}
        </div>

        {msg.content && <p className={styles.lightboxCaption}>{msg.content}</p>}

        <div className={styles.lightboxFoot}>
          <span className={styles.cellSub}>
            Sent {new Date(msg.createdAt).toLocaleString()}
          </span>
          <a className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
};

export const AdminChats = () => {
  const { toast, confirm } = useAdminUI();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState(null);
  // Sent Time column sort: null = default (newest first) | 'asc' | 'desc'
  const [dateSort, setDateSort] = useState(null);

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, mediaFilter, period, page, dateSort]);

  async function fetchChats() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '15'
      });
      if (mediaFilter === 'paywall') {
        params.set('isPaywall', 'true');
      } else if (mediaFilter !== 'all') {
        params.set('mediaType', mediaFilter);
      }
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      if (dateSort) {
        params.set('sortBy', 'date');
        params.set('sortOrder', dateSort);
      }
      const res = await api.get(`/admin/chats?${params.toString()}`);
      if (res.status === 'success') {
        setMessages(res.messages || []);
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

  const switchFilter = (key) => {
    setMediaFilter(key);
    setPage(1);
  };

  // Cycle: default -> asc -> desc -> default
  const toggleDateSort = () => {
    setDateSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));
    setPage(1);
  };

  const handleDeleteMsg = async (id) => {
    const ok = await confirm({
      title: 'Censor message?',
      message: 'This message and any attached media will be permanently deleted. This action cannot be undone.',
      confirmText: 'Censor',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/chats/${id}`);
      if (res.status === 'success') {
        toast.success('Message deleted successfully.');
        if (preview && preview._id === id) setPreview(null);
        fetchChats();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderSender = (msg, align) => (
    <div className={styles.userCell} style={{ justifyContent: align === 'right' ? 'flex-end' : undefined }}>
      <img
        src={msg.senderId?.avatarUrl || DEFAULT_AVATAR}
        alt={msg.senderId?.displayName || 'Sender'}
        className={styles.userAvatar}
        loading="lazy"
      />
      <div className={styles.userCellText}>
        <span className={styles.cellStrong}>{msg.senderId?.displayName || 'System'}</span>
        {msg.senderId?.email && <span className={styles.cellSub}>{msg.senderId.email}</span>}
      </div>
    </div>
  );

  const renderReceiver = (msg) => (
    <div className={styles.userCell}>
      <img
        src={msg.receiverId?.avatarUrl || DEFAULT_AVATAR}
        alt={msg.receiverId?.displayName || 'Receiver'}
        className={styles.userAvatar}
        loading="lazy"
      />
      <div className={styles.userCellText}>
        <span className={styles.cellStrong}>{msg.receiverId?.displayName || 'System'}</span>
        {msg.receiverId?.email && <span className={styles.cellSub}>{msg.receiverId.email}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Chat Logs</h2>
          <p className={styles.pageSub}>
            Review every conversation, text message and media attachment shared between fans and creators.
          </p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search message text or participant..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={(p) => { setPeriod(p); setPage(1); }}
            onReset={() => { setMediaFilter('all'); setPage(1); }}
            activeCount={(mediaFilter !== 'all' ? 1 : 0) + ((period.preset || period.from || period.to) ? 1 : 0)}
          >
            <div className={styles.filterSheetSection}>
              <span className={styles.filterSheetSectionLabel}>Media type</span>
              <div className={styles.filterSheetOptions}>
                {MEDIA_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`${styles.filterSheetOption} ${mediaFilter === f.key ? styles.filterSheetOptionActive : ''}`}
                    onClick={() => switchFilter(f.key)}
                  >
                    <span>{f.label}</span>
                    {mediaFilter === f.key && (
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
        <span className={styles.filterLabel}>Media type:</span>
        {MEDIA_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterTab} ${mediaFilter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => switchFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
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
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Message</th>
                    <th>Attachment</th>
                    <th>
                      <button
                        type="button"
                        className={styles.sortableHeader}
                        onClick={toggleDateSort}
                        aria-label={`Sort by sent time (currently ${dateSort === null ? 'default order' : dateSort})`}
                      >
                        Sent Time
                        {dateSort === 'asc' ? <ArrowUp size={11} /> : dateSort === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} className={styles.sortableHeaderIdle} />}
                      </button>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id}>
                      <td>{renderSender(msg)}</td>
                      <td>{renderReceiver(msg)}</td>
                      <td className={styles.cellWrap}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {msg.isPaywall && (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>
                              <Lock size={11} /> {msg.coinPrice} coins
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {msg.content || (msg.mediaType === 'none' ? '—' : <span className={styles.cellSub}>Media message</span>)}
                        </div>
                      </td>
                      <td>
                        {msg.mediaType !== 'none' ? (
                          <MediaThumb msg={msg} onView={setPreview} />
                        ) : (
                          <span className={styles.cellSub}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.cellSub}>{new Date(msg.createdAt).toLocaleString()}</span>
                      </td>
                      <td>
                        <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleDeleteMsg(msg._id)}>
                          <Trash2 size={12} />
                          Censor
                        </button>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className={styles.emptyState}>
                          <MessageSquareText size={26} style={{ opacity: 0.5 }} />
                          {search || mediaFilter !== 'all' || period.from
                            ? 'No messages match the current filters'
                            : 'No messages sent yet'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {messages.map((msg) => (
                <div key={msg._id} className={styles.mobileCard}>
                  <div className={styles.chatParticipants}>
                    <div className={styles.chatParticipant}>
                      <img
                        src={msg.senderId?.avatarUrl || DEFAULT_AVATAR}
                        alt={msg.senderId?.displayName || 'Sender'}
                        className={styles.chatParticipantAvatar}
                        loading="lazy"
                      />
                      <div className={styles.chatParticipantText}>
                        <span className={styles.chatParticipantName}>{msg.senderId?.displayName || 'System'}</span>
                        <span className={styles.chatParticipantRole}>
                          {msg.senderId?.role === 'creator' ? 'Creator' : 'Fan'}
                        </span>
                      </div>
                    </div>
                    <span className={styles.chatArrow}>
                      <ArrowRight size={14} />
                    </span>
                    <div className={styles.chatParticipant}>
                      <img
                        src={msg.receiverId?.avatarUrl || DEFAULT_AVATAR}
                        alt={msg.receiverId?.displayName || 'Receiver'}
                        className={styles.chatParticipantAvatar}
                        loading="lazy"
                      />
                      <div className={styles.chatParticipantText}>
                        <span className={styles.chatParticipantName}>{msg.receiverId?.displayName || 'System'}</span>
                        <span className={styles.chatParticipantRole}>
                          {msg.receiverId?.role === 'creator' ? 'Creator' : 'Fan'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileRow} style={{ justifyContent: 'flex-start', gap: 6 }}>
                    <span className={`${styles.badge} ${styles.badgeInfo}`}>
                      {mediaIcon(msg.mediaType)}
                      {mediaLabel(msg.mediaType)}
                    </span>
                    {msg.isPaywall && (
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        <Lock size={11} /> {msg.coinPrice} coins
                      </span>
                    )}
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Message:</span>
                    <span className={styles.mobileVal}>{msg.content || '—'}</span>
                  </div>
                  {msg.mediaType !== 'none' && (
                    <div className={styles.mobileRow} style={{ justifyContent: 'flex-start' }}>
                      <span className={styles.mobileLabel}>Attachment:</span>
                      <MediaThumb msg={msg} onView={setPreview} />
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Time:</span>
                    <span className={styles.mobileVal}>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnBlock}`} onClick={() => handleDeleteMsg(msg._id)} style={{ marginTop: 4 }}>
                    <Trash2 size={12} /> Censor Message
                  </button>
                </div>
              ))}
              {messages.length === 0 && (
                <div className={styles.emptyState}>
                  {search || mediaFilter !== 'all' || period.from
                    ? 'No messages match the current filters'
                    : 'No messages sent yet'}
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
            {total} message{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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

      {/* Media preview lightbox */}
      {preview && <MediaLightbox msg={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};
