import { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { ShieldAlert, User, FileText, Loader, Search, X, Check } from 'lucide-react';
import styles from './SettingsPage.module.css';

const getInitialTargetType = (initialTargetType) => {
  if (initialTargetType) return initialTargetType;
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const search = window.location.search;
    if (pathname.includes('report-content') || search.includes('type=content')) return 'content';
    if (pathname.includes('report-creator') || search.includes('type=creator')) return 'creator';
  }
  return 'creator';
};

export const ReportProblemPage = ({ setStatus, onBusyChange, initialTargetType }) => {
  const [targetType, setTargetType] = useState(() => getInitialTargetType(initialTargetType));
  const [reason, setReason] = useState('Inappropriate Content');
  const [description, setDescription] = useState('');
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contentRef, setContentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialTargetType) {
      setTargetType(initialTargetType);
    } else if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      if (pathname.includes('report-content') || search.includes('type=content')) {
        setTargetType('content');
      } else if (pathname.includes('report-creator') || search.includes('type=creator')) {
        setTargetType('creator');
      }
    }
  }, [initialTargetType]);

  useEffect(() => {
    if (targetType === 'creator' && creators.length === 0) {
      api.get('/more/creators')
        .then(res => { if (res.status === 'success') setCreators(res.creators || []); })
        .catch(() => {});
    }
  }, [targetType, creators.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (onBusyChange) onBusyChange(submitting);
  }, [submitting, onBusyChange]);

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
        setSearchQuery('');
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

  const filteredCreators = creators.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (c.displayName || '').toLowerCase();
    const user = (c.username || '').toLowerCase();
    return name.includes(q) || user.includes(q);
  });

  const handleSelectCreator = (c) => {
    const id = c.userId || c._id;
    setCreatorId(id);
    setSearchQuery(c.displayName ? `${c.displayName} (@${c.username})` : `@${c.username}`);
    setDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setCreatorId('');
    setSearchQuery('');
    setDropdownOpen(true);
  };

  return (
    <div className={styles.subPageBody}>
      <div className={styles.reportHeroCard}>
        <ShieldAlert size={26} className={styles.reportShieldIcon} />
        <div>
          <h3>Safety & Moderation Report</h3>
          <p>Report safety issues, harassment, or policy breaches to our 24/7 Trust & Safety Team.</p>
        </div>
      </div>

      <form id="report-problem-form" onSubmit={handleSubmit} className={styles.formGrid}>
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
            <div className={styles.creatorSearchWrapper} ref={dropdownRef}>
              <div className={styles.creatorSearchInputBox}>
                <Search size={16} className={styles.creatorSearchIcon} />
                <input
                  type="text"
                  className={styles.creatorSearchInput}
                  placeholder="Search creator by name or @username..."
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (creatorId) {
                      setCreatorId('');
                    }
                    setDropdownOpen(true);
                  }}
                  required={!creatorId}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.creatorSearchClearBtn}
                    onClick={handleClearSelection}
                    aria-label="Clear creator selection"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {dropdownOpen && (
                <div className={styles.creatorDropdownList}>
                  {filteredCreators.length > 0 ? (
                    filteredCreators.map(c => {
                      const id = c.userId || c._id;
                      const isSelected = id === creatorId;
                      return (
                        <div
                          key={id}
                          className={`${styles.creatorOptionItem} ${isSelected ? styles.creatorOptionSelected : ''}`}
                          onClick={() => handleSelectCreator(c)}
                        >
                          <img
                            src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={c.displayName}
                            className={styles.creatorOptionAvatar}
                          />
                          <div className={styles.creatorOptionInfo}>
                            <span className={styles.creatorOptionName}>{c.displayName}</span>
                            <span className={styles.creatorOptionUsername}>@{c.username}</span>
                          </div>
                          {isSelected && <Check size={16} style={{ marginLeft: 'auto', color: '#7e00f3' }} />}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.creatorOptionEmpty}>
                      No creators found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
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
          <div className={styles.reasonSelectMobile}>
            <select
              className={styles.formSelect}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {reasonOptions.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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
          <button
            type="submit"
            disabled={submitting}
            className={styles.saveProfileHeaderBtn}
            style={{ margin: 0 }}
          >
            {submitting ? (
              <>
                <Loader size={16} className={styles.spin} />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Submit Safety Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
