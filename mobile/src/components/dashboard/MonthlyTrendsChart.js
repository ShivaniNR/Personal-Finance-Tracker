import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const INCOME_COLOR = '#10b981';
const EXPENSE_COLOR = '#ef4444';

// Card has marginHorizontal:16 + padding:14 each side = 60 total; reserve ~50 for y-axis labels.
const CHART_WIDTH = Dimensions.get('window').width - 110;

export default function MonthlyTrendsChart({ monthlyStats, title = 'Monthly Trends' }) {
  if (!monthlyStats || monthlyStats.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>No monthly data for this period.</Text>
      </View>
    );
  }

  const income = monthlyStats.map((m) => ({ value: Number(m.income) || 0, label: m.month }));
  const expenses = monthlyStats.map((m) => ({ value: Number(m.expenses) || 0 }));
  const maxVal = Math.max(
    ...income.map((p) => p.value),
    ...expenses.map((p) => p.value),
    1
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={income}
        data2={expenses}
        width={CHART_WIDTH}
        adjustToWidth
        color1={INCOME_COLOR}
        color2={EXPENSE_COLOR}
        dataPointsColor1={INCOME_COLOR}
        dataPointsColor2={EXPENSE_COLOR}
        thickness={2}
        height={180}
        initialSpacing={20}
        endSpacing={20}
        yAxisLabelPrefix="$"
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        maxValue={Math.ceil(maxVal * 1.1)}
        noOfSections={4}
        rulesType="solid"
        rulesColor="#f3f4f6"
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        hideDataPoints={false}
        pointerConfig={{
          pointerStripColor: '#9ca3af',
          pointerStripWidth: 2,
          strokeDashArray: [2, 5],
          pointerColor: '#6b7280',
          radius: 5,
          pointerLabelWidth: 140,
          pointerLabelHeight: 70,
          autoAdjustPointerLabelPosition: true,
          activatePointersOnLongPress: false,
          pointerLabelComponent: (items) => (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipMonth}>{items[0]?.label || ''}</Text>
              <Text style={[styles.tooltipValue, { color: INCOME_COLOR }]}>
                Income: ${Number(items[0]?.value || 0).toLocaleString()}
              </Text>
              {items[1] && (
                <Text style={[styles.tooltipValue, { color: EXPENSE_COLOR }]}>
                  Expenses: ${Number(items[1]?.value || 0).toLocaleString()}
                </Text>
              )}
            </View>
          ),
        }}
      />
      <View style={styles.legend}>
        <LegendDot color={INCOME_COLOR} label="Income" />
        <LegendDot color={EXPENSE_COLOR} label="Expenses" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#374151' },
  tooltip: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 140,
  },
  tooltipMonth: { color: '#fff', fontSize: 11, marginBottom: 4 },
  tooltipValue: { fontSize: 12, fontWeight: '600' },
});
