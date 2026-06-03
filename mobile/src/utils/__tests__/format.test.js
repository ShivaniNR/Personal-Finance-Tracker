import { formatCurrency, formatSignedCurrency } from '../format';

describe('formatCurrency', () => {
  it('formats whole numbers with $ prefix and thousands separators', () => {
    expect(formatCurrency(1500)).toBe('$1,500');
  });

  it('returns $0 for null/undefined', () => {
    expect(formatCurrency(null)).toBe('$0');
    expect(formatCurrency(undefined)).toBe('$0');
  });

  it('respects decimal places', () => {
    expect(formatCurrency(42.5, 2)).toBe('$42.50');
  });
});

describe('formatSignedCurrency', () => {
  it('prefixes income with +', () => {
    expect(formatSignedCurrency(100, 'INCOME')).toBe('+$100');
  });

  it('prefixes expense with -', () => {
    expect(formatSignedCurrency(100, 'EXPENSE')).toBe('-$100');
  });

  it('uses absolute value (negative input still rendered with the type-driven sign)', () => {
    expect(formatSignedCurrency(-50, 'EXPENSE')).toBe('-$50');
  });
});
