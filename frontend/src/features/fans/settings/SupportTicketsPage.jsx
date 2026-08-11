import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Ticket, Plus, CheckCircle2, Clock, Headphones, FileText } from 'lucide-react';
import styles from './SettingsPage.module.css';

const CATEGORY_LABELS = {
  general: 'General Inquiry',
  billing: 'Billing & Purchases',
  technical: 'Technical Issues',
  other: 'Other Inquiries',
};

// Status values come from the SupportTicket schema enum (open | in-progress | closed)
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
];

export const SupportTicketsPage = ({ setStatus, onContact }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/tickets');
      if (res.status === 'success') setTickets(res.tickets || []);
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load tickets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadTickets();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredTickets = () => {
    if (filterTab === 'all') return tickets;
    return tickets.filter(t => (t.status || 'open').toLowerCase() === filterTab);
  };

  const filteredTickets = getFilteredTickets();

  const getStatusBadge = (status) => {
    const s = (status || 'open').toLowerCase();
    if (s === 'closed' || s === 'resolved') return <span className={`${styles.statusBadge} ${styles.closed}`}><CheckCircle2 size={12} /> Closed</span>;
    if (s === 'in-progress' || s === 'in progress' || s === 'in_progress') return <span className={`${styles.statusBadge} ${styles.statusBadgeInProgress}`}><Clock size={12} /> In Progress</span>;
    return <span className={`${styles.statusBadge} ${styles.open}`}><span className={styles.greenPulse} /> Open</span>;
  };

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.payHeaderRow}>
        <div className={styles.payIntroGroup}>
          <h3>My Support Requests</h3>
          <p className={styles.payIntro}>Track resolution progress for your submitted tickets.</p>
        </div>
        <button className={styles.actionBtn} onClick={onContact}>
          <Plus size={16} /> Submit New Ticket
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className={styles.ticketFilterTabs}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.ticketTabBtn} ${filterTab === tab.key ? styles.ticketTabActive : ''}`}
            onClick={() => setFilterTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <div className={styles.emptyBox}>
          <Ticket size={44} className={styles.emptyBoxIcon} />
          <p>No support tickets match the "{STATUS_TABS.find(t => t.key === filterTab)?.label || filterTab}" filter.</p>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {filteredTickets.map(t => (
            <div key={t._id} className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <div className={styles.ticketTitleMeta}>
                  <span className={styles.ticketIdChip}>#TK-{(t._id || '').slice(-6).toUpperCase()}</span>
                  <span className={styles.ticketSubject}>{t.subject}</span>
                </div>
                {getStatusBadge(t.status)}
              </div>
              <p className={styles.ticketMessagePreview}>{t.message}</p>
              {t.reply ? (
                <div className={styles.ticketReplyCallout}>
                  <div className={styles.supportAvatarMini}>
                    <Headphones size={13} />
                  </div>
                  <div className={styles.replyContentText}>
                    <strong>Fantrio Support Response:</strong>
                    <p>{t.reply}</p>
                    {t.repliedAt && (
                      <div className={styles.ticketDate} style={{ marginTop: 6 }}>
                        <Clock size={12} /> Replied {new Date(t.repliedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              <div className={styles.ticketFooter}>
                <span className={styles.ticketCategoryPill}><FileText size={12} /> {CATEGORY_LABELS[t.category] || t.category || 'General Inquiry'}</span>
                <span className={styles.ticketDate}><Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SkeletonRows = () => (
  <div className={styles.subPageBody}>
    <div className="skeleton-card" style={{ height: '60px', padding: '1rem', marginBottom: '1.5rem' }}>
      <div className="skeleton-box skeleton-title" style={{ width: '200px', height: '100%' }} />
    </div>
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="skeleton-card" style={{ padding: '1.2rem', marginBottom: '1rem', gap: '0.8rem' }}>
        <div className="skeleton-box skeleton-title" style={{ width: '150px' }} />
        <div className="skeleton-box skeleton-content-line" />
        <div className="skeleton-box skeleton-content-line short" />
      </div>
    ))}
  </div>
);
