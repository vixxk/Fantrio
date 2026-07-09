import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PhoneCall, Video, Radio, Ban, Trash2, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminCalls = () => {
  const { toast, confirm } = useAdminUI();
  const [calls, setCalls] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('audio'); // 'audio' | 'video' | 'streams'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (subTab === 'streams') {
      fetchStreams();
    } else {
      fetchCalls();
    }
  }, [subTab, search]);

  const filteredCalls = calls.filter((c) => c.type === subTab);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/calls?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setCalls(res.calls || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/streams?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setStreams(res.streams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateStream = async (id) => {
    const ok = await confirm({
      title: 'Terminate live stream?',
      message: 'The connection will be broken for all viewers and the stream will end.',
      confirmText: 'Terminate Stream',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/streams/${id}/terminate`);
      if (res.status === 'success') {
        toast.success('Live stream terminated successfully.');
        fetchStreams();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Calls & Streams</h2>
          <p className={styles.pageSub}>Inspect call history and manage live broadcasts.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={
              subTab === 'audio' ? 'Search audio calls...' :
              subTab === 'video' ? 'Search video calls...' : 'Search streams...'
            }
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.pillTabs}>
        <button
          className={`${styles.pillTab} ${subTab === 'audio' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('audio')}
        >
          <PhoneCall size={14} />
          Audio Calls
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'video' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('video')}
        >
          <Video size={14} />
          Video Calls
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'streams' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('streams')}
        >
          <Radio size={14} />
          Live Streams
        </button>
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading activity logs…</span>
          </div>
        ) : (
          <>
            {subTab !== 'streams' ? (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Caller</th>
                      <th>Receiver</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Billable Coins</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                  {filteredCalls.map((call) => (
                    <tr key={call._id}>
                      <td className={styles.cellStrong}>{call.callerId?.displayName}</td>
                      <td>{call.receiverId?.displayName}</td>
                      <td>{call.duration} sec</td>
                      <td style={{ textTransform: 'capitalize' }}>{call.status}</td>
                      <td className={styles.cellStrong}>{call.costCoins || 0} coins</td>
                      <td>{new Date(call.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredCalls.length === 0 && (
                    <tr>
                      <td colSpan="6"><div className={styles.emptyState}>No {subTab} calls placed yet</div></td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className={styles.mobileCardList}>
                {filteredCalls.map((call) => (
                  <div key={call._id} className={styles.mobileCard}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileCardTitle}>{call.callerId?.displayName}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Receiver:</span>
                      <span className={styles.mobileVal}>{call.receiverId?.displayName}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Duration:</span>
                      <span className={styles.mobileVal}>{call.duration} sec</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Status:</span>
                      <span className={styles.mobileVal} style={{ textTransform: 'capitalize' }}>{call.status}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Billable:</span>
                      <span className={`${styles.mobileVal} ${styles.cellStrong}`}>{call.costCoins || 0} coins</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Date:</span>
                      <span className={styles.mobileVal}>{new Date(call.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {filteredCalls.length === 0 && <div className={styles.emptyState}>No {subTab} calls placed yet</div>}
              </div>
              </>
            ) : (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Title</th>
                      <th>Room ID</th>
                      <th>Viewers Count</th>
                      <th>Status</th>
                      <th>Started At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {streams.map((stream) => (
                    <tr key={stream._id}>
                      <td className={styles.cellStrong}>{stream.creatorId?.displayName}</td>
                      <td>{stream.title}</td>
                      <td className={styles.cellMono}>{stream.roomId}</td>
                      <td>{stream.viewers?.length || 0}</td>
                      <td style={{ textTransform: 'capitalize' }}>{stream.status}</td>
                      <td>{new Date(stream.createdAt).toLocaleString()}</td>
                      <td>
                        {stream.status === 'live' && (
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleTerminateStream(stream._id)}>
                            <Ban size={12} />
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {streams.length === 0 && (
                    <tr>
                      <td colSpan="7"><div className={styles.emptyState}>No live streams created yet</div></td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className={styles.mobileCardList}>
                {streams.map((stream) => (
                  <div key={stream._id} className={styles.mobileCard}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileCardTitle}>{stream.creatorId?.displayName}</span>
                      <span className={`${styles.badge} ${styles.badgeOutline}`} style={{ textTransform: 'capitalize' }}>{stream.status}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Title:</span>
                      <span className={styles.mobileVal}>{stream.title}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Room ID:</span>
                      <span className={`${styles.mobileVal} ${styles.cellMono}`}>{stream.roomId}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Viewers:</span>
                      <span className={styles.mobileVal}>{stream.viewers?.length || 0}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Started:</span>
                      <span className={styles.mobileVal}>{new Date(stream.createdAt).toLocaleString()}</span>
                    </div>
                    {stream.status === 'live' && (
                      <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnBlock}`} onClick={() => handleTerminateStream(stream._id)} style={{ marginTop: 4 }}>
                        <Ban size={14} /> Terminate
                      </button>
                    )}
                  </div>
                ))}
                {streams.length === 0 && <div className={styles.emptyState}>No live streams created yet</div>}
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
