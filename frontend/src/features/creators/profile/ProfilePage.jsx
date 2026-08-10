import { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import ShimmerSkeleton from '../../../components/ShimmerSkeleton/ShimmerSkeleton';
import { ProfileHero } from './ProfileHero';
import { AboutMe, CreatorPanel } from './AboutMe';
import { ProfileInsights } from './ProfileInsights';
import { FanSpotlight } from './FanSpotlight';
import { SubscriptionPlans } from './SubscriptionPlans';
import { CallRates } from './CallRates';
import { RecentContent } from './RecentContent';
import { SubscribeSave } from './SubscribeSave';
import { api } from '../../../services/api';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const { darkMode } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/creators/panel/profile')
      .then((res) => { if (mounted) setData(res); })
      .catch(() => { if (mounted) setError('Could not load your profile. Please try again.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const emptyProfile = {
    name: '',
    handle: '',
    avatar: '',
    coverImage: '',
    isVerified: false,
    isOnline: false,
    role: 'Creator',
    bio: '',
    location: '',
    languages: '',
    memberSince: '',
    responseTime: ''
  };

  return (
    <div className={`${styles.profileContainer} ${!darkMode ? styles.light : ''}`}>
      {/* Profile Preview Section */}
      <div className={styles.previewSection}>
        <h2 className={styles.previewTitle}>Profile Preview</h2>
        <p className={styles.previewSubtitle}>This is how your profile appears to fans on Fantrio.</p>
      </div>

       {loading && (
         <div className={styles.mainGrid}>
           <div className={styles.leftColumn}>
             <div className={styles.profileHeroSkeleton}>
               <ShimmerSkeleton variant="media" height="300px" marginTop="0" />
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '-40px', padding: '0 1.5rem' }}>
                 <ShimmerSkeleton variant="avatar" width="80px" height="80px" />
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                   <ShimmerSkeleton variant="text" width="40%" height="18px" />
                   <ShimmerSkeleton variant="text" width="25%" height="12px" />
                   <ShimmerSkeleton variant="text" width="30%" height="11px" />
                 </div>
               </div>
             </div>
             <div className={styles.section}>
               <ShimmerSkeleton variant="text" width="30%" height="16px" />
               <ShimmerSkeleton variant="text" width="80%" height="12px" marginTop="0.5rem" />
               <ShimmerSkeleton variant="text" width="60%" height="12px" marginTop="0.35rem" />
             </div>
             <div className={styles.section}>
               <ShimmerSkeleton variant="text" width="25%" height="16px" />
               <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                 {Array.from({ length: 4 }).map((_, idx) => (
                   <div key={idx} style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                     <ShimmerSkeleton variant="text" width="60%" height="10px" />
                     <ShimmerSkeleton variant="text" width="40%" height="16px" />
                   </div>
                 ))}
               </div>
             </div>
           </div>
           <div className={styles.rightSidebar}>
             <div className={styles.sidebarCard}>
               <ShimmerSkeleton variant="text" width="40%" height="14px" />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                 {Array.from({ length: 3 }).map((_, idx) => (
                   <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <ShimmerSkeleton variant="circle" width="32px" height="32px" />
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                       <ShimmerSkeleton variant="text" width="55%" height="10px" />
                       <ShimmerSkeleton variant="text" width="40%" height="9px" />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             <div className={styles.sidebarCard}>
               <ShimmerSkeleton variant="text" width="35%" height="14px" />
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                 {Array.from({ length: 3 }).map((_, idx) => (
                   <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <ShimmerSkeleton variant="circle" width="14px" height="14px" />
                     <ShimmerSkeleton variant="text" width="70%" height="10px" />
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </div>
       )}

      {error && !data && (
        <p className={styles.previewSubtitle} style={{ color: '#ef4444' }}>{error}</p>
      )}

      {!loading && data && (
        /* Main Content Grid */
        <div className={styles.mainGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Profile Hero Card */}
            <ProfileHero
              isDark={darkMode}
              creatorProfile={data.creatorProfile || emptyProfile}
              profileStats={data.profileStats || []}
              actionButtons={data.actionButtons || []}
            />

            {/* Creator Panel */}
            <CreatorPanel isDark={darkMode} creatorProfile={data.creatorProfile || emptyProfile} />

            {/* Bottom Grid: Plans + Call Rates */}
            <div className={styles.bottomGrid}>
              <SubscriptionPlans isDark={darkMode} subscriptionPlans={data.subscriptionPlans} />
              <CallRates isDark={darkMode} callRates={data.callRates} />
            </div>

            {/* Recent Content */}
            <RecentContent isDark={darkMode} recentContent={data.recentContent} />
          </div>

          {/* Right Sidebar */}
          <div className={styles.rightSidebar}>
            <AboutMe isDark={darkMode} creatorProfile={data.creatorProfile || emptyProfile} />
            <ProfileInsights isDark={darkMode} profileInsights={data.profileInsights} />
            <FanSpotlight isDark={darkMode} fanSpotlight={data.fanSpotlight} />
            <SubscribeSave isDark={darkMode} subscribeSave={data.subscribeSave} />
          </div>
        </div>
      )}
    </div>
  );
};
