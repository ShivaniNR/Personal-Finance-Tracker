import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const CHART_WIDTH = Dimensions.get('window').width - 110;

export default function BalanceLineChart({ monthlyStats }) {
  if (!monthlyStats || monthlyStats.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Net Balance Trend</Text>
        <Text style={styles.empty}>No data for this period.</Text>
      </View>
    );
  }

  const data = monthlyStats.map((m) => ({
    value: Number(m.balance) || 0,
    label: m.month,
  }));
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Net Balance Trend</Text>
      <LineChart
        data={data}
        width={CHART_WIDTH}
        adjustToWidth
        color="#6366f1"
        dataPointsColor="#6366f1"
        thickness={2}
        height={200}
        initialSpacing={20}
        endSpacing={20}
        yAxisLabelPrefix="$"
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        maxValue={Math.ceil(Math.max(maxVal, 1) * 1.1)}
        noOfSections={4}
        rulesType="solid"
        rulesColor="#f3f4f6"
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        pointerConfig={{
          pointerStripColor: '#9ca3af',
          pointerStripWidth: 2,
          strokeDashArray: [2, 5],
          pointerColor: '#6366f1',
          radius: 5,
          pointerLabelWidth: 130,
          pointerLabelHeight: 50,
          autoAdjustPointerLabelPosition: true,
          activatePointersOnLongPress: false,
          pointerLabelComponent: (items) => (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipMonth}>{items[0]?.label || ''}</Text>
              <Text style={styles.tooltipValue}>
                Balance: ${Number(items[0]?.value || 0).toLocaleString()}
              </Text>
            </View>
          ),
        }}
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
  tooltip: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 130,
  },
  tooltipMonth: { color: '#fff', fontSize: 11, marginBottom: 4 },
  tooltipValue: { color: '#a5b4fc', fontSize: 12, fontWeight: '600' },
});
