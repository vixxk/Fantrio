import { Camera } from 'lucide-react';
import styles from './CreatorSettingsPage.module.css';

export const CreatorProfileSection = ({
  profileData,
  displayName,
  setDisplayName,
  username,
  setUsername,
  email,
  bioText,
  setBioText,
  savedMsg,
  error,
  onSave,
  onOpenSecurityModal,
  onOpenAvatarModal
}) => {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>Profile & Account</h2>
          <p className={styles.sectionSubtitle}>Update your personal information and account details.</p>
        </div>
        <div className={styles.headerActions}>
          {savedMsg && <span className={styles.saveMsg}>{savedMsg}</span>}
          {error && <span className={styles.saveMsg} style={{ color: '#ef4444' }}>{error}</span>}
          <button className={styles.saveBtn} onClick={onSave}>
            Save Changes
          </button>
          <button className={styles.changePasswordBtn} onClick={onOpenSecurityModal}>
            Change Password
          </button>
        </div>
      </div>

      <div className={styles.profileContent}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <img src={profileData?.avatar || '/profile.png'} alt="Profile" className={styles.avatar} />
            <button className={styles.cameraBtn} onClick={onOpenAvatarModal} aria-label="Change profile picture">
              <Camera size={14} />
            </button>
          </div>
          <div className={styles.profileNameInfo}>
            <span className={styles.profileName}>{displayName || profileData?.displayName}</span>
            <span className={styles.profileUsername}>@{username || profileData?.username}</span>
            <span className={styles.profileSince}>Creator since {profileData?.creatorSince || '2026'}</span>
          </div>
        </div>

        <div className={styles.formFields}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Display Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Display Name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username</label>
              <input
                type="text"
                className={`${styles.formInput} ${styles.usernameInput}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email Address</label>
              <input type="email" className={`${styles.formInput} ${styles.inputDisabled}`} defaultValue={email} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bio & Story</label>
              <textarea
                className={styles.formTextarea}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                maxLength={profileData?.bioMaxLength || 500}
                placeholder="Describe yourself to your fans..."
                rows={3}
              />
              <span className={styles.charCount}>{bioText.length} / {profileData?.bioMaxLength || 500}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
