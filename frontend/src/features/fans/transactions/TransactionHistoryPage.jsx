import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import {
  Coins,
  Wallet,
  TrendingUp,
  TrendingDown,
  Star,
  Heart,
  Gift,
  LockOpen,
  Phone,
  Radio,
  ShoppingBag,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import styles from './TransactionHistoryPage.module.css';

const PAGE_SIZE = 10;

const TYPE_META = {
  deposit: { label: 'Coin Purchase', Icon: Coins, color: '#10b981' },
  withdrawal: { label: 'Withdrawal', Icon: Banknote, color: '#eab308' },
  subscription: { label: 'Subscription', Icon: Star, color: '#ff007f' },
  tip: { label: 'Tip', Icon: Heart, color: '#ff007f' },
  gift: { label: 'Gift', Icon: Gift, color: '#a78bfa' },
  ppv_unlock: { label: 'PPV Unlock', Icon: LockOpen, color: '#eab308' },
  call_billing: { label: 'Call Billing', Icon: Phone, color: '#eab308' },
  live_entry: { label: 'Live Stream Entry', Icon: Radio, color: '#06b6d4' },
  store_purchase: { label: 'Store Purchase', Icon: ShoppingBag, color: '#f97316' }
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Money In' },
  { key: 'out', label: 'Money Out' },
  { key: 'deposit', label: 'Purchases' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'tip', label: 'Tips' },
  { key: 'gift', label: 'Gifts' },
  { key: 'call_billing', label: 'Calls' },
  { key: 'ppv_unlock', label: 'PPV' },
  { key: 'live_entry', label: 'Live' },
  { key: 'store_purchase', label: 'Store' }
];

const STATUS_META = {
  completed: { label: 'Completed', cls: 'completed' },
  pending: { label: 'Pending', cls: 'pending' },
  failed: { label: 'Failed', cls: 'failed' },
  refunded: { label: 'Refunded', cls: 'refunded' }
};

const isMe = (id, userId) => id && String(id._id || id) === String(userId);

// Determine whether this transaction added (in) or removed (out) coins for the user
const getDirection = (t, userId) => {
  if (isMe(t.senderId, userId) && !isMe(t.receiverId, userId)) return 'out';
  if (isMe(t.receiverId, userId)) return 'in';
  return 'out';
};

const getDescription = (t, userId) => {
  if (t.type === 'deposit') {
    if (t.metadata && t.metadata.promoCode) return `Promo code · ${t.metadata.promoCode}`;
    if (t.metadata && t.metadata.packageCoins) return `Coin package · ${t.metadata.packageCoins} coins`;
    return 'Coin purchase';
  }
  if (t.type === 'withdrawal') return 'Withdrawal request';
  if (t.type === 'live_entry') return 'Live stream entry';
  if (t.type === 'store_purchase') return 'Store purchase';

  // Sent to a creator / received from a fan
  const dir = getDirection(t, userId);
  const counterpart = dir === 'out' ? t.receiverId : t.senderId;
  const name = counterpart && counterpart.displayName ? counterpart.displayName : null;
  const base = (TYPE_META[t.type] || {}).label || t.type.replace(/_/g, ' ');
  if (!name) return base;
  return dir === 'out' ? `${base} to ${name}` : `${base} from ${name}`;
};

const formatCoins = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Page numbers for the pagination bar, collapsing long ranges with ellipses
// (e.g. [1 … 4 5 6 … 20])
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  pages.forEach((p) => {
    if (p - prev > 1) out.push('...');
    out.push(p);
    prev = p;
  });
  return out;
};

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, idx) => (
      <div key={idx} className={styles.skeletonRow}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonLines}>
          <div className={`${styles.skeletonBox} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonBox} ${styles.skeletonSub}`} />
        </div>
        <div className={`${styles.skeletonBox} ${styles.skeletonAmount}`} />
      </div>
    ))}
  </>
);

export const TransactionHistoryPage = () => {
  const { balance, darkMode, setActiveTab, user } = useApp();

  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0 });
  const [spendingBreakdown, setSpendingBreakdown] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const fetchTransactions = useCallback(async (targetPage, activeFilter) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
      if (activeFilter === 'in' || activeFilter === 'out') params.set('direction', activeFilter);
      else if (activeFilter !== 'all') params.set('type', activeFilter);

      const res = await api.get(`/wallet/transactions?${params.toString()}`);
      // Ignore stale responses (e.g. a slower earlier filter overwriting a newer one)
      if (requestId !== requestIdRef.current) return;
      if (res.status === 'success') {
        setTransactions(res.transactions || []);
        setTotal(res.total || 0);
        setPage(res.page || targetPage);
        setTotalPages(res.totalPages || 1);
        if (res.summary) setSummary(res.summary);
        if (res.spendingBreakdown) setSpendingBreakdown(res.spendingBreakdown);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Failed to load transactions.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Reset pagination when the filter changes, then load page 1
  useEffect(() => {
    Promise.resolve().then(() => {
      setPage(1);
      setTransactions([]);
      fetchTransactions(1, filter);
    });
  }, [fetchTransactions, filter]);

  const handleFilterChange = (key) => {
    if (key === filter) return;
    setFilter(key);
  };

  const goToPage = (targetPage) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
    fetchTransactions(targetPage, filter);
  };

  const formattedBalance = balance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  // Donut chart data: coins spent per category with share %, sorted desc.
  const spendingData = useMemo(() => {
    const total = (spendingBreakdown || []).reduce((sum, s) => sum + (s.coins || 0), 0);
    if (total <= 0) return [];
    const sorted = spendingBreakdown
      .filter((s) => (s.coins || 0) > 0)
      .map((s) => {
        const type = s.type || 'other';
        const meta = TYPE_META[type] || { label: type.replace(/_/g, ' '), color: '#9ca3af' };
        return {
          type,
          name: meta.label,
          value: s.coins,
          color: meta.color,
          pct: Math.round((s.coins / total) * 1000) / 10
        };
      })
      .sort((a, b) => b.value - a.value);
    // Nudge the largest slice so the displayed percentages sum to exactly 100%
    const pctSum = sorted.reduce((sum, d) => sum + d.pct, 0);
    const diff = Math.round((100 - pctSum) * 10) / 10;
    if (sorted.length > 0 && Math.abs(diff) >= 0.1) {
      sorted[0].pct = Math.round((sorted[0].pct + diff) * 10) / 10;
    }
    return sorted;
  }, [spendingBreakdown]);

  const totalSpentCoins = spendingData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={`${styles.container} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.shell}>

        {/* ================= MAIN LEFT SECTION ================= */}
        <div className={styles.mainSection}>

          {/* Header */}
          <header className={styles.headerSection}>
            <div className={styles.titleRow}>
              <img src="/coin.png" alt="Coin" className={styles.headerCoinIcon} />
              <h1 className={styles.title}>Transaction History</h1>
            </div>
            <p className={styles.subtitle}>
              Track every coin you have received, spent and purchased on Fantrio.
            </p>
          </header>

          {/* Summary Cards */}
          <div className={styles.summaryRow}>
            <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
              <div className={styles.summaryTop}>
                <Wallet size={16} className={styles.summaryIcon} />
                <span className={styles.summaryLabel}>Available Balance</span>
              </div>
              <div className={styles.balanceValueRow}>
                <img src="/coin.png" alt="Coin" className={styles.balanceCoinIcon} />
                <span className={styles.balanceValue}>{formattedBalance}</span>
                <span className={styles.balanceUnit}>Coins</span>
              </div>
              <button className={styles.balanceAction} onClick={() => setActiveTab('Buy Coins')}>
                Buy More Coins
              </button>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <TrendingUp size={16} className={styles.summaryIcon} />
                <span className={styles.summaryLabel}>Total Received</span>
              </div>
              <span className={`${styles.summaryValue} ${styles.positive}`}>
                +{formatCoins(summary.totalIn)}
              </span>
              <span className={styles.summaryNote}>Coins credited to you</span>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <TrendingDown size={16} className={styles.summaryIcon} />
                <span className={styles.summaryLabel}>Total Spent</span>
              </div>
              <span className={`${styles.summaryValue} ${styles.negative}`}>
                -{formatCoins(summary.totalOut)}
              </span>
              <span className={styles.summaryNote}>Coins spent on Fantrio</span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className={styles.filterRow}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${styles.filterChip} ${filter === f.key ? styles.filterChipActive : ''}`}
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <h3 className={styles.listTitle}>Transactions</h3>
              <span className={styles.listCount}>
                {total} {total === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {loading ? (
              <SkeletonRows />
            ) : error ? (
              <div className={styles.errorBox}>
                <AlertTriangle size={40} className={styles.errorIcon} />
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={() => fetchTransactions(page, filter)}>
                  Try Again
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <div className={styles.emptyBox}>
                <Receipt size={48} className={styles.emptyIcon} />
                <p>No coin transactions found for this filter yet.</p>
                {filter !== 'all' && (
                  <button className={styles.retryBtn} onClick={() => handleFilterChange('all')}>
                    View All Transactions
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={styles.txList}>
                  {transactions.map((t) => {
                    const meta = TYPE_META[t.type] || { label: t.type.replace(/_/g, ' '), Icon: Coins, color: '#ffffff' };
                    const Icon = meta.Icon;
                    const dir = getDirection(t, user?.id);
                    const status = STATUS_META[t.status] || { label: t.status, cls: 'pending' };
                    return (
                      <div key={t._id} className={styles.txRow}>
                        <div
                          className={styles.txIconBox}
                          style={{ color: meta.color, borderColor: `${meta.color}33`, background: `${meta.color}14` }}
                        >
                          <Icon size={20} />
                        </div>

                        <div className={styles.txInfo}>
                          <span className={styles.txTitle}>{meta.label}</span>
                          <span className={styles.txDesc}>
                            {getDescription(t, user?.id)}
                            {t.gateway && t.gateway !== 'internal' ? ` · ${t.gateway}` : ''}
                          </span>
                        </div>

                        <div className={styles.txDateCol}>
                          <span className={styles.txDate}>{new Date(t.createdAt).toLocaleDateString()}</span>
                          <span className={styles.txTime}>
                            {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={styles.txAmountCol}>
                          <span className={`${styles.txAmount} ${dir === 'in' ? styles.positive : styles.negative}`}>
                            {dir === 'in' ? '+' : '-'}{formatCoins(t.amountCoins)}
                          </span>
                          <span className={`${styles.statusBadge} ${styles[status.cls]}`}>{status.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={page <= 1 || loading}
                      onClick={() => goToPage(page - 1)}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>

                    <div className={styles.pageNumbers}>
                      {getPageNumbers(page, totalPages).map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            className={`${styles.pageNumberBtn} ${p === page ? styles.pageNumberActive : ''}`}
                            disabled={loading}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      className={styles.pageBtn}
                      disabled={page >= totalPages || loading}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Note */}
          <p className={styles.footerNote}>
            <img src="/coin.png" alt="Coin" className={styles.footerCoinIcon} />
            Fantrio coins are for in-app use only and hold no real-world monetary value.
          </p>
        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className={styles.rightSidebar}>

          {/* Widget 1: My Wallet */}
          <div className={`${styles.widgetCard} ${styles.walletWidgetCard}`}>
            <h3 className={styles.widgetTitle}>My Wallet</h3>
            <div className={styles.walletBalanceRow}>
              <img src="/coin.png" alt="Coin" className={styles.walletCoinImg} />
              <span className={styles.walletCoinsText}>{formattedBalance} Coins</span>
            </div>
            <button
              className={styles.buyCoinsSidebarBtn}
              onClick={() => setActiveTab('Buy Coins')}
            >
              Buy More Coins
            </button>
          </div>

          {/* Widget 2: Spending Breakdown (donut) */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Spending Breakdown</h3>
            {spendingData.length === 0 ? (
              <div className={styles.spendEmpty}>
                No spending yet — your coin breakdown will appear here.
              </div>
            ) : (
              <>
                <div className={styles.donutWrap}>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={spendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {spendingData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#130a24',
                          border: '1px solid rgba(255, 0, 127, 0.25)',
                          borderRadius: '10px',
                          color: '#ffffff'
                        }}
                        itemStyle={{ color: '#ffffff' }}
                        formatter={(value, name) => [`${formatCoins(value)} coins`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutCenterValue}>{formatCoins(totalSpentCoins)}</span>
                    <span className={styles.donutCenterLabel}>Total Spent</span>
                  </div>
                </div>

                <div className={styles.spendLegend}>
                  {spendingData.map((d) => (
                    <div key={d.type} className={styles.spendLegendRow}>
                      <span className={styles.spendLegendDot} style={{ background: d.color }} />
                      <span className={styles.spendLegendName}>{d.name}</span>
                      <span className={styles.spendLegendPct}>{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Widget 3: Coin Usage */}
          <div className={`${styles.widgetCard} ${styles.coinUsageCard}`}>
            <h3 className={styles.widgetTitle}>Coin Usage</h3>
            <div className={styles.guideList}>
              <div className={styles.guideItem}>
                <img src="/heart.png" alt="Heart" className={styles.guideIconImg} />
                <span>Tips & gifts directly support creators</span>
              </div>
              <div className={styles.guideItem}>
                <img src="/Unlock.png" alt="Unlock" className={styles.guideIconImg} />
                <span>Unlocked media stays in your account</span>
              </div>
              <div className={styles.guideItem}>
                <img src="/audio.png" alt="Audio" className={styles.guideIconImg} />
                <span>1:1 Calls are billed per minute</span>
              </div>
            </div>
          </div>

          {/* Widget 4: Safe & Secure */}
          <div className={`${styles.widgetCard} ${styles.safeSecureCard}`}>
            <img src="/safe.png" alt="Safe & Secure" className={styles.safeIconImg} />
            <div className={styles.safeTextCol}>
              <h3 className={styles.safeTitle}>Safe & Transparent</h3>
              <p className={styles.safeSubtext}>
                All coin balances and transaction records are securely logged in real-time.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
