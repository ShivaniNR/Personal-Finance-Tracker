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
  'Services': 'Services',
  'Government Services': 'Services',
  'Education': 'Education',
  'Automotive': 'Transport',
  'Warehouse Clubs': 'Groceries',
  'Payments and Credits': 'Other',
  'Awards and Rebate Credits': 'Other',
  'Department Stores': 'Shopping',
};

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

export function getDefaultMapping(rows) {
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
      mapping[bankCat] = CATEGORY_MAP[bankCat] || 'Other';
    }
  }

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

function convertDate(raw) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}
