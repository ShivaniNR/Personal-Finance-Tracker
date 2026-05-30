import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { formatCurrency } from '../../utils/format';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
];

export default function CategoryPieChart({ categorySummary }) {
  const [focused, setFocused] = useState(0);

  if (!categorySummary || categorySummary.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Expense Categories</Text>
        <Text style={styles.empty}>No category data for this period.</Text>
      </View>
    );
  }

  const top = categorySummary.slice(0, 8);
  const pieData = top.map((c, i) => ({
    value: Number(c.total) || 0,
    color: COLORS[i % COLORS.length],
    text: c.category,
    focused: i === focused,
  }));
  const focusedItem = top[focused];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Expense Categories</Text>
      <Text style={styles.hint}>Tap a slice or row to inspect</Text>
      <View style={styles.pieRow}>
        <PieChart
          data={pieData}
          donut
          radius={75}
          innerRadius={45}
          showText={false}
          focusOnPress
          onPress={(_item, index) => setFocused(index)}
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Text style={styles.centerLabel} numberOfLines={1}>
                {focusedItem?.category || ''}
              </Text>
              <Text style={styles.centerValue}>
                {formatCurrency(focusedItem?.total || 0)}
              </Text>
              <Text style={styles.centerPct}>
                {Number(focusedItem?.percentage || 0).toFixed(1)}%
              </Text>
            </View>
          )}
        />
        <View style={styles.legend}>
          {top.map((c, i) => {
            const isFocused = i === focused;
            return (
              <TouchableOpacity
                key={c.category}
                style={[styles.legendItem, isFocused && styles.legendItemFocused]}
                onPress={() => setFocused(i)}
              >
                <View style={[styles.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                <Text
                  style={[styles.legendLabel, isFocused && styles.legendLabelFocused]}
                  numberOfLines={1}
                >
                  {c.category}
                </Text>
                <Text style={styles.legendPct}>
                  {Number(c.percentage || 0).toFixed(0)}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
  title: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginBottom: 2 },
  hint: { fontSize: 11, color: '#9ca3af', marginBottom: 10 },
  empty: { color: '#9ca3af', fontSize: 14, paddingVertical: 20, textAlign: 'center' },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legend: { flex: 1, gap: 4 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  legendItemFocused: { backgroundColor: '#f3f4f6' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#374151', flex: 1 },
  legendLabelFocused: { color: '#111827', fontWeight: '600' },
  legendPct: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  center: { alignItems: 'center', maxWidth: 80 },
  centerLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center' },
  centerValue: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2 },
  centerPct: { fontSize: 10, color: '#6b7280', marginTop: 1 },
});
