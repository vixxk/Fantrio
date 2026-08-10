import { ChevronRight } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorPrivacySection = ({
  privacyState,
  setPrivacyState,
  onTogglePrivacy,
  onOpenModal
}) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Privacy & Security</h2>
        <p className={styles.sectionSubtitle}>Control your profile visibility and account protection.</p>
      </div>
      <div className={styles.settingsList}>
        {privacyState.map((item) => (
          <div key={item.id} className={styles.settingItem}>
            <span className={styles.settingLabel}>{item.label}</span>
            {item.type === 'toggle' && (
              <label className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => onTogglePrivacy(item.id)}
                />
                <span className={styles.toggleSlider} />
              </label>
            )}
            {item.type === 'select' && (
              <div className={styles.selectWrapperSmall}>
                <select
                  className={styles.formSelectSmall}
                  value={item.value}
                  onChange={(e) => {
                    setPrivacyState(prev =>
                      prev.map(p => p.id === item.id ? { ...p, value: e.target.value } : p)
                    );
                  }}
                >
                  {item.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            {item.type === 'link' && (
              <button
                className={styles.settingLink}
                onClick={() => {
                  if (item.id === 'blockedUsers') onOpenModal('blocked');
                  if (item.id === 'twoFactorAuth') onOpenModal('security');
                }}
              >
                <span className={item.highlight ? styles.linkHighlight : ''}>{item.value}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
