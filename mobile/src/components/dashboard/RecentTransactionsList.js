import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatSignedCurrency } from '../../utils/format';

export default function RecentTransactionsList({ transactions, onSeeAll, onItemPress }) {
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <Text style={styles.empty}>No transactions yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {transactions.slice(0, 5).map((t) => (
        <TouchableOpacity
          key={t.id}
          style={styles.row}
          onPress={() => onItemPress?.(t)}
        >
          <View style={styles.left}>
            <Text style={styles.description} numberOfLines={1}>
              {t.categoryIcon ? `${t.categoryIcon} ` : ''}
              {t.description}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{t.category}</Text>
              <Text style={styles.date}>{new Date(t.date).toLocaleDateString()}</Text>
            </View>
          </View>
          <Text
            style={[
              styles.amount,
              t.type === 'INCOME' ? styles.income : styles.expense,
            ]}
          >
            {formatSignedCurrency(t.amount, t.type, 2)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  seeAll: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  empty: { color: '#9ca3af', fontSize: 14, paddingVertical: 12, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  left: { flex: 1, marginRight: 12 },
  description: { fontSize: 15, fontWeight: '600', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 },
  category: { fontSize: 11, color: '#374151' },
  date: { fontSize: 11, color: '#9ca3af' },
  amount: { fontSize: 15, fontWeight: '700' },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
});
