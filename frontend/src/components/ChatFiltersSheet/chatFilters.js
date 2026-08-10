// Shared chat-list filter model + helpers (used by both Messages pages and the filter sheet)

export const DEFAULT_CHAT_FILTERS = {
  sort: 'recent',      // 'recent' | 'oldest' | 'unreadFirst'
  type: 'all',         // 'all' | 'unread' | 'subscribed' | 'favorites' | 'media'
  period: 'all',       // 'all' | 'today' | 'week' | 'month'
  verifiedOnly: false,
  onlineOnly: false,
};

export const countActiveChatFilters = (f) => {
  if (!f) return 0;
  return (
    (f.sort !== 'recent' ? 1 : 0) +
    (f.type !== 'all' ? 1 : 0) +
    (f.period !== 'all' ? 1 : 0) +
    (f.verifiedOnly ? 1 : 0) +
    (f.onlineOnly ? 1 : 0)
  );
};

const MEDIA_RE = /🔒|📎/;

export const matchesChatFilters = (conv, f, opts = {}) => {
  const { favoriteIds } = opts;
  if (f.type === 'unread' && !(conv.unreadCount > 0)) return false;
  if (f.type === 'favorites' && !(favoriteIds && favoriteIds.has(conv.id))) return false;
  if (f.type === 'media' && !MEDIA_RE.test(conv.lastMessage || '')) return false;

  const t = conv.lastMessageAt || 0;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (f.period === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (!t || t < startOfToday.getTime()) return false;
  }
  if (f.period === 'week' && (!t || t < now - 7 * day)) return false;
  if (f.period === 'month' && (!t || t < now - 30 * day)) return false;

  if (f.verifiedOnly && !conv.user?.isVerified) return false;
  if (f.onlineOnly && !conv.user?.isOnline) return false;
  return true;
};

export const sortConversationsByFilter = (list, f) => {
  const result = [...list];
  if (f.sort === 'oldest') {
    result.sort((a, b) => (a.lastMessageAt || 0) - (b.lastMessageAt || 0));
  } else if (f.sort === 'unreadFirst') {
    result.sort(
      (a, b) => (b.unreadCount - a.unreadCount) || (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  } else {
    result.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }
  return result;
};

export const isMediaConversation = (conv) => MEDIA_RE.test(conv.lastMessage || '');
