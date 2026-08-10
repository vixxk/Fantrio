import styles from './AdminPage.module.css';

export const Skeleton = ({ className = '', variant = 'text', width, height, count = 1 }) => {
  const baseClass = `${styles.skeleton} ${styles[variant]} ${className}`;
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={baseClass}
      style={{ width, height, '--skeleton-width': width, '--skeleton-height': height }}
    />
  ));
  return <> {items} </>;
};

export const SkeletonCard = ({ className = '', lines = 3, hasIcon = false, hasAction = false }) => (
  <div className={`${styles.skeletonCard} ${className}`}>
    <div className={styles.skeletonCardHeader}>
      {hasIcon && <Skeleton variant="circle" width={46} height={46} />}
      <div className={styles.skeletonCardMeta}>
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="60%" height={12} />
      </div>
      {hasAction && <Skeleton variant="rect" width={100} height={36} />}
    </div>
    <div className={styles.skeletonCardBody}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '70%' : '100%'} height={14} />
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ className = '', columns = 5, rows = 5 }) => (
  <div className={`${styles.skeletonTable} ${className}`}>
    <div className={styles.skeletonTableHeader}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} variant="text" width="100%" height={14} />
      ))}
    </div>
    <div className={styles.skeletonTableBody}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonTableRow}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              variant="text"
              width={colIndex === 0 ? '80%' : colIndex === columns - 1 ? '60%' : '100%'}
              height={14}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ className = '', height = 220 }) => (
  <div className={`${styles.skeletonChart} ${className}`} style={{ height }}>
    <div className={styles.skeletonChartHeader}>
      <Skeleton variant="text" width="30%" height={20} />
      <Skeleton variant="rect" width={80} height={28} />
    </div>
    <div className={styles.skeletonChartArea}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} variant="line" width="100%" height={2} style={{ marginTop: `${i * 18}%` }} />
      ))}
    </div>
    <div className={styles.skeletonChartFooter}>
      <Skeleton variant="text" width="40%" height={14} />
    </div>
  </div>
);

export const SkeletonMetricRow = ({ className = '', count = 4 }) => (
  <div className={`${styles.skeletonMetricRow} ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={styles.skeletonMetricCard}>
        <Skeleton variant="circle" width={46} height={46} />
        <Skeleton variant="text" width="100%" height={12} />
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="rect" width={80} height={20} />
      </div>
    ))}
  </div>
);

export const SkeletonPage = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonPageHeader}>
      <Skeleton variant="text" width="30%" height={28} />
      <Skeleton variant="text" width="50%" height={16} />
    </div>
    <SkeletonMetricRow count={4} />
    <div className={styles.skeletonChartsGrid}>
      <SkeletonChart />
      <SkeletonChart />
      <SkeletonChart />
    </div>
    <SkeletonTable columns={4} rows={5} />
  </div>
);

export const SkeletonDrawer = () => (
  <div className={styles.skeletonDrawer}>
    <div className={styles.skeletonDrawerHeader}>
      <Skeleton variant="circle" width={46} height={46} />
      <div>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
    <div className={styles.skeletonDrawerStats}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.skeletonDrawerStat}>
          <Skeleton variant="text" width="100%" height={12} />
          <Skeleton variant="text" width="50%" height={20} />
        </div>
      ))}
    </div>
    <div className={styles.skeletonDrawerSections}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={styles.skeletonDrawerSection}>
          <Skeleton variant="text" width="40%" height={14} />
          <div className={styles.skeletonDrawerItems}>
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className={styles.skeletonDrawerItem}>
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonModal = () => (
  <div className={styles.skeletonModal}>
    <div className={styles.skeletonModalHeader}>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="circle" width={34} height={34} />
    </div>
    <div className={styles.skeletonModalBody}>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} variant="text" width={i === 3 ? '60%' : '100%'} height={14} />
      ))}
      <Skeleton variant="rect" width="100%" height={100} />
    </div>
    <div className={styles.skeletonModalFooter}>
      <Skeleton variant="rect" width={120} height={40} />
      <Skeleton variant="rect" width={120} height={40} />
    </div>
  </div>
);