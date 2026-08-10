import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Search, Play, Music, Check } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

const POST_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'ppv', label: 'PPV' }
];

const typeBadge = (postType) => {
  if (postType === 'ppv') return styles.badgeWarning;
  if (postType === 'subscription') return styles.badgeInfo;
  return styles.badgeOutline;
};

export const AdminPosts = () => {
  const { toast, confirm } = useAdminUI();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, period]);

  async function fetchPosts() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search });
      if (filter !== 'all') params.set('filter', filter);
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      const res = await api.get(`/admin/posts?${params.toString()}`);
      if (res.status === 'success') {
        setPosts(res.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePost = async (postId) => {
    const ok = await confirm({
      title: 'Delete post?',
      message: 'This post will be permanently removed. This action cannot be undone.',
      confirmText: 'Delete Post',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/posts/${postId}`);
      if (res.status === 'success') {
        toast.success('Post deleted successfully.');
        fetchPosts();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Render a post's media as a compact thumbnail stack.
  const renderMediaStack = (post) => {
    const items = post.media || [];
    if (items.length === 0) return <span className={styles.cellSub}>—</span>;
    const brokenImg = (e) => { e.currentTarget.style.display = 'none'; };
    return (
      <div className={styles.postMediaStack}>
        {items.slice(0, 2).map((m, i) => {
          if (m.type === 'image') {
            return (
              <img key={i} src={m.url} alt="Post media" className={styles.postMediaThumb} loading="lazy" onError={brokenImg} />
            );
          }
          if (m.type === 'video') {
            return (
              <span key={i} className={styles.postMediaVideo}>
                <img src={m.thumbnailUrl || m.url} alt="Post video" className={styles.postMediaThumb} loading="lazy" onError={brokenImg} />
                <Play size={14} className={styles.postMediaPlayIcon} />
              </span>
            );
          }
          return (
            <span key={i} className={styles.postMediaAudio}>
              <Music size={14} />
            </span>
          );
        })}
        {items.length > 2 && <span className={styles.postMediaMore}>+{items.length - 2}</span>}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Posts</h2>
          <p className={styles.pageSub}>Review published content across the platform.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search posts..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={setPeriod}
            onReset={() => setFilter('all')}
            activeCount={(filter !== 'all' ? 1 : 0) + ((period.preset || period.from || period.to) ? 1 : 0)}
          >
            <div className={styles.filterSheetSection}>
              <span className={styles.filterSheetSectionLabel}>Content type</span>
              <div className={styles.filterSheetOptions}>
                {POST_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`${styles.filterSheetOption} ${filter === f.key ? styles.filterSheetOptionActive : ''}`}
                    onClick={() => setFilter(f.key)}
                  >
                    <span>{f.label}</span>
                    {filter === f.key && (
                      <span className={styles.filterSheetOptionCheck}><Check size={13} /></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </AdminFilterButton>
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={setPeriod} />

      <div className={styles.filterTabs}>
        <span className={styles.filterLabel}>Show:</span>
        {POST_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.key)}
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
                    <th>Content</th>
                    <th>Media</th>
                    <th>Type</th>
                    <th>Likes</th>
                    <th>Posted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post._id}>
                      <td className={styles.cellStrong}>{post.creatorId?.displayName}</td>
                      <td className={styles.cellTruncate}>{post.content}</td>
                      <td>{renderMediaStack(post)}</td>
                      <td>
                        <span className={`${styles.badge} ${typeBadge(post.postType)}`}>
                          {post.postType || 'free'}
                        </span>
                      </td>
                      <td>{post.likes?.length || 0}</td>
                      <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleDeletePost(post._id)}>
                          <Trash2 size={12} />
                          Take Down
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan="7"><div className={styles.emptyState}>No posts found</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {posts.map((post) => (
                <div key={post._id} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{post.creatorId?.displayName}</span>
                    <span className={`${styles.badge} ${typeBadge(post.postType)}`}>
                      {post.postType || 'free'}
                    </span>
                  </div>
                  {(post.media || []).length > 0 && (
                    <div className={styles.mobileRow} style={{ justifyContent: 'flex-start' }}>
                      <span className={styles.mobileLabel}>Media:</span>
                      {renderMediaStack(post)}
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Content:</span>
                    <span className={styles.mobileVal}>{post.content}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Likes:</span>
                    <span className={styles.mobileVal}>{post.likes?.length || 0}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Posted:</span>
                    <span className={styles.mobileVal}>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnBlock}`} onClick={() => handleDeletePost(post._id)} style={{ marginTop: 4 }}>
                    <Trash2 size={14} /> Take Down
                  </button>
                </div>
              ))}
              {posts.length === 0 && <div className={styles.emptyState}>No posts found</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
