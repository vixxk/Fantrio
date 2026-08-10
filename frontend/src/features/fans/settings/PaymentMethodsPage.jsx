import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { CreditCard, Plus, Trash2, Star, X, Loader } from 'lucide-react';
import styles from './SettingsPage.module.css';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'];

export const PaymentMethodsPage = ({ setStatus }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cardBrand: 'Visa',
    holderName: '',
    last4: '',
    expMonth: '',
    expYear: '',
    billingAddress: '',
  });

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/payment-methods');
      if (res.status === 'success') setMethods(res.paymentMethods || []);
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to load payment methods.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMethods();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.post('/settings/payment-methods', {
        ...form,
        expMonth: parseInt(form.expMonth, 10),
        expYear: parseInt(form.expYear, 10),
      });
      if (res.status === 'success') {
        setMethods(prev => [res.paymentMethod, ...prev]);
        setForm({ cardBrand: 'Visa', holderName: '', last4: '', expMonth: '', expYear: '', billingAddress: '' });
        setShowForm(false);
        if (setStatus) setStatus({ type: 'success', text: 'Payment card added successfully!' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to add payment method.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.patch(`/settings/payment-methods/${id}`, { isDefault: true });
      if (res.status === 'success') {
        setMethods(prev => prev.map(m => ({ ...m, isDefault: m._id === id })));
        if (setStatus) setStatus({ type: 'success', text: 'Default payment method updated.' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to set default payment method.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/settings/payment-methods/${id}`);
      if (res.status === 'success') {
        setMethods(prev => prev.filter(m => m._id !== id));
        if (setStatus) setStatus({ type: 'success', text: 'Payment method removed.' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to remove payment method.' });
    }
  };

  const getBrandClass = (brand) => {
    const b = (brand || '').toLowerCase();
    if (b.includes('visa')) return styles.visaCard;
    if (b.includes('master')) return styles.masterCard;
    if (b.includes('amex')) return styles.amexCard;
    if (b.includes('discover')) return styles.discoverCard;
    return styles.defaultVirtualCard;
  };

  if (loading) {
    return <SkeletonRows />;
  }

  return (
    <div className={styles.subPageBody}>
      <div className={styles.payHeaderRow}>
        <div className={styles.payIntroGroup}>
          <h3>Saved Cards & Billing</h3>
          <p className={styles.payIntro}>
            Manage cards used for instant Fantrio Coin top-ups. PCI-DSS compliant & encrypted.
          </p>
        </div>
        <button className={styles.actionBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add New Card'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.payForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Card Brand</label>
              <select className={styles.formSelect} value={form.cardBrand} onChange={(e) => setForm({ ...form, cardBrand: e.target.value })}>
                {CARD_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cardholder Full Name</label>
              <input type="text" className={styles.formInput} value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} required placeholder="As shown on card" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last 4 Digits</label>
              <input type="text" inputMode="numeric" maxLength={4} className={styles.formInput} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })} required placeholder="4242" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiry Month</label>
              <select className={styles.formSelect} value={form.expMonth} onChange={(e) => setForm({ ...form, expMonth: e.target.value })} required>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiry Year</label>
              <select className={styles.formSelect} value={form.expYear} onChange={(e) => setForm({ ...form, expYear: e.target.value })} required>
                <option value="">Year</option>
                {Array.from({ length: 10 }, (_, i) => 2025 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Billing Address (Optional)</label>
            <input type="text" className={styles.formInput} value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} placeholder="Street Address, City, Country" />
          </div>

          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? <><Loader size={16} className={styles.spin} /> Saving Card...</> : 'Save Payment Card'}
          </button>
        </form>
      )}

      {methods.length === 0 ? (
        <div className={styles.emptyBox}>
          <CreditCard size={44} className={styles.emptyBoxIcon} />
          <p>No payment cards attached yet. Click "Add New Card" to save a payment method.</p>
        </div>
      ) : (
        <div className={styles.virtualCardGrid}>
          {methods.map((m) => (
            <div key={m._id} className={`${styles.virtualCardItem} ${getBrandClass(m.cardBrand)}`}>
              <div className={styles.virtualCardTop}>
                <div className={styles.virtualChipGraphic} />
                <div className={styles.virtualBrandRight}>
                  {m.isDefault && <span className={styles.defaultPillBadge}><Star size={11} fill="currentColor" /> DEFAULT</span>}
                  <span className={styles.virtualBrandName}>{m.cardBrand}</span>
                </div>
              </div>

              <div className={styles.virtualCardNumber}>
                •••• •••• •••• {m.last4}
              </div>

              <div className={styles.virtualCardBottom}>
                <div className={styles.virtualHolderCol}>
                  <span className={styles.virtualLabel}>CARD HOLDER</span>
                  <span className={styles.virtualValue}>{m.holderName || 'CARDHOLDER'}</span>
                </div>
                <div className={styles.virtualExpiryCol}>
                  <span className={styles.virtualLabel}>EXPIRES</span>
                  <span className={styles.virtualValue}>{String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}</span>
                </div>
              </div>

              <div className={styles.virtualCardActionsOverlay}>
                {!m.isDefault && (
                  <button className={styles.cardActionPill} onClick={() => handleSetDefault(m._id)}>
                    <Star size={13} /> Set Default
                  </button>
                )}
                <button className={`${styles.cardActionPill} ${styles.cardDeletePill}`} onClick={() => handleDelete(m._id)}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
