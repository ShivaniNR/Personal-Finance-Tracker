import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const CHART_WIDTH = Dimensions.get('window').width - 110;

export default function CategoryBarChart({ categorySummary }) {
  if (!categorySummary || categorySummary.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Spending by Category</Text>
        <Text style={styles.empty}>No category data for this period.</Text>
      </View>
    );
  }

  const top = categorySummary.slice(0, 6);
  const data = top.map((c) => ({
    value: Number(c.total) || 0,
    label: c.category.length > 8 ? `${c.category.slice(0, 8)}…` : c.category,
    frontColor: '#3b82f6',
  }));
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Spending by Category</Text>
      <BarChart
        data={data}
        width={CHART_WIDTH}
        adjustToWidth
        height={200}
        barWidth={28}
        spacing={20}
        initialSpacing={20}
        yAxisLabelPrefix="$"
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        maxValue={Math.ceil(maxVal * 1.1)}
        noOfSections={4}
        rulesType="solid"
        rulesColor="#f3f4f6"
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        showValuesAsTopLabel
        topLabelTextStyle={styles.topLabel}
      />
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
  empty: { color: '#9ca3af', fontSize: 14, paddingVertical: 20, textAlign: 'center' },
  axis: { color: '#6b7280', fontSize: 10 },
  topLabel: { color: '#374151', fontSize: 10, fontWeight: '600' },
});
