import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';
import { useCategories } from '../hooks/useCategories';

function formatLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function todayLocal() {
  return formatLocalDate(new Date());
}

// Parse 'YYYY-MM-DD' into a local-midnight Date (avoids the UTC shift from new Date(str)).
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function TransactionFormScreen({ route, navigation }) {
  const editing = route.params?.transaction ?? null;
  const isEditing = !!editing;

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();

  const [type, setType] = useState(editing?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [date, setDate] = useState(editing?.date ?? todayLocal());
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (field) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEditing ? updateTransaction(editing.id, payload) : addTransaction(payload),
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Save failed', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTransaction(editing.id),
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Delete failed', e.message),
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  // Switching type: drop a selected category that doesn't belong to the new type.
  const handleType = (next) => {
    setType(next);
    if (category && !categories.some((c) => c.name === category && c.type === next)) {
      setCategory('');
    }
    clearError('category');
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    const nextErrors = {};

    if (!amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else if (Number.isNaN(parsedAmount)) {
      nextErrors.amount = 'Enter a valid number.';
    } else if (parsedAmount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    // Category is required when at least one matches the selected type;
    // if the user has no categories of this type, don't block them.
    const hasCategoriesForType = categories.some((c) => c.type === type);
    if (hasCategoriesForType && !category) {
      nextErrors.category = 'Pick a category.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    saveMutation.mutate({
      amount: parsedAmount,
      description: description.trim(),
      type,
      date,
      ...(category && { category }),
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const typeCategories = categories.filter((c) => c.type === type);

  const onChangeDate = (event, selected) => {
    // Android: dialog closes itself; 'dismissed' means the user cancelled.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type !== 'dismissed' && selected) {
      setDate(formatLocalDate(selected));
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Type toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'EXPENSE' && styles.toggleExpense]}
          onPress={() => handleType('EXPENSE')}
        >
          <Text style={[styles.toggleText, type === 'EXPENSE' && styles.toggleTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'INCOME' && styles.toggleIncome]}
          onPress={() => handleType('INCOME')}
        >
          <Text style={[styles.toggleText, type === 'INCOME' && styles.toggleTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <View style={[styles.amountRow, errors.amount && styles.inputError]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={(t) => {
            setAmount(t);
            clearError('amount');
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, errors.description && styles.inputError]}
        value={description}
        onChangeText={(t) => {
          setDescription(t);
          clearError('description');
        }}
        placeholder="What was it for?"
      />
      {errors.description && (
        <Text style={styles.errorText}>{errors.description}</Text>
      )}

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      {typeCategories.length === 0 ? (
        <Text style={styles.hint}>No {type.toLowerCase()} categories yet.</Text>
      ) : (
        <View style={styles.chips}>
          {typeCategories.map((c) => {
            const selected = category === c.name;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => {
                  setCategory(selected ? '' : c.name);
                  clearError('category');
                }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {c.icon ? `${c.icon} ` : ''}
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{date}</Text>
        </TouchableOpacity>
      )}
      {(showPicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={parseLocalDate(date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, busy && styles.disabled]}
        onPress={handleSave}
        disabled={busy}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>
            {isEditing ? 'Update Transaction' : 'Add Transaction'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Delete (edit only) */}
      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteBtn, busy && styles.disabled]}
          onPress={handleDelete}
          disabled={busy}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  toggle: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  toggleExpense: { backgroundColor: '#fef2f2', borderColor: '#dc2626' },
  toggleIncome: { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  hint: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  dateText: { fontSize: 16, color: '#111827' },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 6 },
  currency: { fontSize: 18, color: '#6b7280', marginRight: 6 },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  deleteText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
