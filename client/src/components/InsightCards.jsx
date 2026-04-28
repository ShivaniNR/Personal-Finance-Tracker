import { PiggyBank, ShoppingBag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const GAUGE_COLORS = {
  great: '#10b981',  // green — under 50%
  okay: '#f59e0b',   // amber — 50-80%
  high: '#ef4444',   // red — over 80%
};

const getGaugeColor = (pct) => {
  if (pct <= 50) return GAUGE_COLORS.great;
  if (pct <= 80) return GAUGE_COLORS.okay;
  return GAUGE_COLORS.high;
};

const getGaugeMessage = (pct) => {
  if (pct <= 50) return 'Healthy spending — well within your income';
  if (pct <= 80) return 'Moderate — keep an eye on your expenses';
  if (pct <= 100) return 'High spending — close to your income limit';
  return 'Overspending — expenses exceed your income';
};

export const InsightCards = memo(({ monthlyIncome, monthlyExpenses, categorySummary }) => {
  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return null;
    return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  }, [monthlyIncome, monthlyExpenses]);

  const topCategory = useMemo(() => {
    if (!categorySummary || categorySummary.length === 0) return null;
    return categorySummary.reduce((max, cat) =>
      cat.total > max.total ? cat : max
    , categorySummary[0]);
  }, [categorySummary]);

  const expensePct = useMemo(() => {
    if (monthlyIncome <= 0) return null;
    return (monthlyExpenses / monthlyIncome) * 100;
  }, [monthlyIncome, monthlyExpenses]);

  const gaugeData = useMemo(() => {
    if (expensePct === null) return [];
    return [{ value: Math.min(expensePct, 100), fill: getGaugeColor(expensePct) }];
  }, [expensePct]);

  return (
    <div className="insight-cards">
      {/* Savings Rate Card */}
      <div className="insight-card savings-card">
        <div className="insight-icon savings">
          <PiggyBank size={22} />
        </div>
        <div className="insight-content">
          <h4>Savings Rate</h4>
          {savingsRate !== null ? (
            <>
              <div className={`insight-value ${savingsRate >= 0 ? 'positive' : 'negative'}`}>
                {savingsRate.toFixed(1)}%
              </div>
              <div className="insight-bar-track">
                <div
                  className={`insight-bar-fill ${savingsRate >= 50 ? 'great' : savingsRate >= 20 ? 'okay' : 'low'}`}
                  style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                />
              </div>
              <p className="insight-subtitle">
                {savingsRate >= 50
                  ? 'Excellent! You\'re saving over half your income'
                  : savingsRate >= 20
                    ? 'Good progress on your savings'
                    : savingsRate >= 0
                      ? 'Try to save at least 20% of your income'
                      : 'You\'re spending more than you earn'}
              </p>
            </>
          ) : (
            <p className="insight-subtitle">No income recorded this month</p>
          )}
        </div>
      </div>

      {/* Expense % of Income Gauge */}
      <div className="insight-card gauge-card">
        <div className="insight-content gauge-content">
          <h4>Expense % of Income</h4>
          {expensePct !== null ? (
            <>
              <div className="gauge-chart-wrapper">
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart
                    cx="50%"
                    cy="100%"
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={180}
                    endAngle={0}
                    data={gaugeData}
                    barSize={14}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background={{ fill: '#e2e8f0' }}
                      dataKey="value"
                      angleAxisId={0}
                      cornerRadius={7}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="gauge-center-label">
                  <span className="gauge-pct" style={{ color: getGaugeColor(expensePct) }}>
                    {expensePct.toFixed(1)}%
                  </span>
                  <span className="gauge-amounts">
                    ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    {' / '}
                    ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <p className="insight-subtitle gauge-msg">{getGaugeMessage(expensePct)}</p>
            </>
          ) : (
            <p className="insight-subtitle">No income recorded to compare</p>
          )}
        </div>
      </div>

      {/* Top Spending Category Card */}
      <div className="insight-card top-category-card">
        <div className="insight-icon top-category">
          <ShoppingBag size={22} />
        </div>
        <div className="insight-content">
          <h4>Top Spending Category</h4>
          {topCategory ? (
            <>
              <div className="insight-value">{topCategory.category}</div>
              <div className="top-category-stats">
                <span className="top-category-amount">
                  ${topCategory.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="top-category-pct">
                  {topCategory.percentage.toFixed(1)}% of expenses
                </span>
              </div>
              <div className="insight-bar-track">
                <div
                  className="insight-bar-fill category"
                  style={{ width: `${topCategory.percentage}%` }}
                />
              </div>
            </>
          ) : (
            <p className="insight-subtitle">No expenses recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
});

InsightCards.displayName = 'InsightCards';
