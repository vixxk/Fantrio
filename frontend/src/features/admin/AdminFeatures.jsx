import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Lightbulb, Check, Trash2, Search, Clock, Sparkles, Flame, CheckCircle2, ThumbsUp } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import styles from './AdminPage.module.css';

const STATUS_OPTIONS = [
  { value: 'suggestion', label: 'Suggestion', color: '#60a5fa' },
  { value: 'under-review', label: 'Under Review', color: '#fbbf24' },
  { value: 'planned', label: 'Planned', color: '#a855f7' },
  { value: 'completed', label: 'Completed', color: '#34d399' }
];

export const AdminFeatures = () => {
  const { toast, confirm } = useAdminUI();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/features');
      if (res.status === 'success') {
        setFeatures(res.features || []);
      }
    } catch (err) {
      console.error('Failed to load feature requests:', err);
      toast.error('Failed to load feature requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchFeatures();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (feature) => {
    try {
      const res = await api.put(`/admin/features/${feature._id}`, { isApproved: true });
      if (res.status === 'success') {
        toast.success(`"${feature.title}" has been approved!`);
        setFeatures((prev) =>
          prev.map((f) => (f._id === feature._id ? { ...f, isApproved: true } : f))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to approve feature request.');
    }
  };

  const handleStatusChange = async (featureId, newStatus) => {
    try {
      const res = await api.put(`/admin/features/${featureId}`, { status: newStatus });
      if (res.status === 'success') {
        toast.success('Feature status updated.');
        setFeatures((prev) =>
          prev.map((f) => (f._id === featureId ? { ...f, status: newStatus } : f))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (feature) => {
    const ok = await confirm({
      title: 'Delete Feature Request?',
      message: `Are you sure you want to delete "${feature.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/admin/features/${feature._id}`);
      if (res.status === 'success') {
        toast.success('Feature request deleted.');
        setFeatures((prev) => prev.filter((f) => f._id !== feature._id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete feature request.');
    }
  };

  const filteredFeatures = features.filter((f) => {
    const q = search.trim().toLowerCase();
    const userStr = f.userId ? `${f.userId.displayName || ''} ${f.userId.username || ''} ${f.userId.email || ''}` : '';
    const dateStr = new Date(f.createdAt).toLocaleDateString().toLowerCase();
    const statusStr = String(f.status || '').toLowerCase();
    const matchesSearch =
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      userStr.toLowerCase().includes(q) ||
      statusStr.includes(q) ||
      dateStr.includes(q);

    if (statusFilter === 'pending') return matchesSearch && f.isApproved === false;
    if (statusFilter === 'approved') return matchesSearch && f.isApproved !== false;
    if (statusFilter !== 'all') return matchesSearch && f.status === statusFilter;
    return matchesSearch;
  });

  const getStatusBadge = (status, isApproved) => {
    if (isApproved === false) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    const s = (status || 'suggestion').toLowerCase();
    if (s === 'planned') return <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12} /> Planned</span>;
    if (s === 'completed') return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={12} /> Completed</span>;
    if (s === 'under-review' || s === 'under_review') return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Flame size={12} /> Under Review</span>;
    return <span style={{ background: 'rgba(0, 112, 243, 0.15)', color: '#60a5fa', border: '1px solid rgba(0, 112, 243, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Lightbulb size={12} /> Suggestion</span>;
  };

  if (loading && features.length === 0) {
    return <SkeletonTable columns={4} rows={4} />;
  }

  const pendingCount = features.filter((f) => f.isApproved === false).length;

  return (
    <div className={styles.sectionContainer}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            <Lightbulb size={22} className={styles.sectionTitleIcon} />
            Feature Requests & Approval
          </h2>
          <p className={styles.sectionSubtitle}>
            Review user-submitted feature requests, approve ideas for public display, and update roadmap status.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={styles.filterRow} style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div className={styles.searchInputWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search feature ideas or usernames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`${styles.filterPill} ${statusFilter === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({features.length})
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'pending' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('pending')}
            style={pendingCount > 0 ? { borderColor: 'rgba(245, 158, 11, 0.6)', color: '#fbbf24' } : {}}
          >
            Pending Approval ({pendingCount})
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.filterPill} ${statusFilter === opt.value ? styles.filterPillActive : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredFeatures.length === 0 ? (
        <div className={styles.emptyState}>
          <Lightbulb size={40} className={styles.emptyIcon} />
          <h4>No feature requests found</h4>
          <p>No feature requests match your current search criteria.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Status / Approval</th>
                <th>Feature Request Details</th>
                <th>Suggested By</th>
                <th>Votes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((f) => (
                <tr key={f._id}>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    {getStatusBadge(f.status, f.isApproved)}
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                      {f.title}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85rem', lineHeight: '1.45', maxWidth: '600px' }}>
                      {f.description}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                      @{f.userId?.username || 'unknown'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                      {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#60a5fa', fontWeight: 700, fontSize: '0.88rem' }}>
                      <ThumbsUp size={14} /> {f.votes?.length || f.votesCount || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      {f.isApproved === false && (
                        <button
                          className={styles.primaryActionBtn}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleApprove(f)}
                          title="Approve for public view"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}

                      <select
                        className={styles.formSelect}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', width: 'auto', background: '#181818' }}
                        value={f.status || 'suggestion'}
                        onChange={(e) => handleStatusChange(f._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(f)}
                        title="Delete feature request"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
