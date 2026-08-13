import React from 'react';
import styles from './GiftMessageCard.module.css';

export const parseGiftMessage = (msg) => {
  if (!msg) return { isGift: false };

  // Explicit gift fields check
  if (msg.isGift || msg.giftName || msg.gift) {
    const giftObj = msg.gift || {};
    const name = msg.giftName || giftObj.name || 'Gift';
    const emoji = msg.giftEmoji || giftObj.emoji || '🎁';
    const coins = msg.giftCoins || giftObj.coins || 0;
    const tier = msg.giftTier || giftObj.tier || (coins >= 500 ? 4 : coins >= 200 ? 3 : coins >= 50 ? 2 : 1);
    return { isGift: true, name, emoji, coins, tier };
  }

  // String parsing for legacy or fallback gift message formats
  const text = msg.text || msg.content || '';
  if (typeof text === 'string' && text.includes('Sent ') && (text.includes('Coin') || text.includes('Coins') || text.includes('!'))) {
    // Regex matching e.g. "❤️ Sent Heart (10 Coins) to Creator1!" or "Sent Crown (500 Coins)"
    const match = text.match(/(?:([^\w\s]+)\s*)?Sent\s+([^(!]+)(?:\((\d+)\s*Coins?\))?/i);
    if (match) {
      const emoji = match[1]?.trim() || '🎁';
      const name = match[2]?.trim() || 'Gift';
      const coins = match[3] ? parseInt(match[3], 10) : 0;
      const tier = coins >= 500 ? 4 : coins >= 200 ? 3 : coins >= 50 ? 2 : 1;
      return { isGift: true, name, emoji, coins, tier };
    }
  }

  return { isGift: false };
};

const TIER_LABELS = {
  2: 'RARE',
  3: 'EPIC GOLD',
  4: 'MYTHIC'
};

export const GiftMessageCard = ({ msg, isCreator = false }) => {
  const parsed = parseGiftMessage(msg);
  if (!parsed.isGift) return null;

  const { name, emoji, coins, tier } = parsed;
  const tierClass = styles[`tier${tier}`] || styles.tier1;
  const labelText = TIER_LABELS[tier];

  return (
    <div className={`${styles.giftCardContainer} ${tierClass}`}>
      <div className={styles.iconBadge}>
        <span>{emoji}</span>
      </div>
      <div className={styles.detailsBlock}>
        <div className={styles.cardHeader}>
          <h4 className={styles.giftTitle}>{name} Gift</h4>
          {labelText && <span className={styles.tierLabel}>{labelText}</span>}
        </div>
        <p className={styles.subText}>
          {isCreator ? '🎁 Gift received in chat' : '💝 Gift sent in chat'}
        </p>
        <div className={styles.coinBadge}>
          <img src="/coin.png" alt="Coin" className={styles.coinIcon} />
          <span className={styles.coinText}>{coins > 0 ? coins.toLocaleString() : 'Special'} Coins</span>
        </div>
      </div>
    </div>
  );
};

export default GiftMessageCard;
