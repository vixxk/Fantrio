import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, MessageSquare, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminChats = () => {
  const { toast, confirm } = useAdminUI();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChats();
  }, [search]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/chats?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMsg = async (id) => {
    const ok = await confirm({
      title: 'Censor message?',
      message: 'This message will be permanently deleted. This action cannot be undone.',
      confirmText: 'Censor',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/chats/${id}`);
      if (res.status === 'success') {
        toast.success('Message deleted successfully.');
        fetchChats();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Chat Monitoring</h2>
          <p className={styles.pageSub}>Review recent conversations and remove abusive messages.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search messages..."
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
            <span>Loading chat logs…</span>
          </div>
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Message Content</th>
                    <th>Sent Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id}>
                      <td className={styles.cellStrong}>{msg.senderId?.displayName || 'System'}</td>
                      <td>{msg.receiverId?.displayName || 'System'}</td>
                      <td className={styles.cellWrap}>{msg.content}</td>
                      <td>{new Date(msg.createdAt).toLocaleTimeString()}</td>
                      <td>
                        <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleDeleteMsg(msg._id)}>
                          <Trash2 size={12} />
                          Censor
                        </button>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td colSpan="5"><div className={styles.emptyState}>No messages sent yet</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {messages.map((msg) => (
                <div key={msg._id} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{msg.senderId?.displayName} ➜ {msg.receiverId?.displayName}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Message:</span>
                    <span className={styles.mobileVal}>{msg.content}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Time:</span>
                    <span className={styles.mobileVal}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnBlock}`} onClick={() => handleDeleteMsg(msg._id)} style={{ marginTop: 4 }}>
                    <Trash2 size={12} /> Censor Message
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
