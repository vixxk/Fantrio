import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { MessageSquare, CreditCard, Zap, SlidersHorizontal } from 'lucide-react';
import styles from './SettingsPage.module.css';

export const ContactSupportPage = ({ setStatus, onBusyChange, onDirtyChange }) => {
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Keep the header submit button in sync with this page's submitting state.
  useEffect(() => {
    if (onBusyChange) onBusyChange(submitting);
    return () => { if (onBusyChange) onBusyChange(false); };
  }, [submitting, onBusyChange]);

  // The header submit button stays disabled until the required fields
  // (subject and message) are filled in. Resets to disabled after submit.
  useEffect(() => {
    const canSubmit = form.subject.trim().length > 0 && form.message.trim().length > 0;
    if (onDirtyChange) onDirtyChange(canSubmit);
    return () => { if (onDirtyChange) onDirtyChange(false); };
  }, [form, onDirtyChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
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
        <h3>How can we assist you today?</h3>
        <p>Fill out the details below to open a direct ticket with our specialized support desk. Average response time is within 24 hours.</p>
      </div>

      <form id="contact-support-form" onSubmit={handleSubmit} className={styles.formGrid}>
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

      </form>
    </div>
  );
};
