import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/format';

export default function BudgetCard({ monthlyBudget, monthlyExpenses }) {
  const hasBudget = monthlyBudget != null && monthlyBudget > 0;
  const spent = monthlyExpenses || 0;
  const remaining = hasBudget ? monthlyBudget - spent : 0;
  const usedPct = hasBudget ? (spent / monthlyBudget) * 100 : 0;
  const isOver = usedPct > 100;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Budget</Text>

      {hasBudget ? (
        <>
          <View style={styles.amountsRow}>
            <View style={styles.amountCell}>
              <Text style={styles.amountLabel}>Spent</Text>
              <Text style={[styles.amountValue, isOver && { color: '#dc2626' }]}>
                {formatCurrency(spent, 2)}
              </Text>
            </View>
            <View style={styles.amountCell}>
              <Text style={styles.amountLabel}>{isOver ? 'Over by' : 'Remaining'}</Text>
              <Text
                style={[
                  styles.amountValue,
                  { color: isOver ? '#dc2626' : '#10b981' },
                ]}
              >
                {formatCurrency(Math.abs(remaining), 2)}
              </Text>
            </View>
            <View style={styles.amountCell}>
              <Text style={styles.amountLabel}>Budget</Text>
              <Text style={styles.amountValue}>{formatCurrency(monthlyBudget, 2)}</Text>
            </View>
          </View>

          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(usedPct, 100)}%`,
                  backgroundColor: isOver
                    ? '#dc2626'
                    : usedPct >= 80
                      ? '#f59e0b'
                      : '#10b981',
                },
              ]}
            />
          </View>
          <Text style={styles.subtitle}>{usedPct.toFixed(0)}% used</Text>
        </>
      ) : (
        <Text style={styles.subtitle}>
          No monthly budget set. Open the web app to set one — mobile budget editing is coming soon.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  title: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 10 },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  amountCell: { flex: 1 },
  amountLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  amountValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  bar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 6 },
});
