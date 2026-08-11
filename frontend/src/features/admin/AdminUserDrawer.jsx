import { X } from 'lucide-react';
import styles from './AdminPage.module.css';

const DEFAULT_AVATAR = '/profile.png';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Status → CSS badge class mapping
const statusBadge = (status) => {
  const map = {
    active: styles.badgeSuccess,
    completed: styles.badgeSuccess,
    approved: styles.badgeSuccess,
    expired: styles.badgeWarning,
    pending: styles.badgeWarning,
    initiated: styles.badgeInfo,
    missed: styles.badgeWarning,
    refunded: styles.badgeWarning,
    cancelled: styles.badgeDanger,
    rejected: styles.badgeDanger,
    failed: styles.badgeDanger,
    suspended: styles.badgeDanger
  };
  return map[status] || styles.badgeOutline;
};

const DrawerSection = ({ title, count, children }) => (
  <div className={styles.drawerSection}>
    <div className={styles.drawerSectionHead}>
      <h4 className={styles.drawerSectionTitle}>{title}</h4>
      {typeof count === 'number' && (
        <span className={styles.drawerSectionCount}>{count}</span>
      )}
    </div>
    <div className={styles.drawerSectionBody}>
      {children}
    </div>
  </div>
);

const EmptyRow = ({ text }) => <div className={styles.drawerEmpty}>{text}</div>;

/**
 * Slide-in drawer showing a single fan's full listener footprint:
 * subscriptions, transactions, posts, calls and their block list.
 */
export const AdminUserDrawer = ({ user, activity, loading, onClose, onUnblock }) => {
  if (!user) return null;

  const subs = activity?.subscriptions || [];
  const txns = activity?.transactions || [];
  const posts = activity?.posts || [];
  const calls = activity?.calls || [];
  const blocked = activity?.blockedUsers || [];

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside className={styles.detailDrawer} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Fan activity">
        {/* Header */}
        <div className={styles.detailDrawerHead}>
          <div className={styles.drawerUserHead}>
            <img src={user.avatarUrl || DEFAULT_AVATAR} alt={user.displayName} className={styles.drawerUserAvatar} />
            <div className={styles.drawerUserText}>
              <span className={styles.drawerUserName}>{user.displayName}</span>
              <span className={styles.drawerUserSub}>@{user.username} · Ref: {user.referralCode || '—'} · {user.email}</span>
            </div>
          </div>
          <button className={styles.drawerCloseBtn} onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        {/* Badge row */}
        <div className={styles.drawerBadgeRow}>
          <span className={`${styles.badge} ${
            user.role === 'admin' ? styles.badgeSuccess :
            user.role === 'creator' ? styles.badgeInfo : styles.badgeWarning
          }`}>
            {user.role}
          </span>
          <span className={`${styles.badge} ${user.isSuspended ? styles.badgeDanger : styles.badgeSuccess}`}>
            {user.isSuspended ? 'Suspended' : 'Active'}
          </span>
          <span className={`${styles.badge} ${user.isVerified ? styles.badgeSuccess : styles.badgeOutline}`}>
            {user.isVerified ? 'Verified' : 'Unverified'}
          </span>
          <span className={styles.badgeOutline} style={{ background: 'transparent' }}>
            {user.blockedCount || 0} blocked
          </span>
        </div>

        {/* Quick stats */}
        <div className={styles.drawerStatsGrid}>
          <div className={styles.drawerStatBox}>
            <span className={styles.drawerStatLabel}>Wallet</span>
            <span className={styles.drawerStatValue}>{(user.walletBalanceCoins || 0).toLocaleString()} coins</span>
          </div>
          <div className={styles.drawerStatBox}>
            <span className={styles.drawerStatLabel}>Joined</span>
            <span className={styles.drawerStatValue}>{formatDate(user.createdAt)}</span>
          </div>
          <div className={styles.drawerStatBox}>
            <span className={styles.drawerStatLabel}>Subscriptions</span>
            <span className={styles.drawerStatValue}>{subs.length}</span>
          </div>
          <div className={styles.drawerStatBox}>
            <span className={styles.drawerStatLabel}>Transactions</span>
            <span className={styles.drawerStatValue}>{txns.length}</span>
          </div>
        </div>

        {/* Sections */}
        <div className={styles.drawerSections}>
          {loading ? (
            <div className={styles.drawerLoading}>
              <div className={styles.spinner} />
              <span>Loading activity…</span>
            </div>
          ) : (
            <>
              <DrawerSection title="Subscriptions" count={subs.length}>
                {subs.length === 0 ? (
                  <EmptyRow text="No subscriptions" />
                ) : subs.map((s) => (
                  <div key={s._id} className={styles.activityItem}>
                    <div className={styles.activityItemMain}>
                      <span className={styles.activityItemTitle}>{s.creatorId?.displayName || 'Creator'}</span>
                      <span className={styles.activityItemSub}>
                        {s.plan} · {s.priceCoins || 0} coins/mo
                      </span>
                    </div>
                    <div className={styles.activityItemRight}>
                      <span className={`${styles.badge} ${statusBadge(s.status)}`}>{s.status}</span>
                      <span className={styles.activityItemDate}>until {formatDate(s.expiryDate)}</span>
                    </div>
                  </div>
                ))}
              </DrawerSection>

              <DrawerSection title="Transactions" count={txns.length}>
                {txns.length === 0 ? (
                  <EmptyRow text="No transactions" />
                ) : txns.map((t) => {
                  const senderIdStr = t.senderId ? String(t.senderId._id || t.senderId) : null;
                  const isSent = senderIdStr === String(user._id);
                  const peer = isSent ? t.receiverId : t.senderId;
                  return (
                    <div key={t._id} className={styles.activityItem}>
                      <div className={styles.activityItemMain}>
                        <span className={styles.activityItemTitle}>{t.type}</span>
                        <span className={styles.activityItemSub}>
                          {peer?.displayName || (isSent ? 'Platform' : 'Purchase')}
                        </span>
                      </div>
                      <div className={styles.activityItemRight}>
                        <span className={`${styles.badge} ${isSent ? styles.badgeDanger : styles.badgeSuccess}`}>
                          {isSent ? '−' : '+'}{(t.amountCoins || 0).toLocaleString()}
                        </span>
                        <span className={styles.activityItemDate}>{formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </DrawerSection>

              <DrawerSection title="Posts" count={posts.length}>
                {posts.length === 0 ? (
                  <EmptyRow text="No posts (regular listeners don't create content)" />
                ) : posts.map((p) => (
                  <div key={p._id} className={styles.activityItem}>
                    <div className={styles.activityItemMain}>
                      <span className={styles.activityItemTitle}>
                        {p.content ? p.content.slice(0, 60) : `[${(p.media || []).length} media item${(p.media || []).length === 1 ? '' : 's'}]`}
                      </span>
                      <span className={styles.activityItemSub}>
                        {p.postType}{p.coinPrice > 0 ? ` · ${p.coinPrice} coins` : ''} · ♥ {p.likes?.length || 0} · 💬 {p.commentCount || 0}
                      </span>
                    </div>
                    <div className={styles.activityItemRight}>
                      <span className={`${styles.badge} ${p.isPublished ? styles.badgeSuccess : styles.badgeWarning}`}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className={styles.activityItemDate}>{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </DrawerSection>

              <DrawerSection title="Calls" count={calls.length}>
                {calls.length === 0 ? (
                  <EmptyRow text="No calls" />
                ) : calls.map((c) => {
                  const isIncoming = String(c.receiverId?._id || c.receiverId) === String(user._id);
                  const peer = isIncoming ? c.callerId : c.receiverId;
                  return (
                    <div key={c._id} className={styles.activityItem}>
                      <div className={styles.activityItemMain}>
                        <span className={styles.activityItemTitle}>
                          {c.type} call {isIncoming ? 'from' : 'to'} {peer?.displayName || '—'}
                        </span>
                        <span className={styles.activityItemSub}>
                          {c.totalMinutesBilling || 0} min · {(c.totalCoinsBilled || 0).toLocaleString()} coins billed
                        </span>
                      </div>
                      <div className={styles.activityItemRight}>
                        <span className={`${styles.badge} ${statusBadge(c.status)}`}>{c.status}</span>
                        <span className={styles.activityItemDate}>{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </DrawerSection>

              <DrawerSection title="Blocked Accounts" count={blocked.length}>
                {blocked.length === 0 ? (
                  <EmptyRow text="No blocked accounts" />
                ) : blocked.map((b) => (
                  <div key={b._id} className={styles.activityItem}>
                    <div className={styles.activityItemMain}>
                      <span className={styles.activityItemTitle}>{b.displayName}</span>
                      <span className={styles.activityItemSub}>@{b.username} · {b.email}</span>
                    </div>
                    <button
                      className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`}
                      onClick={() => onUnblock(b._id)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </DrawerSection>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AdminUserDrawer;
