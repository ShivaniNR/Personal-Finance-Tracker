export const TIME_RANGES = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
];

/**
 * Converts a time range key into { startDate, endDate } strings (YYYY-MM-DD).
 * Uses the last day of the current month as endDate for "this month" ranges
 * to avoid timezone mismatches between client and server.
 */
export function getDateRange(rangeKey) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Last day of current month — avoids cutting off transactions
  // when client timezone differs from server/DB timezone
  const endOfMonth = new Date(year, month + 1, 0);

  switch (rangeKey) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      return { startDate: fmt(start), endDate: fmt(endOfMonth) };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { startDate: fmt(start), endDate: fmt(end) };
    }
    case 'last_3_months': {
      const start = new Date(year, month - 2, 1);
      return { startDate: fmt(start), endDate: fmt(endOfMonth) };
    }
    case 'last_6_months': {
      const start = new Date(year, month - 5, 1);
      return { startDate: fmt(start), endDate: fmt(endOfMonth) };
    }
    default:
      return getDateRange('this_month');
  }
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
