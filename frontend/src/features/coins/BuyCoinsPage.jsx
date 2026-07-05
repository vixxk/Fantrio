import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Percent, 
  Lock, 
  Heart, 
  Gift, 
  Phone, 
  ShieldCheck, 
  ChevronRight,
  CheckCircle2,
  X
} from 'lucide-react';
import styles from './BuyCoinsPage.module.css';

export const BuyCoinsPage = () => {
  const { balance, addCoins, darkMode, setActiveTab } = useApp();
  
  // Timer State (Offer Countdown)
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 13, minutes: 36, seconds: 45 });
  
  // Modal State for Coin Purchase
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 12 Coin Packs configuration matching screenshot
  const coinPacks = [
    { id: 1, coins: 100, oldPrice: '1.99$', price: '1.59$', img: '/1 stack.png', isPopular: true },
    { id: 2, coins: 200, oldPrice: '1.99$', price: '1.59$', img: '/2 stack.png', isPopular: false },
    { id: 3, coins: 300, oldPrice: '1.99$', price: '1.59$', img: '/3 stack.png', isPopular: false },
    { id: 4, coins: 400, oldPrice: '1.99$', price: '1.59$', img: '/chest.png', isPopular: false },
    { id: 5, coins: 500, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 6, coins: 600, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 7, coins: 700, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 8, coins: 800, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 9, coins: 900, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 10, coins: 950, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 11, coins: 1000, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false },
    { id: 12, coins: 1100, oldPrice: '1.99$', price: '1.59$', img: '/Gift & Coins.png', isPopular: false }
  ];

  const handleConfirmPurchase = async () => {
    if (!selectedPack) return;
    setPurchasing(true);

    try {
      await addCoins(selectedPack.coins);
      setPurchaseSuccess(`${selectedPack.coins} coins added to your wallet!`);
      setTimeout(() => {
        setSelectedPack(null);
        setPurchaseSuccess(null);
      }, 1500);
    } catch (err) {
      alert('Purchase failed: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRedeemPromo = (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    if (promoCode.toUpperCase() === 'FANTRIO20' || promoCode.toUpperCase() === 'BONUS') {
      addCoins(200);
      setPromoMessage('Promo code applied! 200 bonus coins added.');
      setPromoCode('');
    } else {
      setPromoMessage('Invalid or expired promo code.');
    }

    setTimeout(() => setPromoMessage(''), 3000);
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
          <div className={styles.offerBanner}>
            <div className={styles.offerLeft}>
              <img src="/offer.png" alt="Offer" className={styles.offerIconImg} />
              <span className={styles.offerText}>
                <strong>Limited Time Offer:</strong> Get 20% extra coins on selected products!
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

          {/* Coin Packs Grid */}
          <div className={styles.coinGrid}>
            {coinPacks.map((pack) => (
              <div 
                key={pack.id} 
                className={`${styles.coinCard} ${pack.isPopular ? styles.popularCard : ''}`}
              >
                {pack.isPopular && (
                  <div className={styles.popularBadge}>Most Popular</div>
                )}
                
                <div className={styles.imgWrapper}>
                  <img 
                    src={pack.img} 
                    alt={`${pack.coins} Coins`} 
                    className={`${styles.packImg} ${pack.img.includes('Gift') ? styles.giftCoinsImg : ''}`} 
                  />
                </div>

                <h3 className={styles.packTitle}>{pack.coins} Coins</h3>

                <div className={styles.priceRow}>
                  <span className={styles.oldPrice}>{pack.oldPrice}</span>
                  <span className={styles.newPrice}>{pack.price}</span>
                </div>

                <button 
                  className={styles.buyBtn}
                  onClick={() => setSelectedPack(pack)}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>

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
              onClick={() => alert('Viewing transaction history...')}
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
              <button type="submit" className={styles.redeemBtn}>Redeem</button>
            </form>
            {promoMessage && (
              <p style={{ fontSize: '0.78rem', color: promoMessage.includes('applied') ? '#22c55e' : '#ef4444', margin: '0 0 0.5rem 0' }}>
                {promoMessage}
              </p>
            )}

            <div className={styles.yourCodesRow} onClick={() => alert('Code FANTRIO20 available!')}>
              <span>Your Codes</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Widget 4: Safe & Secure */}
          <div className={styles.widgetCard}>
            <img src="/safe.png" alt="Safe & Secure" className={styles.safeIconImg} />
            <h3 className={styles.safeTitle}>Safe & Secure</h3>
            <p className={styles.safeSubtext}>
              Your payment information is 100% secure with industry standard encryption.
            </p>
          </div>

        </div>

      </div>

      {/* ================= PURCHASE CONFIRMATION MODAL ================= */}
      {selectedPack && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPack(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <img src={selectedPack.img} alt="Coins" className={styles.modalImg} />
            
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
                  Total Price: <strong>{selectedPack.price}</strong>
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
