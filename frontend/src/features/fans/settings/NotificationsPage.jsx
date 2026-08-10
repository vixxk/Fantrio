import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { MessageSquare, CreditCard, Bell, Check, X } from 'lucide-react';
import styles from './SettingsPage.module.css';

export const NotificationsPage = ({ setStatus }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      if (res.status === 'success') setPreferences(res.preferences);
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load notification preferences.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadPrefs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificationGroups = [
    {
      category: 'Chat & Activity',
      icon: MessageSquare,
      items: [
        { key: 'newMessages', title: 'New Direct Messages', desc: 'Get instant alerts when someone sends you a message.' },
        { key: 'newSubscribers', title: 'New Fan Subscribers', desc: 'Get notified whenever a fan subscribes to your profile.' },
      ]
    },
    {
      category: 'Transactions & Tips',
      icon: CreditCard,
      items: [
        { key: 'tipsAndPayments', title: 'Tips & Coin Gifts', desc: 'Receive real-time notifications for tips, coin transfers, and gifts.' },
        { key: 'productPurchases', title: 'Store Purchases', desc: 'Get notified when someone purchases your exclusive digital products.' },
      ]
    },
    {
      category: 'Live & System Updates',
      icon: Bell,
      items: [
        { key: 'liveStreamReminders', title: 'Live Stream Reminders', desc: 'Alerts when a creator you follow starts a live broadcast or call.' },
        { key: 'announcements', title: 'Platform Announcements', desc: 'Important product updates, features, and platform alerts.' },
      ]
    }
  ];

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(true);
    try {
      const res = await api.patch('/settings/notifications', { [key]: next[key] });
      if (res.status === 'success') setPreferences(res.preferences);
    } catch (err) {
      setPreferences(preferences);
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to update notification preference.' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkToggle = async (enableAll) => {
    if (!preferences) return;
    const updated = {};
    Object.keys(preferences).forEach(k => {
      if (typeof preferences[k] === 'boolean') updated[k] = enableAll;
    });
    setPreferences(updated);
    setSaving(true);
    try {
      const res = await api.patch('/settings/notifications', updated);
      if (res.status === 'success') {
        setPreferences(res.preferences);
        if (setStatus) setStatus({ type: 'success', text: enableAll ? 'All notifications enabled.' : 'All notifications muted.' });
      }
    } catch (err) {
      loadPrefs();
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.notifHeaderBanner}>
        <div className={styles.notifIntroText}>
          <div className={styles.notifHeaderIconBox}>
            <Bell size={22} />
          </div>
          <div>
            <h3>Notification Preferences</h3>
            <p>Customize how and when Fantrio alerts you. All settings sync in real time.</p>
          </div>
        </div>
        <div className={styles.bulkActionsRow}>
          <button type="button" className={styles.bulkPillBtn} onClick={() => handleBulkToggle(true)} disabled={saving}>
            <Check size={14} /> Enable All
          </button>
          <button type="button" className={styles.bulkPillBtnSecondary} onClick={() => handleBulkToggle(false)} disabled={saving}>
            <X size={14} /> Disable All
          </button>
        </div>
      </div>

      <div className={styles.notifGroupsContainer}>
        {notificationGroups.map((group, idx) => {
          const GroupIcon = group.icon;
          return (
            <div key={idx} className={styles.notifGroupCard}>
              <div className={styles.notifGroupTitleRow}>
                <GroupIcon size={18} className={styles.groupIcon} />
                <h4>{group.category}</h4>
              </div>
              <div className={styles.notifList}>
                {group.items.map((item) => (
                  <div key={item.key} className={styles.notifRow}>
                    <div className={styles.notifTextCol}>
                      <h5 className={styles.notifTitle}>{item.title}</h5>
                      <p className={styles.notifDesc}>{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!preferences?.[item.key]}
                      className={`${styles.toggle} ${preferences?.[item.key] ? styles.toggleOn : ''}`}
                      onClick={() => togglePreference(item.key)}
                      disabled={saving}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SkeletonRows = () => (
  <div className={styles.subPageBody}>
    <div className="skeleton-card" style={{ height: '60px', padding: '1rem', marginBottom: '1.5rem' }}>
      <div className="skeleton-box skeleton-title" style={{ width: '200px', height: '100%' }} />
    </div>
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="skeleton-card" style={{ padding: '1.2rem', marginBottom: '1rem', gap: '0.8rem' }}>
        <div className="skeleton-box skeleton-title" style={{ width: '150px' }} />
        <div className="skeleton-box skeleton-content-line" />
        <div className="skeleton-box skeleton-content-line short" />
      </div>
    ))}
  </div>
);
