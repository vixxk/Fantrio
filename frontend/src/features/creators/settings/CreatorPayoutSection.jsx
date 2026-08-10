import { Landmark } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorPayoutSection = ({
  payoutSettings,
  payoutSchedule,
  setPayoutSchedule,
  payoutCurrency,
  setPayoutCurrency,
  minimumPayout,
  setMinimumPayout,
  onSavePayout,
  onOpenPayoutModal,
  payoutSavedMsg,
  payoutError
}) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>Payout & Payment Settings</h2>
          <p className={styles.sectionSubtitle}>Manage your payout methods and payment preferences.</p>
        </div>
        <div className={styles.headerActions}>
          {payoutSavedMsg && <span className={styles.saveMsg}>{payoutSavedMsg}</span>}
          {payoutError && <span className={styles.saveMsg} style={{ color: '#ef4444' }}>{payoutError}</span>}
          <button className={`${styles.saveBtn} ${styles.payoutSaveBtn}`} onClick={onSavePayout}>
            Save Changes
          </button>
        </div>
      </div>

      <div className={styles.payoutContent}>
        <div className={styles.payoutLeft}>
          <div className={styles.connectedAccount}>
            <div className={styles.bankInfo}>
              <div className={styles.bankIcon}>
                <Landmark size={28} />
              </div>
              <div className={styles.bankDetails}>
                <div className={styles.connectedHeader}>
                  <span className={styles.connectedLabel}>Connected Account</span>
                  {payoutSettings?.verified && (
                    <span className={styles.verifiedBadge}>Verified</span>
                  )}
                </div>
                <span className={styles.bankName}>{payoutSettings?.bankName || 'Direct Bank Deposit'}</span>
              </div>
            </div>

            <div className={styles.accountRows}>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Account Holder</span>
                <span className={styles.accountValue}>{payoutSettings?.accountHolder || 'Not configured'}</span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Bank Name</span>
                <span className={styles.accountValue}>{payoutSettings?.bankName || '—'}</span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Routing Number</span>
                <span className={styles.accountValue}>{payoutSettings?.routingNumber || '••••••••'}</span>
              </div>
              <div className={styles.accountRow}>
                <span className={styles.accountLabel}>Account Number</span>
                <span className={styles.accountValue}>{payoutSettings?.accountNumber || '••••••••'}</span>
              </div>
            </div>

            <button className={styles.updatePayoutBtn} onClick={onOpenPayoutModal}>
              Update Payout Details
            </button>
          </div>
        </div>

        <div className={styles.payoutRight}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payout Schedule</label>
            <div className={styles.selectWrapper}>
              <select className={styles.formSelect} value={payoutSchedule} onChange={(e) => setPayoutSchedule(e.target.value)}>
                <option value="weekly">Weekly (Every Monday)</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Minimum Payout Threshold</label>
            <div className={styles.inputWithSuffix}>
              <input
                type="text"
                className={styles.formInput}
                value={minimumPayout}
                onChange={(e) => setMinimumPayout(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="100"
              />
              <span className={styles.inputSuffix}>USD</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payout Currency</label>
            <div className={styles.selectWrapper}>
              <select className={styles.formSelect} value={payoutCurrency} onChange={(e) => setPayoutCurrency(e.target.value)}>
                <option value="usd">USD — US Dollar</option>
                <option value="eur">EUR — Euro</option>
                <option value="gbp">GBP — British Pound</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
