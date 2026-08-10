import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Share2, Copy, Sparkles, UserPlus, Gift, Trophy, CheckCircle2, Loader } from 'lucide-react';
import styles from './MorePage.module.css';

export const ReferralPage = ({ setStatusMsg }) => {
  const [stats, setStats] = useState({ referralCode: '', referredCount: 0, claimed: false, referredBy: null });
  const [codeForm, setCodeForm] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/more/referrals/stats');
      if (res.status === 'success') setStats(res);
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to load referral stats.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadStats();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyCode = async () => {
    if (!stats.referralCode) return;
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      if (setStatusMsg) setStatusMsg({ type: 'success', text: 'Referral code copied to clipboard!' });
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: 'Failed to copy code.' });
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!codeForm.trim()) return;
    setClaiming(true);
    if (setStatusMsg) setStatusMsg({ type: '', text: '' });
    try {
      const res = await api.post('/more/referrals/claim', { code: codeForm.trim() });
      if (res.status === 'success') {
        if (setStatusMsg) setStatusMsg({ type: 'success', text: res.message || 'Referral claimed successfully!' });
        setCodeForm('');
        loadStats();
      }
    } catch (err) {
      if (setStatusMsg) setStatusMsg({ type: 'error', text: err.message || 'Failed to claim referral.' });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <SkeletonGrid />;
  }

  return (
    <div className={styles.subViewGrid}>
      <div className={styles.referralHero}>
        <div className={styles.refHeroBadge}>
          <Share2 size={24} />
        </div>
        <h3>Invite Friends & Earn Free Coins</h3>
        <p>Give your friends 50 bonus coins on signup, and get 100 coins for every friend who joins Fantrio.</p>
        
        <div className={styles.refCodeBox}>
          <div className={styles.refCodeLabel}>YOUR EXCLUSIVE REFERRAL CODE</div>
          <div className={styles.refCodeDisplay}>
            <span>{stats.referralCode || '-------'}</span>
            <button className={styles.copyCodeBtn} onClick={handleCopyCode}>
              <Copy size={16} /> Copy Code
            </button>
          </div>
        </div>
      </div>

      <div className={styles.refGrid2Col}>
        {/* Claim Referral Code Card */}
        <div className={styles.refCard}>
          <div className={styles.refCardHeader}>
            <Gift size={20} className={styles.refCardIcon} />
            <h4>Have a Friend's Code?</h4>
          </div>
          <p className={styles.refCardDesc}>
            Enter an invite code from a friend or creator to instantly receive 50 startup coins.
          </p>

          {stats.claimed ? (
            <div className={styles.claimedSuccessBox}>
              <CheckCircle2 size={20} className={styles.claimedCheckIcon} />
              <div>
                <strong>Bonus Claimed!</strong>
                <p>Referred by @{stats.referredBy?.username || 'a friend'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaim} className={styles.claimFormRow}>
              <input
                type="text"
                className={styles.claimInput}
                placeholder="Enter referral code..."
                value={codeForm}
                onChange={(e) => setCodeForm(e.target.value)}
                required
              />
              <button type="submit" disabled={claiming} className={styles.claimSubmitBtn}>
                {claiming ? <Loader size={16} className={styles.spin} /> : <Sparkles size={16} />} Claim
              </button>
            </form>
          )}
        </div>

        {/* Invite Stats Summary Card */}
        <div className={styles.refCard}>
          <div className={styles.refCardHeader}>
            <Trophy size={20} className={styles.refCardIcon} />
            <h4>Your Referral Milestones</h4>
          </div>
          <div className={styles.refStatsGrid}>
            <div className={styles.refStatBlock}>
              <span className={styles.refStatNum}>{stats.referredCount}</span>
              <span className={styles.refStatLabel}><UserPlus size={13} /> Friends Invited</span>
            </div>
            <div className={styles.refStatBlock}>
              <span className={styles.refStatNum}>{stats.referredCount * 100}</span>
              <span className={styles.refStatLabel}><Sparkles size={13} /> Total Coins Earned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className={styles.subViewGrid}>
    <div className="skeleton-card" style={{ height: '180px', borderRadius: '16px' }} />
    <div className="skeleton-card" style={{ height: '120px', borderRadius: '16px' }} />
  </div>
);
