import { useState } from 'react';
import { PeriodDropdown } from './PeriodDropdown';
import styles from './AnalyticsPage.module.css';

// Nice round tick values derived from the real data max (no hardcoded axis).
const makeTicks = (maxVal, count = 5) => {
  const max = Math.max(Number(maxVal) || 0, 1);
  const raw = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * pow;
  const ticks = [];
  for (let v = 0; v <= max + step; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
};

export const EarningsOverviewChart = ({ isDark, data, value, onPeriodChange }) => {
  const { labels = [], total = [], net = [] } = data || {};
  const [activeIndex, setActiveIndex] = useState(labels.length - 1 || 0);

  const width = 500;
  const height = 165;
  const padding = { top: 12, right: 15, bottom: 22, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTotal = Math.max(...total, 1) * 1.1;
  const yTicks = makeTicks(maxTotal);

  const getX = (i) => padding.left + (i / Math.max(1, labels.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - (val / maxTotal) * chartHeight;

  const totalPath = total.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');
  const netPath = net.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`).join(' ');


  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < labels.length; i++) {
      const dist = Math.abs(getX(i) - svgX);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setActiveIndex(closest);
  };

  const activeTooltip = {
    date: labels[activeIndex] || '',
    total: Math.round(Number(total[activeIndex] || 0)).toLocaleString() + ' Total',
    net: Math.round(Number(net[activeIndex] || 0)).toLocaleString() + ' Net'
  };

  const svgX = getX(activeIndex);
  const tooltipX = (svgX / width) * 100;
  const tooltipTransform = tooltipX > 80 ? 'translateX(-100%)' : 'translateX(-50%)';

  return (
    <div className={`${styles.chartCard} ${!isDark ? styles.light : ''}`}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Earnings Overview</h3>
        <PeriodDropdown variant="text" value={value} onChange={onPeriodChange} />
      </div>
      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} style={{ background: '#e10075' }} />
          <span>Total Earnings</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendLine} ${styles.dashed}`} style={{ '--dashed-color': '#7e00f3' }} />
          <span>Net Earnings</span>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(labels.length - 1 || 0)} style={{ cursor: 'pointer' }}>
          {yTicks.map((val, i) => (
            <line key={i} x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} className={styles.gridLine} />
          ))}
          {labels.map((label, i) => (
            <text key={i} x={getX(i)} y={height - 4} textAnchor="middle" className={styles.axisLabel}>{label}</text>
          ))}
          <path d={totalPath} fill="none" stroke="#e10075" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={netPath} fill="none" stroke="#7e00f3" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
          {total.map((val, i) => (
            <circle key={i} cx={getX(i)} cy={getY(val)} r={i === activeIndex ? 4.5 : 3} fill="#e10075" opacity={i === activeIndex ? 1 : 0.6} />
          ))}
          {net.map((val, i) => (
            <circle key={i} cx={getX(i)} cy={getY(val)} r={i === activeIndex ? 4 : 2.5} fill="#7e00f3" opacity={i === activeIndex ? 1 : 0.5} />
          ))}
          <line x1={svgX} y1={padding.top} x2={svgX} y2={padding.top + chartHeight} className={styles.tooltipLine} />
        </svg>
        <div className={styles.chartTooltip} style={{ left: `${tooltipX}%`, transform: tooltipTransform }}>
          <div className={styles.chartTooltipDate}>{activeTooltip.date}</div>
          <div className={styles.chartTooltipValue}>{activeTooltip.total}</div>
          <div className={styles.chartTooltipSub}>{activeTooltip.net}</div>
        </div>
      </div>
    </div>
  );
};
