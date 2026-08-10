
import { Users, Eye, Lock, DollarSign, Zap, Star } from 'lucide-react';
import styles from './AnalyticsPage.module.css';

const iconMap = { growth: Users, views: Eye, ppv: Lock, tips: DollarSign, engagement: Zap };
const iconColorMap = {
  growth: '#ff007f',
  views: '#a855f7',
  ppv: '#3b82f6',
  tips: '#10b981',
  engagement: '#ec4899'
};

export const InsightsPanel = ({ isDark, insights = [] }) => {
  return (
    <div className={`${styles.insightsPanel} ${!isDark ? styles.light : ''}`}>
      <div className={styles.insightsHeader}>
        <Star size={20} className={styles.insightsIcon} style={{ color: '#e10075' }} fill="#e10075" />
        <h3 className={styles.insightsTitle}>Insights</h3>
      </div>
      <div className={styles.insightsList}>
        {insights.map((insight) => {
          const Icon = iconMap[insight.icon] || Star;
          const color = iconColorMap[insight.icon] || '#e10075';
          return (
            <div key={insight.id} className={styles.insightItem}>
              <div
                className={styles.insightIconWrap}
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className={styles.insightText}>
                <p className={styles.insightContent}>
                  {insight.text}{' '}
                  {insight.highlight && <span className={styles.insightHighlight}>{insight.highlight}</span>}{' '}
                  {insight.suffix}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
