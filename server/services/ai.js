const { getLLM } = require('./llm');

/**
 * Parses natural language text into structured transaction data using Claude Haiku.
 * @param {string} text - The voice/text input from the user
 * @param {Array<{name: string, type: string}>} categories - User's categories from Supabase
 * @returns {Promise<{amount: number, description: string, type: string, category: string}>}
 */
async function parseTransaction(text, categories, today) {
  const categoryNames = categories.map((c) => c.name).join(', ');

  // Prefer the caller's local date; fall back to server (UTC) date only if it
  // is missing or malformed, so "today" resolves in the user's timezone.
  const todayStr = /^\d{4}-\d{2}-\d{2}$/.test(today)
    ? today
    : new Date().toISOString().split('T')[0];

  const systemPrompt = `You are a financial transaction parser. Extract structured data from natural language input.

The user's categories are: ${categoryNames}

Respond with JSON only — no markdown, no explanation, no code fences:
{
  "amount": <positive number>,
  "description": "<brief description>",
  "type": "INCOME" or "EXPENSE",
  "category": "<best matching category from the user's list above>"
}

Rules:
- amount must always be a positive number
- type must be exactly "INCOME" or "EXPENSE"
- category must match one of the user's categories listed above (case-sensitive)
- If no category matches well, use "Other"
- If the input mentions a date, include "date" in YYYY-MM-DD format
- Today's date is ${todayStr}

Examples:
- "Spent 500 on groceries at walmart" → {"amount":500,"description":"Groceries at Walmart","type":"EXPENSE","category":"Groceries"}
- "Got paid 3200 salary" → {"amount":3200,"description":"Salary","type":"INCOME","category":"Salary"}
- "Uber ride cost me 15 bucks" → {"amount":15,"description":"Uber ride","type":"EXPENSE","category":"Transport"}
- "Paid 80 for internet bill" → {"amount":80,"description":"Internet bill","type":"EXPENSE","category":"Utilities"}
- "Received 500 from freelance work" → {"amount":500,"description":"Freelance work","type":"INCOME","category":"Freelance"}`;

  const llm = getLLM();

  let responseText = (await llm.chat(systemPrompt, text)).trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  responseText = responseText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');

  // Parse and validate the JSON response
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error('AI returned invalid JSON');
  }

  // Validate required fields
  if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    throw new Error('AI returned invalid amount');
  }
  if (!['INCOME', 'EXPENSE'].includes(parsed.type)) {
    throw new Error('AI returned invalid type');
  }
  if (!parsed.description || typeof parsed.description !== 'string') {
    throw new Error('AI returned invalid description');
  }
  if (!parsed.category || typeof parsed.category !== 'string') {
    parsed.category = 'Other';
  }

  return {
    amount: parsed.amount,
    description: parsed.description,
    type: parsed.type,
    category: parsed.category,
    ...(parsed.date && { date: parsed.date }),
  };
}

module.exports = { parseTransaction };
