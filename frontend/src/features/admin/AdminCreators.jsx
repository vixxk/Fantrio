import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Save, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import { SkeletonTable } from './AdminSkeletons';
import { AdminPeriodFilter } from './AdminPeriodFilter';
import { AdminFilterButton } from './AdminFilterButton';
import styles from './AdminPage.module.css';

export const AdminCreators = () => {
  const { toast } = useAdminUI();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState({ preset: null, from: '', to: '' });
  const [editProfile, setEditProfile] = useState(null);
  // IMPORTANT: these keys MUST match the CreatorProfile schema (`rates.audioCallPerMin` /
  // `rates.videoCallPerMin`) — the listener-facing call pages, profile and live-stream cards
  // all read those exact fields. Legacy keys (voiceCallMinute/videoCallMinute) were written to
  // nowhere and admin rate edits never reached listeners.
  const [editedRates, setEditedRates] = useState({ audioCallPerMin: 0, videoCallPerMin: 0 });

  useEffect(() => {
    fetchCreators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, period]);

  async function fetchCreators() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search });
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
      const res = await api.get(`/admin/creators?${params.toString()}`);
      if (res.status === 'success') {
        setCreators(res.profiles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (creatorId) => {
    try {
      const res = await api.post(`/admin/creators/${creatorId}/approve`);
      if (res.status === 'success') {
        toast.success('Creator application approved.');
        fetchCreators();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (creatorId) => {
    try {
      const res = await api.post(`/admin/creators/${creatorId}/reject`);
      if (res.status === 'success') {
        toast.success('Creator application rejected.');
        fetchCreators();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleVerification = async (creatorId) => {
    try {
      const res = await api.post(`/admin/creators/${creatorId}/verify`);
      if (res.status === 'success') {
        toast.success(res.message);
        fetchCreators();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openRatesModal = (profile) => {
    setEditProfile(profile);
    setEditedRates({
      audioCallPerMin: profile.rates?.audioCallPerMin || 0,
      videoCallPerMin: profile.rates?.videoCallPerMin || 0
    });
  };

  const handleSaveRates = async () => {
    try {
      const res = await api.put(`/admin/creators/${editProfile.userId._id}`, {
        rates: editedRates
      });
      if (res.status === 'success') {
        toast.success('Creator rates updated successfully.');
        setEditProfile(null);
        fetchCreators();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Creators & Verification</h2>
          <p className={styles.pageSub}>Review applications, badges, and call tariffs.</p>
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search creators..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AdminFilterButton
            period={period}
            onPeriodChange={setPeriod}
            activeCount={(period.preset || period.from || period.to) ? 1 : 0}
          />
        </div>
      </div>

      <AdminPeriodFilter value={period} onChange={setPeriod} />

      <div className={styles.glassPanel}>
        {loading ? (
          <SkeletonTable columns={10} rows={5} />
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Email</th>
                    <th>Subscribers</th>
                    <th>Followers</th>
                    <th>Rating</th>
                    <th>Joined</th>
                    <th>Verification</th>
                    <th>Badge</th>
                    <th>Rates / Min</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((profile) => (
                    <tr key={profile._id}>
                      <td>
                        <div className={styles.userCell}>
                          <img
                            src={profile.userId?.avatarUrl || '/profile.png'}
                            alt={profile.userId?.displayName || 'Creator'}
                            className={styles.userAvatar}
                            loading="lazy"
                          />
                          <div className={styles.userCellText}>
                            <span className={styles.cellStrong}>{profile.userId?.displayName || 'Unknown'}</span>
                            {profile.userId?.username && <span className={styles.cellSub}>@{profile.userId.username}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{profile.userId?.email}</td>
                      <td>{profile.subscriberCount || 0}</td>
                      <td>{profile.followerCount || 0}</td>
                      <td>{profile.rating ? `${profile.rating} ★` : '—'}</td>
                      <td className={styles.cellSub}>
                        {profile.userId?.createdAt
                          ? new Date(profile.userId.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          profile.verificationStatus === 'approved' ? styles.badgeSuccess :
                          profile.verificationStatus === 'pending' ? styles.badgeWarning : styles.badgeDanger
                        }`}>
                          {profile.verificationStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${profile.isVerifiedBadge ? styles.badgeSuccess : styles.badgeOutline}`}>
                          {profile.isVerifiedBadge ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        Audio: {profile.rates?.audioCallPerMin || 0}c / Video: {profile.rates?.videoCallPerMin || 0}c
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {profile.verificationStatus === 'pending' && (
                            <>
                              <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`} onClick={() => handleApprove(profile.userId._id)}>
                                Approve
                              </button>
                              <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleReject(profile.userId._id)}>
                                Reject
                              </button>
                            </>
                          )}
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => handleToggleVerification(profile.userId._id)}>
                            Badge
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => openRatesModal(profile)}>
                            Rates
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {creators.length === 0 && (
                    <tr>
                      <td colSpan="10">
                        <div className={styles.emptyState}>No creators registered</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {creators.map((profile) => (
                <div key={profile._id} className={styles.mobileCard}>
                  <div className={styles.mobileUserHead}>
                    <img
                      src={profile.userId?.avatarUrl || '/profile.png'}
                      alt={profile.userId?.displayName || 'Creator'}
                      className={styles.mobileAvatar}
                      loading="lazy"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileCardTitle}>{profile.userId?.displayName}</span>
                        <span className={`${styles.badge} ${
                          profile.verificationStatus === 'approved' ? styles.badgeSuccess :
                          profile.verificationStatus === 'pending' ? styles.badgeWarning : styles.badgeDanger
                        }`}>
                          {profile.verificationStatus}
                        </span>
                      </div>
                      <div className={styles.mobileRow}>
                        <span className={styles.mobileLabel}>Username:</span>
                        <span className={styles.mobileVal}>@{profile.userId?.username}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Email:</span>
                    <span className={styles.mobileVal}>{profile.userId?.email}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Subscribers:</span>
                    <span className={styles.mobileVal}>{profile.subscriberCount || 0}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Followers:</span>
                    <span className={styles.mobileVal}>{profile.followerCount || 0}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Rating:</span>
                    <span className={styles.mobileVal}>{profile.rating ? `${profile.rating} ★` : '—'}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Joined:</span>
                    <span className={styles.mobileVal}>
                      {profile.userId?.createdAt
                        ? new Date(profile.userId.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Badge status:</span>
                    <span className={`${styles.badge} ${profile.isVerifiedBadge ? styles.badgeSuccess : styles.badgeOutline}`}>
                      {profile.isVerifiedBadge ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Rates:</span>
                    <span className={styles.mobileVal}>Audio: {profile.rates?.audioCallPerMin}c | Video: {profile.rates?.videoCallPerMin}c</span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    {profile.verificationStatus === 'pending' && (
                      <>
                        <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleApprove(profile.userId._id)} style={{ flex: 1 }}>
                          Approve
                        </button>
                        <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={() => handleReject(profile.userId._id)} style={{ flex: 1 }}>
                          Reject
                        </button>
                      </>
                    )}
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => handleToggleVerification(profile.userId._id)} style={{ flex: 1 }}>
                      Toggle Badge
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => openRatesModal(profile)} style={{ flex: 1 }}>
                      Rates
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Rates Modal */}
      {editProfile && (
        <div className={styles.customModalOverlay}>
          <div className={styles.customModalBody}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Call Tariffs</h3>
              <button className={styles.modalCloseBtn} onClick={() => setEditProfile(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Audio Billing (Coins/Min)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={editedRates.audioCallPerMin}
                  onChange={(e) => setEditedRates({ ...editedRates, audioCallPerMin: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Video Billing (Coins/Min)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={editedRates.videoCallPerMin}
                  onChange={(e) => setEditedRates({ ...editedRates, videoCallPerMin: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => setEditProfile(null)}>
                Cancel
              </button>
              <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={handleSaveRates}>
                <Save size={16} />
                Save Rates
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
