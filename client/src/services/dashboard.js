import { supabase } from '../lib/supabase';

export async function getDashboard(startDate, endDate) {
  const params = {};
  if (startDate) params.p_start_date = startDate;
  if (endDate) params.p_end_date = endDate;

  const { data, error } = await supabase.rpc('get_dashboard_data', params);

  if (error) throw error;

  // Format recentTransactions to match the shape components expect
  if (data.recentTransactions) {
    data.recentTransactions = data.recentTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      date: t.date,
      category: t.category,
      categoryIcon: t.icon,
      categoryColor: t.color,
    }));
  }

  return data;
}

export async function getCategorySpending(startDate, endDate) {
  const { data, error } = await supabase.rpc('get_category_spending', {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) throw error;
  return data;
}

export async function updateBudget(amount) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('profiles')
    .update({ monthly_budget: amount })
    .eq('id', user.id);

  if (error) throw error;
}

export async function getMonthlyTrends(monthsBack = 6) {
  const { data, error } = await supabase.rpc('get_monthly_trends', {
    months_back: monthsBack,
  });

  if (error) throw error;
  return data;
}
