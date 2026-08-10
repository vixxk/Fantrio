import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { ShieldAlert, User, FileText, Loader } from 'lucide-react';
import styles from './SettingsPage.module.css';

export const ReportProblemPage = ({ setStatus }) => {
  const [targetType, setTargetType] = useState('creator');
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [contentRef, setContentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetType === 'creator' && creators.length === 0) {
      api.get('/more/creators')
        .then(res => { if (res.status === 'success') setCreators(res.creators || []); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setStatus) setStatus({ type: '', text: '' });
    if (targetType === 'creator' && !creatorId) {
      if (setStatus) setStatus({ type: 'error', text: 'Please select a creator to report.' });
      return;
    }
    if (targetType === 'content' && !contentRef.trim()) {
      if (setStatus) setStatus({ type: 'error', text: 'Please provide a content reference or post ID.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/more/reports', {
        targetType,
        targetId: targetType === 'creator' ? creatorId : contentRef.trim(),
        reason,
        description,
      });
      if (res.status === 'success') {
        if (setStatus) setStatus({ type: 'success', text: 'Report submitted successfully. Our safety team will investigate.' });
        setReason('Inappropriate Content');
        setDescription('');
        setCreatorId('');
        setContentRef('');
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  const reasonOptions = [
    'Inappropriate Content',
    'Harassment / Bullying',
    'Scam / Fraud',
    'Impersonation',
    'Copyright Infringement',
    'Violence / Hate Speech',
    'Other Violations'
  ];

  return (
    <div className={styles.subPageBody}>
      <div className={styles.reportHeroCard}>
        <ShieldAlert size={26} className={styles.reportShieldIcon} />
        <div>
          <h3>Safety & Moderation Report</h3>
          <p>Report safety issues, harassment, or policy breaches to our 24/7 Trust & Safety Team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>What would you like to report?</label>
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${targetType === 'creator' ? styles.segmentActive : ''}`}
              onClick={() => setTargetType('creator')}
            >
              <User size={16} /> Creator Profile
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${targetType === 'content' ? styles.segmentActive : ''}`}
              onClick={() => setTargetType('content')}
            >
              <FileText size={16} /> Content / Post
            </button>
          </div>
        </div>

        {targetType === 'creator' ? (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Creator</label>
            <select className={styles.formSelect} value={creatorId} onChange={(e) => setCreatorId(e.target.value)} required>
              <option value="">-- Choose Creator Profile --</option>
              {creators.map(c => (
                <option key={c.userId || c._id} value={c.userId || c._id}>
                  {c.displayName} (@{c.username})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Post ID or Link Reference</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Paste post URL or ID..."
              value={contentRef}
              onChange={(e) => setContentRef(e.target.value)}
              required
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Select Violation Reason</label>
          <div className={styles.reasonPillGrid}>
            {reasonOptions.map(r => (
              <button
                key={r}
                type="button"
                className={`${styles.reasonPill} ${reason === r ? styles.reasonPillActive : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Evidence & Timestamps</label>
          <textarea
            rows={4}
            className={styles.formTextarea}
            placeholder="Provide specific details or timestamps of the inappropriate behavior..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.formActionsRight}>
          <button type="submit" disabled={submitting} className={styles.dangerBtn}>
            {submitting ? <><Loader size={16} className={styles.spin} /> Submitting...</> : <><ShieldAlert size={16} /> Submit Safety Report</>}
          </button>
        </div>
      </form>
    </div>
  );
};
