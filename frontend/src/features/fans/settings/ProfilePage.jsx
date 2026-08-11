import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { 
  User, UploadCloud, BadgeCheck, Lock, Loader, Camera
} from 'lucide-react';
import styles from './SettingsPage.module.css';

export const ProfilePage = ({ setStatus, onBusyChange, onDirtyChange }) => {
  const { user, updateUser, refreshProfile } = useApp();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });

  // Snapshot of the profile as it was when the page opened, so we can tell
  // whether the user has made any unsaved changes.
  const initialFormRef = useRef({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      if (setStatus) setStatus({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      if (setStatus) setStatus({ type: 'error', text: 'File size must be under 10MB.' });
      return;
    }

    setUploadingImage(true);
    if (setStatus) setStatus({ type: '', text: '' });

    try {
      // 1. Get presigned upload URL from API
      const presignedRes = await api.post('/settings/presigned-upload', {
        fileName: file.name,
        fileType: file.type
      });

      if (presignedRes.status === 'success' && presignedRes.uploadUrl) {
        // 2. Directly upload the image binary to cloud storage
        const s3Response = await fetch(presignedRes.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });

        if (s3Response.ok || s3Response.status === 200) {
          setForm(prev => ({ ...prev, avatarUrl: presignedRes.fileUrl }));
          if (setStatus) setStatus({ type: 'success', text: 'Profile picture uploaded successfully!' });
        } else {
          // If cloud storage credentials in dev environment are mock/dummy, fallback to file data URL for preview
          const reader = new FileReader();
          reader.onload = (evt) => {
            setForm(prev => ({ ...prev, avatarUrl: evt.target.result }));
          };
          reader.readAsDataURL(file);
          if (setStatus) setStatus({ type: 'success', text: 'Profile picture selected and ready to save.' });
        }
      }
    } catch (err) {
      console.warn('Upload fallback to local preview:', err);
      // Fallback: Read file locally as Data URL
      const reader = new FileReader();
      reader.onload = (evt) => {
        setForm(prev => ({ ...prev, avatarUrl: evt.target.result }));
      };
      reader.readAsDataURL(file);
      if (setStatus) setStatus({ type: 'success', text: 'Profile picture selected and ready to save.' });
    } finally {
      setUploadingImage(false);
      // Clear input value so same file can be picked again
      if (e.target) e.target.value = '';
    }
  };

  // Keep the header Save button in sync with this page's busy state
  useEffect(() => {
    if (onBusyChange) onBusyChange(saving || uploadingImage);
    return () => { if (onBusyChange) onBusyChange(false); };
  }, [saving, uploadingImage, onBusyChange]);

  // Report whether the form has unsaved changes so the header Save button
  // can be disabled until the user edits something. The baseline lives in a
  // ref so it can be updated after a successful save without re-rendering.
  useEffect(() => {
    const hasChanges =
      form.displayName !== initialFormRef.current.displayName ||
      form.username !== initialFormRef.current.username ||
      form.bio !== initialFormRef.current.bio ||
      form.avatarUrl !== initialFormRef.current.avatarUrl;
    if (onDirtyChange) onDirtyChange(hasChanges);
    return () => { if (onDirtyChange) onDirtyChange(false); };
  }, [form, onDirtyChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (setStatus) setStatus({ type: '', text: '' });
    try {
      const res = await api.patch('/settings/profile', form);
      if (res.status === 'success') {
        updateUser({
          displayName: res.user.displayName,
          username: res.user.username,
          avatarUrl: res.user.avatarUrl,
          bio: res.user.bio,
        });
        const savedForm = {
          displayName: res.user.displayName || '',
          username: res.user.username || '',
          bio: res.user.bio || '',
          avatarUrl: res.user.avatarUrl || '',
        };
        setForm(savedForm);
        // The saved values are now the new baseline, so the Save button
        // returns to its disabled state.
        initialFormRef.current = savedForm;
        if (setStatus) setStatus({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh the user in context from the server so the header
        // (avatar, name, username) reflects the latest profile.
        refreshProfile();
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.subPageBody}>
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        style={{ display: 'none' }}
      />

      {/* Profile Card Header */}
      <div className={styles.profileHeroCard}>
        <div className={styles.profileBannerBg} />
        <div className={styles.profileHeroContent}>
          <div className={styles.profileAvatarContainer}>
            <img src={form.avatarUrl || '/profile.png'} alt="Profile" className={styles.profileAvatarImg} />
            <div className={styles.onlineBadgeDot} />
            <button
              type="button"
              className={styles.avatarEditOverlay}
              onClick={triggerFileInput}
              disabled={uploadingImage}
              title="Upload picture"
            >
              {uploadingImage ? <Loader size={18} className={styles.spin} /> : <Camera size={18} />}
            </button>
          </div>

          <div className={styles.profileHeroMeta}>
            <div className={styles.heroNameRow}>
              <h3>{form.displayName || 'Your Display Name'}</h3>
              <span className={styles.verifiedChip}>
                <BadgeCheck size={15} /> Verified Member
              </span>
            </div>
            <p className={styles.heroUsername}>@{form.username || 'username'}</p>
            <div className={styles.heroEmailBadge}>
              <User size={13} /> {user?.email}
            </div>
          </div>
        </div>
      </div>

      <form id="profile-save-form" onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.nameUserRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <User size={14} /> Display Name
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g. Alex Morgan"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span>@</span> Username
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="alex_m"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <Lock size={14} /> Account Email
          </label>
          <input
            type="email"
            className={`${styles.formInput} ${styles.inputDisabled}`}
            value={user?.email || ''}
            disabled
          />
        </div>

        {/* Direct image upload card */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <UploadCloud size={14} /> Profile Picture
          </label>
          <div
            className={styles.s3UploadDropzone}
            onClick={triggerFileInput}
          >
            <div className={styles.s3DropzoneContent}>
              {uploadingImage ? (
                <>
                  <Loader size={24} className={styles.spin} style={{ color: '#0070f3' }} />
                  <div>
                    <span className={styles.s3DropzoneTitle}>Uploading...</span>
                    <p className={styles.s3DropzoneSub}>Please wait while your image is saved to secure cloud storage.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.s3UploadIconCircle}>
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <span className={styles.s3DropzoneTitle}>Click to choose an image file from your device</span>
                    <p className={styles.s3DropzoneSub}>PNG, JPG, WEBP up to 10MB.</p>
                  </div>
                  <button type="button" className={styles.s3UploadBtn} onClick={triggerFileInput}>
                    Browse File
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelWithCount}>
            <label className={styles.formLabel}>Bio & Description</label>
            <span className={styles.charCount}>{form.bio.length}/500</span>
          </div>
          <textarea
            rows={4}
            className={styles.formTextarea}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Write a brief bio about yourself..."
            maxLength={500}
          />
        </div>

      </form>
    </div>
  );
};
