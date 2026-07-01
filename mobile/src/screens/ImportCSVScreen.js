import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useQueryClient } from '@tanstack/react-query';
import {
  SUPPORTED_BANKS,
  parseAndGetMapping,
  applyMappingAndParse,
  getMappingDisplayName,
} from '../utils/csvImport';
import { addTransaction } from '../services/transactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/format';

export default function ImportCSVScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { data: userCategories = [] } = useCategories();

  const [stage, setStage] = useState('select-bank');
  const [bank, setBank] = useState(SUPPORTED_BANKS[0]?.key || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState({ succeeded: 0, failed: [] });
  const [pickerOpenFor, setPickerOpenFor] = useState(null);

  const reset = () => {
    setStage('select-bank');
    setBank(SUPPORTED_BANKS[0]?.key || '');
    setErrorMsg('');
    setRawRows([]);
    setMapping({});
    setProgress({ current: 0, total: 0 });
    setResult({ succeeded: 0, failed: [] });
  };

  const handlePick = async () => {
    setErrorMsg('');
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const file = picked.assets[0];
      if (!file.name?.toLowerCase().endsWith('.csv')) {
        setErrorMsg('Please select a .csv file');
        setStage('error');
        return;
      }
      const content = await FileSystem.readAsStringAsync(file.uri);
      const { rawRows: rows, defaultMapping } = parseAndGetMapping(
        bank,
        content,
        userCategories
      );
      setRawRows(rows);
      setMapping(defaultMapping);
      setStage('mapping');
    } catch (err) {
      setErrorMsg(err.message || 'Could not read the file.');
      setStage('error');
    }
  };

  const runImport = async (transactions) => {
    setStage('importing');
    setProgress({ current: 0, total: transactions.length });
    let succeeded = 0;
    const failed = [];
    for (let i = 0; i < transactions.length; i++) {
      try {
        await addTransaction(transactions[i], { allowCreateCategory: false });
        succeeded++;
      } catch (err) {
        failed.push({ ...transactions[i], error: err.message || 'Unknown error' });
      }
      setProgress({ current: i + 1, total: transactions.length });
    }
    setResult({ succeeded, failed });
    setStage('done');
    if (succeeded > 0) {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  };

  const startImport = () => {
    let transactions;
    try {
      transactions = applyMappingAndParse(bank, rawRows, mapping);
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
      return;
    }
    runImport(transactions);
  };

  const retryFailed = () => {
    const toRetry = result.failed.map((tx) => ({
      date: tx.date,
      amount: tx.amount,
      description: tx.description,
      type: tx.type,
      category: tx.category,
    }));
    setResult({ succeeded: result.succeeded, failed: [] });
    runImport(toRetry).then(() => {
      // succeeded count from the runImport reset; re-add prior successes
      setResult((curr) => ({
        succeeded: curr.succeeded + result.succeeded,
        failed: curr.failed,
      }));
    });
  };

  const mappingEntries = Object.entries(mapping);
  const hasUnmapped = mappingEntries.some(([, appCat]) => !appCat);
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const bankLabel = SUPPORTED_BANKS.find((b) => b.key === bank)?.label || '';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {/* SELECT BANK */}
      {stage === 'select-bank' && (
        <View>
          <Text style={styles.title}>Import CSV</Text>
          <Text style={styles.subtitle}>Choose your bank to start the import.</Text>
          <Text style={styles.label}>Bank</Text>
          <View style={styles.chips}>
            {SUPPORTED_BANKS.map((b) => {
              const selected = bank === b.key;
              return (
                <TouchableOpacity
                  key={b.key}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setBank(b.key)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, !bank && styles.btnDisabled]}
            onPress={() => setStage('upload')}
            disabled={!bank}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* UPLOAD */}
      {stage === 'upload' && (
        <View>
          <Text style={styles.title}>Pick your CSV</Text>
          <Text style={styles.subtitle}>
            Select the {bankLabel} export file from your device.
          </Text>
          <TouchableOpacity style={styles.dropZone} onPress={handlePick}>
            <MaterialIcons name="upload-file" size={40} color="#2563eb" />
            <Text style={styles.dropZoneTitle}>Tap to choose a CSV file</Text>
            <Text style={styles.dropZoneHint}>
              We&apos;ll show a preview before importing anything.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStage('select-bank')}>
            <Text style={styles.linkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAPPING */}
      {stage === 'mapping' && (
        <View>
          <Text style={styles.title}>Review categories</Text>
          <Text style={styles.subtitle}>
            Found <Text style={styles.bold}>{rawRows.length}</Text> transactions with{' '}
            <Text style={styles.bold}>{mappingEntries.length}</Text> categories. Adjust the
            mapping below before importing.
          </Text>

          <View style={styles.card}>
            {mappingEntries.map(([bankCat, appCat], idx) => (
              <View key={bankCat}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.mappingRow}>
                  <View style={styles.mappingLeft}>
                    <Text style={styles.mappingBank}>
                      {getMappingDisplayName(bank, bankCat)}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#9ca3af" />
                  </View>
                  <TouchableOpacity
                    style={styles.mappingSelect}
                    onPress={() => setPickerOpenFor(bankCat)}
                  >
                    <Text style={styles.mappingSelectText} numberOfLines={1}>
                      {appCat || 'Select category'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, hasUnmapped && styles.btnDisabled]}
            onPress={startImport}
            disabled={hasUnmapped}
          >
            <Text style={styles.primaryBtnText}>
              {hasUnmapped
                ? 'Pick a category for every row to continue'
                : `Import ${rawRows.length} transactions`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setStage('upload')}>
            <Text style={styles.linkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* IMPORTING */}
      {stage === 'importing' && (
        <View style={styles.centerStage}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerText}>
            Importing… {progress.current} / {progress.total}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>
      )}

      {/* DONE */}
      {stage === 'done' && (
        <View>
          <View style={styles.centerStage}>
            <MaterialIcons name="check-circle" size={64} color="#10b981" />
            <Text style={styles.doneTitle}>Import complete</Text>
            <Text style={styles.doneSubtitle}>
              Successfully imported{' '}
              <Text style={styles.bold}>{result.succeeded}</Text> transaction
              {result.succeeded !== 1 ? 's' : ''}.
            </Text>
          </View>
          {result.failed.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.failedTitle}>
                {result.failed.length} failed
              </Text>
              {result.failed.slice(0, 10).map((tx, i) => (
                <View key={i} style={styles.failedRow}>
                  <Text style={styles.failedDate}>{tx.date}</Text>
                  <Text style={styles.failedDesc} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={styles.failedAmount}>{formatCurrency(tx.amount, 2)}</Text>
                </View>
              ))}
              {result.failed.length > 10 && (
                <Text style={styles.failedMore}>
                  …and {result.failed.length - 10} more
                </Text>
              )}
              <TouchableOpacity style={styles.retryBtn} onPress={retryFailed}>
                <MaterialIcons name="refresh" size={16} color="#2563eb" />
                <Text style={styles.retryText}>Retry failed</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ERROR */}
      {stage === 'error' && (
        <View style={styles.centerStage}>
          <MaterialIcons name="error-outline" size={64} color="#dc2626" />
          <Text style={styles.errTitle}>Something went wrong</Text>
          <Text style={styles.errBody}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CATEGORY PICKER MODAL */}
      <Modal
        visible={!!pickerOpenFor}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpenFor(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerOpenFor(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick a category</Text>
            <FlatList
              data={userCategories}
              keyExtractor={(c) => c.id}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setMapping((prev) => ({ ...prev, [pickerOpenFor]: item.name }));
                    setPickerOpenFor(null);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.icon ? `${item.icon} ` : ''}
                    {item.name}
                  </Text>
                  <Text style={styles.modalItemType}>{item.type}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  bold: { fontWeight: '700', color: '#111827' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  linkText: { color: '#6b7280', fontSize: 14 },

  dropZone: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropZoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  dropZoneHint: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4,
  },
  mappingRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  mappingLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mappingBank: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
  mappingSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  mappingSelectText: { fontSize: 14, color: '#111827', flex: 1 },
  divider: { height: 1, backgroundColor: '#f3f4f6' },

  centerStage: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  centerText: { fontSize: 15, color: '#374151', marginTop: 14, marginBottom: 12 },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2563eb' },

  doneTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 12 },
  doneSubtitle: { fontSize: 14, color: '#374151', marginTop: 6, textAlign: 'center' },

  failedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  failedRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  failedDate: { fontSize: 11, color: '#6b7280', minWidth: 70 },
  failedDesc: { fontSize: 12, color: '#374151', flex: 1 },
  failedAmount: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  failedMore: {
    fontSize: 11,
    color: '#9ca3af',
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  retryText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },

  errTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 12 },
  errBody: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalList: { flexGrow: 0 },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: { fontSize: 15, color: '#111827' },
  modalItemType: { fontSize: 11, color: '#9ca3af' },
});
