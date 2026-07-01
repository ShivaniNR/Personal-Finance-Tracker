import Papa from 'papaparse';
import * as discoverParser from './parsers/discoverParser';

const MAX_ROWS = 5000;

const PARSERS = {
  discover: discoverParser,
};

export function getMappingDisplayName(bankKey, mappingKey) {
  const parser = PARSERS[bankKey];
  if (parser?.getMappingDisplayName) {
    return parser.getMappingDisplayName(mappingKey);
  }
  return mappingKey;
}

export const SUPPORTED_BANKS = [
  { key: 'discover', label: 'Discover' },
];

/**
 * Parses a CSV content string and returns raw rows + default mapping.
 * Mobile reads the file content via expo-file-system, then calls this.
 *
 * @param {string} bankKey
 * @param {string} content - the raw CSV text
 * @param {Array<{id, name, type}>} userCategories - user's real DB categories
 *   used to build a default mapping that only references categories that
 *   actually exist for this user.
 * @returns {{ rawRows: object[], defaultMapping: Record<string, string>, rowCount: number }}
 */
export function parseAndGetMapping(bankKey, content, userCategories = []) {
  const parser = PARSERS[bankKey];
  if (!parser) throw new Error(`Unsupported bank: ${bankKey}`);

  const results = Papa.parse(content, { header: true, skipEmptyLines: true });

  if (results.errors && results.errors.length) {
    throw new Error(`Failed to read CSV: ${results.errors[0].message}`);
  }

  const headers = results.meta.fields || [];

  if (!parser.validate(headers)) {
    throw new Error(
      `This file doesn't match the expected ${bankKey} format. Check that you selected the right bank.`
    );
  }
  if (!results.data.length) {
    throw new Error('CSV file is empty (no data rows).');
  }
  if (results.data.length > MAX_ROWS) {
    throw new Error(`Too many rows (${results.data.length}). Max is ${MAX_ROWS}.`);
  }

  const defaultMapping = parser.getDefaultMapping(results.data, userCategories);
  return {
    rawRows: results.data,
    defaultMapping,
    rowCount: results.data.length,
  };
}

/**
 * Converts the raw rows into final transactions using the user-reviewed mapping.
 */
export function applyMappingAndParse(bankKey, rawRows, categoryMapping) {
  const parser = PARSERS[bankKey];
  if (!parser) throw new Error(`Unsupported bank: ${bankKey}`);

  const transactions = parser.parse(rawRows, categoryMapping);
  if (!transactions.length) {
    throw new Error('No valid transactions found in this file.');
  }
  return transactions;
}
