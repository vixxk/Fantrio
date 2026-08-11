import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Megaphone, Plus, Pencil, Trash2, X, Check, Search, AlertTriangle, Sparkles, Bell } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import styles from './AdminPage.module.css';

const EMPTY_FORM = {
  title: '',
  content: '',
  category: 'news'
};

const CATEGORIES = [
  { value: 'news', label: 'News', color: '#0070f3' },
  { value: 'update', label: 'Product Update', color: '#10b981' },
  { value: 'maintenance', label: 'Maintenance', color: '#f59e0b' }
];

export const AdminAnnouncements = () => {
  const { toast, confirm } = useAdminUI();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal state: null = closed, 'create' = new, object = editing
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/announcements');
      if (res.status === 'success') {
        setAnnouncements(res.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnnouncements();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalState('create');
  };

  const openEdit = (announcement) => {
    setForm({
      title: announcement.title || '',
      content: announcement.content || '',
      category: announcement.category || 'news'
    });
    setModalState(announcement);
  };

  const closeModal = () => {
    if (saving) return;
    setModalState(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      toast.error('Announcement title is required.');
      return;
    }
    if (!content) {
      toast.error('Announcement content is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        content,
        category: form.category
      };

      if (modalState === 'create') {
        const res = await api.post('/admin/announcements', payload);
        if (res.status === 'success') {
          toast.success('Announcement published successfully.');
          fetchAnnouncements();
          closeModal();
        }
      } else if (modalState && modalState._id) {
        const res = await api.put(`/admin/announcements/${modalState._id}`, payload);
        if (res.status === 'success') {
          toast.success('Announcement updated successfully.');
          fetchAnnouncements();
          closeModal();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (announcement) => {
    const ok = await confirm({
      title: 'Delete Announcement?',
      message: `Are you sure you want to delete "${announcement.title}"? This cannot be undone.`,
      confirmText: 'Delete Announcement',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/admin/announcements/${announcement._id}`);
      if (res.status === 'success') {
        toast.success('Announcement deleted.');
        setAnnouncements((prev) => prev.filter((a) => a._id !== announcement._id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete announcement.');
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat) => {
    if (cat === 'update') return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Sparkles size={12} /> Product Update</span>;
    if (cat === 'maintenance') return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={12} /> Maintenance</span>;
    return <span style={{ background: 'rgba(0, 112, 243, 0.15)', color: '#60a5fa', border: '1px solid rgba(0, 112, 243, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Bell size={12} /> News</span>;
  };

  if (loading && announcements.length === 0) {
    return <SkeletonTable columns={4} rows={4} />;
  }

  return (
    <div className={styles.sectionContainer}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            <Megaphone size={22} className={styles.sectionTitleIcon} />
            Platform Announcements
          </h2>
          <p className={styles.sectionSubtitle}>
            Publish and manage platform announcements, feature updates, and maintenance alerts for all users.
          </p>
        </div>
        <button className={styles.primaryActionBtn} onClick={openCreate}>
          <Plus size={18} /> Publish Announcement
        </button>
      </div>

      {/* Filters Bar */}
      <div className={styles.filterRow} style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div className={styles.searchInputWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`${styles.filterPill} ${categoryFilter === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All ({announcements.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.filterPill} ${categoryFilter === cat.value ? styles.filterPillActive : ''}`}
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* List / Grid */}
      {filteredAnnouncements.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={40} className={styles.emptyIcon} />
          <h4>No announcements found</h4>
          <p>Create a new announcement or change your search filter.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Title & Content</th>
                <th>Published Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((a) => (
                <tr key={a._id}>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    {getCategoryBadge(a.category)}
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                      {a.title}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85rem', lineHeight: '1.45', whiteSpace: 'pre-wrap', maxWidth: '650px' }}>
                      {a.content}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', paddingTop: '1.1rem', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.82rem' }}>
                    {new Date(a.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '1.1rem' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEdit(a)}
                        title="Edit announcement"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(a)}
                        title="Delete announcement"
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

      {/* Modal Dialog */}
      {modalState && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className={styles.modalHeader}>
              <h3>{modalState === 'create' ? 'Publish New Announcement' : 'Edit Announcement'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  className={styles.formSelect}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Announcement Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Scheduled System Maintenance"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Content</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Write the full announcement text here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryActionBtn} disabled={saving}>
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check size={16} /> {modalState === 'create' ? 'Publish Announcement' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
