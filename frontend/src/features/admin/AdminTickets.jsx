import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MessageSquare, X, Send, Trash2, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminTickets = () => {
  const { toast, confirm } = useAdminUI();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [search]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/tickets?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = (ticket) => {
    setActiveTicket(ticket);
    setReplyText(ticket.reply || '');
  };

  const handleSendReply = async (statusVal) => {
    try {
      const res = await api.put(`/admin/tickets/${activeTicket._id}`, {
        reply: replyText,
        status: statusVal
      });
      if (res.status === 'success') {
        toast.success('Ticket replied and status updated.');
        setActiveTicket(null);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteTicket = async (id) => {
    const ok = await confirm({
      title: 'Delete ticket?',
      message: 'This support ticket will be permanently removed.',
      confirmText: 'Delete Ticket',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/admin/tickets/${id}`);
      if (res.status === 'success') {
        toast.success('Ticket deleted successfully.');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Support Desk</h2>
          <p className={styles.pageSub}>Respond to user tickets and resolve issues.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tickets..."
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
            <span>Syncing support queue…</span>
          </div>
        ) : (
          <>
            <div className={styles.customTableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t._id}>
                      <td className={styles.cellStrong}>{t.userId?.displayName || 'Unknown'}</td>
                      <td>{t.subject}</td>
                      <td>
                        <span className={`${styles.badge} ${
                          t.status === 'resolved' ? styles.badgeSuccess :
                          t.status === 'pending' ? styles.badgeWarning : styles.badgeDanger
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`} onClick={() => handleOpenReply(t)}>
                            <MessageSquare size={12} />
                            Reply
                          </button>
                          <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteTicket(t._id)} aria-label="Delete ticket">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="5"><div className={styles.emptyState}>No support requests in queue</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={styles.mobileCardList}>
              {tickets.map((t) => (
                <div key={t._id} className={styles.mobileCard}>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileCardTitle}>{t.userId?.displayName || 'User'}</span>
                    <span className={`${styles.badge} ${
                      t.status === 'resolved' ? styles.badgeSuccess :
                      t.status === 'pending' ? styles.badgeWarning : styles.badgeDanger
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Subject:</span>
                    <span className={styles.mobileVal}>{t.subject}</span>
                  </div>
                  <div className={styles.mobileRow}>
                    <span className={styles.mobileLabel}>Date:</span>
                    <span className={styles.mobileVal}>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                    <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleOpenReply(t)} style={{ flex: 1 }}>
                      Reply Message
                    </button>
                    <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => handleDeleteTicket(t._id)} aria-label="Delete ticket">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {activeTicket && (
        <div className={styles.customModalOverlay}>
          <div className={styles.customModalBody}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Ticket Resolution</h3>
              <button className={styles.modalCloseBtn} onClick={() => setActiveTicket(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.quoteBox}>
                <div className={styles.strong} style={{ marginBottom: 4 }}>Subject: {activeTicket.subject}</div>
                <div className={styles.muted}>{activeTicket.message || 'No description provided.'}</div>
              </div>

              <div className={styles.formControlItem}>
                <label className={styles.inputLabel}>Reply Text</label>
                <textarea
                  rows="4"
                  className={styles.inputField}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type support reply..."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.buttonControl} ${styles.btnBordered}`} onClick={() => setActiveTicket(null)}>
                Cancel
              </button>
              <button className={`${styles.buttonControl} ${styles.btnWarning}`} onClick={() => handleSendReply('in-progress')}>
                Mark In-Progress
              </button>
              <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleSendReply('resolved')}>
                <Send size={14} />
                Resolve Ticket
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
