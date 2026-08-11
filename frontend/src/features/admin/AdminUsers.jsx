import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Edit, ShieldAlert, Trash2, X, Check, Coins, Eye, AlertTriangle } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { AdminUserDrawer } from './AdminUserDrawer';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatBalance = (n) => (n || 0).toLocaleString();

const DEFAULT_AVATAR = '/profile.png';

export const AdminUsers = () => {
  const { toast, confirm } = useAdminUI();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [editedForm, setEditedForm] = useState({ displayName: '', email: '', username: '', role: '' });
  const [coinAdjustment, setCoinAdjustment] = useState(0);

  // User detail drawer
  const [detailUser, setDetailUser] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Close drawer on Escape + lock body scroll while open
  useEffect(() => {
    if (!detailUser) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [detailUser]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, period]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: '10',
        role: 'user'
      });
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.status === 'success') {
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setTotalPages(Math.max(1, Math.ceil((res.total || 0) / (res.limit || 10))));
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

  const handleToggleSuspension = async (user) => {
    const ok = await confirm({
      title: user.isSuspended ? 'Activate fan?' : 'Suspend fan?',
      message: user.isSuspended
        ? `Restore full access for @${user.username}? Their account will be active again.`
        : `@${user.username} will lose access to the platform immediately. They can be activated again at any time.`,
      confirmText: user.isSuspended ? 'Activate Fan' : 'Suspend Fan',
      danger: !user.isSuspended
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/users/${user._id}/toggle-suspension`);
      if (res.status === 'success') {
        toast.success(res.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    const ok = await confirm({
      title: 'Delete fan?',
      message: 'This will permanently remove the fan and all their transactions, subscriptions, posts, and chats. This cannot be undone.',
      confirmText: 'Delete Fan',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.status === 'success') {
        toast.success('Fan successfully deleted.');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openDetail = async (user) => {
    setDetailUser(user);
    setActivity(null);
    setActivityLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/activity`);
      if (res.status === 'success') {
        setActivity(res.activity || null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load fan activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailUser(null);
    setActivity(null);
  };

  const handleUnblock = async (blockedId) => {
    if (!detailUser) return;
    try {
      const res = await api.delete(`/admin/users/${detailUser._id}/blocked/${blockedId}`);
      if (res.status === 'success') {
        toast.success('Block removed.');
        // Keep the table row's blocked count in sync with the drawer
        setUsers((prev) =>
          prev.map((u) =>
            u._id === detailUser._id
              ? { ...u, blockedCount: Math.max(0, (u.blockedCount || 1) - 1) }
              : u
          )
        );
        setDetailUser((prev) => (prev ? { ...prev, blockedCount: Math.max(0, (prev.blockedCount || 1) - 1) } : prev));
        const refresh = await api.get(`/admin/users/${detailUser._id}/activity`);
        if (refresh.status === 'success') setActivity(refresh.activity || null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove block');
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setCoinAdjustment(0);
    setEditedForm({
      displayName: user.displayName,
      email: user.email,
      username: user.username,
      role: user.role
    });
  };

  const handleSaveUser = async () => {
    try {
      // Guard: never deduct more coins than the user currently holds
      if (coinAdjustment !== 0 && coinAdjustment < 0) {
        const current = editUser?.walletBalanceCoins || 0;
        if (Math.abs(coinAdjustment) > current) {
          toast.error(`Cannot deduct ${Math.abs(coinAdjustment).toLocaleString()} coins — ${current.toLocaleString()} available.`);
          return;
        }
      }

      // Save details
      await api.put(`/admin/users/${editUser._id}`, editedForm);

      // Adjust coin balance if amount is set
      if (coinAdjustment !== 0) {
        await api.post(`/admin/users/${editUser._id}/adjust-balance`, { amountCoins: coinAdjustment });
      }

      toast.success('Fan settings updated successfully.');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Fan Accounts</h2>
          <p className={styles.pageSub}>Manage registered fans, roles, and coin balances.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search fan profile..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={(p) => { setPeriod(p); setPage(1); }}
            activeCount={(period.preset || period.from || period.to) ? 1 : 0}
          />
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={(p) => { setPeriod(p); setPage(1); }} />

      <div className={styles.glassPanel}>
        {loading ? (
          <SkeletonTable columns={8} rows={5} />
        ) : (
          <>
            {/* Redesigned Desktop Table */}
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Fan</th>
                    <th>Email</th>
                    <th>Referral Code</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className={styles.userCell}>
                          <img
                            src={user.avatarUrl || DEFAULT_AVATAR}
                            alt={user.displayName}
                            className={styles.userAvatar}
                            loading="lazy"
                          />
                          <div className={styles.userCellText}>
                            <span className={styles.cellStrong}>{user.displayName}</span>
                            <span className={styles.cellSub}>@{user.username} · {user.blockedCount || 0} blocked</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={styles.cellStrong} style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                          {user.referralCode || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          user.role === 'admin' ? styles.badgeSuccess :
                          user.role === 'creator' ? styles.badgeInfo : styles.badgeWarning
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={styles.walletCell}>
                          <Coins size={13} style={{ color: 'var(--warning)' }} />
                          {formatBalance(user.walletBalanceCoins)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${user.isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className={styles.cellSub}>{formatDate(user.createdAt)}</td>
                      <td>
                        <span className={`${styles.badge} ${user.isVerified ? styles.badgeSuccess : styles.badgeOutline}`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => openDetail(user)}>
                            <Eye size={14} />
                            View
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => openEditModal(user)}>
                            <Edit size={14} />
                            Edit / Coins
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => handleToggleSuspension(user)}>
                            <ShieldAlert size={14} />
                            {user.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteUser(user._id)} aria-label="Delete fan">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="8">
                        <div className={styles.emptyState}>
                          {search
                            ? 'No fans match the current search'
                            : 'No fans registered yet'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {users.map((user) => (
                <div key={user._id} className={styles.mobileCard}>
                  <div className={styles.mobileUserHead}>
                    <img
                      src={user.avatarUrl || DEFAULT_AVATAR}
                      alt={user.displayName}
                      className={styles.mobileAvatar}
                      loading="lazy"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileCardTitle}>{user.displayName}</span>
                        <span className={`${styles.badge} ${
                          user.role === 'admin' ? styles.badgeSuccess :
                          user.role === 'creator' ? styles.badgeInfo : styles.badgeWarning
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>@{user.username}</span>
                        <span className={`${styles.badge} ${user.isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Email:</span>
                    <span className={styles.mobileVal}>{user.email}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Referral Code:</span>
                    <span className={styles.mobileVal} style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {user.referralCode || '—'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Wallet:</span>
                    <span className={styles.mobileVal}>
                      <Coins size={13} style={{ color: 'var(--warning)', verticalAlign: 'middle', marginRight: 3 }} />
                      {formatBalance(user.walletBalanceCoins)} coins
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Joined:</span>
                    <span className={styles.mobileVal}>{formatDate(user.createdAt)}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Verified:</span>
                    <span className={`${styles.badge} ${user.isVerified ? styles.badgeSuccess : styles.badgeOutline}`}>
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Blocked:</span>
                    <span className={styles.mobileVal}>{user.blockedCount || 0} blocked</span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => openDetail(user)} style={{ flex: 1 }}>
                      <Eye size={14} /> View
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => openEditModal(user)} style={{ flex: 1 }}>
                      Edit / Coins
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleToggleSuspension(user)} style={{ flex: 1 }}>
                      Toggle Limit
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteUser(user._id)} aria-label="Delete fan">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className={styles.emptyState}>
                  {search
                    ? 'No fans match the current search'
                    : 'No fans registered yet'}
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
            {total} fan{total === 1 ? '' : 's'} · Page {page} of {totalPages}
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

      {/* Edit User Modal Dialog */}
      {editUser && (
        <div className={styles.customModalOverlay}>
          <div className={styles.customModalBody}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Fan Profile</h3>
              <button className={styles.modalCloseBtn} onClick={() => setEditUser(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Display Name</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editedForm.displayName}
                  onChange={(e) => setEditedForm({ ...editedForm, displayName: e.target.value })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Email Address</label>
                <input
                  type="email"
                  className={styles.inputField}
                  value={editedForm.email}
                  onChange={(e) => setEditedForm({ ...editedForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Username</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editedForm.username}
                  onChange={(e) => setEditedForm({ ...editedForm, username: e.target.value })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Referral Code</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editUser?.referralCode || '—'}
                  disabled
                  style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.8 }}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Account Role</label>
                <select
                  className={styles.inputField}
                  value={editedForm.role}
                  onChange={(e) => setEditedForm({ ...editedForm, role: e.target.value })}
                >
                  <option value="user">Fan</option>
                  <option value="creator">Creator</option>
                </select>
              </div>

              <div className={styles.formControlItem} style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Coins size={14} style={{ color: 'var(--warning)' }} />
                  Adjust Coins Balance
                </label>
                <input
                  type="number"
                  className={styles.inputField}
                  placeholder="E.g. 500 to add, -200 to deduct"
                  value={coinAdjustment || ''}
                  onChange={(e) => setCoinAdjustment(parseInt(e.target.value) || 0)}
                />
                <span className={styles.fieldHint}>
                  Positive numbers add coins to the wallet. Negative numbers subtract them. Balance cannot go below 0.
                </span>
                {(coinAdjustment < 0 && Math.abs(coinAdjustment) > (editUser?.walletBalanceCoins || 0)) ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, color: 'var(--danger)', fontWeight: 700 }}>
                    <AlertTriangle size={13} />
                    Not enough coins — current balance {(editUser?.walletBalanceCoins || 0).toLocaleString()}, deduction would leave it negative.
                  </span>
                ) : (
                  <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: 'var(--text)' }}>
                    Current: <strong>{(editUser?.walletBalanceCoins || 0).toLocaleString()}</strong> coins · New:{' '}
                    <strong>{Math.max(0, (editUser?.walletBalanceCoins || 0) + coinAdjustment).toLocaleString()}</strong> coins
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={handleSaveUser}>
                <Check size={16} />
                Save Fan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* User Activity Detail Drawer */}
      <AdminUserDrawer
        user={detailUser}
        activity={activity}
        loading={activityLoading}
        onClose={closeDetail}
        onUnblock={handleUnblock}
      />

    </div>
  );
};
