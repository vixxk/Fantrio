import { useState } from 'react';
import { isChatPageSoundEnabled, isMessageSoundEnabled, setChatPageSoundEnabled, setMessageSoundEnabled } from '../../../utils/sound';
import styles from './CreatorSettingsPage.module.css';

export const CreatorNotificationsSection = ({ notificationSettings, onToggle }) => {
  // Device-level sound prefs (kept in localStorage, like the gift chime mute)
  // so they take effect instantly and don't need a server round-trip.
  const [soundPrefs, setSoundPrefs] = useState(() => ({
    messageSound: isMessageSoundEnabled(),
    chatPageSound: isChatPageSoundEnabled()
  }));

  const toggleSoundPref = (key) => {
    setSoundPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'messageSound') setMessageSoundEnabled(next.messageSound);
      else setChatPageSoundEnabled(next.chatPageSound);
      return next;
    });
  };

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

        {/* Message sounds — device-level toggles (localStorage), not server
            notification prefs, so they apply instantly to the sound layer. */}
        <div className={styles.settingItem}>
          <span className={styles.settingLabel}>
            Message Sounds
            <span className={styles.settingSubLabel}>Play a sound when a DM arrives while you're not on the chat page.</span>
          </span>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={soundPrefs.messageSound}
              onChange={() => toggleSoundPref('messageSound')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>
        <div className={styles.settingItem}>
          <span className={styles.settingLabel}>
            Chat Page Sounds
            <span className={styles.settingSubLabel}>Chime for messages in other conversations while browsing the chat list on desktop.</span>
          </span>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={soundPrefs.chatPageSound}
              onChange={() => toggleSoundPref('chatPageSound')}
            />
            <span className={styles.toggleSlider} />
          </label>
        </div>
      </div>
    </section>
  );
};
