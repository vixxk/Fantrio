import { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Coins,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  PhoneCall,
  CalendarClock,
  BadgeCheck,
  Radio,
  ShieldAlert,
  Receipt,
  TrendingDown,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAdminUI } from './AdminUI';
import { SkeletonPage } from './AdminSkeletons';
import styles from './AdminPage.module.css';

const CHART_COLORS = ['#e10075', '#7e00f3', '#34d399', '#fbbf24', '#38bdf8', '#f87171'];

// Custom tooltip for the Fan Growth chart: always lists Fans above Creators
// regardless of recharts' internal payload order.
const UserGrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => {
    if (a.dataKey === 'users') return -1;
    if (b.dataKey === 'users') return 1;
    return 0;
  });
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-soft)',
        padding: '8px 12px'
      }}
    >
      <div style={{ color: 'var(--text)', fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {sorted.map((item) => (
        <div key={item.dataKey} style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: item.stroke || item.color || 'var(--brand)', marginRight: 6 }} />
          {item.dataKey === 'users' ? 'Fans' : 'Creators'}: {item.value?.toLocaleString?.() ?? item.value}
        </div>
      ))}
    </div>
  );
};

const generateTimeSeriesLabels = (points = 7) => {
  const labels = [];
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
};

const RevenueChart = ({ totalRevenue }) => {
  const labels = useMemo(() => generateTimeSeriesLabels(7), []);
  const data = useMemo(() => labels.map((date) => ({ date, value: totalRevenue || 0 })), [totalRevenue, labels]);
  const latestValue = totalRevenue || 0;

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Revenue (7 Days)</h3>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-soft)'
              }}
              labelStyle={{ color: 'var(--text)', fontSize: '12px', fontWeight: 600 }}
              formatter={(value) => [value.toLocaleString(), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--brand)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartFooter}>
        <span className={styles.chartSummary}>Latest: <strong>{latestValue.toLocaleString()} coins</strong></span>
      </div>
    </div>
  );
};

const UserGrowthChart = ({ usersCount, creatorsCount }) => {
  const labels = useMemo(() => generateTimeSeriesLabels(7), []);
  const data = useMemo(() => labels.map((date) => ({
    date,
    users: usersCount || 0,
    creators: creatorsCount || 0
  })), [usersCount, creatorsCount, labels]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Fan Growth (7 Days)</h3>
        <Activity size={16} className={styles.chartIcon} />
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip
              content={<UserGrowthTooltip />}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-app)' }}
              activeDot={{ r: 6, strokeWidth: 3 }}
            />
            <Line
              type="monotone"
              dataKey="creators"
              stroke="var(--brand-2)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-app)' }}
              activeDot={{ r: 6, strokeWidth: 3 }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconType="line"
              itemStyle={{ marginTop: 8, fontSize: 11, color: 'var(--text-soft)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartFooter}>
        <span className={styles.chartLegend}>
          <span className={styles.legendDot} style={{ background: 'var(--brand)' }} />
          Fans
        </span>
        <span className={styles.chartLegend}>
          <span className={styles.legendDot} style={{ background: 'var(--brand-2)' }} />
          Creators
        </span>
      </div>
    </div>
  );
};

const TransactionDistributionChart = ({ transactionBreakdown }) => {
  const data = useMemo(() => {
    if (!transactionBreakdown?.length) return [{ name: 'No Data', value: 1 }];
    return transactionBreakdown.map((t, i) => ({
      name: (t._id || 'other').charAt(0).toUpperCase() + (t._id || 'other').slice(1),
      value: t.count || 0,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [transactionBreakdown]);

  const totalTxns = data.reduce((sum, d) => sum + d.value, 0);

  if (!transactionBreakdown?.length) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Transaction Types</h3>
          <PieChartIcon size={16} className={styles.chartIcon} />
        </div>
        <div className={styles.chartWrapper} style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.emptyChartState}>No transaction data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Transaction Distribution</h3>
        <PieChartIcon size={16} className={styles.chartIcon} />
      </div>
      <div className={styles.donutLayout}>
        <div className={styles.donutChartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-soft)'
                }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={styles.chartFooter}>
        <span className={styles.chartSummary}>Total: <strong>{totalTxns} transactions</strong></span>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color, bgColor, trend, trendLabel }) => (
  <div className={styles.metricCard}>
    <div className={styles.iconContainer} style={{ background: bgColor, color: color }}>
      <Icon size={24} />
    </div>
    <div className={styles.metricText}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.metricValueRow}>
        <span className={styles.metricValue}>{value}</span>
        {trend !== undefined && (
          <span className={`${styles.metricTrend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendLabel || `${Math.abs(trend)}%`}</span>
          </span>
        )}
      </div>
    </div>
  </div>
);

export const AdminOverview = () => {
  useAdminUI();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/stats');

      if (statsRes.status === 'success') {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData();
    });
  }, []);

  if (loading) {
    return <SkeletonPage />;
  }

  const usersCount = stats?.users?.totalUsers || 0;
  const creatorsCount = stats?.users?.totalCreators || 0;
  const coinsCirculating = stats?.wallet?.totalCoinsCirculating || 0;
  const reportsCount = stats?.moderation?.totalReportedPosts || 0;
  const todaysSignups = stats?.users?.todaysSignups || 0;
  const suspendedUsers = stats?.users?.suspendedUsers || 0;
  const activeCalls = stats?.calls?.activeCallsCount || 0;
  const activeSubscriptions = stats?.engagement?.activeSubscriptions || 0;
  const liveStreams = stats?.engagement?.liveStreamsCount || 0;
  const totalPosts = stats?.engagement?.totalPosts || 0;
  const totalRevenue = stats?.revenue?.totalRevenueCoins || 0;
  const completedTxns = stats?.revenue?.completedTransactionsCount || 0;
  const pendingReports = stats?.support?.pendingReports || 0;
  const transactionBreakdown = stats?.transactions || [];

  const usersGrowth = stats?.users?.growthRate ?? 0;
  const revenueGrowth = stats?.revenue?.growthRate ?? 0;
  const creatorsGrowth = stats?.users?.creatorsGrowthRate ?? 0;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageTitle}>Dashboard Overview</h2>
          <p className={styles.pageSub}>Platform health and configuration at a glance.</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.dashboardMetrics}>
        <MetricCard
          icon={Users}
          label="Total Fans"
          value={usersCount.toLocaleString()}
          color="var(--brand)"
          bgColor="var(--brand-soft)"
          trend={usersGrowth}
          trendLabel="+12.5%"
        />
        <MetricCard
          icon={TrendingUp}
          label="Creators"
          value={creatorsCount.toLocaleString()}
          color="var(--brand-2)"
          bgColor="var(--brand-soft-2)"
          trend={creatorsGrowth}
          trendLabel="+15.2%"
        />
        <MetricCard
          icon={Coins}
          label="Coin Ledger"
          value={coinsCirculating.toLocaleString()}
          color="var(--warning)"
          bgColor="var(--warning-soft)"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Reported Posts"
          value={reportsCount.toLocaleString()}
          color="var(--danger)"
          bgColor="var(--danger-soft)"
        />
        <MetricCard
          icon={CalendarClock}
          label="Today's Signups"
          value={todaysSignups.toLocaleString()}
          color="var(--success)"
          bgColor="var(--success-soft)"
        />
        <MetricCard
          icon={PhoneCall}
          label="Active Calls"
          value={activeCalls.toLocaleString()}
          color="var(--info)"
          bgColor="var(--info-soft)"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Active Subscriptions"
          value={activeSubscriptions.toLocaleString()}
          color="var(--brand)"
          bgColor="var(--brand-soft)"
        />
        <MetricCard
          icon={Radio}
          label="Live Streams"
          value={liveStreams.toLocaleString()}
          color="var(--brand-2)"
          bgColor="var(--brand-soft-2)"
        />
        <MetricCard
          icon={Receipt}
          label="Total Revenue (coins)"
          value={totalRevenue.toLocaleString()}
          color="var(--warning)"
          bgColor="var(--warning-soft)"
          trend={revenueGrowth}
          trendLabel="+8.3%"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Suspended Fans"
          value={suspendedUsers.toLocaleString()}
          color="var(--danger)"
          bgColor="var(--danger-soft)"
        />
        <MetricCard
          icon={CheckCircle}
          label="Posts"
          value={totalPosts.toLocaleString()}
          color="var(--success)"
          bgColor="var(--success-soft)"
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>
        <RevenueChart totalRevenue={totalRevenue} />
        <UserGrowthChart usersCount={usersCount} creatorsCount={creatorsCount} />
        <TransactionDistributionChart transactionBreakdown={transactionBreakdown} />
      </div>

      {/* Transaction / Economy Breakdown */}
      <div className={styles.glassPanel}>
        <div className={styles.panelHeadRow}>
          <h3 className={styles.panelTitle} style={{ margin: 0 }}>Economy Breakdown</h3>
          <span className={styles.breakdownMeta}>
            {completedTxns} completed transactions · {pendingReports} pending fan reports
          </span>
        </div>

        {transactionBreakdown.length === 0 ? (
          <div className={styles.emptyState}>No transactions recorded yet.</div>
        ) : (
          <div className={styles.transactionBreakdown}>
            {transactionBreakdown.map((t, idx) => (
              <div key={t._id || idx} className={styles.breakdownRow}>
                <div className={styles.breakdownMain}>
                  <span className={styles.breakdownType}>{t._id || 'other'}</span>
                  <span className={styles.breakdownCount}>{t.count} transactions</span>
                </div>
                <span className={styles.breakdownTotal}>
                  {(t.totalCoins || 0).toLocaleString()} coins
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};