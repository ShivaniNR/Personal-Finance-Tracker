import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../../utils/format';

export default function SummaryHeader({ totalBalance, monthlyIncome, monthlyExpenses }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(totalBalance)}</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.smallCard, styles.income]}>
          <Text style={styles.smallLabel}>Income</Text>
          <Text style={styles.smallValueIncome}>{formatCurrency(monthlyIncome)}</Text>
        </View>
        <View style={[styles.smallCard, styles.expense]}>
          <Text style={styles.smallLabel}>Expenses</Text>
          <Text style={styles.smallValueExpense}>{formatCurrency(monthlyExpenses)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  balanceCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  balanceLabel: { color: '#cbd5ff', fontSize: 13, marginBottom: 6 },
  balanceValue: { color: '#fff', fontSize: 30, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  income: { borderLeftWidth: 4, borderLeftColor: '#10b981' },
  expense: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  smallLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  smallValueIncome: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  smallValueExpense: { fontSize: 18, fontWeight: '700', color: '#ef4444' },
});
