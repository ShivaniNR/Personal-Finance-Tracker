import { useState } from 'react';
import { Search, Filter, ArrowUpDown, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getTransactions, updateTransaction, deleteTransaction } from '../services/transactions';
import { getUserCategories } from '../services/categories';
import './TransactionsList.css';
import { useQuickModal } from '../hooks/useQuickModal';
import { QuickAddModal } from './QuickModal';

const PAGE_SIZE = 20;

export const TransactionsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  // Fetch all transactions
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions({ limit: 200 }),
  });

  // Fetch user categories for the filter dropdown
  const { data: userCategories = [] } = useQuery({
    queryKey: ['userCategories'],
    queryFn: getUserCategories,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => updateTransaction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction updated successfully');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction deleted');
    },
  });

  const handleUpdateTransaction = async (transactionData) => {
    try {
      await updateMutation.mutateAsync(transactionData);
    } catch (err) {
      toast.error('Failed to update transaction. Please try again.');
    }
  };

  const {
    isOpen,
    openModal,
    closeModal,
    editingTransaction,
    isVoiceMode,
    setIsVoiceMode,
    onSubmitHandler,
  } = useQuickModal(handleUpdateTransaction);

  if (isLoading) return <div className="loading-spinner"></div>;
  if (error)
    return <div className="error-message">Error loading transactions</div>;

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === 'all' || transaction.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when filters change
  const handleSearch = (val) => { setSearchTerm(val); setCurrentPage(1); };
  const handleCategoryFilter = (val) => { setFilterCategory(val); setCurrentPage(1); };
  const handleSort = (val) => {
    const [field, order] = val.split('-');
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const categories = userCategories.map((c) => c.name);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        toast.error('Failed to delete transaction');
      }
    }
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>All Transactions</h1>
        <p>Manage and view all your financial transactions</p>
      </div>

      {/* Filters and Search */}
      <div className="transactions-controls">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="sort-group">
            <ArrowUpDown size={16} />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="transactions-grid">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
            <button className="add-first-btn" onClick={() => openModal()}>
              Add Your First Transaction
            </button>
          </div>
        ) : (
          paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-main">
                <div className="transaction-info">
                  <h3>{transaction.description}</h3>
                  <div className="transaction-meta">
                    <span className="category-tag">
                      {transaction.category}
                    </span>
                    <span className="date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="transaction-amount-section">
                  <div
                    className={`amount ${transaction.type.toLowerCase()}`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}$
                    {transaction.amount.toLocaleString()}
                  </div>
                  <div className="transaction-actions">
                    <button
                      className="edit-btn"
                      title="Edit"
                      onClick={() => openModal(transaction)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="transactions-summary">
        <div className="summary-item">
          <span className="label">Total Transactions</span>
          <span className="value">{filteredTransactions.length}</span>
        </div>
        <div className="summary-item">
          <span className="label">Total Income</span>
          <span className="value income">
            +$
            {filteredTransactions
              .filter((t) => t.type === 'INCOME')
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">Total Expenses</span>
          <span className="value expense">
            -$
            {filteredTransactions
              .filter((t) => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </span>
        </div>
      </div>

      <QuickAddModal
        isOpen={isOpen}
        onClose={closeModal}
        onSubmit={onSubmitHandler}
        isVoiceMode={isVoiceMode}
        setIsVoiceMode={setIsVoiceMode}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};
