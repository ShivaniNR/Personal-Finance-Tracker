import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Sends voice/text input to the server for AI parsing into transaction fields.
 * @param {string} text - The transcript from speech recognition or typed text
 * @returns {Promise<{amount: number, description: string, type: string, category: string, date?: string}>}
 */
export async function parseTransactionAI(text) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/api/parse-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to parse transaction');
  }

  return response.json();
}
