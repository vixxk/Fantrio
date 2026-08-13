import React from 'react';
import styles from './GiftMessageCard.module.css';
import { GIFTS } from './giftCatalog';

export const parseGiftMessage = (msg) => {
  if (!msg) return { isGift: false };

  // Explicit gift fields check
  if (msg.isGift || msg.giftName || msg.gift) {
    const giftObj = msg.gift || {};
    const name = msg.giftName || giftObj.name || 'Gift';
    const emoji = msg.giftEmoji || giftObj.emoji || '🎁';
    let coins = msg.giftCoins || giftObj.coins || 0;

    if (!coins && name) {
      const catalogMatch = GIFTS.find(g =>
        g.name.toLowerCase() === name.toLowerCase() ||
        name.toLowerCase().includes(g.name.toLowerCase()) ||
        g.name.toLowerCase().includes(name.toLowerCase())
      );
      if (catalogMatch) coins = catalogMatch.coins;
    }

    const tier = msg.giftTier || giftObj.tier || (coins >= 500 ? 4 : coins >= 200 ? 3 : coins >= 50 ? 2 : 1);
    return { isGift: true, name, emoji, coins, tier };
  }

  // String parsing for legacy or fallback gift message formats
  const text = msg.text || msg.content || '';
  if (typeof text === 'string' && text.includes('Sent ') && (text.includes('Coin') || text.includes('Coins') || text.includes('!'))) {
    // Regex matching e.g. "🏎️ Sent Luxury Sports Car (2,500 Coins)!" or "Sent Heart (10 Coins)"
    const match = text.match(/(?:([^\w\s]+)\s*)?Sent\s+([^(!]+?)(?:\s*\(([\d,]+)\s*Coins?\))?/i);
    if (match) {
      const emoji = match[1]?.trim() || '🎁';
      const rawName = match[2]?.trim() || 'Gift';
      const cleanName = rawName.replace(/\s*Gift$/i, '').trim();
      let coins = match[3] ? parseInt(match[3].replace(/,/g, ''), 10) : 0;

      if (!coins && cleanName) {
        const catalogMatch = GIFTS.find(g =>
          g.name.toLowerCase() === cleanName.toLowerCase() ||
          cleanName.toLowerCase().includes(g.name.toLowerCase()) ||
          g.name.toLowerCase().includes(cleanName.toLowerCase())
        );
        if (catalogMatch) coins = catalogMatch.coins;
      }

      const tier = coins >= 500 ? 4 : coins >= 200 ? 3 : coins >= 50 ? 2 : 1;
      return { isGift: true, name: cleanName, emoji, coins, tier };
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
          <span className={styles.coinText}>{coins > 0 ? coins.toLocaleString() : '0'} Coins</span>
        </div>
      </div>
    </div>
  );
};

export default GiftMessageCard;
