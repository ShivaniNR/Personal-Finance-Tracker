/**
 * Discover Bank CSV parser.
 *
 * Discover exports: Trans. Date, Post Date, Description, Amount, Category
 * Amount sign: positive = charge (EXPENSE), negative = payment/refund (INCOME)
 * Date format: MM/DD/YYYY
 */

const DISCOVER_HEADERS = [
  'Trans. Date',
  'Post Date',
  'Description',
  'Amount',
  'Category',
];

const CATEGORY_MAP = {
  'Supermarkets': 'Groceries',
  'Gasoline': 'Transport',
  'Merchandise': 'Shopping',
  'Restaurants': 'Food & Dining',
  'Travel/ Entertainment': 'Entertainment',
  'Travel/Entertainment': 'Entertainment',
  'Medical Services': 'Healthcare',
  'Services': 'Utilities',
  'Government Services': 'Utilities',
  'Education': 'Education',
  'Automotive': 'Transport',
  'Warehouse Clubs': 'Groceries',
  'Payments and Credits': 'Other',
  'Awards and Rebate Credits': 'Other',
  'Department Stores': 'Shopping',
};

// Descriptions that indicate Transport even when Discover categorises as Travel/Entertainment
const TRANSPORT_KEYWORDS = ['uber', 'lyft', 'taxi', 'cab', 'rideshare'];

// Suffix used to split Travel/Entertainment into two mapping rows
const RIDES_SUFFIX = '::rides';
const OTHER_SUFFIX = '::other';

function isTransportDescription(description) {
  const lower = description.toLowerCase();
  return TRANSPORT_KEYWORDS.some((kw) => lower.includes(kw));
}

function isTravelEntertainment(bankCategory) {
  return bankCategory === 'Travel/ Entertainment' || bankCategory === 'Travel/Entertainment';
}

/**
 * Returns the mapping key to display in the UI.
 * For Travel/Entertainment, shows two rows: one for rides, one for other.
 */
export function getMappingDisplayName(key) {
  if (key.endsWith(RIDES_SUFFIX)) {
    return key.replace(RIDES_SUFFIX, '') + ' (rides)';
  }
  if (key.endsWith(OTHER_SUFFIX)) {
    return key.replace(OTHER_SUFFIX, '') + ' (other)';
  }
  return key;
}

/**
 * Returns true if the CSV headers match Discover's format.
 * @param {string[]} headers
 */
export function validate(headers) {
  const normalized = headers.map((h) => h.trim());
  return DISCOVER_HEADERS.every((h) => normalized.includes(h));
}

/**
 * Returns the default category mapping for all bank categories found in the rows.
 * UI can display this for user review/editing before import.
 * @param {Array<Record<string, string>>} rows - PapaParse output (header mode)
 * @returns {Record<string, string>} bankCategory → appCategory
 */
export function getDefaultMapping(rows) {
  const mapping = {};
  let hasRides = false;
  let hasOtherTravel = false;
  let travelKey = null; // the exact bank category string (with or without space after /)

  for (const row of rows) {
    // Skip negative amounts (payments, credits, refunds)
    const amt = parseFloat((row['Amount'] || '').replace(/[$,]/g, ''));
    if (Number.isNaN(amt) || amt < 0) continue;

    const bankCat = (row['Category'] || '').trim() || 'Uncategorized';
    const desc = (row['Description'] || '').trim();

    // Track Travel/Entertainment sub-types
    if (isTravelEntertainment(bankCat)) {
      travelKey = bankCat;
      if (isTransportDescription(desc)) hasRides = true;
      else hasOtherTravel = true;
      continue; // don't add the unsplit key — we'll add the split keys below
    }

    if (!mapping[bankCat]) {
      mapping[bankCat] = CATEGORY_MAP[bankCat] || 'Other';
    }
  }

  // Split Travel/Entertainment into two rows if both types exist,
  // otherwise just add the single appropriate row
  if (travelKey) {
    if (hasRides && hasOtherTravel) {
      mapping[travelKey + RIDES_SUFFIX] = 'Transport';
      mapping[travelKey + OTHER_SUFFIX] = 'Entertainment';
    } else if (hasRides) {
      mapping[travelKey + RIDES_SUFFIX] = 'Transport';
    } else {
      mapping[travelKey + OTHER_SUFFIX] = 'Entertainment';
    }
  }

  return mapping;
}

/**
 * Converts PapaParse row objects into the app's transaction shape.
 * Accepts a user-reviewed category mapping to override defaults.
 * @param {Array<Record<string, string>>} rows - PapaParse output (header mode)
 * @param {Record<string, string>} categoryMapping - bankCategory → appCategory
 * @returns {Array<{ date: string, amount: number, description: string, type: 'INCOME'|'EXPENSE', category: string, bankCategory: string }>}
 */
export function parse(rows, categoryMapping) {
  return rows
    .map((row) => {
      const rawDate = (row['Trans. Date'] || '').trim();
      const rawAmount = (row['Amount'] || '').trim();
      const rawDescription = (row['Description'] || '').trim();
      const rawCategory = (row['Category'] || '').trim() || 'Uncategorized';

      if (!rawDate || !rawAmount || !rawDescription) return null;

      const date = convertDate(rawDate);
      if (!date) return null;

      const numeric = parseFloat(rawAmount.replace(/[$,]/g, ''));
      if (Number.isNaN(numeric)) return null;

      // Skip negative amounts — these are payments, credits, and refunds
      if (numeric < 0) return null;

      let category;

      if (isTravelEntertainment(rawCategory) && categoryMapping) {
        // Look up the split mapping keys based on description
        const suffix = isTransportDescription(rawDescription) ? RIDES_SUFFIX : OTHER_SUFFIX;
        category = categoryMapping[rawCategory + suffix]
          || categoryMapping[rawCategory]
          || (isTransportDescription(rawDescription) ? 'Transport' : 'Entertainment');
      } else {
        category = categoryMapping?.[rawCategory] || CATEGORY_MAP[rawCategory] || 'Other';
      }

      return { date, amount: numeric, description: rawDescription, type: 'EXPENSE', category, bankCategory: rawCategory };
    })
    .filter(Boolean);
}

/** MM/DD/YYYY → YYYY-MM-DD */
function convertDate(raw) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
