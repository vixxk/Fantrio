import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import {
  X,
  Gift,
  Trophy,
  Users,
  Eye,
  Clock,
  Coins,
  BadgeCheck,
  Loader2,
  Calendar,
  Radio,
  BarChart2
} from 'lucide-react';
import styles from './StreamDetailsModal.module.css';

export const StreamDetailsModal = ({ streamId, isAdmin = false, onClose }) => {
  const { darkMode } = useApp();
  const [activeTab, setActiveTab] = useState('tipping'); // 'tipping' | 'leaderboard' | 'viewers'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!streamId) return;
    let mounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const endpoint = isAdmin
          ? `/admin/streams/${streamId}/details`
          : `/creators/live/${streamId}/details`;
        const res = await api.get(endpoint);
        if (mounted && res.status === 'success') {
          setData(res.streamDetails);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load stream details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      mounted = false;
    };
  }, [streamId, isAdmin]);

  if (!streamId) return null;

  const stream = data?.stream || {};
  const tippingLogs = data?.tippingLogs || [];
  const giftsLeaderboard = data?.giftsLeaderboard || [];
  const viewersList = data?.viewersList || [];

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${styles.backdrop} ${!darkMode ? styles.light : ''}`} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dragHandle} />
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerTitleGroup}>
              <BarChart2 className={styles.headerIcon} size={20} />
              <h3 className={styles.title}>Stream Analytics & Audit Logs</h3>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {data && (
            <div className={styles.streamMetaBanner}>
              <div className={styles.streamMetaMain}>
                <span className={styles.streamTitleText}>{stream.streamTitle || 'Live Stream'}</span>
                <div className={styles.badgeRow}>
                  <span className={`${styles.statusBadge} ${stream.isLive ? styles.liveBadge : styles.endedBadge}`}>
                    {stream.isLive ? (
                      <>
                        <span className={styles.pulseDot} /> LIVE NOW
                      </>
                    ) : (
                      'ENDED'
                    )}
                  </span>
                  <span className={styles.categoryTag}>{stream.category || 'Just Chatting'}</span>
                  {stream.language && <span className={styles.langTag}>{stream.language}</span>}
                </div>
              </div>

              {isAdmin && stream.creator && (
                <div className={styles.creatorProfileChip}>
                  <img
                    src={stream.creator.avatarUrl || '/profile.png'}
                    alt={stream.creator.displayName}
                    className={styles.creatorAvatar}
                  />
                  <div className={styles.creatorInfo}>
                    <span className={styles.creatorName}>
                      {stream.creator.displayName || stream.creator.username}
                      {stream.creator.isVerifiedBadge && <BadgeCheck size={13} color="#e10075" />}
                    </span>
                    <span className={styles.creatorHandle}>@{stream.creator.username}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className={styles.spin} />
            <span>Loading stream data…</span>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Stat Cards Overview Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(225, 0, 117, 0.12)', color: '#e10075' }}>
                  <Eye size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Peak Viewers</span>
                  <span className={styles.statValue}>{(stream.peakViewers || stream.viewerCount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                  <Clock size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Duration</span>
                  <span className={styles.statValue}>{stream.duration || '0m'}</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                  <Coins size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Total Earnings</span>
                  <span className={styles.statValue}>
                    <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                    {(stream.totalEarningsCoins || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                  <Users size={18} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Total Viewers</span>
                  <span className={styles.statValue}>{(viewersList.length || stream.viewerCount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabNav}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'tipping' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('tipping')}
              >
                <Gift size={15} />
                <span><span className={styles.desktopOnly}>Gift </span>Logs</span>
                <span className={styles.tabBadge}>{tippingLogs.length}</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('leaderboard')}
              >
                <Trophy size={15} />
                <span><span className={styles.desktopOnly}>Gifts </span>Leaderboard</span>
                <span className={styles.tabBadge}>{giftsLeaderboard.length}</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'viewers' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('viewers')}
              >
                <Users size={15} />
                <span>Viewers</span>
                <span className={styles.tabBadge}>{viewersList.length}</span>
              </button>
            </div>

            {/* Tab View Content */}
            <div className={styles.tabContentArea}>
              {/* TAB 1: Gift Logs */}
              {activeTab === 'tipping' && (
                <div className={styles.logsList}>
                  {tippingLogs.length === 0 ? (
                    <div className={styles.emptyTabState}>
                      <Gift size={32} className={styles.emptyIcon} />
                      <p>No gifts recorded for this live stream yet.</p>
                    </div>
                  ) : (
                    tippingLogs.map((log) => (
                      <div key={log._id} className={styles.logCard}>
                        <img
                          src={log.sender?.avatarUrl || '/profile.png'}
                          alt={log.sender?.displayName}
                          className={styles.senderAvatar}
                        />
                        <div className={styles.logInfo}>
                          <span className={styles.senderName}>{log.sender?.displayName || 'Fan'}</span>
                          <span className={styles.logDetails}>
                            Sent <span className={styles.giftHighlight}>{log.giftEmoji} {log.giftName}</span>
                          </span>
                        </div>
                        <div className={styles.logRight}>
                          <div className={styles.coinAmountChip}>
                            <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                            +{log.amountCoins.toLocaleString()}
                          </div>
                          <span className={styles.logTime}>{formatDate(log.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Gifts Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className={styles.leaderboardList}>
                  {giftsLeaderboard.length === 0 ? (
                    <div className={styles.emptyTabState}>
                      <Trophy size={32} className={styles.emptyIcon} />
                      <p>No supporters on the leaderboard yet.</p>
                    </div>
                  ) : (
                    giftsLeaderboard.map((item, index) => {
                      const rank = index + 1;
                      return (
                        <div key={item.userId} className={`${styles.rankCard} ${rank <= 3 ? styles[`rankCard${rank}`] : ''}`}>
                          <div className={styles.rankBadgeContainer}>
                            {rank === 1 && <span className={styles.goldBadge}>🥇 #1</span>}
                            {rank === 2 && <span className={styles.silverBadge}>🥈 #2</span>}
                            {rank === 3 && <span className={styles.bronzeBadge}>🥉 #3</span>}
                            {rank > 3 && <span className={styles.normalRank}>#{rank}</span>}
                          </div>

                          <img
                            src={item.avatarUrl || '/profile.png'}
                            alt={item.displayName}
                            className={styles.rankAvatar}
                          />

                          <div className={styles.rankInfo}>
                            <span className={styles.rankName}>{item.displayName}</span>
                            <span className={styles.rankSub}>{item.giftCount || 1} gift(s) sent</span>
                          </div>

                          <div className={styles.rankCoinsChip}>
                            <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                            {item.totalCoins.toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 3: Viewers List */}
              {activeTab === 'viewers' && (
                viewersList.length === 0 ? (
                  <div className={styles.emptyTabState}>
                    <Users size={32} className={styles.emptyIcon} />
                    <p>No recorded viewers for this live session.</p>
                  </div>
                ) : (
                  <div className={styles.viewersGrid}>
                    {viewersList.map((viewer) => (
                      <div key={viewer.userId} className={styles.viewerItemCard}>
                        <img
                          src={viewer.avatarUrl || '/profile.png'}
                          alt={viewer.displayName}
                          className={styles.viewerAvatar}
                        />
                        <div className={styles.viewerDetails}>
                          <span className={styles.viewerName}>{viewer.displayName}</span>
                          {viewer.username && <span className={styles.viewerHandle}>@{viewer.username}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StreamDetailsModal;
