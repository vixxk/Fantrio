import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MessageSquare, X, Send, Trash2, Search, Check, AlertTriangle } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'closed', label: 'Closed' }
];

const REPORT_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'resolved', label: 'Resolved' }
];

// Ticket categories match the SupportTicket schema enum and the fan-side form
const CATEGORY_LABELS = {
  general: 'General Inquiry',
  billing: 'Billing & Purchases',
  technical: 'Technical Issues',
  other: 'Other Inquiries'
};

const statusBadge = (status) => {
  if (status === 'closed') return styles.badgeSuccess;
  if (status === 'open') return styles.badgeWarning;
  return styles.badgeInfo; // in-progress
};

const reportStatusBadge = (status) => {
  if (status === 'resolved') return styles.badgeSuccess;
  if (status === 'reviewed') return styles.badgeInfo;
  return styles.badgeWarning; // pending
};

const reportTypeBadge = (targetType) => {
  if (targetType === 'creator') return styles.badgeDanger;
  if (targetType === 'content') return styles.badgeWarning;
  return styles.badgeOutline; // post violation
};

export const AdminTickets = () => {
  const { toast, confirm } = useAdminUI();
  const [view, setView] = useState('tickets'); // 'tickets' | 'reports'
  const [tickets, setTickets] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (view === 'tickets') {
      fetchTickets();
    } else {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, search, statusFilter, reportStatusFilter, period]);

  async function fetchTickets() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      const res = await api.get(`/admin/tickets?${params.toString()}`);
      if (res.status === 'success') {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReports() {
    try {
      setLoading(true);
      // Two sources: standalone Report-model docs (creator + content reports)
      // and post violations (posts reported through the feed). Content reports
      // from the Report model are already folded into their post violation by
      // the backend, so standalone content rows are dropped to avoid dupes.
      const [standaloneRes, postRes] = await Promise.all([
        api.get('/admin/user-reports'),
        api.get('/admin/reports')
      ]);

      const fromTime = period.from ? new Date(`${period.from}T00:00:00`).getTime() : null;
      const toTime = period.to ? new Date(`${period.to}T23:59:59.999`).getTime() : null;
      const inPeriod = (d) => {
        const t = new Date(d).getTime();
        if (Number.isNaN(t)) return true;
        if (fromTime && t < fromTime) return false;
        if (toTime && t > toTime) return false;
        return true;
      };

      const standalone = (standaloneRes.status === 'success' ? standaloneRes.reports || [] : [])
        .map((r) => ({
          key: `r-${r._id}`,
          kind: 'report',
          id: r._id,
          targetId: r.targetId,
          targetType: r.targetType,
          targetLabel: r.targetType === 'creator'
            ? (r.target?.displayName || r.target?.username || 'Creator')
            : (r.target?.content || '(content post)'),
          targetDetail: r.targetType === 'content' && r.target?.creatorDisplayName
            ? `by ${r.target.creatorDisplayName}`
            : '',
          reporter: r.reporterId?.displayName || r.reporterId?.username || 'Unknown',
          reason: r.reason,
          description: r.description || '',
          status: r.status || 'pending',
          date: r.createdAt
        }));

      const postViolations = (postRes.status === 'success' ? postRes.posts || [] : [])
        .map((post) => {
          const latest = (post.reports || []).reduce((max, x) => {
            const t = new Date(x.date).getTime();
            return Number.isNaN(t) ? max : Math.max(max, t);
          }, 0);
          return {
            key: `p-${post._id}`,
            kind: 'post',
            id: post._id,
            targetId: post._id,
            targetType: 'post',
            targetLabel: post.content || '(media only post)',
            targetDetail: post.creatorId?.displayName ? `by ${post.creatorId.displayName}` : '',
            reporter: `${post.reports?.length || 0} fan${post.reports?.length === 1 ? '' : 's'}`,
            reason: (post.reports || []).map((x) => x.reason).join(', ') || 'Reported content',
            description: '',
            status: 'pending',
            date: latest ? new Date(latest).toISOString() : post.createdAt
          };
        });

      const postViolationIds = new Set(postViolations.map((p) => String(p.targetId)));

      let merged = [
        // Standalone creator reports always stay; standalone content reports are
        // already aggregated into their post violation row.
        ...standalone.filter(
          (r) => r.targetType !== 'content' || !postViolationIds.has(String(r.targetId))
        ),
        ...postViolations
      ];

      if (reportStatusFilter !== 'all') {
        merged = merged.filter((r) => r.status === reportStatusFilter);
      }
      const q = search.trim().toLowerCase();
      if (q) {
        merged = merged.filter((r) =>
          r.targetLabel.toLowerCase().includes(q) ||
          r.reporter.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      merged = merged.filter((r) => inPeriod(r.date));
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));

      setReports(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenReply = (ticket) => {
    setActiveTicket(ticket);
    setReplyText(ticket.reply || '');
  };

  const handleSendReply = async (statusVal) => {
    try {
      const res = await api.put(`/admin/tickets/${activeTicket._id}`, {
        reply: replyText,
        status: statusVal
      });
      if (res.status === 'success') {
        toast.success('Ticket replied and status updated.');
        setActiveTicket(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTicket = async (id) => {
    const ok = await confirm({
      title: 'Delete ticket?',
      message: 'This support ticket will be permanently removed.',
      confirmText: 'Delete Ticket',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/tickets/${id}`);
      if (res.status === 'success') {
        toast.success('Ticket deleted successfully.');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReportStatus = async (id, status) => {
    try {
      const res = await api.put(`/admin/user-reports/${id}`, { status });
      if (res.status === 'success') {
        toast.success(`Report marked as ${status}.`);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteReport = async (id) => {
    const ok = await confirm({
      title: 'Delete report?',
      message: 'This report will be permanently removed from the queue.',
      confirmText: 'Delete Report',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/user-reports/${id}`);
      if (res.status === 'success') {
        toast.success('Report deleted successfully.');
        fetchReports();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleModeratePost = async (postId, action) => {
    const ok = await confirm({
      title: action === 'delete' ? 'Remove reported post?' : 'Dismiss reports?',
      message: action === 'delete'
        ? 'The post will be permanently deleted.'
        : 'All reports on this post will be cleared.',
      confirmText: action === 'delete' ? 'Remove Post' : 'Dismiss Reports',
      danger: action === 'delete'
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/reports/${postId}/moderate`, { action });
      if (res.status === 'success') {
        toast.success(res.message);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const reportActions = (r) => (
    <div className={styles.actionBtns}>
      {r.kind === 'report' ? (
        <>
          {r.status !== 'reviewed' && (
            <button
              className={`${styles.buttonControl} ${styles.btnGhost} ${styles.btnSm}`}
              onClick={() => handleReportStatus(r.id, 'reviewed')}
            >
              Reviewed
            </button>
          )}
          {r.status !== 'resolved' && (
            <button
              className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`}
              onClick={() => handleReportStatus(r.id, 'resolved')}
            >
              Resolve
            </button>
          )}
          <button
            className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`}
            onClick={() => handleDeleteReport(r.id)}
            aria-label="Delete report"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </>
      ) : (
        <>
          <button
            className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`}
            onClick={() => handleModeratePost(r.id, 'dismiss')}
          >
            Dismiss
          </button>
          <button
            className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`}
            onClick={() => handleModeratePost(r.id, 'delete')}
          >
            Remove
          </button>
        </>
      )}
    </div>
  );

  const renderTicketsView = () => (
    <>
      <div className={styles.filterTabs}>
        <span className={styles.filterLabel}>Status:</span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterTab} ${statusFilter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setStatusFilter(f.key)}
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
                    <th>ID</th>
                    <th>Fan</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Replied</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t._id}>
                      <td><span className={styles.cellMono}>#TK-{(t._id || '').slice(-6).toUpperCase()}</span></td>
                      <td>
                        <div className={styles.cellStrong}>{t.userId?.displayName || 'Unknown'}</div>
                        {t.userId?.email && <div className={styles.cellSub}>{t.userId.email}</div>}
                      </td>
                      <td>{t.subject}</td>
                      <td>{CATEGORY_LABELS[t.category] || t.category || 'General Inquiry'}</td>
                      <td>
                        <span className={`${styles.badge} ${statusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.repliedAt ? new Date(t.repliedAt).toLocaleString() : '—'}</td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`} onClick={() => handleOpenReply(t)}>
                            <MessageSquare size={12} />
                            Reply
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleDeleteTicket(t._id)} aria-label="Delete ticket">
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="8">
                        <div className={styles.emptyState}>
                          {search || statusFilter !== 'all' || period.from
                            ? 'No tickets match the current filters'
                            : 'No support requests in queue'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {tickets.map((t) => (
                <div key={t._id} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{t.userId?.displayName || 'Fan'}</span>
                    <span className={`${styles.badge} ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>ID:</span>
                    <span className={`${styles.mobileVal} ${styles.cellMono}`}>#TK-{(t._id || '').slice(-6).toUpperCase()}</span>
                  </div>
                  {t.userId?.email && (
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Email:</span>
                      <span className={styles.mobileVal}>{t.userId.email}</span>
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Subject:</span>
                    <span className={styles.mobileVal}>{t.subject}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Category:</span>
                    <span className={styles.mobileVal}>{CATEGORY_LABELS[t.category] || t.category || 'General Inquiry'}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Replied:</span>
                    <span className={styles.mobileVal}>{t.repliedAt ? new Date(t.repliedAt).toLocaleString() : '—'}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Date:</span>
                    <span className={styles.mobileVal}>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleOpenReply(t)} style={{ flex: 1 }}>
                      Reply Message
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={() => handleDeleteTicket(t._id)} aria-label="Delete ticket" style={{ flex: 1 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className={styles.emptyState}>
                  {search || statusFilter !== 'all' || period.from
                    ? 'No tickets match the current filters'
                    : 'No support requests in queue'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {activeTicket && (
        <div className={styles.customModalOverlay}>
          <div className={styles.customModalBody}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ticket Resolution</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveTicket(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.quoteBox}>
                <div className={styles.strong} style={{ marginBottom: 4 }}>Subject: {activeTicket.subject}</div>
                <div className={styles.muted}>
                  Category: {CATEGORY_LABELS[activeTicket.category] || activeTicket.category || 'General Inquiry'}
                </div>
                <div className={styles.muted}>
                  From: {activeTicket.userId?.displayName || 'Unknown'}
                  {activeTicket.userId?.email ? ` (${activeTicket.userId.email})` : ''}
                </div>
                <div className={styles.muted} style={{ marginTop: 6 }}>{activeTicket.message || 'No description provided.'}</div>
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Reply Text</label>
                <textarea
                  rows="4"
                  className={styles.inputField}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type support reply..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => setActiveTicket(null)}>
                Cancel
              </button>
              <div className={styles.modalActionsGroup}>
                {/* open -> put in waiting state; in-progress -> the final closed state */}
                {activeTicket.status === 'in-progress' ? (
                  <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleSendReply('closed')}>
                    Mark Closed
                  </button>
                ) : (
                  <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleSendReply('in-progress')}>
                    Mark In-Progress
                  </button>
                )}
                <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleSendReply('closed')}>
                  <Send size={14} />
                  Send
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );

  const renderReportsView = () => (
    <>
      <div className={styles.filterTabs}>
        <span className={styles.filterLabel}>Status:</span>
        {REPORT_STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterTab} ${reportStatusFilter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setReportStatusFilter(f.key)}
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
                    <th>Target</th>
                    <th>Reporter</th>
                    <th>Reason / Details</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <div className={styles.cellStrong}>{r.targetLabel}</div>
                        {r.targetDetail && <div className={styles.cellSub}>{r.targetDetail}</div>}
                      </td>
                      <td className={styles.cellStrong}>{r.reporter}</td>
                      <td className={styles.cellWrap}>
                        {r.reason}
                        {r.description && <div className={styles.muted}>{r.description}</div>}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${reportTypeBadge(r.targetType)}`}>
                          {r.targetType === 'content' ? 'Content' : r.targetType === 'creator' ? 'Creator' : 'Post'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${reportStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td>{reportActions(r)}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className={styles.emptyState}>
                          {search || reportStatusFilter !== 'all' || period.from
                            ? 'No reports match the current filters'
                            : 'No reports in queue'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {reports.map((r) => (
                <div key={r.key} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{r.targetLabel}</span>
                    <span className={`${styles.badge} ${reportStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.targetDetail && (
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Target:</span>
                      <span className={styles.mobileVal}>{r.targetDetail}</span>
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Reporter:</span>
                    <span className={styles.mobileVal}>{r.reporter}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Type:</span>
                    <span className={`${styles.badge} ${reportTypeBadge(r.targetType)}`}>
                      {r.targetType === 'content' ? 'Content' : r.targetType === 'creator' ? 'Creator' : 'Post'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Reason:</span>
                    <span className={styles.mobileVal}>{r.reason}</span>
                  </div>
                  {r.description && (
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Details:</span>
                      <span className={styles.mobileVal}>{r.description}</span>
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Date:</span>
                    <span className={styles.mobileVal}>{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginTop: 4, width: '100%' }}>{reportActions(r)}</div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className={styles.emptyState}>
                  {search || reportStatusFilter !== 'all' || period.from
                    ? 'No reports match the current filters'
                    : 'No reports in queue'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Support Desk</h2>
          <p className={styles.pageSub}>Respond to fan tickets and resolve reports.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={view === 'tickets' ? 'Search tickets...' : 'Search reports...'}
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={setPeriod}
            onReset={() => (view === 'tickets' ? setStatusFilter('all') : setReportStatusFilter('all'))}
            activeCount={
              (view === 'tickets'
                ? (statusFilter !== 'all' ? 1 : 0)
                : (reportStatusFilter !== 'all' ? 1 : 0)) +
              ((period.preset || period.from || period.to) ? 1 : 0)
            }
          >
            {view === 'tickets' ? (
              <div className={styles.filterSheetSection}>
                <span className={styles.filterSheetSectionLabel}>Ticket status</span>
                <div className={styles.filterSheetOptions}>
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`${styles.filterSheetOption} ${statusFilter === f.key ? styles.filterSheetOptionActive : ''}`}
                      onClick={() => setStatusFilter(f.key)}
                    >
                      <span>{f.label}</span>
                      {statusFilter === f.key && (
                        <span className={styles.filterSheetOptionCheck}><Check size={13} /></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.filterSheetSection}>
                <span className={styles.filterSheetSectionLabel}>Report status</span>
                <div className={styles.filterSheetOptions}>
                  {REPORT_STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`${styles.filterSheetOption} ${reportStatusFilter === f.key ? styles.filterSheetOptionActive : ''}`}
                      onClick={() => setReportStatusFilter(f.key)}
                    >
                      <span>{f.label}</span>
                      {reportStatusFilter === f.key && (
                        <span className={styles.filterSheetOptionCheck}><Check size={13} /></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AdminFilterButton>
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={setPeriod} />

      <div className={styles.pillTabs}>
        <button
          className={`${styles.pillTab} ${view === 'tickets' ? styles.pillTabActive : ''}`}
          onClick={() => setView('tickets')}
        >
          <MessageSquare size={14} />
          Tickets
        </button>
        <button
          className={`${styles.pillTab} ${view === 'reports' ? styles.pillTabActive : ''}`}
          onClick={() => setView('reports')}
        >
          <AlertTriangle size={14} />
          Reports
        </button>
      </div>

      {view === 'tickets' ? renderTicketsView() : renderReportsView()}
    </div>
  );
};
