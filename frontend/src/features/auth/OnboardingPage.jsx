import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, AtSign, Heart, Crown, Gift, ArrowRight } from 'lucide-react';
import { AuthLayout, GoogleLogo, XLogo } from './AuthLayout';
import styles from './OnboardingPage.module.css';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);

export const OnboardingPage = () => {
  const { user, completeOnboarding, logout, navigateTo } = useApp();

  const [role, setRole] = useState(user?.role === 'creator' ? 'creator' : 'fan');
  const [name, setName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(
    user?.username && !user?.username.startsWith('user_') && !user?.username.startsWith('x_')
      ? user.username
      : (user?.displayName ? slugify(user.displayName) : '')
  );
  const [referralCode, setReferralCode] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.displayName && !name) {
      setName(user.displayName);
    }
    if (user?.username && !username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    const oldSlug = slugify(name);
    setName(val);
    setUsername((currentUsername) =>
      (!currentUsername || currentUsername === oldSlug) && val ? slugify(val) : currentUsername
    );
  };

  const isNameValid = name.trim().length >= 2;
  const isUsernameValid = /^[a-z0-9_]{3,30}$/i.test(username.trim());
  const isFormValid = isNameValid && isUsernameValid && agree;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isNameValid) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!isUsernameValid) {
      setError('Username must be 3–30 characters using letters, numbers, or underscores.');
      return;
    }
    if (!agree) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        role,
        displayName: name.trim(),
        username: username.trim().toLowerCase(),
        referralCode: referralCode.trim() || undefined,
        agree: true
      });
    } catch (err) {
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isGoogle = user?.googleId || (user?.email && user.email.toLowerCase().includes('@gmail.com'));
  const isX = !!user?.xId;

  return (
    <AuthLayout
      mode="signup"
      showNormalForm={true}
      isGatedOnboarding={true}
    >
      <div className={styles.formWrap}>
        <div className={styles.cardHead}>
          <h2 className={styles.title}>
            Complete your <span className={styles.titleBrand}>account</span>
          </h2>
          <p className={styles.subtitle}>
            Just one last step to complete your Fantrio journey with your connected account.
          </p>
        </div>

        {/* Connected Social Account Indicator */}
        {user && (
          <div className={styles.connectedBadge}>
            {isGoogle ? (
              <GoogleLogo size={18} />
            ) : isX ? (
              <XLogo size={16} />
            ) : null}

            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt="Account Avatar"
                className={styles.connectedAvatar}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}

            <span className={styles.connectedText}>
              Connected as <span className={styles.connectedHighlight}>{user.email || user.displayName || user.username}</span>
            </span>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert} role="alert">
            {error}
          </div>
        )}

        {/* Role selection: Fan vs Creator */}
        <div className={styles.roleLabel}>Join as</div>
        <div className={styles.roleGrid}>
          <button
            type="button"
            className={`${styles.roleCard} ${role === 'fan' ? styles.roleActive : ''}`}
            onClick={() => setRole('fan')}
            aria-pressed={role === 'fan'}
          >
            <Heart size={18} className={styles.roleIcon} />
            <span className={styles.roleName}>Fan</span>
            <span className={styles.roleDesc}>Follow creators, chat &amp; call</span>
            {role === 'fan' && <span className={styles.roleCheck}>✓</span>}
          </button>
          <button
            type="button"
            className={`${styles.roleCard} ${role === 'creator' ? styles.roleActive : ''}`}
            onClick={() => setRole('creator')}
            aria-pressed={role === 'creator'}
          >
            <Crown size={18} className={styles.roleIcon} />
            <span className={styles.roleName}>Creator</span>
            <span className={styles.roleDesc}>Earn from your content</span>
            {role === 'creator' && <span className={styles.roleCheck}>✓</span>}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldRow}>
            {/* Full name input */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="onboarding-name">
                Full name
              </label>
              <div className={styles.inputWrap}>
                <User size={18} className={styles.inputIcon} />
                <input
                  id="onboarding-name"
                  className={styles.input}
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={handleNameChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Username input */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="onboarding-username">
                Username
              </label>
              <div className={styles.inputWrap}>
                <AtSign size={18} className={styles.inputIcon} />
                <input
                  id="onboarding-username"
                  className={styles.input}
                  type="text"
                  placeholder="jane_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoComplete="username"
                  maxLength={30}
                  required
                />
              </div>
              {username && !isUsernameValid && (
                <span className={styles.helperText} style={{ color: '#ef4444' }}>
                  Must be 3–30 letters, numbers, or underscores
                </span>
              )}
            </div>
          </div>

          {/* Referral code (Optional) */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="onboarding-referral">
              Referral code (Optional)
            </label>
            <div className={styles.inputWrap}>
              <Gift size={18} className={styles.inputIcon} />
              <input
                id="onboarding-referral"
                className={styles.input}
                type="text"
                placeholder="e.g. XJQP (earn 50 bonus coins)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={10}
              />
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className={styles.checkText}>
              I agree to the{' '}
              <span className={styles.link} onClick={() => navigateTo('/terms')}>
                Terms of Service
              </span>{' '}
              and{' '}
              <span className={styles.link} onClick={() => navigateTo('/privacy')}>
                Privacy Policy
              </span>
              , and confirm that I am at least 18 years old.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isFormValid || submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                <span>Finalizing account...</span>
              </>
            ) : (
              <>
                <span>Complete account &amp; enter</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Sign out link if user needs to switch accounts */}
        <div className={styles.logoutRow}>
          <span>Signed into the wrong account?</span>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default OnboardingPage;
