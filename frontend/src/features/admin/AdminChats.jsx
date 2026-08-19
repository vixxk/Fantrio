import { useState, useEffect, useRef } from 'react';
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
        onClick={(e) => e.stopPropagation()}
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
      onClick={(e) => {
        e.stopPropagation();
        onView(msg);
      }}
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

/** Thread Modal to view all messages exchanged between Sender and Receiver from a selected user's POV */
const ConversationThreadModal = ({ user1Id, user2Id, initialPovId, onClose, onDeleteMsg, onPreviewMedia }) => {
  const [threadMessages, setThreadMessages] = useState([]);
  const [user1, setUser1] = useState(null);
  const [user2, setUser2] = useState(null);
  const [povId, setPovId] = useState(String(initialPovId || ''));
  const [loading, setLoading] = useState(true);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user1Id, user2Id]);

  useEffect(() => {
    if (!loading) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, povId, loading]);

  async function fetchThread() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/chats/thread/${user1Id}/${user2Id}`);
      if (res.status === 'success') {
        setThreadMessages(res.messages || []);
        setUser1(res.user1);
        setUser2(res.user2);
      }
    } catch (err) {
      console.error('Failed to fetch thread:', err);
    } finally {
      setLoading(false);
    }
  }

  const user1Str = String(user1?._id || user1Id || '');
  const user2Str = String(user2?._id || user2Id || '');

  const povUser = povId === user1Str ? user1 : user2;
  const otherUser = povId === user1Str ? user2 : user1;

  const togglePov = () => {
    setPovId((prev) => (prev === user1Str ? user2Str : user1Str));
  };

  const handleCensor = async (msgId) => {
    const ok = await onDeleteMsg(msgId);
    if (ok) {
      setThreadMessages((prev) => prev.filter((m) => m._id !== msgId));
    }
  };

  return (
    <div className={styles.customModalOverlay} onClick={onClose}>
      <div
        className={styles.customModalBody}
        style={{ maxWidth: 680, width: '92%', height: '85vh', display: 'flex', flexDirection: 'column', padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img
              src={povUser?.avatarUrl || DEFAULT_AVATAR}
              alt={povUser?.displayName || 'User'}
              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand)', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{povUser?.displayName || 'User'}</span>
                <span className={`${styles.badge} ${povUser?.role === 'creator' ? styles.badgeDanger : styles.badgeInfo}`}>
                  {povUser?.role === 'creator' ? 'Creator' : 'Fan'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(225, 0, 117, 0.2)', color: 'var(--brand)' }}>
                  POV
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Chat history with <strong style={{ color: 'var(--text)' }}>{otherUser?.displayName || 'User'}</strong> ({threadMessages.length} message{threadMessages.length === 1 ? '' : 's'})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`}
              onClick={togglePov}
              title={`Switch perspective to ${otherUser?.displayName || 'Other User'}`}
            >
              Switch POV to {otherUser?.displayName || 'Other User'}
            </button>
            <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat Thread Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 6px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div className={styles.emptyState} style={{ padding: 40 }}>
              <span>Loading conversation thread...</span>
            </div>
          ) : threadMessages.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: 40 }}>
              <span>No messages exchanged between these users.</span>
            </div>
          ) : (
            threadMessages.map((msg) => {
              const msgSenderId = String(msg.senderId?._id || msg.senderId);
              const isOutgoing = msgSenderId === String(povUser?._id || povId);
              const senderObj = isOutgoing ? povUser : otherUser;

              return (
                <div
                  key={msg._id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOutgoing ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isOutgoing ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Sender Label & Censor Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{senderObj?.displayName || (isOutgoing ? 'POV User' : 'Participant')}</span>
                    <span>·</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      type="button"
                      onClick={() => handleCensor(msg._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.7 }}
                      title="Censor message"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isOutgoing
                        ? 'linear-gradient(135deg, #e10075 0%, #a80058 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: isOutgoing ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      border: isOutgoing ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.isPaywall && (
                      <div style={{ marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                        <Lock size={11} /> {msg.coinPrice} coins unlock
                      </div>
                    )}

                    {msg.content && <div>{msg.content}</div>}

                    {msg.mediaType !== 'none' && msg.mediaUrl && (
                      <div style={{ marginTop: msg.content ? 8 : 0 }}>
                        <MediaThumb msg={msg} onView={onPreviewMedia} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Footer info */}
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>
            POV User: <strong style={{ color: 'var(--text)' }}>{povUser?.displayName}</strong> ({povUser?.email || 'N/A'})
          </span>
          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={onClose}>
            Close
          </button>
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
  const [activeThread, setActiveThread] = useState(null); // { user1Id, user2Id, povId }
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
    if (!ok) return false;
    try {
      const res = await api.delete(`/admin/chats/${id}`);
      if (res.status === 'success') {
        toast.success('Message deleted successfully.');
        if (preview && preview._id === id) setPreview(null);
        fetchChats();
        return true;
      }
    } catch (err) {
      toast.error(err.message);
    }
    return false;
  };

  const openThread = (sender, receiver, povUserObj) => {
    const user1Id = sender?._id || sender;
    const user2Id = receiver?._id || receiver;
    const povId = povUserObj?._id || povUserObj;

    if (!user1Id || !user2Id) return;
    setActiveThread({ user1Id, user2Id, povId });
  };

  const renderSender = (msg, align) => (
    <div
      className={`${styles.userCell} ${styles.userCellClickable}`}
      onClick={() => openThread(msg.senderId, msg.receiverId, msg.senderId)}
      title="Click to view full chat history from Sender POV"
      style={{ justifyContent: align === 'right' ? 'flex-end' : undefined }}
    >
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
    <div
      className={`${styles.userCell} ${styles.userCellClickable}`}
      onClick={() => openThread(msg.senderId, msg.receiverId, msg.receiverId)}
      title="Click to view full chat history from Receiver POV"
    >
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
            Review every conversation, text message and media attachment shared between fans and creators. Click any participant to open their conversation thread.
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
                    <div
                      className={styles.chatParticipant}
                      onClick={() => openThread(msg.senderId, msg.receiverId, msg.senderId)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view thread from Sender POV"
                    >
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
                    <div
                      className={styles.chatParticipant}
                      onClick={() => openThread(msg.senderId, msg.receiverId, msg.receiverId)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view thread from Receiver POV"
                    >
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

      {/* Conversation Thread Modal */}
      {activeThread && (
        <ConversationThreadModal
          user1Id={activeThread.user1Id}
          user2Id={activeThread.user2Id}
          initialPovId={activeThread.povId}
          onClose={() => setActiveThread(null)}
          onDeleteMsg={handleDeleteMsg}
          onPreviewMedia={setPreview}
        />
      )}

      {/* Media preview lightbox */}
      {preview && <MediaLightbox msg={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};
