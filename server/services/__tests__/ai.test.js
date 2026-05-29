import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

// Inject a fake LLM layer via the native require cache before loading ai.js,
// so no real provider SDK loads and we control the raw model response.
// (vitest's vi.mock does not reliably intercept CommonJS require() calls.)
const require = createRequire(import.meta.url);

const state = { chatResponse: '', lastSystem: '' };

const llmPath = require.resolve('../llm/index.js');
require.cache[llmPath] = {
  id: llmPath,
  filename: llmPath,
  loaded: true,
  exports: {
    getLLM: () => ({
      chat: async (system) => {
        state.lastSystem = system;
        return state.chatResponse;
      },
    }),
  },
};

const { parseTransaction } = require('../ai.js');

const categories = [
  { name: 'Food', type: 'EXPENSE' },
  { name: 'Salary', type: 'INCOME' },
];

const json = (obj) => JSON.stringify(obj);

describe('parseTransaction', () => {
  beforeEach(() => {
    state.chatResponse = '';
    state.lastSystem = '';
  });

  it('parses a clean JSON response into structured fields', async () => {
    state.chatResponse = json({
      amount: 40,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
    const result = await parseTransaction('spent 40 on lunch', categories);
    expect(result).toEqual({
      amount: 40,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
  });

  it('strips markdown code fences before parsing', async () => {
    state.chatResponse =
      '```json\n{"amount":40,"description":"Lunch","type":"EXPENSE","category":"Food"}\n```';
    const result = await parseTransaction('spent 40 on lunch', categories);
    expect(result.amount).toBe(40);
    expect(result.category).toBe('Food');
  });

  it('throws on a non-JSON response', async () => {
    state.chatResponse = 'Sorry, I cannot help with that.';
    await expect(parseTransaction('hello', categories)).rejects.toThrow(
      'AI returned invalid JSON'
    );
  });

  it('rejects a non-positive amount', async () => {
    state.chatResponse = json({
      amount: -5,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
    await expect(parseTransaction('x', categories)).rejects.toThrow(
      'AI returned invalid amount'
    );
  });

  it('rejects a type outside INCOME/EXPENSE', async () => {
    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'TRANSFER',
      category: 'Food',
    });
    await expect(parseTransaction('x', categories)).rejects.toThrow(
      'AI returned invalid type'
    );
  });

  it('falls back to "Other" when category is missing', async () => {
    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'EXPENSE',
    });
    const result = await parseTransaction('x', categories);
    expect(result.category).toBe('Other');
  });

  it('includes a date only when the response provides one', async () => {
    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
      date: '2026-05-01',
    });
    const withDate = await parseTransaction('x', categories);
    expect(withDate.date).toBe('2026-05-01');

    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
    const withoutDate = await parseTransaction('x', categories);
    expect(withoutDate).not.toHaveProperty('date');
  });

  it('uses the caller-provided local date in the prompt', async () => {
    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
    await parseTransaction('spent 5 on lunch today', categories, '2026-05-28');
    expect(state.lastSystem).toContain("Today's date is 2026-05-28");
  });

  it('falls back to a valid date when today is missing or malformed', async () => {
    state.chatResponse = json({
      amount: 5,
      description: 'Lunch',
      type: 'EXPENSE',
      category: 'Food',
    });
    await parseTransaction('x', categories, 'not-a-date');
    expect(state.lastSystem).not.toContain('not-a-date');
    expect(state.lastSystem).toMatch(/Today's date is \d{4}-\d{2}-\d{2}/);
  });
});
