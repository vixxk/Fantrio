// Subscriber list filter model + helpers (creators → subscribers page)
// Mirrors the ChatFiltersSheet pattern used by the messages pages.

export const DEFAULT_SUBSCRIBER_FILTERS = {
  status: 'all',       // 'all' | 'active' | 'expiring' | 'expired' | 'cancelled'
  plan: 'all',         // 'all' | 'basic' | 'premium' | 'vip'
  spend: 'all',        // 'all' | 'under50' | '50to150' | 'over150'
  verifiedOnly: false,
  onlineOnly: false,
};

// Coin-spend buckets (inclusive bounds). Rows use totalSpentCoins.
export const SPEND_BUCKETS = {
  under50: { min: null, max: 49 },
  '50to150': { min: 50, max: 149 },
  over150: { min: 150, max: null },
};

// Note: sort is intentionally excluded — it's owned by the standalone
// toolbar dropdown on the page (selectedSort → sortParam), not by these
// filters, so it never lights up the badge.
export const countActiveSubscriberFilters = (f) => {
  if (!f) return 0;
  return (
    (f.status !== 'all' ? 1 : 0) +
    (f.plan !== 'all' ? 1 : 0) +
    (f.spend !== 'all' ? 1 : 0) +
    (f.verifiedOnly ? 1 : 0) +
    (f.onlineOnly ? 1 : 0)
  );
};

// Builds the query params sent to GET /creators/subscribers.
// Sort is intentionally NOT set here — the page adds it from its own
// toolbar dropdown (sortParam) so there's a single source of truth.
export const buildSubscriberQuery = (f) => {
  const params = new URLSearchParams();
  params.set('status', f.status || 'all');
  if (f.plan && f.plan !== 'all') params.set('plan', f.plan);
  const bucket = SPEND_BUCKETS[f.spend];
  if (bucket) {
    if (bucket.min !== null) params.set('minSpend', String(bucket.min));
    if (bucket.max !== null) params.set('maxSpend', String(bucket.max));
  }
  if (f.verifiedOnly) params.set('verifiedOnly', 'true');
  if (f.onlineOnly) params.set('onlineOnly', 'true');
  return params;
};
