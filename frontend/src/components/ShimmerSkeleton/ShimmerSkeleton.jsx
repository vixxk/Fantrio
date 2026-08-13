import { useApp } from '../../context/AppContext';
import styles from './ShimmerSkeleton.module.css';

const SKELETON_THEMES = {
  dark: {
    bg: 'rgba(255, 255, 255, 0.07)',
    shimmer: 'rgba(255, 255, 255, 0.06)',
  },
  light: {
    bg: '#e5e7eb',
    shimmer: 'rgba(255, 255, 255, 0.85)',
  },
};

const ShimmerSkeleton = ({
  width,
  height,
  borderRadius = '4px',
  marginTop = 0,
  marginBottom = 0,
  marginLeft = 0,
  marginRight = 0,
  padding = 0,
  light,
  className = '',
  style = {},
  animate = true,
  variant = 'box',
  count = 1,
  gap = '0.5rem',
  direction = 'column',
  alignItems = 'stretch',
}) => {
  let appCtx = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    appCtx = useApp();
  } catch {
    appCtx = null;
  }

  const isLightMode = typeof light === 'boolean'
    ? light
    : appCtx && appCtx.darkMode !== undefined
      ? !appCtx.darkMode
      : typeof document !== 'undefined'
        ? document.body.classList.contains('light') || !!document.querySelector('.lightTheme')
        : false;

  const theme = isLightMode ? 'light' : 'dark';
  const themeStyles = SKELETON_THEMES[theme];

  const baseStyle = {
    backgroundColor: themeStyles.bg,
    borderRadius,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    padding,
    ...style,
  };

  if (variant === 'text') {
    baseStyle.height = height || '14px';
    baseStyle.width = width || '100%';
  } else if (variant === 'avatar') {
    baseStyle.borderRadius = '50%';
    baseStyle.width = width || '50px';
    baseStyle.height = height || '50px';
  } else if (variant === 'media') {
    baseStyle.width = width || '100%';
    baseStyle.height = height || '350px';
    baseStyle.borderRadius = '8px';
  } else if (variant === 'card') {
    baseStyle.width = width || '100%';
    baseStyle.height = height || 'auto';
    baseStyle.borderRadius = '16px';
    baseStyle.background = isLightMode ? '#ffffff' : 'rgba(255, 255, 255, 0.03)';
    baseStyle.border = `1px solid ${isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)'}`;
    baseStyle.boxShadow = isLightMode ? '0 4px 12px rgba(0, 0, 0, 0.03)' : 'none';
  } else if (variant === 'circle') {
    baseStyle.borderRadius = '50%';
    baseStyle.width = width || '40px';
    baseStyle.height = height || '40px';
  } else if (variant === 'chip') {
    baseStyle.height = height || '28px';
    baseStyle.width = width || '80px';
    baseStyle.borderRadius = '99px';
  } else if (variant === 'button') {
    baseStyle.height = height || '38px';
    baseStyle.width = width || '100%';
    baseStyle.borderRadius = '8px';
  } else if (variant === 'row') {
    baseStyle.display = 'flex';
    baseStyle.alignItems = 'center';
    baseStyle.gap = '0.5rem';
    baseStyle.width = width || '100%';
    baseStyle.height = height || '40px';
    baseStyle.borderRadius = '8px';
  }

  const shimmerStyle = animate
    ? {
        position: 'relative',
        overflow: 'hidden',
      }
    : {};

  const content = count > 1
    ? Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${styles.shimmerBlock} ${isLightMode ? styles.light : ''} ${className}`}
          style={{
            ...baseStyle,
            ...shimmerStyle,
            '--shimmer-bg': themeStyles.bg,
            '--shimmer-highlight': themeStyles.shimmer,
          }}
        />
      ))
    : (
        <div
          className={`${styles.shimmerBlock} ${isLightMode ? styles.light : ''} ${className}`}
          style={{
            ...baseStyle,
            ...shimmerStyle,
            '--shimmer-bg': themeStyles.bg,
            '--shimmer-highlight': themeStyles.shimmer,
          }}
        />
      );

  if (count > 1 && direction === 'row') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap,
          alignItems,
          width: '100%',
        }}
      >
        {content}
      </div>
    );
  }

  if (count > 1) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap,
          width: '100%',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default ShimmerSkeleton;