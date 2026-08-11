import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  KeyRound, ShieldCheck, ShieldAlert, Shield, Check, X,
  Smartphone, Laptop, Monitor, Loader, Zap, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import styles from './SettingsPage.module.css';

export const SecurityPage = ({ setStatus }) => {
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // 2FA flow state
  const [twoFaStep, setTwoFaStep] = useState('idle'); // idle | sent | enabled
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const loadSecurity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/security');
      if (res.status === 'success') {
        setSecurity(res.security);
        setTwoFaStep(res.security.twoFactorEnabled ? 'enabled' : 'idle');
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load security settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadSecurity();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Enter a password', color: 'rgba(255,255,255,0.2)' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score === 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (score === 3) return { score: 3, label: 'Good', color: '#3b82f6' };
    if (score >= 4) return { score: 4, label: 'Strong', color: '#10b981' };
    return { score: 1, label: 'Weak', color: '#ef4444' };
  };

  const pwdStrength = getPasswordStrength(pwdForm.newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (setStatus) setStatus({ type: '', text: '' });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      if (setStatus) setStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      if (setStatus) setStatus({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await api.patch('/auth/update-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      if (res.status === 'success') {
        if (setStatus) setStatus({ type: 'success', text: 'Password updated successfully!' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFaBusy(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/enable', {});
      if (res.status === 'success') {
        setTwoFaStep('sent');
        setTwoFaCode('');
        if (setStatus) setStatus({ type: 'success', text: res.message || 'Verification code sent to your email.' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to send verification code.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/verify', { code: twoFaCode });
      if (res.status === 'success') {
        setTwoFaStep('enabled');
        setTwoFaCode('');
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        if (setStatus) setStatus({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/disable', { currentPassword: disablePwd });
      if (res.status === 'success') {
        setTwoFaStep('idle');
        setDisablePwd('');
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false }));
        if (setStatus) setStatus({ type: 'success', text: 'Two-factor authentication disabled.' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to disable 2FA.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  if (loading) {
    return <SkeletonRows />;
  }

  const deviceIcon = (device) => {
    if (/mobile|android|iphone|ipad/i.test(device)) return <Smartphone size={16} />;
    if (/apple|mac/i.test(device)) return <Monitor size={16} />;
    if (/linux/i.test(device)) return <Laptop size={16} />;
    return <Laptop size={16} />;
  };

  return (
    <div className={styles.subPageBody}>
      {/* 2FA Card */}
      <div className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={`${styles.securityIconBox} ${twoFaStep === 'enabled' ? styles.shieldActiveGlow : ''}`}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className={styles.secTitleBadgeRow}>
                <h3 className={styles.securityCardTitle}>Two-Factor Authentication (2FA)</h3>
                <span className={`${styles.securityStatusBadge} ${twoFaStep === 'enabled' ? styles.enabled : styles.disabled}`}>
                  <span className={styles.pulseDot} />
                  {twoFaStep === 'enabled' ? '2FA Protection Active' : '2FA Disabled'}
                </span>
              </div>
              <p className={styles.securityCardDesc}>
                Protect your account from unauthorized logins by requiring a one-time verification code sent to your email.
              </p>

              {twoFaStep === 'idle' && (
                <div className={styles.twoFaBenefits}>
                  <span className={styles.benefitItem}><CheckCircle2 size={14} /> Instant email login notifications</span>
                  <span className={styles.benefitItem}><CheckCircle2 size={14} /> Prevents unauthorized account access</span>
                </div>
              )}
            </div>
          </div>

          {twoFaStep === 'idle' && (
            <button onClick={handleEnable2FA} disabled={twoFaBusy} className={styles.submitBtn}>
              {twoFaBusy ? <><Loader size={16} className={styles.spin} /> Sending Code...</> : <><ShieldCheck size={16} /> Setup 2FA Security</>}
            </button>
          )}
        </div>

        {twoFaStep === 'enabled' && (
          <form onSubmit={handleDisable2FA} className={styles.twoFaForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Enter password to confirm 2FA deactivation</label>
              <input
                type="password"
                className={styles.formInput}
                placeholder="Current account password"
                value={disablePwd}
                onChange={(e) => setDisablePwd(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={twoFaBusy} className={styles.dangerBtn}>
              {twoFaBusy ? 'Deactivating 2FA...' : 'Disable 2FA Security'}
            </button>
          </form>
        )}

        {twoFaStep === 'sent' && (
          <form onSubmit={handleVerify2FA} className={styles.twoFaForm}>
            <div className={styles.otpCardBox}>
              <Zap size={24} className={styles.otpZapIcon} />
              <h4>Enter 6-Digit Email Code</h4>
              <p>We've dispatched a security code to your email inbox. Enter it below to enable 2FA.</p>
              <div className={styles.otpInputRow}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={styles.otpInputBig}
                  placeholder="0 0 0 0 0 0"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.twoFaActions}>
              <button type="submit" disabled={twoFaBusy || twoFaCode.length < 6} className={styles.submitBtn}>
                {twoFaBusy ? <Loader size={16} className={styles.spin} /> : <CheckCircle2 size={16} />} Verify & Enable 2FA
              </button>
              <button type="button" className={styles.cancelBtn} onClick={() => setTwoFaStep('idle')} disabled={twoFaBusy}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change password Card */}
      <form onSubmit={handleChangePassword} className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={styles.securityIconBox}>
              <KeyRound size={22} />
            </div>
            <div>
              <h3 className={styles.securityCardTitle}>Change Password</h3>
              <p className={styles.securityCardDesc}>Ensure your account remains safe with a strong, unique password.</p>
            </div>
          </div>
          <button type="submit" disabled={savingPwd} className={`${styles.submitBtn} ${styles.pwdSubmitBtn}`}>
            {savingPwd ? <><Loader size={16} className={styles.spin} /> Updating...</> : 'Update Password'}
          </button>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Current Password</label>
            <div className={styles.inputWithIconWrap}>
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                className={styles.formInput}
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
                placeholder="••••••••••••"
              />
              <button
                type="button"
                className={styles.inputEyeBtn}
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                tabIndex={-1}
              >
                {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>New Password</label>
              <div className={styles.inputWithIconWrap}>
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  className={styles.formInput}
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  required
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  className={styles.inputEyeBtn}
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  tabIndex={-1}
                >
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Confirm New Password</label>
              <input
                type="password"
                className={styles.formInput}
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          {pwdForm.newPassword && (
            <div className={styles.strengthMeterBox}>
              <div className={styles.strengthMeterHeader}>
                <span>Password Strength:</span>
                <strong style={{ color: pwdStrength.color }}>{pwdStrength.label}</strong>
              </div>
              <div className={styles.strengthBarsRow}>
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={styles.strengthBar}
                    style={{
                      background: step <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
              <div className={styles.pwdChecklist}>
                <span className={pwdForm.newPassword.length >= 8 ? styles.checkPass : styles.checkFail}>
                  {pwdForm.newPassword.length >= 8 ? <Check size={12} /> : <X size={12} />} 8+ characters
                </span>
                <span className={/[A-Z]/.test(pwdForm.newPassword) ? styles.checkPass : styles.checkFail}>
                  {/[A-Z]/.test(pwdForm.newPassword) ? <Check size={12} /> : <X size={12} />} Uppercase letter
                </span>
                <span className={/[0-9]/.test(pwdForm.newPassword) ? styles.checkPass : styles.checkFail}>
                  {/[0-9]/.test(pwdForm.newPassword) ? <Check size={12} /> : <X size={12} />} Number (0-9)
                </span>
                <span className={/[^A-Za-z0-9]/.test(pwdForm.newPassword) ? styles.checkPass : styles.checkFail}>
                  {/[^A-Za-z0-9]/.test(pwdForm.newPassword) ? <Check size={12} /> : <X size={12} />} Special symbol
                </span>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Login activity */}
      <div className={styles.securityCard}>
        <div className={styles.securityCardHeader}>
          <div className={styles.securityCardTitleRow}>
            <div className={styles.securityIconBox}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className={styles.securityCardTitle}>Login Activity</h3>
              <p className={styles.securityCardDesc}>Recently used devices and locations for your account.</p>
            </div>
          </div>
        </div>

        {!security?.loginActivity || security.loginActivity.length === 0 ? (
          <div className={styles.emptyBox}>
            <Shield size={40} className={styles.emptyBoxIcon} />
            <p>No recent login activity recorded.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {security.loginActivity.map((a, idx) => (
              <div key={idx} className={styles.activityRow}>
                <div className={styles.activityIconWrap}>{deviceIcon(a.device)}</div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityDevice}>{a.device}</span>
                  <span className={styles.activityMeta}>
                    {a.ip || 'Unknown IP'}{a.location && a.location !== '—' ? ` • ${a.location}` : ''}
                  </span>
                </div>
                <span className={styles.activityTime}>
                  {new Date(a.loggedInAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonRows = () => (
  <div className={styles.subPageBody}>
    <div className="skeleton-card" style={{ height: '60px', padding: '1rem', marginBottom: '1.5rem' }}>
      <div className="skeleton-box skeleton-title" style={{ width: '200px', height: '100%' }} />
    </div>
    {Array.from({ length: 3 }).map((_, idx) => (
      <div key={idx} className="skeleton-card" style={{ padding: '1.2rem', marginBottom: '1rem', gap: '0.8rem' }}>
        <div className="skeleton-box skeleton-title" style={{ width: '150px' }} />
        <div className="skeleton-box skeleton-content-line" />
        <div className="skeleton-box skeleton-content-line short" />
      </div>
    ))}
  </div>
);
