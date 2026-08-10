import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { StatsCards } from './StatsCards';
import { SubscriberGrowthChart } from './SubscriberGrowthChart';
import { EarningsOverviewChart } from './EarningsOverviewChart';
import { InsightsPanel } from './InsightsPanel';
import { ContentPerformance } from './ContentPerformance';
import { TrafficSources } from './TrafficSources';
import { PeriodDropdown } from './PeriodDropdown';
import styles from './AnalyticsPage.module.css';

const PERIOD_MAP = {
  'Today': 'week',
  'Last 7 Days': 'week',
  'Last 30 Days': 'month',
  'Last 90 Days': 'quarter',
  'All Time': 'all'
};

export const AnalyticsPage = () => {
  const { darkMode } = useApp();
  const [period, setPeriod] = useState('All Time');
  const [data, setData] = useState({
    statsCards: [],
    subscriberGrowthData: {},
    earningsOverviewData: {},
    insights: [],
    contentPerformance: [],
    trafficSources: [],
    creatorProfile: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalytics = async (p) => {
    setLoading(true);
    try {
      const res = await api.get(`/creators/panel/analytics?period=${PERIOD_MAP[p] || 'month'}`);
      if (res.status === 'success') {
        setData({
          statsCards: res.statsCards || [],
          subscriberGrowthData: res.subscriberGrowthData || {},
          earningsOverviewData: res.earningsOverviewData || {},
          insights: res.insights || [],
          contentPerformance: res.contentPerformance || [],
          trafficSources: res.trafficSources || [],
          creatorProfile: res.creatorProfile || {}
        });
        setError(false);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadAnalytics(period));
  }, [period]);

  return (
    <div className={`${styles.analyticsContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}></div>
        <PeriodDropdown variant="btn" value={period} onChange={setPeriod} />
      </div>

{/* Stats Cards Row */}
       {loading ? (
          <div className={styles.statsGrid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="skeleton-card" style={{ height: '110px', padding: 0 }}>
                <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
              </div>
            ))}
          </div>
        ) : (
         <StatsCards isDark={darkMode} statsCards={data.statsCards} />
       )}

       {/* Main Content Grid */}
       <div className={styles.mainGrid}>
         {/* Left Column - Charts & Table */}
         <div className={styles.chartsColumn}>
           {loading ? (
             <div className="skeleton-card" style={{ height: '240px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ) : (
             <SubscriberGrowthChart isDark={darkMode} data={data.subscriberGrowthData} value={period} onPeriodChange={setPeriod} />
           )}
           {loading ? (
             <div className="skeleton-card" style={{ height: '240px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ) : (
             <EarningsOverviewChart isDark={darkMode} data={data.earningsOverviewData} value={period} onPeriodChange={setPeriod} />
           )}
           {loading ? (
             <div className="skeleton-card" style={{ height: '280px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ) : (
             <ContentPerformance
               isDark={darkMode}
               contentPerformance={data.contentPerformance}
               contentTabs={['All', 'Posts', 'Streams', 'PPV']}
             />
           )}
         </div>

         {/* Right Column - Insights & Sidebar */}
         <div className={styles.rightColumn}>
           {loading ? (
             <div className="skeleton-card" style={{ height: '300px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ) : (
             <InsightsPanel isDark={darkMode} insights={data.insights} />
           )}
           {loading ? (
             <div className="skeleton-card" style={{ height: '260px', padding: 0 }}>
               <ShimmerSkeleton variant="card" height="100%" marginTop="0" />
             </div>
           ) : (
             <TrafficSources isDark={darkMode} trafficSources={data.trafficSources} value={period} onPeriodChange={setPeriod} />
           )}
         </div>
       </div>

      {error && (
        <p style={{ color: '#ef4444', textAlign: 'center', padding: '1rem' }}>
          Could not load analytics. Please try again later.
        </p>
      )}
    </div>
  );
};
