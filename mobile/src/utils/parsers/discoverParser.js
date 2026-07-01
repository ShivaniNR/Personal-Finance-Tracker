/**
 * Discover Bank CSV parser.
 *
 * Discover exports: Trans. Date, Post Date, Description, Amount, Category
 * Amount sign: positive = charge (EXPENSE), negative = payment/refund (INCOME)
 * Date format: MM/DD/YYYY
 *
 * Mapping model:
 *   - LEFT side (Discover's category strings) is hardcoded here — it's a
 *     fact about Discover's export format.
 *   - RIGHT side (target app category) is resolved at runtime against the
 *     user's real DB categories via keyword hints. Unmatched entries fall
 *     back to "Other".
 */

const DISCOVER_HEADERS = [
  'Trans. Date',
  'Post Date',
  'Description',
  'Amount',
  'Category',
];

// Hints are keyword substrings to fuzzy-match against user category names
// (case-insensitive). First hint that matches an existing category wins.
// Empty array = go straight to the "Other" fallback.
const CATEGORY_HINTS = {
  'Supermarkets': ['grocer'],
  'Gasoline': ['transport', 'gas', 'fuel'],
  'Merchandise': ['shopping'],
  'Restaurants': ['dining', 'restaurant', 'food'],
  'Medical Services': ['health', 'medical'],
  'Services': ['utilit'],
  'Government Services': ['utilit'],
  'Education': ['education'],
  'Automotive': ['transport', 'auto'],
  'Warehouse Clubs': ['grocer'],
  'Department Stores': ['shopping'],
  'Payments and Credits': [],
  'Awards and Rebate Credits': [],
};

const TRAVEL_RIDES_HINTS = ['transport'];
const TRAVEL_OTHER_HINTS = ['entertain'];

const TRANSPORT_KEYWORDS = ['uber', 'lyft', 'taxi', 'cab', 'rideshare'];

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
 * Fuzzy-match hints against the user's DB categories.
 * Returns the matched category NAME, or the name of "Other", or null.
 */
function matchCategory(hints, userCategories) {
  const expenseCats = userCategories.filter(
    (c) => (c.type || '').toUpperCase() === 'EXPENSE'
  );

  for (const hint of hints) {
    const found = expenseCats.find((c) =>
      c.name.toLowerCase().includes(hint.toLowerCase())
    );
    if (found) return found.name;
  }

  const other = expenseCats.find((c) => c.name.toLowerCase() === 'other');
  return other ? other.name : expenseCats[0]?.name || null;
}

export function getMappingDisplayName(key) {
  if (key.endsWith(RIDES_SUFFIX)) {
    return key.replace(RIDES_SUFFIX, '') + ' (rides)';
  }
  if (key.endsWith(OTHER_SUFFIX)) {
    return key.replace(OTHER_SUFFIX, '') + ' (other)';
  }
  return key;
}

export function validate(headers) {
  const normalized = headers.map((h) => h.trim());
  return DISCOVER_HEADERS.every((h) => normalized.includes(h));
}

/**
 * Build the default bankCategory → appCategoryName map by cross-referencing
 * parser hints against the user's real DB categories.
 */
export function getDefaultMapping(rows, userCategories = []) {
  const mapping = {};
  let hasRides = false;
  let hasOtherTravel = false;
  let travelKey = null;

  for (const row of rows) {
    const amt = parseFloat((row['Amount'] || '').replace(/[$,]/g, ''));
    if (Number.isNaN(amt) || amt < 0) continue;

    const bankCat = (row['Category'] || '').trim() || 'Uncategorized';
    const desc = (row['Description'] || '').trim();

    if (isTravelEntertainment(bankCat)) {
      travelKey = bankCat;
      if (isTransportDescription(desc)) hasRides = true;
      else hasOtherTravel = true;
      continue;
    }

    if (!mapping[bankCat]) {
      const hints = CATEGORY_HINTS[bankCat] || [];
      mapping[bankCat] = matchCategory(hints, userCategories) || '';
    }
  }

  if (travelKey) {
    if (hasRides) {
      mapping[travelKey + RIDES_SUFFIX] =
        matchCategory(TRAVEL_RIDES_HINTS, userCategories) || '';
    }
    if (hasOtherTravel) {
      mapping[travelKey + OTHER_SUFFIX] =
        matchCategory(TRAVEL_OTHER_HINTS, userCategories) || '';
    }
  }

  return mapping;
}

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
      if (numeric < 0) return null;

      let category;

      if (isTravelEntertainment(rawCategory) && categoryMapping) {
        const suffix = isTransportDescription(rawDescription) ? RIDES_SUFFIX : OTHER_SUFFIX;
        category =
          categoryMapping[rawCategory + suffix] ||
          categoryMapping[rawCategory] ||
          '';
      } else {
        category = categoryMapping?.[rawCategory] || '';
      }

      return {
        date,
        amount: numeric,
        description: rawDescription,
        type: 'EXPENSE',
        category,
        bankCategory: rawCategory,
      };
    })
    .filter(Boolean);
}

function convertDate(raw) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
