import { PhoneCall, Video, Sparkles, Coins } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorRatesSection = ({
  rateAudio,
  setRateAudio,
  rateVideo,
  setRateVideo,
  subscriptionPrice,
  setSubscriptionPrice,
  onSave,
  savedMsg,
  error
}) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>Monetization & Call Rates</h2>
          <p className={styles.sectionSubtitle}>Set your per-minute audio/video call rates and monthly subscription fee.</p>
        </div>
        <div className={styles.headerActions}>
          {savedMsg && <span className={styles.saveMsg}>{savedMsg}</span>}
          {error && <span className={styles.saveMsg} style={{ color: '#ef4444' }}>{error}</span>}
          <button className={styles.saveBtn} onClick={onSave}>
            Save Rates
          </button>
        </div>
      </div>

      <div className={styles.ratesGrid3Col}>
        <div className={styles.rateCard}>
          <div className={styles.rateCardHeader}>
            <PhoneCall size={20} className={styles.rateIconAudio} />
            <div>
              <h4>Audio Call Rate</h4>
              <p>Coins per minute</p>
            </div>
          </div>
          <div className={styles.inputWithSuffix}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.formInput}
              value={rateAudio}
              onChange={(e) => setRateAudio(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="10"
            />
            <span className={styles.inputSuffix}><Coins size={12} /> Coins/min</span>
          </div>
        </div>

        <div className={styles.rateCard}>
          <div className={styles.rateCardHeader}>
            <Video size={20} className={styles.rateIconVideo} />
            <div>
              <h4>Video Call Rate</h4>
              <p>Coins per minute</p>
            </div>
          </div>
          <div className={styles.inputWithSuffix}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.formInput}
              value={rateVideo}
              onChange={(e) => setRateVideo(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="25"
            />
            <span className={styles.inputSuffix}><Coins size={12} /> Coins/min</span>
          </div>
        </div>

        <div className={styles.rateCard}>
          <div className={styles.rateCardHeader}>
            <Sparkles size={20} className={styles.rateIconSub} />
            <div>
              <h4>Monthly Subscription</h4>
              <p>USD per month</p>
            </div>
          </div>
          <div className={styles.inputWithSuffix}>
            <input
              type="text"
              inputMode="numeric"
              className={styles.formInput}
              value={subscriptionPrice}
              onChange={(e) => setSubscriptionPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="9.99"
            />
            <span className={styles.inputSuffix}>USD / mo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
