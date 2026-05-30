import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/format';

function getGaugeColor(pct) {
  if (pct <= 50) return '#10b981';
  if (pct <= 80) return '#f59e0b';
  return '#ef4444';
}

export default function InsightCards({ monthlyIncome, monthlyExpenses, categorySummary }) {
  const savingsRate =
    monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : null;
  const expensePct =
    monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : null;

  const top =
    categorySummary && categorySummary.length > 0
      ? categorySummary.reduce((max, c) => (c.total > max.total ? c : max), categorySummary[0])
      : null;

  return (
    <View style={styles.wrap}>
      {/* Savings Rate */}
      <View style={styles.card}>
        <Text style={styles.title}>Savings Rate</Text>
        {savingsRate !== null ? (
          <>
            <Text
              style={[
                styles.value,
                { color: savingsRate >= 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              {savingsRate.toFixed(1)}%
            </Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                    backgroundColor: savingsRate >= 20 ? '#10b981' : '#f59e0b',
                  },
                ]}
              />
            </View>
            <Text style={styles.subtitle}>
              {savingsRate >= 50
                ? 'Saving over half of your income'
                : savingsRate >= 20
                  ? 'Healthy savings'
                  : savingsRate >= 0
                    ? 'Aim for 20%+ savings'
                    : 'Spending more than earning'}
            </Text>
          </>
        ) : (
          <Text style={styles.subtitle}>No income recorded in range</Text>
        )}
      </View>

      {/* Expense % of Income */}
      <View style={styles.card}>
        <Text style={styles.title}>Expense % of Income</Text>
        {expensePct !== null ? (
          <>
            <Text style={[styles.value, { color: getGaugeColor(expensePct) }]}>
              {expensePct.toFixed(1)}%
            </Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, expensePct)}%`,
                    backgroundColor: getGaugeColor(expensePct),
                  },
                ]}
              />
            </View>
            <Text style={styles.subtitle}>
              {formatCurrency(monthlyExpenses)} / {formatCurrency(monthlyIncome)}
            </Text>
          </>
        ) : (
          <Text style={styles.subtitle}>No income recorded to compare</Text>
        )}
      </View>

      {/* Top Category */}
      <View style={styles.card}>
        <Text style={styles.title}>Top Spending Category</Text>
        {top ? (
          <>
            <Text style={styles.value}>{top.category}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.amount}>
                {formatCurrency(top.total, 2)}
              </Text>
              <Text style={styles.pct}>
                {Number(top.percentage || 0).toFixed(1)}% of expenses
              </Text>
            </View>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, top.percentage || 0)}%`,
                    backgroundColor: '#3b82f6',
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <Text style={styles.subtitle}>No expenses recorded yet</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 12, marginTop: 16 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  title: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  bar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  amount: { fontSize: 14, fontWeight: '600', color: '#111827' },
  pct: { fontSize: 12, color: '#6b7280' },
});
