import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AuthHeader } from './AuthHeader';
import { AuthBackground } from './AuthBackground';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { login, verify2FALogin, navigateTo, darkMode, user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (user) {
      redirectAfterAuth(user);
    }
  }, [user]);

  const redirectAfterAuth = (user) => {
    if (user && user.role === 'admin') {
      navigateTo('/admin');
    } else if (user && user.role === 'creator') {
      navigateTo('/creators/dashboard');
    } else {
      navigateTo('/discover');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (res.requires2FA) {
        setPendingToken(res.pendingToken);
        setCode('');
        setNotice(res.message || 'Enter the code sent to your email to complete sign-in.');
        return;
      }
      if (res.user) {
        redirectAfterAuth(res.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Please enter the verification code sent to your email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await verify2FALogin(pendingToken, code.trim());
      if (res.user) {
        redirectAfterAuth(res.user);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel2FA = () => {
    setPendingToken('');
    setCode('');
    setNotice('');
    setError('');
  };

  return (
    <div className={`${styles.authRoot} ${darkMode ? styles.dark : styles.light}`}>
      <AuthBackground />
      <AuthHeader />

      <main className={styles.authMain}>
        <div className={styles.authCard}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>
              Sign in to <span className={styles.titleGrad}>Fantrio</span>
            </h1>
            <p className={styles.subtitle}>
              Enter your details to get back to your favorite creators.
            </p>
          </div>

          <form className={styles.form} onSubmit={pendingToken ? handleVerify2FA : handleSubmit} noValidate>
            {pendingToken ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-2fa-code">Verification code</label>
                <div className={styles.inputWrap}>
                  <ShieldCheck size={18} className={styles.inputIcon} />
                  <input
                    id="login-2fa-code"
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="login-email">Email address</label>
                  <div className={styles.inputWrap}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input
                      id="login-email"
                      className={styles.input}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="login-password">Password</label>
                  <div className={styles.inputWrap}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input
                      id="login-password"
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.rememberRow}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className={styles.checkboxLabel}>Keep me signed in</span>
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => setNotice('Password reset is coming soon — stay tuned!')}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className={styles.errorBox} role="alert">
                <span className={styles.errorDot} />
                {error}
              </div>
            )}
            {notice && <div className={styles.noticeBox}>{notice}</div>}

            {pendingToken && (
              <button type="button" className={styles.forgotLink} onClick={cancel2FA} style={{ marginBottom: '0.75rem', display: 'block' }}>
                ← Back to sign in
              </button>
            )}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  {pendingToken ? 'Verifying…' : 'Signing in…'}
                </>
              ) : (
                pendingToken ? 'Verify & Sign In' : 'Sign In'
              )}
            </button>
          </form>

          <div className={styles.switchPrompt}>
            <span>New to Fantrio?</span>
            <button type="button" className={styles.switchLink} onClick={() => navigateTo('/signup')}>
              Create an account
            </button>
          </div>
        </div>

        <p className={styles.footerText}>
          © 2026 Fantrio • <span className={styles.footerLink}>Terms</span> •{' '}
          <span className={styles.footerLink}>Privacy</span>
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
