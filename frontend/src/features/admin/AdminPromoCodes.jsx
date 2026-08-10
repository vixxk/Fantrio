import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BadgePercent, Plus, Pencil, Trash2, X, Check, Power } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import styles from './AdminPage.module.css';

const EMPTY_FORM = {
  code: '',
  bonusCoins: '',
  description: '',
  maxRedemptions: '',
  expiresAt: '',
  isActive: true
};

// Convert a Date/ISO string into a value for <input type="datetime-local">.
const toDateTimeLocal = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

export const AdminPromoCodes = () => {
  const { toast, confirm } = useAdminUI();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal state — null = closed, 'create' = new code, object = editing
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // NOTE: intentionally a plain function (not useCallback) — AdminUI's `toast`
  // is recreated on every provider render, so memoizing on it would re-run this
  // effect in a loop. The fetch only needs to run once on mount.
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/promo-codes');
      if (res.status === 'success') {
        setPromoCodes(res.promoCodes || []);
      }
    } catch (err) {
      console.error('Failed to load promo codes:', err);
      toast.error('Failed to load promo codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPromoCodes();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalState('create');
  };

  const openEdit = (promo) => {
    setForm({
      code: promo.code,
      bonusCoins: String(promo.bonusCoins || ''),
      description: promo.description || '',
      maxRedemptions: promo.maxRedemptions != null ? String(promo.maxRedemptions) : '',
      expiresAt: toDateTimeLocal(promo.expiresAt),
      isActive: promo.isActive !== false
    });
    setModalState(promo);
  };

  const closeModal = () => {
    if (saving) return;
    setModalState(null);
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    const bonusCoins = Math.floor(Number(form.bonusCoins));
    if (!code) {
      toast.error('Promo code is required.');
      return;
    }
    if (form.bonusCoins === '' || Number.isNaN(bonusCoins) || bonusCoins <= 0) {
      toast.error('Bonus coins must be a positive number.');
      return;
    }
    let maxRedemptions = null;
    if (form.maxRedemptions !== '') {
      const parsed = Math.floor(Number(form.maxRedemptions));
      if (Number.isNaN(parsed) || parsed < 1) {
        toast.error('Max redemptions must be a positive number (or blank for unlimited).');
        return;
      }
      maxRedemptions = parsed;
    }
    const payload = {
      code,
      bonusCoins,
      description: form.description.trim(),
      maxRedemptions,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive
    };

    setSaving(true);
    try {
      if (modalState === 'create') {
        const res = await api.post('/admin/promo-codes', payload);
        if (res.status === 'success') {
          toast.success(`Promo code ${code} created.`);
        }
      } else {
        const res = await api.put(`/admin/promo-codes/${modalState._id}`, payload);
        if (res.status === 'success') {
          toast.success(`Promo code ${code} updated.`);
        }
      }
      setModalState(null);
      fetchPromoCodes();
    } catch (err) {
      toast.error(err.message || 'Failed to save promo code.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo) => {
    const nextActive = promo.isActive !== false ? false : true;
    try {
      const res = await api.put(`/admin/promo-codes/${promo._id}`, { isActive: nextActive });
      if (res.status === 'success') {
        toast.success(`${promo.code} ${nextActive ? 'activated' : 'deactivated'}.`);
        fetchPromoCodes();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update promo code.');
    }
  };

  const handleDelete = async (promo) => {
    const ok = await confirm({
      title: 'Delete promo code?',
      message: `"${promo.code}" will be removed. Fans can no longer redeem it, and its redemption history will be lost.`,
      confirmText: 'Delete',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/promo-codes/${promo._id}`);
      if (res.status === 'success') {
        toast.success('Promo code deleted.');
        fetchPromoCodes();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete promo code.');
    }
  };

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return 'Never';
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Short readable list of the fans who redeemed a code ("A, B +2 more"),
  // with the full list on hover via the title attribute.
  const formatRedeemers = (promo) => {
    const names = (promo.redeemedBy || []).map((u) => (u && (u.displayName || u.username)) || 'Fan');
    if (names.length === 0) return null;
    return {
      summary: `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2} more` : ''}`,
      full: names.join(', ')
    };
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Promo Codes</h2>
          <p className={styles.pageSub}>Create and manage promo codes fans can redeem for bonus coins.</p>
        </div>
        <div className={styles.searchRow}>
          <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={openCreate}>
            <Plus size={16} />
            New Promo Code
          </button>
        </div>
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
                    <th>Code</th>
                    <th>Bonus</th>
                    <th>Description</th>
                    <th>Redemptions</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => {
                    const redeemers = formatRedeemers(promo);
                    return (
                    <tr key={promo._id}>
                      <td className={styles.cellStrong}>{promo.code}</td>
                      <td className={styles.posAmount}>+{promo.bonusCoins} coins</td>
                      <td className={styles.cellSub}>{promo.description || '—'}</td>
                      <td>
                        <div>
                          {promo.redemptionCount || 0}
                          {promo.maxRedemptions != null ? ` / ${promo.maxRedemptions}` : ''}
                        </div>
                        {redeemers && (
                          <div className={styles.cellSub} title={redeemers.full}>
                            {redeemers.summary}
                          </div>
                        )}
                      </td>
                      <td className={styles.cellSub}>{formatExpiry(promo.expiresAt)}</td>
                      <td>
                        <span className={`${styles.badge} ${promo.isActive !== false ? styles.badgeSuccess : styles.badgeDanger}`}>
                          {promo.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => openEdit(promo)}>
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => handleToggle(promo)}>
                            <Power size={14} />
                            {promo.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDelete(promo)} aria-label={`Delete ${promo.code}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {promoCodes.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className={styles.emptyState}>
                          <BadgePercent size={32} style={{ opacity: 0.4, marginBottom: 6 }} />
                          No promo codes yet — create one to let fans redeem bonus coins.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {promoCodes.map((promo) => {
                const redeemers = formatRedeemers(promo);
                return (
                <div key={promo._id} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{promo.code}</span>
                    <span className={`${styles.badge} ${promo.isActive !== false ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {promo.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Bonus:</span>
                    <span className={`${styles.mobileVal} ${styles.posAmount}`}>+{promo.bonusCoins} coins</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Redemptions:</span>
                    <span className={styles.mobileVal}>
                      {promo.redemptionCount || 0}
                      {promo.maxRedemptions != null ? ` / ${promo.maxRedemptions}` : ''}
                    </span>
                  </div>
                  {redeemers && (
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Redeemed by:</span>
                      <span className={styles.mobileVal} title={redeemers.full}>
                        {redeemers.summary}
                      </span>
                    </div>
                  )}
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Expires:</span>
                    <span className={styles.mobileVal}>{formatExpiry(promo.expiresAt)}</span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => openEdit(promo)} style={{ flex: 1 }}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleToggle(promo)} style={{ flex: 1 }}>
                      <Power size={14} /> {promo.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDelete(promo)} aria-label={`Delete ${promo.code}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                );
              })}
              {promoCodes.length === 0 && (
                <div className={styles.emptyState}>
                  <BadgePercent size={32} style={{ opacity: 0.4, marginBottom: 6 }} />
                  No promo codes yet — create one to let fans redeem bonus coins.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Promo Code Modal */}
      {modalState && (
        <div className={styles.customModalOverlay} onClick={closeModal}>
          <div className={styles.customModalBody} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalState === 'create' ? 'Create Promo Code' : `Edit ${form.code || 'Promo Code'}`}
              </h3>
              <button className={styles.modalCloseBtn} onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Promo Code</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. WELCOME20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={modalState !== 'create'}
                />
                {modalState !== 'create' && (
                  <span className={styles.fieldHint}>The code itself cannot be changed after creation.</span>
                )}
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Bonus Coins</label>
                <input
                  type="number"
                  min="1"
                  className={styles.inputField}
                  placeholder="e.g. 200"
                  value={form.bonusCoins}
                  onChange={(e) => setForm({ ...form, bonusCoins: e.target.value })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Description</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Optional short description shown to fans"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Max Redemptions</label>
                <input
                  type="number"
                  min="1"
                  className={styles.inputField}
                  placeholder="Unlimited (leave blank)"
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                />
                <span className={styles.fieldHint}>Total times this code can be redeemed across all fans.</span>
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Expires At</label>
                <input
                  type="datetime-local"
                  className={styles.inputField}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
                <span className={styles.fieldHint}>Leave blank for no expiry date.</span>
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Status</label>
                <select
                  className={styles.inputField}
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Active — fans can redeem</option>
                  <option value="inactive">Inactive — hidden & blocked</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={handleSave} disabled={saving}>
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Check size={16} />
                    {modalState === 'create' ? 'Create Code' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
