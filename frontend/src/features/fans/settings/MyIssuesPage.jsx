import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  ShieldAlert, 
  Ticket, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Headphones, 
  FileText,
  AlertCircle,
  MessageSquare,
  Filter,
  ChevronDown
} from 'lucide-react';
import styles from './SettingsPage.module.css';

const CATEGORY_LABELS = {
  general: 'General Inquiry',
  billing: 'Billing & Purchases',
  technical: 'Technical Issues',
  other: 'Other Inquiries',
  safety_report: 'Safety & Moderation'
};

const TYPE_TABS = [
  { key: 'all', label: 'All Issues' },
  { key: 'ticket', label: 'Support Tickets' },
  { key: 'report', label: 'Safety Reports' },
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'Under Review' },
  { key: 'resolved', label: 'Resolved' }
];

export const MyIssuesPage = ({ setStatus, onNavigate }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/my-issues');
      if (res.status === 'success') {
        setIssues(res.issues || []);
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load issues and reports.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadIssues();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeFilteredList = issues.filter(item => {
    if (typeTab !== 'all' && item.issueType !== typeTab) return false;
    return true;
  });

  const getStatusCount = (key) => {
    if (key === 'all') return typeFilteredList.length;
    if (key === 'open') return typeFilteredList.filter(i => ['open', 'pending'].includes((i.status || '').toLowerCase())).length;
    if (key === 'in_progress') return typeFilteredList.filter(i => ['in-progress', 'in progress', 'reviewed'].includes((i.status || '').toLowerCase())).length;
    if (key === 'resolved') return typeFilteredList.filter(i => ['closed', 'resolved'].includes((i.status || '').toLowerCase())).length;
    return 0;
  };

  const getFilteredIssues = () => {
    return issues.filter(item => {
      // Filter by type
      if (typeTab !== 'all' && item.issueType !== typeTab) return false;

      // Filter by status
      if (statusFilter !== 'all') {
        const s = (item.status || '').toLowerCase();
        if (statusFilter === 'open' && !['open', 'pending'].includes(s)) return false;
        if (statusFilter === 'in_progress' && !['in-progress', 'in progress', 'reviewed'].includes(s)) return false;
        if (statusFilter === 'resolved' && !['closed', 'resolved'].includes(s)) return false;
      }

      return true;
    });
  };

  const filteredIssues = getFilteredIssues();

  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (['closed', 'resolved'].includes(s)) {
      return (
        <span className={`${styles.statusBadge} ${styles.closed}`}>
          <CheckCircle2 size={13} /> {s === 'resolved' ? 'Resolved' : 'Closed'}
        </span>
      );
    }
    if (['in-progress', 'in progress', 'reviewed'].includes(s)) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusBadgeInProgress}`}>
          <Clock size={13} /> {s === 'reviewed' ? 'Under Review' : 'In Progress'}
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.open}`}>
        <span className={styles.greenPulse} /> {s === 'pending' ? 'Pending' : 'Open'}
      </span>
    );
  };

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      {/* Top Filter Controls */}
      <div className={styles.issuesFilterBar}>
        <div className={styles.ticketFilterTabs}>
          {TYPE_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.ticketTabBtn} ${typeTab === tab.key ? styles.ticketTabActive : ''}`}
              onClick={() => setTypeTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className={styles.statusFilterDropdownGroup}>
          <span className={styles.filterLabel}>STATUS:</span>
          <div className={styles.selectWrapper}>
            <select
              className={styles.issueStatusSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.selectChevron} />
          </div>
        </div>
      </div>

      {/* List of Issues */}
      {filteredIssues.length === 0 ? (
        <div className={styles.emptyBox}>
          <AlertCircle size={44} className={styles.emptyBoxIcon} />
          <p>No issues or tickets found for the selected filter.</p>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {filteredIssues.map((item) => (
            <div 
              key={item._id} 
              className={`${styles.ticketCard} ${item.issueType === 'report' ? styles.reportCardBorder : styles.ticketCardBorder}`}
            >
              {/* Card Top Banner */}
              <div className={styles.ticketCardTopRow}>
                <span className={`${styles.ticketIdChip} ${item.issueType === 'report' ? styles.reportChip : styles.ticketChip}`}>
                  {item.issueType === 'report' ? <ShieldAlert size={12} /> : <Ticket size={12} />}
                  {item.issueType === 'report' ? 'REPORT' : 'TICKET'} #{(item._id || '').slice(-6).toUpperCase()}
                </span>
                {renderStatusBadge(item.status)}
              </div>

              {/* Subject Title */}
              <h4 className={styles.ticketSubjectTitle}>{item.subject}</h4>

              {/* Message Details */}
              {item.details && (
                <p className={styles.ticketMessagePreview}>{item.details}</p>
              )}

              {/* Admin Reply or Compact Pending Indicator */}
              {item.reply ? (
                <div className={styles.ticketReplyCallout}>
                  <div className={styles.supportAvatarMini}>
                    <Headphones size={13} />
                  </div>
                  <div className={styles.replyContentText}>
                    <div className={styles.replyHeaderRow}>
                      <strong>Official Response:</strong>
                      {item.repliedAt && (
                        <span className={styles.replyTimeText}>
                          {new Date(item.repliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className={styles.replyBodyText}>{item.reply}</p>
                  </div>
                </div>
              ) : (
                <div className={styles.pendingReplyBanner}>
                  <Clock size={12} className={styles.spinSlow} />
                  <span>Awaiting review by Support Team</span>
                </div>
              )}

              {/* Footer Meta Row */}
              <div className={styles.ticketFooter}>
                <span className={styles.ticketCategoryPill}>
                  {item.issueType === 'report' ? <ShieldAlert size={11} /> : <FileText size={11} />}
                  {CATEGORY_LABELS[item.category] || item.category || 'General Inquiry'}
                </span>
                <span className={styles.ticketDate}>
                  <Clock size={11} /> {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
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
