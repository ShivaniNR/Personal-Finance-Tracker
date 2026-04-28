import { supabase } from '../lib/supabase';

export async function getUserCategories() {
  const { data, error } = await supabase.rpc('get_user_categories');

  if (error) throw error;

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isSystem: c.is_system,
    transactionCount: c.transaction_count,
  }));
}
