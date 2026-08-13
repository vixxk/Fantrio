// Authoritative gift catalog segregated into Comment Gifts vs Chat Gifts.
// Coins and tiers are single-sourced here and mirrored on the client.

const COMMENT_GIFTS = [
  { id: 'fire', name: 'Fire Drop', emoji: '🔥', coins: 15, tier: 1, category: 'comment' },
  { id: 'star_badge', name: 'Super Star', emoji: '⭐', coins: 35, tier: 1, category: 'comment' },
  { id: 'applause', name: 'Standing Ovation', emoji: '👏', coins: 75, tier: 1, category: 'comment' },
  { id: 'spotlight', name: 'Spotlight', emoji: '💡', coins: 150, tier: 2, category: 'comment' },
  { id: 'champagne', name: 'Celebration', emoji: '🍾', coins: 300, tier: 2, category: 'comment' },
  { id: 'medal', name: 'Gold Medal', emoji: '🥇', coins: 600, tier: 3, category: 'comment' },
  { id: 'top_fan', name: 'Top Fan Crown', emoji: '👑', coins: 1200, tier: 3, category: 'comment' },
  { id: 'golden_post', name: 'Post Trophy', emoji: '🏆', coins: 2500, tier: 4, category: 'comment' },
  { id: 'mega_spotlight', name: 'Mega Spotlight', emoji: '🌟', coins: 6000, tier: 4, category: 'comment' },
  { id: 'legendary_aura', name: 'Legendary Banner', emoji: '💥', coins: 12000, tier: 4, category: 'comment' }
];

const CHAT_GIFTS = [
  { id: 'heart', name: 'Sweet Heart', emoji: '❤️', coins: 10, tier: 1, category: 'chat' },
  { id: 'rose', name: 'Velvet Rose', emoji: '🌹', coins: 30, tier: 1, category: 'chat' },
  { id: 'chocolate', name: 'Chocolates', emoji: '🍫', coins: 60, tier: 1, category: 'chat' },
  { id: 'kiss', name: 'Flying Kiss', emoji: '💋', coins: 100, tier: 2, category: 'chat' },
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', coins: 200, tier: 2, category: 'chat' },
  { id: 'love_letter', name: 'Love Letter', emoji: '💌', coins: 500, tier: 3, category: 'chat' },
  { id: 'diamond_ring', name: 'Diamond Ring', emoji: '💍', coins: 1000, tier: 3, category: 'chat' },
  { id: 'sports_car', name: 'Luxury Sports Car', emoji: '🏎️', coins: 2500, tier: 4, category: 'chat' },
  { id: 'yacht', name: 'Royal Yacht', emoji: '🛥️', coins: 5000, tier: 4, category: 'chat' },
  { id: 'private_jet', name: 'Private Jet', emoji: '✈️', coins: 10000, tier: 4, category: 'chat' }
];

const LEGACY_GIFTS = [
  { id: 'star', name: 'Star', emoji: '⭐', coins: 60, tier: 1 },
  { id: 'love', name: 'Love Burst', emoji: '💖', coins: 100, tier: 2 },
  { id: 'crown', name: 'Crown', emoji: '👑', coins: 500, tier: 3 },
  { id: 'diamond', name: 'Diamond', emoji: '💎', coins: 1000, tier: 3 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', coins: 2000, tier: 4 },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', coins: 5000, tier: 4 },
  { id: 'jackpot', name: 'Jackpot', emoji: '💰', coins: 10000, tier: 4 }
];

// Combined map of all gifts for ID lookup
const ALL_GIFTS = [...COMMENT_GIFTS, ...CHAT_GIFTS, ...LEGACY_GIFTS];

const TIER_NAMES = { 1: 'Classic', 2: 'Premium', 3: 'Luxury', 4: 'Royal' };

const getGiftById = (id) => ALL_GIFTS.find((g) => g.id === id) || null;

const getPublicGifts = (type) => {
  if (type === 'comment') return COMMENT_GIFTS.map((g) => ({ ...g }));
  if (type === 'chat') return CHAT_GIFTS.map((g) => ({ ...g }));
  return CHAT_GIFTS.map((g) => ({ ...g }));
};

module.exports = {
  GIFTS: ALL_GIFTS,
  COMMENT_GIFTS,
  CHAT_GIFTS,
  TIER_NAMES,
  getGiftById,
  getPublicGifts
};
