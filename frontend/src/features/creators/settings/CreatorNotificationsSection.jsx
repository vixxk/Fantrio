import styles from './CreatorSettingsPage.module.css';

export const CreatorNotificationsSection = ({ notificationSettings, onToggle }) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <p className={styles.sectionSubtitle}>Choose what activity and alerts you want to be notified about.</p>
      </div>
      <div className={styles.settingsList}>
        {notificationSettings.map((item) => (
          <div key={item.id} className={styles.settingItem}>
            <span className={styles.settingLabel}>{item.label}</span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => onToggle(item.id)}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
};
