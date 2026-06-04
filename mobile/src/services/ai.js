import { supabase } from '../lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Sends voice/text input to the server for AI parsing into transaction fields.
 * Server endpoint and contract are shared with the web client.
 * @param {string} text - Speech transcript or typed text.
 * @returns {Promise<{amount: number, description: string, type: string, category: string, date?: string}>}
 */
export async function parseTransactionAI(text) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Send local "today" so the server's LLM resolves relative dates in the
  // user's timezone, not server UTC.
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

  const response = await fetch(`${API_URL}/api/parse-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ text, today }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to parse transaction');
  }

  return response.json();
}
