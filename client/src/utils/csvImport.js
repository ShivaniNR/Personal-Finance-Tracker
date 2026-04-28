import Papa from 'papaparse';
import * as discoverParser from './parsers/discoverParser';

const MAX_ROWS = 5000;

const PARSERS = {
  discover: discoverParser,
};

/**
 * Returns a user-friendly display name for a mapping key.
 * Handles synthetic keys like "Travel/ Entertainment::rides".
 */
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
 * Parses the CSV file and returns the raw rows + default category mapping.
 * This is the first step — the UI shows the mapping for user review.
 *
 * @param {string} bankKey
 * @param {File} file
 * @returns {Promise<{ rawRows: object[], defaultMapping: Record<string, string>, rowCount: number }>}
 */
export function parseAndGetMapping(bankKey, file) {
  const parser = PARSERS[bankKey];
  if (!parser) {
    return Promise.reject(new Error(`Unsupported bank: ${bankKey}`));
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];

          if (!parser.validate(headers)) {
            reject(new Error(
              `This file doesn't match the expected ${bankKey} format. Check that you selected the right bank.`
            ));
            return;
          }

          if (!results.data.length) {
            reject(new Error('CSV file is empty (no data rows).'));
            return;
          }

          if (results.data.length > MAX_ROWS) {
            reject(new Error(`Too many rows (${results.data.length}). Max is ${MAX_ROWS}.`));
            return;
          }

          const defaultMapping = parser.getDefaultMapping(results.data);

          resolve({
            rawRows: results.data,
            defaultMapping,
            rowCount: results.data.length,
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(new Error(`Failed to read CSV: ${err.message}`)),
    });
  });
}

/**
 * Converts raw rows into final transactions using the user-reviewed mapping.
 * This is the second step — called after the user confirms the mapping.
 *
 * @param {string} bankKey
 * @param {object[]} rawRows
 * @param {Record<string, string>} categoryMapping - user-reviewed bankCategory → appCategory
 * @returns {Array<{ date: string, amount: number, description: string, type: 'INCOME'|'EXPENSE', category: string, bankCategory: string }>}
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
