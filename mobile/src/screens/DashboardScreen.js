import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDashboard } from '../hooks/useDashboard';
import { getDateRange } from '../utils/dateRanges';
import TimeRangePicker from '../components/TimeRangePicker';
import SummaryHeader from '../components/dashboard/SummaryHeader';
import InsightCards from '../components/dashboard/InsightCards';
import BudgetCard from '../components/dashboard/BudgetCard';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList';

export default function DashboardScreen({ navigation }) {
  const [range, setRange] = useState('this_month');
  const { startDate, endDate } = useMemo(() => getDateRange(range), [range]);
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard(
    startDate,
    endDate
  );

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
        <Text style={styles.errorText}>Couldn&apos;t load the dashboard.</Text>
      </View>
    );
  }

  const d = data || {};

  const openAdd = () => navigation.navigate('TransactionForm');
  const openEdit = (t) => navigation.navigate('TransactionForm', { transaction: t });
  const seeAll = () => navigation.navigate('Transactions');

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <TimeRangePicker value={range} onChange={setRange} />
        <SummaryHeader
          totalBalance={d.totalBalance}
          monthlyIncome={d.monthlyIncome}
          monthlyExpenses={d.monthlyExpenses}
        />
        <InsightCards
          monthlyIncome={d.monthlyIncome}
          monthlyExpenses={d.monthlyExpenses}
          categorySummary={d.categorySummary}
        />
        <BudgetCard
          monthlyBudget={d.monthlyBudget}
          monthlyExpenses={d.monthlyExpenses}
        />
        <MonthlyTrendsChart monthlyStats={d.monthlyStats} />
        <CategoryPieChart categorySummary={d.categorySummary} />
        <RecentTransactionsList
          transactions={d.recentTransactions}
          onSeeAll={seeAll}
          onItemPress={openEdit}
        />
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { paddingBottom: 80 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#dc2626', fontSize: 15 },
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
