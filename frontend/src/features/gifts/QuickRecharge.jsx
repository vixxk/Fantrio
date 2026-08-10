import { useState } from 'react';
import { X, CheckCircle2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/Toast/Toast';
import styles from './QuickRecharge.module.css';

const PRESETS = [100, 300, 500, 1000, 2000];

/**
 * In-context coin recharge modal used during live calls/streams. All
 * recharges are simulated and always succeed — no real money is involved;
 * coins are simply credited to the wallet instantly.
 */
export const QuickRecharge = ({ onClose, reason }) => {
  const { balance, addCoins } = useApp();
  const { toast } = useToast();
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const selected = custom ? parseInt(custom, 10) || 0 : amount;

  const handleRecharge = async () => {
    if (selected <= 0) return;
    setLoading(true);
    try {
      await addCoins(selected);
      setSuccess(selected);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err) {
      toast.error(err.message || 'Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {success ? (
          <div className={styles.successBox}>
            <CheckCircle2 size={46} className={styles.successIcon} />
            <h3 className={styles.successTitle}>Recharge Successful!</h3>
            <p className={styles.successText}>
              {success.toLocaleString()} coins added to your wallet.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.iconWrap}>
              <img src="/coin.png" alt="Coin" className={styles.coinImg} />
            </div>
            <h3 className={styles.title}>Recharge Coins</h3>
            <p className={styles.sub}>
              {reason || 'Top up your wallet to keep gifting and stay connected.'}
            </p>

            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>Current balance</span>
              <span className={styles.balanceValue}>
                <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                {balance.toLocaleString()}
              </span>
            </div>

            <div className={styles.presetGrid}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.preset} ${!custom && amount === p ? styles.presetActive : ''}`}
                  onClick={() => { setAmount(p); setCustom(''); }}
                >
                  <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                  {p.toLocaleString()}
                </button>
              ))}
            </div>

            <div className={styles.customRow}>
              <input
                type="number"
                min="1"
                placeholder="Custom amount"
                className={styles.customInput}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <button
                type="button"
                className={styles.rechargeBtn}
                onClick={handleRecharge}
                disabled={loading || selected <= 0}
              >
                {loading ? 'Recharging…' : `Recharge ${selected.toLocaleString()} coins`}
              </button>
            </div>

            <p className={styles.note}>
              <Zap size={12} />
              Demo mode — every recharge is instantly successful. No real money is charged.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickRecharge;
