// Client mirror of the backend gift catalog (backend/src/utils/gifts.js).
// Coins/tiers are authoritative on the backend; this copy only drives the UI
// instantly while the API validates every send.
export const GIFTS = [
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

// Animation intensity grows with the tier (the "royalty" of the gift):
//   tier 1 Classic — pop & float
//   tier 2 Premium — burst + sparkles
//   tier 3 Luxury  — glow + rings + confetti
//   tier 4 Royal   — full-screen golden spectacle
export const GIFT_TIERS = {
  1: { label: 'Classic', duration: 3000, cssClass: 'giftTier1' },
  2: { label: 'Premium', duration: 3800, cssClass: 'giftTier2' },
  3: { label: 'Luxury', duration: 4600, cssClass: 'giftTier3' },
  4: { label: 'Royal', duration: 5600, cssClass: 'giftTier4' }
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
