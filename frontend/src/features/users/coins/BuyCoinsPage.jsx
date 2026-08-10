import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../components/Toast/Toast';
import {
  Lock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import styles from './BuyCoinsPage.module.css';

export const BuyCoinsPage = () => {
  const { balance, purchaseCoins, redeemPromo, darkMode, setActiveTab } = useApp();
  const { toast } = useToast();

  // Data from backend
  const [packages, setPackages] = useState([]);
  const [offer, setOffer] = useState({ isActive: false, bonusPercent: 0, endsAt: null });
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Timer State (Offer Countdown)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Modal State for Coin Purchase
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/packages');
      if (res.status === 'success') {
        setPackages(res.packages || []);
        setOffer(res.offer || { isActive: false, bonusPercent: 0, endsAt: null });
        setAvailablePromos(res.promoCodes || []);
      }
    } catch (err) {
      console.error('Failed to load coin packages:', err);
      setLoadError(err.message || 'Failed to load coin packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchPackages();
    });
  }, []);

  // Countdown timer driven by the backend offer end time
  const offerEndsAt = useMemo(() => (offer.isActive && offer.endsAt ? new Date(offer.endsAt).getTime() : null), [offer]);

  useEffect(() => {
    if (!offerEndsAt) return;

    const updateTimer = () => {
      const diff = offerEndsAt - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [offerEndsAt]);

  const handleConfirmPurchase = async () => {
    if (!selectedPack) return;
    setPurchasing(true);

    try {
      const res = await purchaseCoins(selectedPack.id);
      setPurchaseSuccess(`${res.transaction.amountCoins} coins added to your wallet!`);
      fetchPackages();
      setTimeout(() => {
        setSelectedPack(null);
        setPurchaseSuccess(null);
      }, 1500);
    } catch (err) {
      toast.error('Purchase failed: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRedeemPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await redeemPromo(promoCode);
      setPromoMessage(res.message || 'Promo code applied!');
      setPromoCode('');
      fetchPackages();
    } catch (err) {
      setPromoMessage(err.message || 'Invalid or expired promo code.');
    } finally {
      setRedeeming(false);
    }
    setTimeout(() => setPromoMessage(''), 4000);
  };

  const formattedBalance = balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className={`${styles.buyCoinsContainer} ${!darkMode ? styles.light : ''}`}>
      <div className={styles.buyCoinsShell}>

        {/* ================= LEFT MAIN SECTION ================= */}
        <div className={styles.mainSection}>

          {/* Header */}
          <div className={styles.headerSection}>
            <div className={styles.titleRow}>
              <img src="/coin.png" alt="Coin" className={styles.headerCoinIcon} />
              <h1 className={styles.title}>Buy Coins</h1>
            </div>
            <p className={styles.subtitle}>Choose a coin pack and start supporting your favourite creators.</p>
          </div>

          {/* Limited Time Offer Banner */}
          {offer.isActive && (
            <div className={styles.offerBanner}>
              <div className={styles.offerLeft}>
                <img src="/offer.png" alt="Offer" className={styles.offerIconImg} />
                <span className={styles.offerText}>
                  <strong>Limited Time Offer:</strong> Get {offer.bonusPercent}% extra coins on selected products!
                </span>
              </div>

              {/* Timer */}
              <div className={styles.offerTimer}>
                <span className={styles.timerLabel}>Offer Ends In</span>
                <div className={styles.timerGroup}>
                  <div className={styles.timerBoxWrapper}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{String(timeLeft.days).padStart(2, '0')}</span>
                    </div>
                    <span className={styles.timerUnit}>DAYS</span>
                  </div>

                  <span className={styles.timerColon}>:</span>

                  <div className={styles.timerBoxWrapper}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{String(timeLeft.hours).padStart(2, '0')}</span>
                    </div>
                    <span className={styles.timerUnit}>Hrs</span>
                  </div>

                  <span className={styles.timerColon}>:</span>

                  <div className={styles.timerBoxWrapper}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                    </div>
                    <span className={styles.timerUnit}>Mins</span>
                  </div>

                  <span className={styles.timerColon}>:</span>

                  <div className={styles.timerBoxWrapper}>
                    <div className={styles.timerBox}>
                      <span className={styles.timerNum}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                    <span className={styles.timerUnit}>Secs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coin Packs Grid */}
          {loading ? (
            <div className={styles.coinGrid}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className={styles.coinCard} style={{ minHeight: '210px' }} />
              ))}
            </div>
          ) : loadError ? (
            <div className={styles.paymentNotice} style={{ justifyContent: 'center', padding: '2rem 0' }}>
              <span>{loadError}</span>
            </div>
          ) : packages.length === 0 ? (
            <div className={styles.paymentNotice} style={{ justifyContent: 'center', padding: '2rem 0' }}>
              <span>No coin packs are currently available.</span>
            </div>
          ) : (
            <div className={styles.coinGrid}>
              {packages.map((pack) => {
                const packBonus = pack.bonusCoins || 0;
                const offerBonus = offer.isActive && offer.bonusPercent > 0
                  ? Math.round((pack.coins * offer.bonusPercent) / 100)
                  : 0;
                const totalBonus = packBonus + offerBonus;
                return (
                  <div
                    key={pack.id}
                    className={`${styles.coinCard} ${pack.isPopular ? styles.popularCard : ''}`}
                  >
                    {pack.isPopular && (
                      <div className={styles.popularBadge}>Most Popular</div>
                    )}

                    <div className={styles.imgWrapper}>
                      <img
                        src={pack.image || '/coin.png'}
                        alt={`${pack.coins} Coins`}
                        className={`${styles.packImg} ${pack.image && pack.image.includes('Gift') ? styles.giftCoinsImg : ''}`}
                      />
                    </div>

                    <h3 className={styles.packTitle}>{pack.coins} Coins</h3>

                    {totalBonus > 0 && (
                      <p className={styles.offerText} style={{ fontSize: '0.78rem', margin: '0 0 0.4rem 0', textAlign: 'center' }}>
                        +{totalBonus} bonus coins
                      </p>
                    )}

                    <div className={styles.priceRow}>
                      {pack.oldPriceUSD != null && (
                        <span className={styles.oldPrice}>${pack.oldPriceUSD.toFixed(2)}</span>
                      )}
                      <span className={styles.newPrice}>${pack.priceUSD.toFixed(2)}</span>
                    </div>

                    <button
                      className={styles.buyBtn}
                      onClick={() => setSelectedPack(pack)}
                    >
                      Buy
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Secure Payment Footer */}
          <div className={styles.paymentFooter}>
            <div className={styles.paymentNotice}>
              <Lock size={14} className={styles.lockIcon} />
              <span>All payments are secured and encrypted. Prices are in USD</span>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className={styles.rightSidebar}>

          {/* Widget 1: My Wallet */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>My Wallet</h3>
            <div className={styles.walletBalanceRow}>
              <img src="/coin.png" alt="Coin" className={styles.walletCoinImg} />
              <span className={styles.walletCoinsText}>{formattedBalance} Coins</span>
            </div>
            <button
              className={styles.transHistoryBtn}
              onClick={() => setActiveTab('Transaction History')}
            >
              View Transaction History
            </button>
          </div>

          {/* Widget 2: Why Buy Coins? */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Why Buy Coins?</h3>
            <div className={styles.whyList}>
              <div className={styles.whyItem}>
                <img src="/heart.png" alt="Heart" className={styles.whyIconImg} />
                <span>Support your favourite creators</span>
              </div>
              <div className={styles.whyItem}>
                <img src="/Unlock.png" alt="Unlock" className={styles.whyIconImg} />
                <span>Unlock exclusive content</span>
              </div>
              <div className={styles.whyItem}>
                <img src="/gift.png" alt="Gift" className={styles.whyIconImg} />
                <span>Send tips and gifts</span>
              </div>
              <div className={styles.whyItem}>
                <img src="/audio.png" alt="Audio" className={styles.whyIconImg} />
                <span>Start 1:1 calling</span>
              </div>
              <div className={styles.whyItem}>
                <img src="/offer circle.png" alt="Offer" className={styles.whyIconImg} />
                <span>Get special offers & discounts</span>
              </div>
            </div>
          </div>

          {/* Widget 3: Redeem Promo Code */}
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>Redeem Promo Code</h3>
            <form onSubmit={handleRedeemPromo} className={styles.promoInputRow}>
              <input
                type="text"
                placeholder="Enter promo..."
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className={styles.promoInput}
              />
              <button type="submit" className={styles.redeemBtn} disabled={redeeming}>
                {redeeming ? '...' : 'Redeem'}
              </button>
            </form>
            {promoMessage && (
              <p style={{ fontSize: '0.78rem', color: promoMessage.toLowerCase().includes('invalid') || promoMessage.toLowerCase().includes('already') ? '#ef4444' : '#22c55e', margin: '0 0 0.5rem 0' }}>
                {promoMessage}
              </p>
            )}

            {availablePromos.length > 0 && (
              <div className={styles.yourCodesRow}>
                <span>Available Codes</span>
                <ChevronRight size={16} />
              </div>
            )}
            {availablePromos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {availablePromos.map((p) => (
                  <div
                    key={p.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(126, 0, 243, 0.12)',
                      border: '1px solid rgba(126, 0, 243, 0.25)',
                      borderRadius: '10px',
                      padding: '0.45rem 0.7rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => setPromoCode(p.code)}
                  >
                    <span style={{ fontWeight: 700, color: '#e10075' }}>{p.code}</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>+{p.bonusCoins} coins</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 4: Safe & Secure */}
          <div className={`${styles.widgetCard} ${styles.safeSecureCard}`}>
            <img src="/safe.png" alt="Safe & Secure" className={styles.safeIconImg} />
            <div className={styles.safeTextCol}>
              <h3 className={styles.safeTitle}>Safe & Secure</h3>
              <p className={styles.safeSubtext}>
                Your payment information is 100% secure with industry standard encryption.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ================= PURCHASE CONFIRMATION MODAL ================= */}
      {selectedPack && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPack(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <img src={selectedPack.image || '/coin.png'} alt="Coins" className={styles.modalImg} />

            {purchaseSuccess ? (
              <>
                <CheckCircle2 size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
                <h3 className={styles.modalTitle}>Purchase Successful!</h3>
                <p className={styles.modalDesc}>{purchaseSuccess}</p>
              </>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Purchase {selectedPack.coins} Coins</h3>
                <p className={styles.modalDesc}>
                  Total Price: <strong>${selectedPack.priceUSD.toFixed(2)}</strong>
                  {selectedPack.oldPriceUSD != null && (
                    <> <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>${selectedPack.oldPriceUSD.toFixed(2)}</span></>
                  )}
                </p>

                <div className={styles.modalBtnGroup}>
                  <button
                    className={styles.modalConfirmBtn}
                    onClick={handleConfirmPurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                  <button
                    className={styles.modalCancelBtn}
                    onClick={() => setSelectedPack(null)}
                    disabled={purchasing}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
