import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogIn, ArrowLeft } from 'lucide-react';
import styles from './AdminPage.module.css';

export const AdminLogin = () => {
  const { login, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.status === 'success' && res.user && res.user.role === 'admin') {
        navigateTo('/admin');
      } else {
        setError('These credentials do not have administrator access.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminLoginWrap}>
      <div className={styles.adminLoginCard}>
        <div className={styles.logoMark}>
          <img src="/favicon-v4.png" alt="Fantrio" className={styles.logoImg} />
        </div>
        <h1 className={styles.adminLoginTitle}>Fantrio Admin</h1>
        <p className={styles.adminLoginSub}>Sign in with your administrator credentials to continue.</p>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div className={styles.formControlItem}>
            <label className={styles.inputLabel}>Email</label>
            <input
              className={styles.inputField}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fantrio.com"
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.formControlItem}>
            <label className={styles.inputLabel}>Password</label>
            <input
              className={styles.inputField}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className={styles.loginError}>{error}</div>}

          <button type="submit" className={`${styles.buttonControl} ${styles.btnSolid} ${styles.btnBlock}`} disabled={loading}>
            <LogIn size={16} />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <button className={styles.loginBack} onClick={() => navigateTo('/discover')}>
          <ArrowLeft size={14} />
          Back to main site
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
