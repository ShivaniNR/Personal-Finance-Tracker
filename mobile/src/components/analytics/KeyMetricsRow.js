import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/format';

export default function KeyMetricsRow({ monthlyStats, categorySummary }) {
  const latest =
    monthlyStats && monthlyStats.length > 0
      ? monthlyStats[monthlyStats.length - 1]
      : null;
  const prev =
    monthlyStats && monthlyStats.length > 1
      ? monthlyStats[monthlyStats.length - 2]
      : null;

  const incomeChange =
    prev && prev.income > 0 ? ((latest.income - prev.income) / prev.income) * 100 : 0;
  const expenseChange =
    prev && prev.expenses > 0
      ? ((latest.expenses - prev.expenses) / prev.expenses) * 100
      : 0;

  const top = categorySummary && categorySummary.length > 0 ? categorySummary[0] : null;

  return (
    <View style={styles.row}>
      <MetricCard
        label="Income Trend"
        value={`${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`}
        sub="vs previous"
        valueColor={incomeChange >= 0 ? '#10b981' : '#ef4444'}
      />
      <MetricCard
        label="Expense Trend"
        value={`${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`}
        sub="vs previous"
        valueColor={expenseChange <= 0 ? '#10b981' : '#ef4444'}
      />
      <MetricCard
        label="Top Category"
        value={top?.category || 'N/A'}
        sub={top ? formatCurrency(top.total) : '$0'}
      />
    </View>
  );
}

function MetricCard({ label, value, sub, valueColor }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, valueColor && { color: valueColor }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  label: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});
