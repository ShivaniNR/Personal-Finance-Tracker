import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic } from 'lucide-react';
import { parseTransactionAI } from '../services/ai'; // AI feature
import { getUserCategories } from '../services/categories';


export const QuickAddModal = ({ isOpen, onClose, onSubmit, editingTransaction }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const { data: userCategories = [] } = useQuery({
    queryKey: ['userCategories'],
    queryFn: getUserCategories,
    enabled: isOpen,
  });

  const isEditing = !!editingTransaction;

  // Today's local date in YYYY-MM-DD
  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  //populate form when editing
  useEffect(() => {
    if (editingTransaction){
      setAmount(editingTransaction.amount);
      setDescription(editingTransaction.description);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date || todayLocal());
    }
    else{
      setAmount('');
      setDescription('');
      setType('EXPENSE');
      setCategory('');
      setDate(todayLocal());
    }
  }, [editingTransaction, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && description) {

      const transactionData = {
        amount: parseFloat(amount),
        description,
        type,
        date,
        ...(category && { category })
      };

      // If editing, include the ID
      if (isEditing) {
        transactionData.id = editingTransaction.id;
      }

      onSubmit(transactionData);
      // Only reset form if adding new transaction
      if (!isEditing) {
        setAmount('');
        setDescription('');
        setCategory('');
        setDate(todayLocal());
      }
      onClose();
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      parseVoiceInput(transcript);
      setIsListening(false);
    };

    recognition.onspeechend = function () {
      recognition.stop();
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not recognize speech. Please try again.');
    };

    recognition.start();
  };

  // AI parsing — uncomment when ready
  const parseVoiceInput = async (transcript) => {
    setIsParsing(true);
    try {
      const parsed = await parseTransactionAI(transcript);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.type) setType(parsed.type);
      setCategory(parsed.category || '');
      setDescription(parsed.description || transcript);
      if (parsed.date) {
        setDate(parsed.date);
      }
    } catch (err) {
      console.error('Error parsing transaction:', err);
      toast.error('Could not parse transaction. Please try again or enter manually.');
    }
    setIsParsing(false);
  };
  // const parseVoiceInput = (transcript) => {
  //   setDescription(transcript);
  // };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Transaction': 'Add Transaction'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="transaction-type-toggle">
            <button
              type="button"
              className={`toggle-btn ${type === 'EXPENSE' ? 'active expense' : ''}`}
              onClick={() => setType('EXPENSE')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`toggle-btn ${type === 'INCOME' ? 'active income' : ''}`}
              onClick={() => setType('INCOME')}
            >
              Income
            </button>
          </div>
          
          <div className="form-group">
            <label>Amount</label>
            <div className="amount-input">
              <span className="currency">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <div className="description-input">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you spend on?"
                required
              />
              <button
                type="button"
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={startVoiceInput}
                disabled={isListening || isParsing}
              >
                <Mic size={16} />
              </button>
            </div>
            {isListening && <p className="voice-status">Listening... speak now!</p>}
            {isParsing && <p className="voice-status">Analyzing transaction...</p>}
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                color: '#1a202c',
                background: 'white',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                appearance: 'auto',
              }}
            >
              <option value="">Select a category</option>
              {userCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                color: '#1a202c',
                background: 'white',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEditing? 'Update Transaction': 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};