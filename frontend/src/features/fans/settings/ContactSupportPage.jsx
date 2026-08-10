import { useState } from 'react';
import { api } from '../../../services/api';
import { MessageSquare, CreditCard, Zap, SlidersHorizontal, Sparkles, Loader } from 'lucide-react';
import styles from './SettingsPage.module.css';

export const ContactSupportPage = ({ setStatus }) => {
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setSubmitting(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/more/tickets', form);
      if (res.status === 'success') {
        if (setStatus) setStatus({ type: 'success', text: 'Support ticket submitted successfully! Our team will respond shortly.' });
        setForm({ subject: '', category: 'general', message: '' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to submit ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const categoriesList = [
    { id: 'general', label: 'General Inquiry', icon: MessageSquare },
    { id: 'billing', label: 'Billing & Purchases', icon: CreditCard },
    { id: 'technical', label: 'Technical Issues', icon: Zap },
    { id: 'other', label: 'Other Inquiries', icon: SlidersHorizontal },
  ];

  return (
    <div className={styles.subPageBody}>
      <div className={styles.contactHeroCard}>
        <div className={styles.liveSupportBadge}>
          <span className={styles.greenPulseDot} /> 24/7 Support Desk Online
        </div>
        <h3>How can we assist you today?</h3>
        <p>Fill out the details below to open a direct ticket with our specialized support desk. Average response time is under 5 minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Select Category</label>
          <div className={styles.contactCatGrid}>
            {categoriesList.map(cat => {
              const IconComp = cat.icon;
              const isSelected = form.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.contactCatCard} ${isSelected ? styles.contactCatActive : ''}`}
                  onClick={() => setForm({ ...form, category: cat.id })}
                >
                  <IconComp size={18} className={styles.catCardIcon} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Ticket Subject</label>
          <input
            type="text"
            className={styles.formInput}
            required
            placeholder="Briefly describe what you need help with..."
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Detailed Explanation</label>
          <textarea
            rows={5}
            required
            className={styles.formTextarea}
            placeholder="Include any relevant details, error messages, transaction IDs, or usernames..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>

        <div className={styles.formActionsRight}>
          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? <><Loader size={16} className={styles.spin} /> Submitting Ticket...</> : <><Sparkles size={16} /> Submit Support Ticket</>}
          </button>
        </div>
      </form>
    </div>
  );
};
