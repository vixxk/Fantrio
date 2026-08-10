import { useApp } from '../../context/AppContext';
import { Moon, Sun } from 'lucide-react';
import styles from './AuthHeader.module.css';

export const AuthHeader = () => {
  const { darkMode, setDarkMode } = useApp();

  return (
    <header className={`${styles.header} ${darkMode ? styles.dark : styles.light}`}>
      {/* Hidden gradient definition used to paint the theme icon on hover */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="themeToggleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e10075" />
            <stop offset="100%" stopColor="#7e00f3" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.brand}>
        <img src="/Fantrio Logo.png" alt="Fantrio Logo" className={styles.logo} />
        <span className={styles.brandName}>
          Fant<span className={styles.brandPink}>rio</span>
        </span>
      </div>

      <button
        type="button"
        className={styles.themeToggle}
        onClick={() => setDarkMode(!darkMode)}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
};

export default AuthHeader;
