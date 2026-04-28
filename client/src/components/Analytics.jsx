import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { getDashboard } from '../services/dashboard';
import { getDateRange } from '../utils/dateRanges';
import './Analytics.css';

const ANALYTICS_RANGES = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
];

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('last_3_months');
  const [viewType, setViewType] = useState('overview');

  const { startDate, endDate } = useMemo(() => getDateRange(timeRange), [timeRange]);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', startDate, endDate],
    queryFn: () => getDashboard(startDate, endDate),
  });

  if (isLoading || !analyticsData) {
    return (
      <div className="analytics-page">
        <div className="page-header">
          <h1>Analytics & Insights</h1>
          <p>Detailed analysis of your spending patterns</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { categorySummary, monthlyStats } = analyticsData;

  // Safe trend calculations
  const latestMonth = monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1] : null;
  const previousMonth = monthlyStats.length > 1 ? monthlyStats[monthlyStats.length - 2] : null;

  const incomeChange = previousMonth && previousMonth.income > 0
    ? ((latestMonth.income - previousMonth.income) / previousMonth.income * 100).toFixed(1)
    : 0;
  const expenseChange = previousMonth && previousMonth.expenses > 0
    ? ((latestMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100).toFixed(1)
    : 0;

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics & Insights</h1>
        <p>Detailed analysis of your spending patterns</p>
      </div>

      {/* Time Range Selector */}
      <div className="analytics-controls">
        <div className="time-range-selector">
          <Calendar size={16} />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            {ANALYTICS_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="view-type-selector">
          <button
            className={viewType === 'overview' ? 'active' : ''}
            onClick={() => setViewType('overview')}
          >
            Overview
          </button>
          <button
            className={viewType === 'categories' ? 'active' : ''}
            onClick={() => setViewType('categories')}
          >
            Categories
          </button>
          <button
            className={viewType === 'trends' ? 'active' : ''}
            onClick={() => setViewType('trends')}
          >
            Trends
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics">
        <div className="metric-card">
          <div className="metric-icon income">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Income Trend</h3>
            <div className="metric-value">
              <span className={incomeChange >= 0 ? 'positive' : 'negative'}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange}%
              </span>
              <span className="metric-label">vs previous month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon expense">
            <TrendingDown size={24} />
          </div>
          <div className="metric-content">
            <h3>Expense Trend</h3>
            <div className="metric-value">
              <span className={expenseChange <= 0 ? 'positive' : 'negative'}>
                {expenseChange >= 0 ? '+' : ''}{expenseChange}%
              </span>
              <span className="metric-label">vs previous month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <PieChartIcon size={24} />
          </div>
          <div className="metric-content">
            <h3>Top Category</h3>
            <div className="metric-value">
              <span>{categorySummary[0]?.category || 'N/A'}</span>
              <span className="metric-label">
                {categorySummary[0] ? `$${categorySummary[0].total.toLocaleString()}` : '$0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="analytics-charts">
        {viewType === 'overview' && (
          <div className="chart-container large">
            <h3>Income vs Expenses Over Time</h3>
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">No data available for this period</div>
            )}
          </div>
        )}

        {viewType === 'categories' && (
          <div className="chart-container large">
            <h3>Spending by Category</h3>
            {categorySummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categorySummary.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="category" type="category" width={120} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="total" fill="#667eea" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">No expense data for this period</div>
            )}
          </div>
        )}

        {viewType === 'trends' && (
          <div className="chart-container large">
            <h3>Monthly Balance Trend</h3>
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" name="Net Balance" stroke="#667eea" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">No trend data for this period</div>
            )}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Smart Insights</h3>
        <div className="insights-grid">
          {categorySummary.length > 0 && (
            <div className="insight-card">
              <h4>Spending Pattern</h4>
              <p>You spend most on {categorySummary[0].category}, averaging ${(categorySummary[0].total / categorySummary[0].count).toFixed(2)} per transaction.</p>
            </div>
          )}

          {previousMonth && (
            <div className="insight-card">
              <h4>Monthly Trend</h4>
              <p>Your {incomeChange >= 0 ? 'income increased' : 'income decreased'} by {Math.abs(incomeChange)}% compared to the previous month.</p>
            </div>
          )}

          {categorySummary.length >= 3 && (
            <div className="insight-card">
              <h4>Saving Opportunity</h4>
              <p>Reducing spending in your top 3 categories by 10% could save ${(categorySummary.slice(0, 3).reduce((sum, cat) => sum + cat.total, 0) * 0.1).toFixed(2)}.</p>
            </div>
          )}

          {categorySummary.length === 0 && !previousMonth && (
            <div className="insight-card">
              <h4>No Insights Yet</h4>
              <p>Add more transactions to see spending patterns and saving opportunities.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};