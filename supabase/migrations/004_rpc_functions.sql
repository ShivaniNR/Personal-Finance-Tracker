-- =====================================================
-- Migration 004: RPC functions for complex queries
-- Called via supabase.rpc() from client/server
-- These replace the JS aggregation in services/transactions.js
-- =====================================================


-- =====================================================
-- FUNCTION 1: get_dashboard_data
-- Returns complete dashboard payload in one call
-- Replaces: calculateDashboardData() — 60+ lines of JS
-- Usage: supabase.rpc('get_dashboard_data', { p_start_date, p_end_date })
-- When dates are NULL, defaults to current month
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_start DATE := COALESCE(p_start_date, date_trunc('month', CURRENT_DATE)::DATE);
  v_end   DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  SELECT json_build_object(
    'totalBalance', (
      SELECT COALESCE(SUM(
        CASE WHEN type = 'INCOME' THEN amount ELSE -amount END
      ), 0)
      FROM transactions
      WHERE user_id = auth.uid()
        AND date BETWEEN v_start AND v_end
    ),
    'monthlyIncome', (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE user_id = auth.uid()
        AND type = 'INCOME'
        AND date BETWEEN v_start AND v_end
    ),
    'monthlyExpenses', (
      SELECT COALESCE(SUM(amount), 0)
      FROM transactions
      WHERE user_id = auth.uid()
        AND type = 'EXPENSE'
        AND date BETWEEN v_start AND v_end
    ),
    'categorySummary', (
      SELECT COALESCE(json_agg(row_to_json(cs)), '[]'::json)
      FROM (
        SELECT
          c.name AS category,
          c.icon,
          c.color,
          SUM(t.amount) AS total,
          COUNT(*) AS count,
          ROUND(
            SUM(t.amount) * 100.0 / NULLIF(SUM(SUM(t.amount)) OVER (), 0), 1
          ) AS percentage
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = auth.uid()
          AND t.type = 'EXPENSE'
          AND t.date BETWEEN v_start AND v_end
        GROUP BY c.name, c.icon, c.color
        ORDER BY total DESC
      ) cs
    ),
    'monthlyStats', (
      SELECT COALESCE(json_agg(row_to_json(ms)), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(date_trunc('month', date), 'Mon YYYY') AS month,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expenses,
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS balance
        FROM transactions
        WHERE user_id = auth.uid()
          AND date BETWEEN v_start AND v_end
        GROUP BY date_trunc('month', date)
        ORDER BY date_trunc('month', date)
      ) ms
    ),
    'recentTransactions', (
      SELECT COALESCE(json_agg(row_to_json(rt)), '[]'::json)
      FROM (
        SELECT
          t.id, t.amount, t.type, t.description, t.date,
          c.name AS category, c.icon, c.color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = auth.uid()
          AND t.date BETWEEN v_start AND v_end
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT 10
      ) rt
    ),
    'monthlyBudget', (
      SELECT monthly_budget
      FROM profiles
      WHERE id = auth.uid()
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- FUNCTION 2: get_category_spending
-- Category breakdown for a date range
-- Usage: supabase.rpc('get_category_spending', { start_date, end_date })
-- =====================================================
CREATE OR REPLACE FUNCTION get_category_spending(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  category TEXT,
  icon TEXT,
  color TEXT,
  total NUMERIC,
  count BIGINT,
  percentage NUMERIC
) AS $$
  SELECT
    c.name,
    c.icon,
    c.color,
    SUM(t.amount) AS total,
    COUNT(*) AS count,
    ROUND(
      SUM(t.amount) * 100.0 / NULLIF(SUM(SUM(t.amount)) OVER (), 0), 1
    ) AS percentage
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = auth.uid()
    AND t.type = 'EXPENSE'
    AND t.date BETWEEN start_date AND end_date
  GROUP BY c.name, c.icon, c.color
  ORDER BY total DESC;
$$ LANGUAGE sql SECURITY DEFINER;


-- =====================================================
-- FUNCTION 3: get_monthly_trends
-- Monthly income/expense/balance for the last N months
-- Usage: supabase.rpc('get_monthly_trends', { months_back: 6 })
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_trends(months_back INT DEFAULT 6)
RETURNS TABLE (
  month TEXT,
  income NUMERIC,
  expenses NUMERIC,
  balance NUMERIC
) AS $$
  SELECT
    TO_CHAR(date_trunc('month', t.date), 'Mon YYYY'),
    SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END),
    SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END),
    SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END)
  FROM transactions t
  WHERE t.user_id = auth.uid()
    AND t.date >= date_trunc('month', CURRENT_DATE)
                  - (months_back || ' months')::INTERVAL
  GROUP BY date_trunc('month', t.date)
  ORDER BY date_trunc('month', t.date);
$$ LANGUAGE sql SECURITY DEFINER;


-- =====================================================
-- FUNCTION 4: get_user_categories
-- Returns user's categories with transaction counts
-- Usage: supabase.rpc('get_user_categories')
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_categories()
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN,
  transaction_count BIGINT
) AS $$
  SELECT
    c.id,
    c.name,
    c.type,
    c.icon,
    c.color,
    c.is_system,
    COUNT(t.id) AS transaction_count
  FROM categories c
  LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = auth.uid()
  WHERE c.user_id = auth.uid()
  GROUP BY c.id, c.name, c.type, c.icon, c.color, c.is_system
  ORDER BY transaction_count DESC, c.name;
$$ LANGUAGE sql SECURITY DEFINER;
