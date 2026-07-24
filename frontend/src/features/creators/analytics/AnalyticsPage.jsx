import React from 'react';
import { useApp } from '../../../context/AppContext';
import { StatsCards } from './StatsCards';
import { SubscriberGrowthChart } from './SubscriberGrowthChart';
import { EarningsOverviewChart } from './EarningsOverviewChart';
import { InsightsPanel } from './InsightsPanel';
import { ContentPerformance } from './ContentPerformance';
import { TrafficSources } from './TrafficSources';
import { PeriodDropdown } from './PeriodDropdown';
import styles from './AnalyticsPage.module.css';

export const AnalyticsPage = () => {
  const { darkMode } = useApp();

  return (
    <div className={`${styles.analyticsContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Analytics</h1>
        </div>
        <PeriodDropdown variant="btn" />
      </div>

      {/* Stats Cards Row */}
      <StatsCards isDark={darkMode} />

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column - Charts & Table */}
        <div className={styles.chartsColumn}>
          <SubscriberGrowthChart isDark={darkMode} />
          <EarningsOverviewChart isDark={darkMode} />
          <ContentPerformance isDark={darkMode} />
        </div>

        {/* Right Column - Insights & Sidebar */}
        <div className={styles.rightColumn}>
          <InsightsPanel isDark={darkMode} />
          <TrafficSources isDark={darkMode} />
        </div>
      </div>
    </div>
  );
};
