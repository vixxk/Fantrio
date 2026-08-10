// Map a period label (as used by the creator panel PeriodDropdown) to an
// inclusive date start. 'All Time' returns null (no lower bound).
// Returns { start } where start is a Date or null.
const getPeriodStart = (label) => getPeriodBounds(label).start;

// Map a period label to the current window plus the previous equivalent-length
// window (the same span of time immediately before the selected one), used for
// the "vs last X" change comparisons on the creator panel.
// Returns { start, prevStart, prevEnd, prevLabel, showChange }:
//   - start: inclusive start of the selected window (Date or null for all time)
//   - prevStart / prevEnd: bounds of the previous window (both null for all time)
//   - prevLabel: readable comparison label ('' for all time)
//   - showChange: false for 'All Time' (no comparison to show)
const getPeriodBounds = (label) => {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const window = {
    'Today': { start: dayStart, prevLabel: 'vs yesterday' },
    'Last 7 Days': { start: new Date(dayStart.getTime() - 6 * 86400000), prevLabel: 'vs last 7 days' },
    'Last 30 Days': { start: new Date(dayStart.getTime() - 29 * 86400000), prevLabel: 'vs last 30 days' },
    'Last 90 Days': { start: new Date(dayStart.getTime() - 89 * 86400000), prevLabel: 'vs last 90 days' }
  };

  const b = window[label];
  if (!b) {
    return { start: null, prevStart: null, prevEnd: null, prevLabel: '', showChange: false };
  }

  // The previous window is the same length as the selected one, immediately before it.
  const windowLength = now.getTime() - b.start.getTime();
  const prevEnd = new Date(b.start);
  const prevStart = new Date(prevEnd.getTime() - windowLength);

  return { start: b.start, prevStart, prevEnd, prevLabel: b.prevLabel, showChange: true };
};

module.exports = { getPeriodStart, getPeriodBounds };