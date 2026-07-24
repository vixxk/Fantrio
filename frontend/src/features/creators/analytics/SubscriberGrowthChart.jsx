import React, { useState } from 'react';
import { subscriberGrowthData } from './mockData';
import { PeriodDropdown } from './PeriodDropdown';
import styles from './AnalyticsPage.module.css';

export const SubscriberGrowthChart = ({ isDark }) => {
  const { labels, total, new: newSubs } = subscriberGrowthData;
  const [activeIndex, setActiveIndex] = useState(6);

  const width = 500;
  const height = 165;
  const padding = { top: 12, right: 15, bottom: 22, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTotal = Math.max(...total) * 1.1;
  const maxNew = Math.max(...newSubs) * 1.2;

  const getX = (i) => padding.left + (i / (labels.length - 1)) * chartWidth;
  const getTotalY = (val) => padding.top + chartHeight - (val / maxTotal) * chartHeight;
  const getNewY = (val) => padding.top + chartHeight - (val / maxNew) * chartHeight;

  const totalPath = total.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getTotalY(val)}`).join(' ');
  const newPath = newSubs.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getNewY(val)}`).join(' ');

  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < labels.length; i++) {
      const dist = Math.abs(getX(i) - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  };

  const activeTooltip = {
    date: labels[activeIndex],
    total: Number(total[activeIndex]).toLocaleString() + ' Total',
    new: '+' + newSubs[activeIndex] + ' New',
  };

  const svgX = getX(activeIndex);
  const tooltipX = (svgX / width) * 100;

  return (
    <div className={`${styles.chartCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Subscribers Growth</h3>
        <PeriodDropdown variant="text" />
      </div>
      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} style={{ background: '#e10075' }} />
          <span>Total Subscribers</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendLine} ${styles.dashed}`} style={{ '--dashed-color': '#7e00f3' }} />
          <span>New Subscribers</span>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(6)} style={{ cursor: 'pointer' }}>
          {[0, 300, 600, 900, '1.2K', '1.5K'].map((label, i) => (
            <text key={i} x={padding.left - 8} y={getTotalY(i * 300)} textAnchor="end" className={styles.axisLabel}>{label}</text>
          ))}
          {[0, 300, 600, 900, 1200, 1500].map((val, i) => (
            <line key={i} x1={padding.left} y1={getTotalY(val)} x2={width - padding.right} y2={getTotalY(val)} className={styles.gridLine} />
          ))}
          {labels.map((label, i) => (
            <text key={i} x={getX(i)} y={height - 4} textAnchor="middle" className={styles.axisLabel}>{label}</text>
          ))}
          <path d={totalPath} fill="none" stroke="#e10075" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={newPath} fill="none" stroke="#7e00f3" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
          {total.map((val, i) => (
            <circle key={i} cx={getX(i)} cy={getTotalY(val)} r={i === activeIndex ? 4.5 : 3} fill="#e10075" opacity={i === activeIndex ? 1 : 0.6} />
          ))}
          {newSubs.map((val, i) => (
            <circle key={i} cx={getX(i)} cy={getNewY(val)} r={i === activeIndex ? 4 : 2.5} fill="#7e00f3" opacity={i === activeIndex ? 1 : 0.5} />
          ))}
          <line x1={svgX} y1={padding.top} x2={svgX} y2={padding.top + chartHeight} className={styles.tooltipLine} />
        </svg>
        <div className={styles.chartTooltip} style={{ left: `${tooltipX}%`, transform: 'translateX(-50%)' }}>
          <div className={styles.chartTooltipDate}>{activeTooltip.date}</div>
          <div className={styles.chartTooltipValue}>{activeTooltip.total}</div>
          <div className={styles.chartTooltipSub}>{activeTooltip.new}</div>
        </div>
      </div>
    </div>
  );
};
