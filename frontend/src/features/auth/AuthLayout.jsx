import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Play, Pause, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import { AuthBackground } from './AuthBackground';
import { AuthHeader } from './AuthHeader';
import styles from './AuthLayout.module.css';

const REEL_VIDEOS = [
  {
    id: 1,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-and-dancing-34360-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    title: 'Dance & Glow',
    initialBlurred: true
  },
  {
    id: 2,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-happily-in-summer-39864-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    title: 'Summer Vibes',
    initialBlurred: false
  },
  {
    id: 3,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-a-dark-room-40587-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80',
    title: 'Studio Moves',
    initialBlurred: false
  },
  {
    id: 4,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-sportswear-doing-exercises-at-home-40893-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    title: 'Fit & Energy',
    initialBlurred: true
  }
];

// X (Twitter) official SVG logo
export const XLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Google official SVG logo
export const GoogleLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthLayout = ({
  mode = 'login', // 'login' | 'signup'
  showNormalForm = false,
  setShowNormalForm,
  children,
  onOAuthGoogle,
  onOAuthX,
  oauthNotice = '',
  setOAuthNotice,
  isGatedOnboarding = false
}) => {
  const { navigateTo, darkMode } = useApp();
  const [blurredCards, setBlurredCards] = useState({ 1: true, 4: true });
  const [playingStates, setPlayingStates] = useState({ 1: true, 2: true, 3: true, 4: true });
  const videoRefs = useRef({});

  const toggleBlur = (id, e) => {
    e.stopPropagation();
    setBlurredCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePlay = (id) => {
    const video = videoRefs.current[id];
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlayingStates((prev) => ({ ...prev, [id]: true }));
    } else {
      video.pause();
      setPlayingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className={`${styles.authRoot} ${darkMode ? styles.dark : styles.light}`}>
      <AuthBackground />
      <AuthHeader />

      <div className={styles.container}>
        {/* ================= LEFT SIDE: Brand & 4 Reel Cards ================= */}
        <div className={styles.leftPane}>
          {/* 4 Shorts/Reels Video Template Cards */}
          <div className={styles.reelsRow}>
            {REEL_VIDEOS.map((item) => {
              const isBlurred = !!blurredCards[item.id];
              const isPlaying = !!playingStates[item.id];

              return (
                <div
                  key={item.id}
                  className={`${styles.reelCard} ${isBlurred ? styles.reelCardBlurred : ''}`}
                  onClick={() => togglePlay(item.id)}
                  title="Click to play / pause video"
                >
                  <video
                    ref={(el) => (videoRefs.current[item.id] = el)}
                    src={item.videoUrl}
                    poster={item.posterUrl}
                    className={`${styles.reelVideo} ${isBlurred ? styles.videoBlur : ''}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />

                  {/* Overlay with Sensitive/Blur toggle & Play/Pause indicators */}
                  <div className={styles.reelOverlay}>
                    <button
                      type="button"
                      className={styles.blurBtn}
                      onClick={(e) => toggleBlur(item.id, e)}
                      aria-label={isBlurred ? 'Show content' : 'Hide content'}
                      title={isBlurred ? 'Reveal preview' : 'Hide preview'}
                    >
                      {isBlurred ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    <div className={styles.playIndicator}>
                      {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical divider line between left and right sections (Desktop) */}
        <div className={styles.sectionDivider} aria-hidden="true" />

        {/* ================= RIGHT SIDE: Auth Actions & Input Form ================= */}
        <div className={styles.rightPane}>
          <div className={styles.authCard}>
            {(!showNormalForm && !isGatedOnboarding) ? (
              <>
                {/* Top Switch Buttons (Sign Up / Login) */}
                <div className={styles.topTabs}>
                  <button
                    type="button"
                    className={`${styles.topTabBtn} ${mode === 'signup' ? styles.tabActive : styles.tabInactive}`}
                    onClick={() => {
                      if (mode !== 'signup') navigateTo('/signup');
                    }}
                  >
                    Sign up
                  </button>
                  <button
                    type="button"
                    className={`${styles.topTabBtn} ${mode === 'login' ? styles.tabActive : styles.tabInactive}`}
                    onClick={() => {
                      if (mode !== 'login') navigateTo('/login');
                    }}
                  >
                    Login
                  </button>
                </div>

                {/* Terms & 18+ Disclaimer */}
                <p className={styles.disclaimer}>
                  By joining, you agree to our{' '}
                  <span className={styles.linkText} onClick={() => navigateTo('/terms')}>
                    Terms &amp; Conditions
                  </span>{' '}
                  and{' '}
                  <span className={styles.linkText} onClick={() => navigateTo('/privacy')}>
                    Privacy Policy
                  </span>
                  , and confirm that you are at least 18 years old.
                </p>

                {oauthNotice && (
                  <div className={styles.noticeBanner} role="status">
                    <ShieldAlert size={18} className={styles.noticeIcon} />
                    <span>{oauthNotice}</span>
                    {setOAuthNotice && (
                      <button
                        type="button"
                        className={styles.noticeClose}
                        onClick={() => setOAuthNotice('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                {/* 3 Buttons on the Right Side (X, Google, Normal) */}
                <div className={styles.actionButtons}>
                {/* Button 1: Sign in / up with X */}
                <button
                  type="button"
                  className={`${styles.authButton} ${styles.xButton}`}
                  onClick={onOAuthX}
                >
                  <span className={styles.btnIconBadge}>
                    <XLogo size={18} />
                  </span>
                  <span className={styles.btnText}>
                    {mode === 'signup' ? 'Sign up with X' : 'Sign in with X'}
                  </span>
                </button>

                {/* Button 2: Sign in / up with Google */}
                <button
                  type="button"
                  className={`${styles.authButton} ${styles.googleButton}`}
                  onClick={onOAuthGoogle}
                >
                  <span className={styles.googleIconBadge}>
                    <GoogleLogo size={18} />
                  </span>
                  <span className={styles.btnText}>
                    {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                  </span>
                </button>

                {/* Button 3: Normal Form Toggle */}
                <button
                  type="button"
                  className={`${styles.authButton} ${styles.normalButton}`}
                  onClick={() => setShowNormalForm(true)}
                >
                  <span className={styles.btnIconBadge}>
                    <Mail size={18} />
                  </span>
                  <span className={styles.btnText}>
                    {mode === 'signup' ? 'Sign up with Email' : 'Sign in with Email'}
                  </span>
                </button>
              </div>
            </>
          ) : (
              <div className={styles.formContainer}>
                {/* Back to 3 buttons option */}
                {!isGatedOnboarding && setShowNormalForm && (
                  <button
                    type="button"
                    className={styles.backLink}
                    onClick={() => setShowNormalForm(false)}
                  >
                    <ArrowLeft size={16} />
                    <span>All sign-in options</span>
                  </button>
                )}

                {/* The existing input boxes / form */}
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
