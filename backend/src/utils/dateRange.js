// Build a MongoDB date-range filter from inclusive YYYY-MM-DD strings
// (as sent by the admin period filter). 'from' is the first day, 'to' is the
// last day (inclusive). Empty strings mean "no bound on that side".
const parseDateOnly = (str) => {
  if (!str) return null;
  const parts = String(str).split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight
};

// Returns {} when no bounds, otherwise { createdAt: { $gte, $lt } }.
const buildDateRangeQuery = (from, to) => {
  const start = parseDateOnly(from);
  const end = parseDateOnly(to);
  if (!start && !end) return {};
  const range = {};
  if (start) range.$gte = start;
  // Exclusive upper bound = the local midnight AFTER the end day (DST-safe:
  // adding 24h to a local midnight can land at 23:00/01:00 across transitions).
  if (end) range.$lt = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  return { createdAt: range };
};

module.exports = { buildDateRangeQuery, parseDateOnly };
