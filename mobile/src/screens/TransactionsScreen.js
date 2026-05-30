import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTransactions } from '../hooks/useTransactions';

function formatAmount(amount, type) {
  const sign = type === 'INCOME' ? '+' : '-';
  return `${sign}$${Number(amount).toLocaleString()}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function TransactionRow({ item, onPress }) {
  const isIncome = item.type === 'INCOME';
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
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
    </TouchableOpacity>
  );
}

export default function TransactionsScreen({ navigation }) {
  const { data: transactions = [], isLoading, isError, refetch, isRefetching } =
    useTransactions();

  const openForm = (transaction) =>
    navigation.navigate('TransactionForm', transaction ? { transaction } : undefined);

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
    <View style={styles.flex}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} onPress={openForm} />}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet. Tap + to add one.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => openForm(null)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#dc2626', fontSize: 15 },
  listContent: { padding: 16, flexGrow: 1 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '300' },
});
