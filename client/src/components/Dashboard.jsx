import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Header } from './Header';
import { TimeRangeFilter } from './TimeRangeFilter';
import { InsightCards } from './InsightCards';
import { BudgetCard } from './BudgetCard';
import { ChartsSection } from './ChartsSection';
import { RecentTransactions } from './recentTrasactions';
import { QuickAddModal } from './QuickModal';
import { PlusCircle } from 'lucide-react';
import { useQuickModal } from '../hooks/useQuickModal';
import { addTransaction } from '../services/transactions';

export const Dashboard = ({ dashboardData, timeRange, onTimeRangeChange, onNavigate }) => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (transactionData) => addTransaction(transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction added successfully');
    },
  });

  const handleAddTransaction = async (transactionData) => {
    try {
      await addMutation.mutateAsync(transactionData);
    } catch (err) {
      toast.error('Failed to add transaction. Please try again.');
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
  } = useQuickModal(handleAddTransaction);

  if (!dashboardData) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-top-bar">
        <h1>Track, Save, and Grow Your Wealth</h1>
        <TimeRangeFilter value={timeRange} onChange={onTimeRangeChange} />
      </div>

      <Header
        totalBalance={dashboardData.totalBalance}
        monthlyIncome={dashboardData.monthlyIncome}
        monthlyExpenses={dashboardData.monthlyExpenses}
        timeRange={timeRange}
      />

      <InsightCards
        monthlyIncome={dashboardData.monthlyIncome}
        monthlyExpenses={dashboardData.monthlyExpenses}
        categorySummary={dashboardData.categorySummary}
      />

      <BudgetCard
        monthlyBudget={dashboardData.monthlyBudget}
        monthlyExpenses={dashboardData.monthlyExpenses}
      />

      <ChartsSection
        categorySummary={dashboardData.categorySummary}
        monthlyStats={dashboardData.monthlyStats}
      />

      <RecentTransactions
        transactions={dashboardData.recentTransactions}
        onSeeAll={() => onNavigate('transactions')}
      />

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => openModal()}
        title="Add Transaction"
      >
        <PlusCircle size={24} />
      </button>

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
