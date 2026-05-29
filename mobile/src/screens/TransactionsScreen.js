import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTransactions } from '../hooks/useTransactions';

function formatAmount(amount, type) {
  const sign = type === 'INCOME' ? '+' : '-';
  return `${sign}$${Number(amount).toLocaleString()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function TransactionRow({ item }) {
  const isIncome = item.type === 'INCOME';
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.description} numberOfLines={1}>
          {item.categoryIcon ? `${item.categoryIcon} ` : ''}
          {item.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {formatAmount(item.amount, item.type)}
      </Text>
    </View>
  );
}

export default function TransactionsScreen() {
  const { data: transactions = [], isLoading, isError, refetch, isRefetching } =
    useTransactions();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Couldn&apos;t load transactions.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TransactionRow item={item} />}
      contentContainerStyle={
        transactions.length === 0 ? styles.emptyContainer : styles.listContent
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transactions yet.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#dc2626', fontSize: 15 },
  listContent: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emptyText: { color: '#888', fontSize: 15 },
  separator: { height: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
  },
  left: { flex: 1, marginRight: 12 },
  description: { fontSize: 16, fontWeight: '600', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  category: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  date: { fontSize: 12, color: '#9ca3af' },
  amount: { fontSize: 16, fontWeight: '700' },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
});
