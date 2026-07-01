import { supabase } from '../lib/supabase';

export async function getTransactions({ limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, icon, color)')
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data.map(formatTransaction);
}

export async function addTransaction(transaction, { allowCreateCategory = true } = {}) {
  // Resolve category name to ID. CSV import passes allowCreateCategory:false
  // so unknown categories fail loudly instead of silently seeding orphans.
  const categoryId = await resolveCategory(
    transaction.category,
    transaction.type,
    { allowCreate: allowCreateCategory }
  );

  // Get current user ID for RLS — INSERT requires user_id to match auth.uid()
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category_id: categoryId,
      date: transaction.date || localDateString(),
    })
    .select('*, categories(name, icon, color)')
    .single();

  if (error) throw error;
  return formatTransaction(data);
}

export async function updateTransaction(id, updates) {
  const updateData = {};
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.date !== undefined) updateData.date = updates.date;

  if (updates.category !== undefined) {
    updateData.category_id = await resolveCategory(
      updates.category,
      updates.type || 'EXPENSE'
    );
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select('*, categories(name, icon, color)')
    .single();

  if (error) throw error;
  return formatTransaction(data);
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);

  if (error) throw error;
  return true;
}

export async function searchTransactions(query) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name, icon, color)')
    .ilike('description', `%${query}%`)
    .order('date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map(formatTransaction);
}

function formatTransaction(row) {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    date: row.date,
    category: row.categories?.name || 'Other',
    categoryIcon: row.categories?.icon || null,
    categoryColor: row.categories?.color || null,
  };
}

/** Returns today's date in YYYY-MM-DD using local timezone (not UTC) */
function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function resolveCategory(categoryName, type, { allowCreate = true } = {}) {
  if (!categoryName) throw new Error('Category is required.');

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryName)
    .limit(1)
    .single();

  if (existing) return existing.id;

  if (!allowCreate) {
    throw new Error(`Category "${categoryName}" not found in your categories.`);
  }

  const { data: created, error } = await supabase
    .from('categories')
    .insert({
      name: categoryName,
      type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return created.id;
}
