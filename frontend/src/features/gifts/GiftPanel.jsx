import { useState, useEffect } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { GIFTS as LOCAL_GIFTS, GIFT_TIERS } from './giftCatalog';
import { useToast } from '../../components/Toast/Toast';
import styles from './GiftPanel.module.css';

const TIER_STYLES = {
  1: styles.tierBadge1,
  2: styles.tierBadge2,
  3: styles.tierBadge3,
  4: styles.tierBadge4
};

/**
 * Bottom-sheet gift picker used on 1:1 call overlays and live stream watch
 * screens. The catalog is fetched from the backend (/monetization/gifts) so
 * the UI always reflects the authoritative server list; the bundled mirror is
 * only a fallback for instant first paint or offline render.
 * Tapping a gift sends it immediately (great for rapid gifting). When the
 * wallet can't cover the cost, the recharge modal is opened instead.
 */
export const GiftPanel = ({ receiverName = 'this creator', balance, onSendGift, onRecharge, onClose }) => {
  const { toast } = useToast();
  const [sendingId, setSendingId] = useState(null);
  const [sentId, setSentId] = useState(null);
  const [gifts, setGifts] = useState(LOCAL_GIFTS);

  // Load the authoritative gift catalog from the backend on mount.
  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      try {
        const res = await api.get('/monetization/gifts');
        if (mounted && res.status === 'success' && Array.isArray(res.gifts) && res.gifts.length > 0) {
          setGifts(res.gifts);
        }
      } catch (err) {
        console.error('Failed to load gift catalog from backend:', err);
      }
    };
    Promise.resolve().then(loadCatalog);
    return () => { mounted = false; };
  }, []);

  const handleSend = async (gift) => {
    if (balance < gift.coins) {
      onRecharge();
      return;
    }
    setSendingId(gift.id);
    try {
      await onSendGift(gift);
      setSentId(gift.id);
      setTimeout(() => setSentId(null), 900);
    } catch (err) {
      toast.error(err.message || 'Failed to send gift');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Send a Gift</h3>
            <p className={styles.sub}>Show some love to {receiverName} 💝</p>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.balanceChip}>
              <img src="/coin.png" alt="Coin" className={styles.coinImg} />
              {balance.toLocaleString()}
            </span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {gifts.map((gift) => {
            const affordable = balance >= gift.coins;
            const sending = sendingId === gift.id;
            const sent = sentId === gift.id;
            return (
              <button
                key={gift.id}
                type="button"
                className={`${styles.giftCard} ${!affordable ? styles.giftCardLocked : ''} ${sent ? styles.giftCardSent : ''}`}
                onClick={() => handleSend(gift)}
                disabled={sending}
              >
                <span className={styles.giftEmoji}>{gift.emoji}</span>
                <span className={styles.giftName}>{gift.name}</span>
                <span className={`${styles.tierBadge} ${TIER_STYLES[gift.tier]}`}>
                  {GIFT_TIERS[gift.tier].label}
                </span>
                <span className={styles.giftPrice}>
                  {sending ? (
                    <span className={styles.sendingDots}>···</span>
                  ) : sent ? (
                    <span className={styles.sentCheck}><Check size={13} /> Sent</span>
                  ) : (
                    <>
                      <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                      {gift.coins.toLocaleString()}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <Zap size={13} className={styles.footerIcon} />
          <span>
            Bigger gifts unlock fancier animations. Need more coins?{' '}
            <button className={styles.rechargeLink} onClick={onRecharge}>Recharge</button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GiftPanel;
