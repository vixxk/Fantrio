import { useState, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { 
  User, UploadCloud, BadgeCheck, Lock, Sparkles, Loader, Camera, Check, AlertCircle
} from 'lucide-react';
import styles from './SettingsPage.module.css';

export const ProfilePage = ({ setStatus }) => {
  const { user, updateUser } = useApp();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
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
        // 2. Directly upload the image binary to AWS S3
        const s3Response = await fetch(presignedRes.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });

        if (s3Response.ok || s3Response.status === 200) {
          setForm(prev => ({ ...prev, avatarUrl: presignedRes.fileUrl }));
          if (setStatus) setStatus({ type: 'success', text: 'Profile picture uploaded to AWS S3 successfully!' });
        } else {
          // If AWS credentials in dev environment are mock/dummy, fallback to file data URL for preview
          const reader = new FileReader();
          reader.onload = (evt) => {
            setForm(prev => ({ ...prev, avatarUrl: evt.target.result }));
          };
          reader.readAsDataURL(file);
          if (setStatus) setStatus({ type: 'success', text: 'Profile picture selected and ready to save.' });
        }
      }
    } catch (err) {
      console.warn('S3 upload fallback to local preview:', err);
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
        setForm({
          displayName: res.user.displayName || '',
          username: res.user.username || '',
          bio: res.user.bio || '',
          avatarUrl: res.user.avatarUrl || '',
        });
        if (setStatus) setStatus({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      if (setStatus) setStatus({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.subPageBody}>
      {/* Hidden file input for S3 upload */}
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
              title="Upload picture directly to AWS S3"
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

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        <div className={styles.formRow2Col}>
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

        {/* Direct AWS S3 Upload Card */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <UploadCloud size={14} /> Profile Picture (AWS S3 Upload)
          </label>
          <div
            className={styles.s3UploadDropzone}
            onClick={triggerFileInput}
          >
            <div className={styles.s3DropzoneContent}>
              {uploadingImage ? (
                <>
                  <Loader size={24} className={styles.spin} style={{ color: '#e10075' }} />
                  <div>
                    <span className={styles.s3DropzoneTitle}>Uploading to AWS S3...</span>
                    <p className={styles.s3DropzoneSub}>Please wait while your image is saved directly to AWS S3 cloud storage.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.s3UploadIconCircle}>
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <span className={styles.s3DropzoneTitle}>Click to choose an image file from your device</span>
                    <p className={styles.s3DropzoneSub}>Image will be uploaded directly to AWS S3. PNG, JPG, WEBP up to 10MB.</p>
                  </div>
                  <button type="button" className={styles.s3UploadBtn} onClick={triggerFileInput}>
                    Browse File
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formRow2Col}>
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
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Current Image Storage Location</label>
            <input
              type="text"
              className={`${styles.formInput} ${styles.inputDisabled}`}
              value={form.avatarUrl ? (form.avatarUrl.includes('.amazonaws.com/') ? 'AWS S3 Cloud Storage' : 'Configured Avatar') : 'Default'}
              disabled
            />
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

        <div className={styles.formActionsRight}>
          <button type="submit" disabled={saving || uploadingImage} className={styles.submitBtn}>
            {saving ? <><Loader size={16} className={styles.spin} /> Saving Changes...</> : <><Sparkles size={16} /> Save Profile</>}
          </button>
        </div>
      </form>
    </div>
  );
};
