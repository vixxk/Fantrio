import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Lightbulb, ThumbsUp, Plus, Sparkles, Flame, CheckCircle2, Clock, Loader } from 'lucide-react';
import styles from './MorePage.module.css';

export const FeatureRequestsPage = ({ setStatusMsg }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/features');
      if (res.status === 'success') setFeatures(res.features || []);
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to load feature requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadFeatures();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setSubmitting(true);
    if (setStatusMsg) setStatusMsg({ type: '', text: '' });
    try {
      const res = await api.post('/more/features', form);
      if (res.status === 'success') {
        if (setStatusMsg) setStatusMsg({ type: 'success', text: 'Feature suggestion submitted successfully!' });
        setForm({ title: '', description: '' });
        setShowForm(false);
        loadFeatures();
      }
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to submit feature.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id) => {
    try {
      const res = await api.post(`/more/features/${id}/vote`);
      if (res.status === 'success') {
        setFeatures(prev => prev.map(f => (
          f._id === id ? { ...f, votesCount: res.votesCount, hasVoted: res.hasVoted } : f
        )));
      }
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to register vote.' });
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'under_review').toLowerCase();
    if (s === 'planned') return <span className={`${styles.featureBadge} ${styles.planned}`}><Clock size={12} /> Planned</span>;
    if (s === 'completed') return <span className={`${styles.featureBadge} ${styles.completed}`}><CheckCircle2 size={12} /> Completed</span>;
    return <span className={`${styles.featureBadge} ${styles.review}`}><Flame size={12} /> Under Review</span>;
  };

  if (loading) {
    return <SkeletonGrid />;
  }

  return (
    <div className={styles.subViewGrid}>
      <div className={styles.featureHero}>
        <div className={styles.featureHeroLeft}>
          <div className={styles.featureIconBadge}>
            <Lightbulb size={26} />
          </div>
          <div>
            <h3>Community Feature Request Board</h3>
            <p>Vote on new ideas or propose features you'd like to see implemented on Fantrio.</p>
          </div>
        </div>
        <button className={styles.submitIdeaBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Close Form' : 'Submit Idea'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className={styles.featureFormCard}>
          <h4>Propose a New Feature</h4>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="e.g. Dark theme schedule mode"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Detailed Description</label>
            <textarea
              rows={4}
              className={styles.formTextarea}
              placeholder="Explain how this feature works and why it would benefit users..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? <Loader size={16} className={styles.spin} /> : <Sparkles size={16} />} Submit Feature Suggestion
          </button>
        </form>
      )}

      {features.length === 0 ? (
        <div className={styles.emptyBox}>
          <Lightbulb size={40} className={styles.emptyIcon} />
          <p>No feature requests submitted yet. Be the first to suggest an idea!</p>
        </div>
      ) : (
        <div className={styles.featureList}>
          {features.map((f) => (
            <div key={f._id} className={styles.featureCard}>
              <button
                type="button"
                className={`${styles.voteBox} ${f.hasVoted ? styles.votedBox : ''}`}
                onClick={() => handleVote(f._id)}
              >
                <ThumbsUp size={18} />
                <span className={styles.voteCountNum}>{f.votesCount || 0}</span>
                <span className={styles.voteTextLabel}>{f.hasVoted ? 'Voted' : 'Vote'}</span>
              </button>

              <div className={styles.featureContentCol}>
                <div className={styles.featureHeaderRow}>
                  <h4 className={styles.featureTitle}>{f.title}</h4>
                  {getStatusBadge(f.status)}
                </div>
                <p className={styles.featureDesc}>{f.description}</p>
                <div className={styles.featureMetaRow}>
                  <span>Suggested by @{f.userId?.username || 'user'}</span>
                  <span>•</span>
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SkeletonGrid = () => (
  <div className={styles.subViewGrid}>
    <div className="skeleton-card" style={{ height: '140px', borderRadius: '16px' }} />
    <div className="skeleton-card" style={{ height: '100px', borderRadius: '16px' }} />
  </div>
);
