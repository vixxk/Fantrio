import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminPosts = () => {
  const { toast, confirm } = useAdminUI();
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (subTab === 'all') {
      fetchPosts();
    } else {
      fetchReports();
    }
  }, [subTab, search]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/posts?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setPosts(res.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reports?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setReports(res.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        if (subTab === 'all') fetchPosts();
        else fetchReports();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleModerateReport = async (postId, action) => {
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

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Posts & Moderation</h2>
          <p className={styles.pageSub}>Review published content and handle reported violations.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={subTab === 'all' ? 'Search posts...' : 'Search reports...'}
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.pillTabs}>
        <button
          className={`${styles.pillTab} ${subTab === 'all' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('all')}
        >
          All Feeds
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'reports' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('reports')}
        >
          <AlertTriangle size={14} />
          Reports Log
        </button>
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Syncing feeds…</span>
          </div>
        ) : (
          <>
            {subTab === 'all' ? (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Content Description</th>
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
                        <td colSpan="5"><div className={styles.emptyState}>No posts found</div></td>
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
                    </div>
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
            ) : (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Reported Content</th>
                      <th>Count</th>
                      <th>Violations Log</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((post) => (
                      <tr key={post._id}>
                        <td className={styles.cellStrong}>{post.creatorId?.displayName}</td>
                        <td className={styles.cellWrap}>{post.content}</td>
                        <td>{post.reports?.length || 0}</td>
                        <td>
                          {post.reports?.map((r, i) => (
                            <div key={i} className={styles.muted} style={{ fontSize: 11.5 }}>
                              - {r.reason} {r.description ? `(${r.description})` : ''}
                            </div>
                          ))}
                        </td>
                        <td>
                          <div className={styles.actionBtns}>
                            <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`} onClick={() => handleModerateReport(post._id, 'dismiss')}>
                              Dismiss
                            </button>
                            <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleModerateReport(post._id, 'delete')}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan="5"><div className={styles.emptyState}>No content violations reported</div></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className={styles.mobileCardList}>
                {reports.map((post) => (
                  <div key={post._id} className={styles.mobileCard}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileCardTitle}>{post.creatorId?.displayName}</span>
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>{post.reports?.length || 0} reports</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Content:</span>
                      <span className={styles.mobileVal}>{post.content}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Violations:</span>
                      <span className={styles.mobileVal}>{post.reports?.length || 0}</span>
                    </div>
                    {post.reports?.map((r, i) => (
                      <div key={i} className={styles.muted} style={{ fontSize: 11.5 }}>
                        - {r.reason} {r.description ? `(${r.description})` : ''}
                      </div>
                    ))}
                    <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                      <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleModerateReport(post._id, 'dismiss')} style={{ flex: 1 }}>
                        Dismiss
                      </button>
                      <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={() => handleModerateReport(post._id, 'delete')} style={{ flex: 1 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && <div className={styles.emptyState}>No content violations reported</div>}
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
