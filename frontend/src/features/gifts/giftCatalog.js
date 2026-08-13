// Comment Gifts — tailored for public post reactions & comment highlighting
export const COMMENT_GIFTS = [
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

// Chat Gifts — tailored for 1:1 direct messages & private call gifts
export const CHAT_GIFTS = [
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

export const GIFTS = [...COMMENT_GIFTS, ...CHAT_GIFTS];

// Dynamically compute tier from coin value if not set
export const getTierFromCoins = (coins = 0) => {
  const c = Number(coins) || 0;
  if (c >= 5000) return 5;
  if (c >= 1000) return 4;
  if (c >= 300) return 3;
  if (c >= 100) return 2;
  return 1;
};

// Animation intensity grows with the tier (the "royalty" of the gift):
//   tier 1 Classic         — pop & float
//   tier 2 Premium         — burst + neon shockwave ring
//   tier 3 Luxury          — dual aura + radial particles + crown + screen pulse
//   tier 4 Royal           — golden sunburst rays + triple shockwaves + confetti rain
//   tier 5 Ultra Legendary — full screen cosmic spectacle + coin rain + rainbow border flash
export const GIFT_TIERS = {
  1: { label: 'Classic', duration: 2800, cssClass: 'giftTier1' },
  2: { label: 'Premium', duration: 3600, cssClass: 'giftTier2' },
  3: { label: 'Luxury', duration: 4500, cssClass: 'giftTier3' },
  4: { label: 'Royal', duration: 5500, cssClass: 'giftTier4' },
  5: { label: 'Ultra Legendary', duration: 6800, cssClass: 'giftTier5' }
};

// Deterministic pseudo-random from a string seed (event ids) so particles stay
// stable across re-renders instead of re-randomizing every frame.
const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

export const seededRand = (seed, i) => {
  const h = hashCode(`${seed}_${i}`);
  return h / 2147483647;
};
