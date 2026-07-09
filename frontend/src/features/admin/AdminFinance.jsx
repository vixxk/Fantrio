import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, Landmark, Check, X, Undo, Search } from 'lucide-react';
import { useAdminUI } from './AdminUI';
import styles from './AdminPage.module.css';

export const AdminFinance = () => {
  const { toast, confirm } = useAdminUI();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('transactions');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (subTab === 'transactions') {
      fetchTransactions();
    } else {
      fetchWithdrawals();
    }
  }, [subTab, search]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/transactions?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/withdrawals?search=${encodeURIComponent(search)}`);
      if (res.status === 'success') {
        setWithdrawals(res.withdrawals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (txId) => {
    const ok = await confirm({
      title: 'Refund transaction?',
      message: 'The coins will be deducted from the receiver and returned to the sender.',
      confirmText: 'Refund',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/refund/${txId}`);
      if (res.status === 'success') {
        toast.success('Transaction refunded successfully.');
        fetchTransactions();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleApproveWithdrawal = async (wId) => {
    try {
      const res = await api.post(`/admin/withdrawals/${wId}/approve`);
      if (res.status === 'success') {
        toast.success('Withdrawal request approved successfully.');
        fetchWithdrawals();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRejectWithdrawal = async (wId) => {
    const ok = await confirm({
      title: 'Reject withdrawal?',
      message: 'The withdrawal will be rejected and the coins refunded to the creator.',
      confirmText: 'Reject',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await api.post(`/admin/withdrawals/${wId}/reject`);
      if (res.status === 'success') {
        toast.success('Withdrawal request rejected and coins refunded.');
        fetchWithdrawals();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Finance & Payouts</h2>
          <p className={styles.pageSub}>Audit transactions and process creator withdrawals.</p>
        </div>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={subTab === 'transactions' ? 'Search transactions...' : 'Search withdrawals...'}
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.pillTabs}>
        <button
          className={`${styles.pillTab} ${subTab === 'transactions' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('transactions')}
        >
          <DollarSign size={14} />
          Transactions Log
        </button>
        <button
          className={`${styles.pillTab} ${subTab === 'withdrawals' ? styles.pillTabActive : ''}`}
          onClick={() => setSubTab('withdrawals')}
        >
          <Landmark size={14} />
          Withdrawal Requests
        </button>
      </div>

      <div className={styles.glassPanel}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Syncing ledger…</span>
          </div>
        ) : (
          <>
            {subTab === 'transactions' ? (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className={styles.cellMono}>{tx._id}</td>
                      <td>{tx.senderId?.displayName || 'Credit System'}</td>
                      <td>{tx.receiverId?.displayName || 'Platform Cut'}</td>
                      <td>
                        <span className={styles.badge} style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>{tx.type}</span>
                      </td>
                      <td className={tx.amountCoins > 0 ? styles.posAmount : styles.negAmount}>
                        {tx.amountCoins}c
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          tx.status === 'completed' ? styles.badgeSuccess :
                          tx.status === 'refunded' ? styles.badgeInfo : styles.badgeDanger
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        {tx.status === 'completed' && (
                          <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnSm}`} onClick={() => handleRefund(tx._id)}>
                            <Undo size={12} />
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="7"><div className={styles.emptyState}>No transactions recorded</div></td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className={styles.mobileCardList}>
                {transactions.map((tx) => (
                  <div key={tx._id} className={styles.mobileCard}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileCardTitle}>{tx.type}</span>
                      <span className={`${styles.badge} ${
                        tx.status === 'completed' ? styles.badgeSuccess :
                        tx.status === 'refunded' ? styles.badgeInfo : styles.badgeDanger
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>TX ID:</span>
                      <span className={`${styles.mobileVal} ${styles.cellMono}`}>{tx._id}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>From:</span>
                      <span className={styles.mobileVal}>{tx.senderId?.displayName || 'Credit System'}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>To:</span>
                      <span className={styles.mobileVal}>{tx.receiverId?.displayName || 'Platform Cut'}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Amount:</span>
                      <span className={`${styles.mobileVal} ${tx.amountCoins > 0 ? styles.posAmount : styles.negAmount}`}>{tx.amountCoins}c</span>
                    </div>
                    {tx.status === 'completed' && (
                      <button className={`${styles.buttonControl} ${styles.btnBordered} ${styles.btnBlock}`} onClick={() => handleRefund(tx._id)} style={{ marginTop: 4 }}>
                        <Undo size={14} /> Refund
                      </button>
                    )}
                  </div>
                ))}
                {transactions.length === 0 && <div className={styles.emptyState}>No transactions recorded</div>}
              </div>
              </>
            ) : (
              <>
              <div className={styles.customTableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Creator Profile</th>
                      <th>Requested Coins</th>
                      <th>Payout Value</th>
                      <th>Status</th>
                      <th>Requested At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id}>
                      <td className={styles.cellMono}>{w._id}</td>
                      <td className={styles.cellStrong}>{w.senderId?.displayName}</td>
                      <td>{w.amountCoins} coins</td>
                      <td className={styles.posAmount}>
                        ${(w.amountCoins * 0.05).toFixed(2)} USD
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          w.status === 'completed' ? styles.badgeSuccess :
                          w.status === 'pending' ? styles.badgeWarning : styles.badgeDanger
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                      <td>
                        {w.status === 'pending' && (
                          <div className={styles.actionBtns}>
                            <button className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnSm}`} onClick={() => handleApproveWithdrawal(w._id)}>
                              Complete Payout
                            </button>
                            <button className={`${styles.buttonControl} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleRejectWithdrawal(w._id)}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan="7"><div className={styles.emptyState}>No withdrawal payout requests pending</div></td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className={styles.mobileCardList}>
                {withdrawals.map((w) => (
                  <div key={w._id} className={styles.mobileCard}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileCardTitle}>{w.senderId?.displayName}</span>
                      <span className={`${styles.badge} ${
                        w.status === 'completed' ? styles.badgeSuccess :
                        w.status === 'pending' ? styles.badgeWarning : styles.badgeDanger
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Request ID:</span>
                      <span className={`${styles.mobileVal} ${styles.cellMono}`}>{w._id}</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Requested:</span>
                      <span className={styles.mobileVal}>{w.amountCoins} coins</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Payout:</span>
                      <span className={`${styles.mobileVal} ${styles.posAmount}`}>${(w.amountCoins * 0.05).toFixed(2)} USD</span>
                    </div>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Requested At:</span>
                      <span className={styles.mobileVal}>{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                    {w.status === 'pending' && (
                      <div className={styles.actionBtns} style={{ marginTop: 4, width: '100%' }}>
                        <button className={`${styles.buttonControl} ${styles.btnSolid}`} onClick={() => handleApproveWithdrawal(w._id)} style={{ flex: 1 }}>
                          Complete Payout
                        </button>
                        <button className={`${styles.buttonControl} ${styles.btnDanger}`} onClick={() => handleRejectWithdrawal(w._id)} style={{ flex: 1 }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {withdrawals.length === 0 && <div className={styles.emptyState}>No withdrawal payout requests pending</div>}
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
