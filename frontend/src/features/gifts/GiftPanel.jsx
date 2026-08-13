import { useState, useEffect } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { COMMENT_GIFTS, CHAT_GIFTS, GIFT_TIERS } from './giftCatalog';
import { useToast } from '../../components/Toast/Toast';
import { useApp } from '../../context/AppContext';
import styles from './GiftPanel.module.css';

const TIER_STYLES = {
  1: styles.tierBadge1,
  2: styles.tierBadge2,
  3: styles.tierBadge3,
  4: styles.tierBadge4
};

/**
 * Bottom-sheet gift picker used on 1:1 call overlays, live stream watch
 * screens, post comments, and direct chat messages.
 */
export const GiftPanel = ({ type = 'chat', receiverName = 'this creator', balance = 0, onSendGift, onRecharge, onClose }) => {
  const { toast } = useToast();
  const app = useApp?.() || {};
  const darkMode = app.darkMode !== undefined ? app.darkMode : true;

  const initialGifts = type === 'comment' ? COMMENT_GIFTS : CHAT_GIFTS;

  const [sendingId, setSendingId] = useState(null);
  const [sentId, setSentId] = useState(null);
  const [gifts, setGifts] = useState(initialGifts);
  const [confirmGift, setConfirmGift] = useState(null);

  const safeBalance = typeof balance === 'number' ? balance : Number(balance) || 0;

  // Load the authoritative gift catalog from the backend on mount.
  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      try {
        const res = await api.get(`/monetization/gifts?type=${type}`);
        if (mounted && res.status === 'success' && Array.isArray(res.gifts) && res.gifts.length > 0) {
          setGifts(res.gifts);
        }
      } catch (err) {
        console.error('Failed to load gift catalog from backend:', err);
      }
    };
    Promise.resolve().then(loadCatalog);
    return () => { mounted = false; };
  }, [type]);

  const handleGiftClick = (gift) => {
    if (sendingId || sentId) return;
    const coinPrice = typeof gift.coins === 'number' ? gift.coins : Number(gift.coins) || 0;
    if (safeBalance < coinPrice) {
      onRecharge();
      return;
    }
    setConfirmGift(gift);
  };

  const handleConfirmSend = async () => {
    if (!confirmGift || sendingId) return;
    const targetGift = confirmGift;
    setConfirmGift(null);
    onClose(); // Automatically close the gift popup immediately for optimistic UI update
    try {
      await onSendGift(targetGift);
    } catch (err) {
      const msg = err && err.message ? err.message : 'Failed to send gift. Please try again.';
      console.error('Failed to send gift:', err);
      if (/insufficient/i.test(msg)) {
        onRecharge();
        return;
      }
      toast.error(msg);
    }
  };

  return (
    <div className={`${styles.backdrop} ${!darkMode ? styles.light : styles.dark}`} onClick={() => !sendingId && onClose()}>
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
              {safeBalance.toLocaleString()}
            </span>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              disabled={!!sendingId}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {gifts.map((gift) => {
            const coinPrice = typeof gift.coins === 'number' ? gift.coins : Number(gift.coins) || 0;
            const affordable = safeBalance >= coinPrice;
            const sending = sendingId === gift.id;
            const sent = sentId === gift.id;
            return (
              <button
                key={gift.id}
                type="button"
                className={`${styles.giftCard} ${!affordable ? styles.giftCardLocked : ''} ${sent ? styles.giftCardSent : ''}`}
                onClick={() => handleGiftClick(gift)}
                disabled={sending}
              >
                <span className={styles.giftEmoji}>{gift.emoji}</span>
                <span className={styles.giftName}>{gift.name}</span>
                <span className={`${styles.tierBadge} ${TIER_STYLES[gift.tier]}`}>
                  {GIFT_TIERS[gift.tier]?.label || 'Tier 1'}
                </span>
                <span className={styles.giftPrice}>
                  {sending ? (
                    <span className={styles.sendingDots}>···</span>
                  ) : sent ? (
                    <span className={styles.sentCheck}><Check size={13} /> Sent</span>
                  ) : (
                    <>
                      <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                      {coinPrice.toLocaleString()}
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
            Bigger gifts unlock bigger attractions. Need more coins?{' '}
            <button className={styles.rechargeLink} onClick={onRecharge}>Recharge</button>
          </span>
        </div>

        {/* Gift Confirmation Modal */}
        {confirmGift && (
          <div className={styles.confirmBackdrop} onClick={() => !sendingId && setConfirmGift(null)}>
            <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmEmoji}>{confirmGift.emoji}</div>
              <h4 className={styles.confirmTitle}>Send {confirmGift.name}?</h4>
              <p className={styles.confirmText}>
                Send <strong>{confirmGift.name}</strong> to <strong>{receiverName}</strong> for{' '}
                <span className={styles.confirmCoins}>
                  <img src="/coin.png" alt="Coin" className={styles.coinImgSm} />
                  {(typeof confirmGift.coins === 'number' ? confirmGift.coins : Number(confirmGift.coins) || 0).toLocaleString()} coins
                </span>?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={() => setConfirmGift(null)}
                  disabled={!!sendingId}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmSendBtn}
                  onClick={handleConfirmSend}
                  disabled={!!sendingId}
                >
                  {sendingId ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftPanel;
