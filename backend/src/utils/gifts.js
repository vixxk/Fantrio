// Authoritative gift catalog. Coins and tiers are single-sourced here and
// mirrored on the client (frontend/src/features/gifts/giftCatalog.js) purely
// for instant UI rendering — the backend always validates against THIS list.
//
// Tier = animation intensity / royalty of the gift:
//   tier 1 (Classic,  ≤ 99 coins)   — small pop & float
//   tier 2 (Premium,  100–499)      — burst + sparkles
//   tier 3 (Luxury,   500–1999)     — glow + rings + confetti
//   tier 4 (Royal,    ≥ 2000)       — full-screen golden spectacle
const GIFTS = [
  { id: 'heart', name: 'Heart', emoji: '❤️', coins: 10, tier: 1 },
  { id: 'rose', name: 'Rose', emoji: '🌹', coins: 30, tier: 1 },
  { id: 'star', name: 'Star', emoji: '⭐', coins: 60, tier: 1 },
  { id: 'love', name: 'Love Burst', emoji: '💖', coins: 100, tier: 2 },
  { id: 'kiss', name: 'Kiss', emoji: '💋', coins: 200, tier: 2 },
  { id: 'crown', name: 'Crown', emoji: '👑', coins: 500, tier: 3 },
  { id: 'diamond', name: 'Diamond', emoji: '💎', coins: 1000, tier: 3 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', coins: 2000, tier: 4 },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', coins: 5000, tier: 4 },
  { id: 'jackpot', name: 'Jackpot', emoji: '💰', coins: 10000, tier: 4 }
];

const TIER_NAMES = { 1: 'Classic', 2: 'Premium', 3: 'Luxury', 4: 'Royal' };

const getGiftById = (id) => GIFTS.find((g) => g.id === id) || null;

const getPublicGifts = () => GIFTS.map((g) => ({ ...g }));

module.exports = { GIFTS, TIER_NAMES, getGiftById, getPublicGifts };
