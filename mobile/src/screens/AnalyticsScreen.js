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
import KeyMetricsRow from '../components/analytics/KeyMetricsRow';
import BalanceLineChart from '../components/analytics/BalanceLineChart';
import CategoryBarChart from '../components/analytics/CategoryBarChart';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'categories', label: 'Categories' },
  { value: 'trends', label: 'Trends' },
];

function ViewTabs({ value, onChange }) {
  return (
    <View style={tabStyles.row}>
      {VIEWS.map((v) => {
        const selected = value === v.value;
        return (
          <TouchableOpacity
            key={v.value}
            style={[tabStyles.tab, selected && tabStyles.tabSelected]}
            onPress={() => onChange(v.value)}
          >
            <Text style={[tabStyles.label, selected && tabStyles.labelSelected]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabSelected: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  label: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  labelSelected: { color: '#111827' },
});

export default function AnalyticsScreen() {
  const [range, setRange] = useState('last_3_months');
  const [view, setView] = useState('overview');
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
        <Text style={styles.errorText}>Couldn&apos;t load analytics.</Text>
      </View>
    );
  }

  const d = data || {};

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <TimeRangePicker value={range} onChange={setRange} />
      <ViewTabs value={view} onChange={setView} />
      <KeyMetricsRow
        monthlyStats={d.monthlyStats}
        categorySummary={d.categorySummary}
      />
      {view === 'overview' && (
        <MonthlyTrendsChart
          monthlyStats={d.monthlyStats}
          title="Income vs Expenses"
        />
      )}
      {view === 'categories' && (
        <CategoryBarChart categorySummary={d.categorySummary} />
      )}
      {view === 'trends' && <BalanceLineChart monthlyStats={d.monthlyStats} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#dc2626', fontSize: 15 },
});
