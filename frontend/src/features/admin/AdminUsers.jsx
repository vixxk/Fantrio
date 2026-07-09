import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Edit, ShieldAlert, Trash2, X, Check, Coins } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminUsers = () => {
  const { toast, confirm } = useAdminUI();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editedForm, setEditedForm] = useState({ displayName: '', email: '', username: '', role: '' });
  const [coinAdjustment, setCoinAdjustment] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users?search=${search}`);
      if (res.status === 'success') {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspension = async (userId) => {
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-suspension`);
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
      title: 'Delete user?',
      message: 'This will permanently remove the user and all their transactions, subscriptions, posts, and chats. This cannot be undone.',
      confirmText: 'Delete User',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.status === 'success') {
        toast.success('User successfully deleted.');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message);
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
      // Save details
      await api.put(`/admin/users/${editUser._id}`, editedForm);

      // Adjust coin balance if amount is set
      if (coinAdjustment !== 0) {
        await api.post(`/admin/users/${editUser._id}/adjust-balance`, { amountCoins: coinAdjustment });
      }

      toast.success('User settings updated successfully.');
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
          <h2 className={styles.pageTitle}>User Accounts</h2>
          <p className={styles.pageSub}>Manage registered users, roles, and coin balances.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search user profile..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Retrieving profiles…</span>
          </div>
        ) : (
          <>
            {/* Redesigned Desktop Table */}
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className={styles.cellStrong}>{user.displayName}</td>
                      <td>{user.email}</td>
                      <td>@{user.username}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          user.role === 'admin' ? styles.badgeSuccess :
                          user.role === 'creator' ? styles.badgeInfo : styles.badgeWarning
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${user.isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => openEditModal(user)}>
                            <Edit size={14} />
                            Edit / Coins
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => handleToggleSuspension(user._id)}>
                            <ShieldAlert size={14} />
                            {user.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteUser(user._id)} aria-label="Delete user">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className={styles.emptyState}>No users match the search terms</div>
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
                    <span className={styles.mobileLabel}>Email:</span>
                    <span className={styles.mobileVal}>{user.email}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Username:</span>
                    <span className={styles.mobileVal}>@{user.username}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Status:</span>
                    <span className={`${styles.badge} ${user.isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => openEditModal(user)} style={{ flex: 1 }}>
                      Edit / Coins
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleToggleSuspension(user._id)} style={{ flex: 1 }}>
                      Toggle Limit
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteUser(user._id)} aria-label="Delete user">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal Dialog */}
      {editUser && (
        <div className={styles.customModalOverlay}>
          <div className={styles.customModalBody}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit User Profile</h3>
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
                <label className={styles.inputLabel}>Account Role</label>
                <select
                  className={styles.inputField}
                  value={editedForm.role}
                  onChange={(e) => setEditedForm({ ...editedForm, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Administrator</option>
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
                  Positive numbers add coins to the wallet. Negative numbers subtract them.
                </span>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={handleSaveUser}>
                <Check size={16} />
                Save User
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
