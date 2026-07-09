import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Check, X, ShieldCheck, Edit, Save, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminCreators = () => {
  const { toast } = useAdminUI();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editProfile, setEditProfile] = useState(null);
  const [editedRates, setEditedRates] = useState({ voiceCallMinute: 0, videoCallMinute: 0 });

  useEffect(() => {
    fetchCreators();
  }, [search]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/creators?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setCreators(res.profiles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      voiceCallMinute: profile.rates?.voiceCallMinute || 0,
      videoCallMinute: profile.rates?.videoCallMinute || 0
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
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Retrieving creator listings…</span>
          </div>
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>Email</th>
                    <th>Subscribers</th>
                    <th>Verification</th>
                    <th>Badge</th>
                    <th>Rates / Min</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((profile) => (
                    <tr key={profile._id}>
                      <td className={styles.cellStrong}>{profile.userId?.displayName} (@{profile.userId?.username})</td>
                      <td>{profile.userId?.email}</td>
                      <td>{profile.subscriberCount || 0}</td>
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
                        Audio: {profile.rates?.voiceCallMinute || 0}c / Video: {profile.rates?.videoCallMinute || 0}c
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
                      <td colSpan="7">
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
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Email:</span>
                    <span className={styles.mobileVal}>{profile.userId?.email}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Subscribers:</span>
                    <span className={styles.mobileVal}>{profile.subscriberCount || 0}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Badge status:</span>
                    <span className={`${styles.badge} ${profile.isVerifiedBadge ? styles.badgeSuccess : styles.badgeOutline}`}>
                      {profile.isVerifiedBadge ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Rates:</span>
                    <span className={styles.mobileVal}>Audio: {profile.rates?.voiceCallMinute}c | Video: {profile.rates?.videoCallMinute}c</span>
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
                <label className={styles.inputLabel}>Voice Billing (Coins/Min)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={editedRates.voiceCallMinute}
                  onChange={(e) => setEditedRates({ ...editedRates, voiceCallMinute: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Video Billing (Coins/Min)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={editedRates.videoCallMinute}
                  onChange={(e) => setEditedRates({ ...editedRates, videoCallMinute: parseInt(e.target.value) || 0 })}
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
