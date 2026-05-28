import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  AddTransactionInput,
  UpdateTransactionInput,
  DeleteTransactionInput,
} = require('../validation.js');

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('AddTransactionInput', () => {
  const valid = {
    amount: 40,
    type: 'EXPENSE',
    description: 'Lunch',
    category: 'Food',
  };

  it('accepts a valid transaction', () => {
    expect(AddTransactionInput.parse(valid)).toMatchObject(valid);
  });

  it('rejects a non-positive amount', () => {
    expect(() => AddTransactionInput.parse({ ...valid, amount: 0 })).toThrow();
    expect(() => AddTransactionInput.parse({ ...valid, amount: -5 })).toThrow();
  });

  it('rejects an amount that is too large', () => {
    expect(() => AddTransactionInput.parse({ ...valid, amount: 1e9 })).toThrow();
  });

  it('rejects an invalid type', () => {
    expect(() => AddTransactionInput.parse({ ...valid, type: 'TRANSFER' })).toThrow();
  });

  it('rejects an empty description', () => {
    expect(() => AddTransactionInput.parse({ ...valid, description: '' })).toThrow();
  });

  it('trims surrounding whitespace on description and category', () => {
    const parsed = AddTransactionInput.parse({
      ...valid,
      description: '  Lunch  ',
      category: '  Food  ',
    });
    expect(parsed.description).toBe('Lunch');
    expect(parsed.category).toBe('Food');
  });

  it('treats date as optional but enforces YYYY-MM-DD when present', () => {
    expect(() => AddTransactionInput.parse(valid)).not.toThrow();
    expect(AddTransactionInput.parse({ ...valid, date: '2026-05-01' }).date).toBe('2026-05-01');
    expect(() => AddTransactionInput.parse({ ...valid, date: '05/01/2026' })).toThrow();
  });
});

describe('UpdateTransactionInput', () => {
  it('requires a valid UUID id', () => {
    expect(() => UpdateTransactionInput.parse({ id: 'not-a-uuid' })).toThrow();
    expect(() => UpdateTransactionInput.parse({ id: VALID_UUID })).not.toThrow();
  });

  it('allows partial updates with all non-id fields optional', () => {
    const parsed = UpdateTransactionInput.parse({ id: VALID_UUID, amount: 12 });
    expect(parsed).toMatchObject({ id: VALID_UUID, amount: 12 });
  });
});

describe('DeleteTransactionInput', () => {
  it('requires a valid UUID id', () => {
    expect(() => DeleteTransactionInput.parse({ id: 'nope' })).toThrow();
    expect(DeleteTransactionInput.parse({ id: VALID_UUID })).toEqual({ id: VALID_UUID });
  });
});
