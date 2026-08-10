import { Users, Eye, Lock, DollarSign, Zap } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

const cardConfigs = {
  subscribers: { icon: Users, bg: 'rgba(255, 0, 127, 0.12)', color: '#ff007f' },
  views: { icon: Eye, bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' },
  ppv: { icon: Lock, bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' },
  tips: { icon: DollarSign, bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
  engagement: { icon: Zap, bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }
};

const changeClass = (type) =>
  type === 'positive' ? styles.changePositive : type === 'negative' ? styles.changeNegative : styles.changeInfo;

export const StatsCards = ({ isDark, statsCards = [] }) => {
  return (
    <div className={`${styles.statsGrid} ${!isDark ? styles.light : ''}`}>
      {statsCards.map((stat) => {
        const config = cardConfigs[stat.id] || cardConfigs.subscribers;
        const Icon = config.icon;
        const changeText = stat.change && stat.period ? `${stat.change} ${stat.period}` : stat.change || '';
        return (
          <div key={stat.id} className={`${styles.statCard} ${stat.id === 'tips' ? styles.hideMobile : ''}`}>
            <div className={styles.statIconWrap} style={{ background: config.bg }}>
              <Icon size={20} style={{ color: config.color }} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              {changeText ? (
                <span className={`${styles.statChange} ${changeClass(stat.changeType)}`}>{changeText}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
