import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Check, ChevronRight, ShieldCheck, KeyRound, Lock, Unlock, X } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

/* ------------------------------ Shared wrapper ------------------------------ */

const Modal = ({ darkMode, title, subtitle, onClose, children, width }) => (
  <div className={`${styles.modalBackdrop} ${!darkMode ? styles.lightModalBackdrop : ''}`} onClick={onClose}>
    <div
      className={styles.modalCard}
      style={width ? { maxWidth: width } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.modalHeader}>
        <div className={styles.modalTitleWrap}>
          <h3 className={styles.modalTitle}>{title}</h3>
          {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
        </div>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const StatusMsg = ({ type, text }) =>
  text ? (
    <div className={`${styles.modalStatus} ${type === 'success' ? styles.modalStatusSuccess : styles.modalStatusError}`}>
      {type === 'success' ? <Check size={14} /> : <X size={14} />} {text}
    </div>
  ) : null;

/* ------------------------------ Security (2FA + password) ------------------------------ */

export const SecurityModal = ({ darkMode, onClose, onChanged }) => {
  const [twoFaStep, setTwoFaStep] = useState('idle'); // idle | sent | enabled
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;
    api.get('/settings/security')
      .then((res) => {
        if (mounted && res.status === 'success' && res.security) {
          setTwoFaStep(res.security.twoFactorEnabled ? 'enabled' : 'idle');
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleEnable2FA = async () => {
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/enable', {});
      if (res.status === 'success') {
        setTwoFaStep('sent');
        setTwoFaCode('');
        setStatus({ type: 'success', text: 'Verification code sent to your email.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to send verification code.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/verify', { code: twoFaCode });
      if (res.status === 'success') {
        setTwoFaStep('enabled');
        setTwoFaCode('');
        setStatus({ type: 'success', text: 'Two-factor authentication enabled.' });
        if (onChanged) onChanged();
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFaBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/security/2fa/disable', { currentPassword: disablePwd });
      if (res.status === 'success') {
        setTwoFaStep('idle');
        setDisablePwd('');
        setStatus({ type: 'success', text: 'Two-factor authentication disabled.' });
        if (onChanged) onChanged();
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to disable 2FA.' });
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setStatus({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await api.patch('/auth/update-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Password updated successfully!' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Security" subtitle="Manage your password and two-factor authentication." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />

      {/* 2FA */}
      <div className={styles.modalSection}>
        <div className={styles.modalSectionHeader}>
          <div className={styles.modalSectionIcon}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.modalSectionTitleWrap}>
            <h4 className={styles.modalSectionTitle}>Two-Factor Authentication</h4>
            <p className={styles.modalSectionDesc}>We'll send a one-time code to your email when you sign in.</p>
          </div>
          <span className={`${styles.modalBadge} ${twoFaStep === 'enabled' ? styles.modalBadgeActive : ''}`}>
            {twoFaStep === 'enabled' ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {twoFaStep === 'enabled' ? (
          <form onSubmit={handleDisable2FA} className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Enter your current password to disable 2FA</label>
              <input
                type="password"
                className={styles.formInput}
                placeholder="Current password"
                value={disablePwd}
                onChange={(e) => setDisablePwd(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={twoFaBusy} className={`${styles.modalBtn} ${styles.modalBtnDanger}`}>
              {twoFaBusy ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </form>
        ) : twoFaStep === 'sent' ? (
          <form onSubmit={handleVerify2FA} className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Enter the 6-digit code from your email</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={styles.formInput}
                placeholder="123456"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                required
              />
            </div>
            <div className={styles.modalBtnRow}>
              <button type="submit" disabled={twoFaBusy} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
                {twoFaBusy ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button type="button" className={styles.modalBtnGhost} onClick={() => setTwoFaStep('idle')} disabled={twoFaBusy}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={handleEnable2FA} disabled={twoFaBusy} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
            {twoFaBusy ? 'Sending code...' : 'Enable 2FA'}
          </button>
        )}
      </div>

      {/* Change password */}
      <div className={styles.modalSection}>
        <div className={styles.modalSectionHeader}>
          <div className={styles.modalSectionIcon}>
            <KeyRound size={18} />
          </div>
          <div className={styles.modalSectionTitleWrap}>
            <h4 className={styles.modalSectionTitle}>Change Password</h4>
            <p className={styles.modalSectionDesc}>Use a strong password that you don't use anywhere else.</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Current Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>New Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirm New Password</label>
            <input
              type="password"
              className={styles.formInput}
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={savingPwd} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
            {savingPwd ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

/* ------------------------------ Payout details ------------------------------ */

export const PayoutDetailsModal = ({ darkMode, payoutSettings, onClose, onSaved }) => {
  const [form, setForm] = useState({
    accountHolder: '',
    bankName: '',
    routingNumber: '',
    accountNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const payoutMethod = {};
      if (form.accountHolder.trim()) payoutMethod.accountHolder = form.accountHolder.trim();
      if (form.bankName.trim()) payoutMethod.bankName = form.bankName.trim();
      if (form.routingNumber.trim()) payoutMethod.routingNumber = form.routingNumber.trim();
      if (form.accountNumber.trim()) payoutMethod.accountNumber = form.accountNumber.trim();
      if (Object.keys(payoutMethod).length === 0) {
        setStatus({ type: 'error', text: 'Enter at least one field to update.' });
        setSaving(false);
        return;
      }
      const res = await api.put('/creators/panel/settings', { payoutMethod });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Payout details updated successfully.' });
        setForm({ accountHolder: '', bankName: '', routingNumber: '', accountNumber: '' });
        if (onSaved) onSaved();
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to update payout details.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Update Payout Details" subtitle="Update your connected bank account information." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />
      <div className={styles.payoutModalCurrent}>
        <span>Connected account: {payoutSettings.bankName || 'Bank Transfer'}</span>
        {payoutSettings.verified && <span className={styles.verifiedBadge}>Verified</span>}
      </div>
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Account Holder</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder={payoutSettings.accountHolder || 'Name on account'}
            value={form.accountHolder}
            onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Bank Name</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder={payoutSettings.bankName || 'Bank name'}
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Routing Number</label>
            <input
              type="text"
              inputMode="numeric"
              className={styles.formInput}
              placeholder={payoutSettings.routingNumber || '•••• 0000'}
              value={form.routingNumber}
              onChange={(e) => setForm({ ...form, routingNumber: e.target.value.replace(/[^0-9]/g, '') })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Account Number</label>
            <input
              type="text"
              inputMode="numeric"
              className={styles.formInput}
              placeholder={payoutSettings.accountNumber || '•••• 0000'}
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
          {saving ? 'Saving...' : 'Save Payout Details'}
        </button>
      </form>
    </Modal>
  );
};

/* ------------------------------ Blocked users ------------------------------ */

export const BlockedUsersModal = ({ darkMode, onClose, onChanged }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busyId, setBusyId] = useState(null);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const res = await api.get('/block');
      if (res.status === 'success') setUsers(res.blockedUsers || []);
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to load blocked users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => loadBlocked());
  }, []);

  const handleUnblock = async (id) => {
    setBusyId(id);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.delete(`/block/${id}`);
      if (res.status === 'success') {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        setStatus({ type: 'success', text: 'User unblocked successfully.' });
        if (onChanged) onChanged();
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to unblock user.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Blocked Users" subtitle="Users you have blocked can't message you or view your content." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />
      {loading ? (
        <p className={styles.modalEmpty}>Loading...</p>
      ) : users.length === 0 ? (
        <p className={styles.modalEmpty}>You haven't blocked anyone yet.</p>
      ) : (
        <div className={styles.modalList}>
          {users.map((u) => (
            <div key={u._id} className={styles.modalListItem}>
              <img src={u.avatarUrl || ''} alt={u.displayName || u.username} className={styles.modalAvatar} />
              <div className={styles.modalListInfo}>
                <span className={styles.modalListName}>{u.displayName || u.username}</span>
                <span className={styles.modalListMeta}>@{u.username}</span>
              </div>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnDanger} ${styles.modalBtnSmall}`}
                onClick={() => handleUnblock(u._id)}
                disabled={busyId === u._id}
              >
                <Unlock size={13} /> {busyId === u._id ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------ Avatar ------------------------------ */

export const AvatarModal = ({ darkMode, currentAvatar, onClose, onSaved }) => {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setStatus({ type: 'error', text: 'Please enter an image URL.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.put('/creators/panel/settings', { avatarUrl: url.trim() });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Profile picture updated.' });
        if (onSaved) onSaved();
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to update profile picture.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Profile Picture" subtitle="Paste the URL of your new profile picture." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />
      <div className={styles.avatarModalPreview}>
        <img src={url.trim() || currentAvatar || ''} alt="Preview" className={styles.avatarModalImg} />
      </div>
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Image URL</label>
          <input
            type="url"
            className={styles.formInput}
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
          {saving ? 'Saving...' : 'Update Picture'}
        </button>
      </form>
    </Modal>
  );
};

/* ------------------------------ Help Centre (FAQ) ------------------------------ */

export const HelpModal = ({ darkMode, onClose }) => {
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/settings/faqs')
      .then((res) => {
        if (mounted && res.status === 'success') setFaqs(res.faqs || []);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <Modal darkMode={darkMode} title="Help Centre" subtitle="Browse the most common questions below." onClose={onClose}>
      {loading ? (
        <p className={styles.modalEmpty}>Loading...</p>
      ) : faqs.length === 0 ? (
        <p className={styles.modalEmpty}>No articles published yet.</p>
      ) : (
        <div className={styles.modalAccordion}>
          {faqs.map((faq, idx) => (
            <div key={faq._id || idx} className={styles.modalAccordionItem}>
              <button
                className={styles.modalAccordionTrigger}
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <span>{faq.question}</span>
                <ChevronRight size={16} className={`${styles.modalAccordionChevron} ${expanded === idx ? styles.modalAccordionOpen : ''}`} />
              </button>
              {expanded === idx && <div className={styles.modalAccordionPanel}><p>{faq.answer}</p></div>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------ Contact support ------------------------------ */

export const ContactSupportModal = ({ darkMode, onClose }) => {
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Subject and message are required.' });
      return;
    }
    setSubmitting(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/more/tickets', form);
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Support ticket submitted! Our team will get back to you soon.' });
        setForm({ subject: '', category: 'general', message: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to submit ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Contact Support" subtitle="Our team is available 24/7. Submit a ticket and we'll respond soon." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Subject</label>
          <input
            type="text"
            className={styles.formInput}
            required
            placeholder="Summarize your issue..."
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Category</label>
          <select className={styles.formSelect} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General Inquiry</option>
            <option value="billing">Billing & Purchases</option>
            <option value="technical">Technical Issues</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Message Details</label>
          <textarea
            rows={5}
            required
            className={styles.formTextarea}
            placeholder="Describe your issue or question in detail..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button type="submit" disabled={submitting} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
          {submitting ? 'Submitting...' : 'Submit Support Ticket'}
        </button>
      </form>
    </Modal>
  );
};

/* ------------------------------ Report issue ------------------------------ */

export const ReportIssueModal = ({ darkMode, onClose }) => {
  const [targetType, setTargetType] = useState('creator');
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [contentRef, setContentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    if (targetType === 'creator' && creators.length === 0) {
      api.get('/creators')
        .then((res) => { if (res.status === 'success') setCreators(res.creators || []); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (targetType === 'creator' && !creatorId) {
      setStatus({ type: 'error', text: 'Please select a creator to report.' });
      return;
    }
    if (targetType === 'content' && !contentRef.trim()) {
      setStatus({ type: 'error', text: 'Please provide a post ID or content reference.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/more/reports', {
        targetType,
        targetId: targetType === 'creator' ? creatorId : contentRef.trim(),
        reason,
        description
      });
      if (res.status === 'success') {
        setStatus({ type: 'success', text: 'Report submitted. Our safety team will review it.' });
        setReason('Inappropriate Content');
        setDescription('');
        setCreatorId('');
        setContentRef('');
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal darkMode={darkMode} title="Report an Issue" subtitle="Report content or behaviour that violates our guidelines." onClose={onClose}>
      <StatusMsg type={status.type} text={status.text} />
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>What would you like to report?</label>
          <div className={styles.modalSegment}>
            <button
              type="button"
              className={`${styles.modalSegmentBtn} ${targetType === 'creator' ? styles.modalSegmentActive : ''}`}
              onClick={() => setTargetType('creator')}
            >
              <Lock size={14} /> Creator
            </button>
            <button
              type="button"
              className={`${styles.modalSegmentBtn} ${targetType === 'content' ? styles.modalSegmentActive : ''}`}
              onClick={() => setTargetType('content')}
            >
              <Check size={14} /> Content / Post
            </button>
          </div>
        </div>

        {targetType === 'creator' ? (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Creator</label>
            <select className={styles.formSelect} value={creatorId} onChange={(e) => setCreatorId(e.target.value)}>
              <option value="">-- Choose Creator --</option>
              {creators.map((c) => (
                <option key={c._id} value={c.userId || c._id}>
                  {c.displayName} (@{c.username})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Post ID / Content Reference</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Enter the post ID..."
              value={contentRef}
              onChange={(e) => setContentRef(e.target.value)}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Violation Reason</label>
          <select className={styles.formSelect} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Harassment/Bullying">Harassment / Bullying</option>
            <option value="Scam/Fraud">Scam / Fraud</option>
            <option value="Impersonation">Impersonation</option>
            <option value="Copyright Infringement">Copyright Infringement</option>
            <option value="Violence/Hate Speech">Violence / Hate Speech</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description / Evidence</label>
          <textarea
            rows={4}
            className={styles.formTextarea}
            placeholder="Provide details or timestamps..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" disabled={submitting} className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </Modal>
  );
};
