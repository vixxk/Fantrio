import React from 'react';
import { Users, Eye, Lock, DollarSign, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { statsCards } from './mockData';
import styles from './AnalyticsPage.module.css';

const cardConfigs = {
  subscribers: {
    icon: Users,
    bg: 'rgba(255, 0, 127, 0.12)',
    borderColor: '#ff007f',
    color: '#ff007f'
  },
  views: {
    icon: Eye,
    bg: 'rgba(168, 85, 247, 0.12)',
    borderColor: '#a855f7',
    color: '#a855f7'
  },
  ppv: {
    icon: Lock,
    bg: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3b82f6',
    color: '#3b82f6'
  },
  tips: {
    icon: DollarSign,
    bg: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
    color: '#10b981'
  },
  engagement: {
    icon: Zap,
    bg: 'rgba(236, 72, 153, 0.12)',
    borderColor: '#ec4899',
    color: '#ec4899'
  }
};

export const StatsCards = ({ isDark }) => {
  return (
    <div className={`${styles.statsGrid} ${!isDark ? styles.light : ''}`}>
      {statsCards.map((stat) => {
        const config = cardConfigs[stat.id] || cardConfigs.subscribers;
        const Icon = config.icon;
        const changeNum = stat.change.replace(/[+\-]/g, '');
        return (
          <div key={stat.id} className={`${styles.statCard} ${stat.id === 'tips' ? styles.hideMobile : ''}`}>
            <div className={styles.statLabelRow}>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
            <div className={styles.statValueRow}>
              <div 
                className={styles.statIconWrap}
                style={{ 
                  background: config.bg,
                  boxShadow: `0 0 12px ${config.borderColor}30`
                }}
              >
                <Icon size={22} style={{ color: config.color }} />
              </div>
              <div className={styles.statValueCol}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statPeriod}>{stat.period}</span>
              </div>
              <span className={`${styles.statChangeInline} ${styles[stat.changeType]}`}>
                {stat.changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {changeNum}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
