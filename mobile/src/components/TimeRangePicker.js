import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TIME_RANGES } from '../utils/dateRanges';

export default function TimeRangePicker({ value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TIME_RANGES.map((r) => {
        const selected = value === r.value;
        return (
          <TouchableOpacity
            key={r.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(r.value)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{r.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  label: { fontSize: 13, color: '#374151', fontWeight: '600' },
  labelSelected: { color: '#fff' },
});
