import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBudget } from '../services/dashboard';
import { useDashboard } from '../hooks/useDashboard';
import { getDateRange } from '../utils/dateRanges';

export default function BudgetSettingScreen({ navigation }) {
  const queryClient = useQueryClient();
  // Reuse the dashboard query for the current month so we can pre-fill the
  // budget value the user already has set.
  const { startDate, endDate } = useMemo(() => getDateRange('this_month'), []);
  const { data } = useDashboard(startDate, endDate);
  const current = data?.monthlyBudget ?? null;

  const [amount, setAmount] = useState(current != null ? String(current) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (current != null && amount === '') {
      setAmount(String(current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const mutation = useMutation({
    mutationFn: (val) => updateBudget(val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Saved', 'Your monthly budget has been updated.');
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Update failed', e.message || 'Could not save the budget.'),
  });

  const handleSave = () => {
    setError('');
    const val = parseFloat(amount);
    if (!amount.trim() || Number.isNaN(val)) {
      setError('Enter a valid number.');
      return;
    }
    if (val <= 0) {
      setError('Budget must be greater than zero.');
      return;
    }
    mutation.mutate(val);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Monthly budget</Text>
        <Text style={styles.subtitle}>
          Set a monthly spending limit. The dashboard will show how much you have left.
        </Text>

        <Text style={styles.label}>Spending limit</Text>
        <View style={[styles.amountRow, !!error && styles.amountRowError]}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              if (error) setError('');
            }}
            placeholder="1500.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.saveBtn, mutation.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              {current != null ? 'Update Budget' : 'Save Budget'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  amountRowError: { borderColor: '#dc2626' },
  currency: { fontSize: 20, color: '#6b7280', marginRight: 8 },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: 20, color: '#111827' },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 6 },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  cancelText: { color: '#6b7280', fontSize: 15 },
});
