/**
 * formatLastSeen — turns a lastSeenAt ISO timestamp into a friendly
 * "Last seen …" label for chat headers. Returns 'Offline' when there's no
 * timestamp at all.
 */
export const formatLastSeen = (iso) => {
  if (!iso) return 'Offline';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Offline';

  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Last seen just now';
  if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return 'Last seen yesterday';
  return `Last seen ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
};

export default formatLastSeen;
