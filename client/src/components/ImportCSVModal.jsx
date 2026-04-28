import React, { useCallback, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, AlertTriangle, CheckCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { SUPPORTED_BANKS, parseAndGetMapping, applyMappingAndParse, getMappingDisplayName } from '../utils/csvImport';
import { addTransaction } from '../services/transactions';
import { getUserCategories } from '../services/categories';

const bankOptions = SUPPORTED_BANKS.map((b) => ({ label: b.label, value: b.key }));

export const ImportCSVModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Stages: select-bank → upload → mapping → importing → done | error
  const [stage, setStage] = useState('select-bank');
  const [selectedBank, setSelectedBank] = useState(SUPPORTED_BANKS[0]?.key || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Mapping review state
  const [rawRows, setRawRows] = useState([]);
  const [categoryMapping, setCategoryMapping] = useState({});

  // Import progress state
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState({ succeeded: 0, failed: [] });
  const [isRetrying, setIsRetrying] = useState(false);

  // User categories for the mapping dropdowns
  const { data: userCategories = [] } = useQuery({
    queryKey: ['userCategories'],
    queryFn: getUserCategories,
    enabled: isOpen,
  });

  const resetState = useCallback(() => {
    setStage('select-bank');
    setSelectedBank(SUPPORTED_BANKS[0]?.key || '');
    setErrorMsg('');
    setIsDragging(false);
    setRawRows([]);
    setCategoryMapping({});
    setProgress({ current: 0, total: 0 });
    setResult({ succeeded: 0, failed: [] });
    setIsRetrying(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMsg('Please select a .csv file');
        setStage('error');
        return;
      }
      setErrorMsg('');
      try {
        const { rawRows: rows, defaultMapping } = await parseAndGetMapping(selectedBank, file);
        setRawRows(rows);
        setCategoryMapping(defaultMapping);
        setStage('mapping');
      } catch (err) {
        setErrorMsg(err.message);
        setStage('error');
      }
    },
    [selectedBank]
  );

  const handleImport = useCallback(
    async (transactions) => {
      setStage('importing');
      setProgress({ current: 0, total: transactions.length });
      let succeeded = 0;
      const failed = [];
      for (let i = 0; i < transactions.length; i++) {
        try {
          await addTransaction(transactions[i]);
          succeeded++;
        } catch (err) {
          failed.push({ ...transactions[i], error: err.message || 'Unknown error' });
        }
        setProgress({ current: i + 1, total: transactions.length });
      }
      setResult({ succeeded, failed });
      setStage('done');
      if (succeeded > 0) {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    },
    [queryClient]
  );

  const startImport = useCallback(() => {
    let transactions;
    try {
      transactions = applyMappingAndParse(selectedBank, rawRows, categoryMapping);
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
      return;
    }
    handleImport(transactions);
  }, [selectedBank, rawRows, categoryMapping, handleImport]);

  const retryFailed = useCallback(() => {
    const toRetry = result.failed.map((tx) => ({
      date: tx.date, amount: tx.amount, description: tx.description,
      type: tx.type, category: tx.category,
    }));
    setIsRetrying(true);
    setResult({ succeeded: result.succeeded, failed: [] });
    handleImport(toRetry).finally(() => setIsRetrying(false));
  }, [result, handleImport]);

  const updateMapping = (bankCat, appCat) => {
    setCategoryMapping((prev) => ({ ...prev, [bankCat]: appCat }));
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleFileInput = (e) => { const file = e.target.files?.[0]; if (file) handleFile(file); };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const mappingEntries = Object.entries(categoryMapping);
  const isWide = stage === 'mapping' || (stage === 'done' && result.failed.length > 0);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: isWide ? '680px' : '520px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2>Import CSV</h2>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        {/* --- SELECT BANK --- */}
        {stage === 'select-bank' && (
          <div>
            <div className="form-group">
              <label>Select your bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                style={{
                  width: '100%', padding: '16px', border: '2px solid #e2e8f0',
                  borderRadius: '12px', fontSize: '1rem', color: '#1a202c',
                  background: 'white', cursor: 'pointer',
                }}
              >
                <option value="">Choose bank...</option>
                {bankOptions.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleClose}>Cancel</button>
              <button className="submit-btn" disabled={!selectedBank} onClick={() => setStage('upload')}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- UPLOAD --- */}
        {stage === 'upload' && (
          <div>
            <div
              className={`import-drop-zone ${isDragging ? 'import-drop-zone--dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="import-drop-zone__icon">
                <Upload size={36} />
              </div>
              <h3 className="import-drop-zone__title">
                Drop your {SUPPORTED_BANKS.find((b) => b.key === selectedBank)?.label} CSV here
              </h3>
              <p className="import-drop-zone__subtitle">or click to browse</p>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} style={{ display: 'none' }} />
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button className="cancel-btn" onClick={() => setStage('select-bank')}>Back</button>
            </div>
          </div>
        )}

        {/* --- MAPPING REVIEW --- */}
        {stage === 'mapping' && (
          <div>
            <p style={{ color: '#4a5568', marginBottom: 4, fontSize: '0.95rem' }}>
              Found <strong>{rawRows.length}</strong> transactions with <strong>{mappingEntries.length}</strong> unique categories.
            </p>
            <p style={{ color: '#718096', fontSize: '0.88rem', marginBottom: 20 }}>
              Review and adjust the category mapping before importing.
            </p>

            <div className="import-mapping-card">
              <table className="import-mapping-table">
                <thead>
                  <tr>
                    <th>Bank Category</th>
                    <th>Your Category</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingEntries.map(([bankCat, appCat]) => (
                    <tr key={bankCat}>
                      <td>{getMappingDisplayName(selectedBank, bankCat)}</td>
                      <td>
                        <select
                          value={appCat}
                          onChange={(e) => updateMapping(bankCat, e.target.value)}
                          className="import-mapping-select"
                        >
                          <option value="">Select category</option>
                          {userCategories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="cancel-btn" onClick={() => setStage('upload')}>Back</button>
              <button className="submit-btn" onClick={startImport}>
                Import {rawRows.length} Transactions
              </button>
            </div>
          </div>
        )}

        {/* --- IMPORTING --- */}
        {stage === 'importing' && (
          <div className="import-center-stage">
            <div className="import-spinner" />
            <p className="import-center-stage__text">
              Importing... {progress.current} / {progress.total}
            </p>
            <div className="import-progress-bar">
              <div className="import-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* --- DONE --- */}
        {stage === 'done' && (
          <div>
            <div className="import-center-stage" style={{ paddingBottom: result.failed.length > 0 ? 15 : 30 }}>
              <CheckCircle size={52} style={{ color: '#10b981' }} />
              <h3 style={{ color: '#1a202c', marginTop: 12, fontSize: '1.3rem' }}>Import Complete</h3>
              <p style={{ color: '#4a5568', marginTop: 6 }}>
                Successfully imported <strong>{result.succeeded}</strong> transaction{result.succeeded !== 1 ? 's' : ''}.
              </p>
            </div>

            {result.failed.length > 0 && (
              <div className="import-failed-section">
                <p className="import-failed-section__title">
                  {result.failed.length} transaction{result.failed.length > 1 ? 's' : ''} failed
                </p>
                <div className="import-failed-scroll">
                  <table className="import-failed-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed.map((tx, i) => (
                        <tr key={i}>
                          <td>{tx.date}</td>
                          <td>{tx.description}</td>
                          <td>${tx.amount?.toFixed(2)}</td>
                          <td className="import-failed-table__error">{tx.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ textAlign: 'center', marginTop: 15 }}>
                  <button className="retry-btn" onClick={retryFailed} disabled={isRetrying}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={16} />
                    Retry Failed ({result.failed.length})
                  </button>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="submit-btn" onClick={handleClose}>Close</button>
            </div>
          </div>
        )}

        {/* --- ERROR --- */}
        {stage === 'error' && (
          <div className="import-center-stage">
            <AlertTriangle size={52} style={{ color: '#ef4444' }} />
            <h3 style={{ color: '#1a202c', marginTop: 12, fontSize: '1.3rem' }}>Something went wrong</h3>
            <p style={{ color: '#4a5568', marginTop: 6, maxWidth: 350, lineHeight: 1.5 }}>{errorMsg}</p>
            <div style={{ marginTop: 25 }}>
              <button className="cancel-btn" onClick={resetState}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
