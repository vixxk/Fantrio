import styles from './CreatorSettingsPage.module.css';

export const CreatorPreferencesSection = ({ preferences, onChangePreference }) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Creator Preferences</h2>
        <p className={styles.sectionSubtitle}>Customize default broadcasting, call formats, and content settings.</p>
      </div>
      <div className={styles.settingsList}>
        {preferences.map((item) => (
          <div key={item.id} className={styles.settingItem}>
            <span className={styles.settingLabel}>{item.label}</span>
            <div className={styles.selectWrapperSmall}>
              <select
                className={styles.formSelectSmall}
                value={item.value}
                onChange={(e) => onChangePreference(item.id, e.target.value)}
              >
                {item.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
