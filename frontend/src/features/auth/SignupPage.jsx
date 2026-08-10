import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mail, Lock, User, AtSign, Eye, EyeOff, Heart, Crown, Info
} from 'lucide-react';
import { AuthHeader } from './AuthHeader';
import { AuthBackground } from './AuthBackground';
import styles from './SignupPage.module.css';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);

const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (pwd.length >= 12) score += 1;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

export const SignupPage = () => {
  const { register, navigateTo, darkMode, user } = useApp();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigateTo(user.role === 'creator' ? '/creators/dashboard' : '/discover');
    }
  }, [user, navigateTo]);

  const strength = password ? getStrength(password) : 0;

  const isFormValid = 
    name.trim() && 
    username.trim() && 
    email.trim() && 
    password.length >= 8 && 
    confirm === password && 
    agree;

  useEffect(() => {
    const nameInput = document.getElementById('signup-name');
    if (nameInput) {
      nameInput.focus();
      const blurTimer = setTimeout(() => {
        nameInput.blur();
      }, 100);
      return () => clearTimeout(blurTimer);
    }
  }, []);

  const handleName = (e) => {
    const val = e.target.value;
    const oldSlug = slugify(name);
    setName(val);
    // Auto-suggest a username from the display name until the user edits it
    setUsername((u) => (!u || u === oldSlug) && val ? slugify(val) : u);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
      setError('Username must be 3–20 characters using letters, numbers, or underscores.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!agree) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        email: email.trim(),
        password,
        role,
        username: username.trim(),
        displayName: name.trim()
      });
      if (res.token) {
        navigateTo(res.user && res.user.role === 'creator' ? '/creators/dashboard' : '/discover');
      } else if (res.message) {
        setNotice(res.message);
      } else {
        navigateTo('/discover');
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.authRoot} ${darkMode ? styles.dark : styles.light}`}>
      <AuthBackground />
      <AuthHeader />

      <main className={styles.authMain}>
        <div className={styles.authCard}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>
              Create your <span className={styles.titleGrad}>account</span>
            </h1>
            <p className={styles.subtitle}>
              Connect with creators, unlock exclusive content
              <br />
              and start your Fantrio journey.
            </p>
          </div>

          {/* Role selection — creator flow comes later */}
          <div className={styles.roleLabel}>Join as</div>
          <div className={styles.roleGrid}>
            <button
              type="button"
              className={`${styles.roleCard} ${role === 'user' ? styles.roleActive : ''}`}
              onClick={() => { setRole('user'); setNotice(''); }}
              aria-pressed={role === 'user'}
            >
              <Heart size={20} className={styles.roleIcon} />
              <span className={styles.roleName}>Fan</span>
              <span className={styles.roleDesc}>Follow creators, chat &amp; call</span>
              {role === 'user' && <span className={styles.roleCheck}>✓</span>}
            </button>
            <button
              type="button"
              className={`${styles.roleCard} ${role === 'creator' ? styles.roleActive : ''}`}
              onClick={() => setRole('creator')}
              aria-pressed={role === 'creator'}
            >
              <Crown size={20} className={styles.roleIcon} />
              <span className={styles.roleName}>Creator</span>
              <span className={styles.roleDesc}>Earn from your content</span>
              {role === 'creator' && <span className={styles.roleCheck}>✓</span>}
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-name">Full name</label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    id="signup-name"
                    className={styles.input}
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={handleName}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-username">Username</label>
                <div className={styles.inputWrap}>
                  <AtSign size={18} className={styles.inputIcon} />
                  <input
                    id="signup-username"
                    className={styles.input}
                    type="text"
                    placeholder="jane_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="signup-email">Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="signup-email"
                  className={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-password">Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="signup-password"
                    className={styles.input}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthBar} data-strength={strength}>
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`${styles.strengthSeg} ${i < strength ? styles.strengthOn : ''}`}
                        />
                      ))}
                    </div>
                    <span className={styles.strengthLabel}>{STRENGTH_LABELS[strength]}</span>
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-confirm">Confirm password</label>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="signup-confirm"
                    className={styles.input}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <label className={styles.termsRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className={styles.termsText}>
                I agree to the <span className={styles.termsLink}>Terms of Service</span> and{' '}
                <span className={styles.termsLink}>Privacy Policy</span>
              </span>
            </label>

          {error && (
            <div className={styles.errorBox} role="alert">
              <span className={styles.errorDot} />
              {error}
            </div>
          )}
          {notice && (
            <div className={styles.noticeBox}>
              <Info size={15} className={styles.noticeIcon} />
              {notice}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={!isFormValid || submitting}
            style={!isFormValid ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
              {submitting ? (
                <>
                  <span className={styles.spinner} />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className={styles.switchPrompt}>
            <span>Already have an account?</span>
            <button type="button" className={styles.switchLink} onClick={() => navigateTo('/login')}>
              Log in
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

export default SignupPage;
