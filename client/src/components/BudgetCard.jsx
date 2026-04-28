import { memo, useState } from 'react';
import { Wallet, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBudget } from '../services/dashboard';

const BudgetModal = ({ isOpen, onClose, currentBudget }) => {
  const [amount, setAmount] = useState(currentBudget || '');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (val) => updateBudget(val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Budget updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update budget');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    mutation.mutate(val);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Monthly Budget</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Monthly Spending Limit</label>
            <div className="amount-input">
              <span className="currency">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500.00"
                autoFocus
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BudgetCard = memo(({ monthlyBudget, monthlyExpenses }) => {
  const [showModal, setShowModal] = useState(false);

  const hasBudget = monthlyBudget != null && monthlyBudget > 0;
  const spent = monthlyExpenses || 0;
  const remaining = hasBudget ? monthlyBudget - spent : 0;
  const usedPct = hasBudget ? (spent / monthlyBudget) * 100 : 0;
  const isOver = usedPct > 100;

  return (
    <>
      <div className="budget-card">
        <div className="budget-card-header">
          <div className="budget-title-row">
            <div className={`insight-icon ${hasBudget ? 'budget-active' : 'budget-empty'}`}>
              <Wallet size={22} />
            </div>
            <h4>Monthly Budget</h4>
          </div>
          {hasBudget && (
            <button className="budget-edit-btn" onClick={() => setShowModal(true)} title="Edit budget">
              <Pencil size={14} />
            </button>
          )}
        </div>

        {hasBudget ? (
          <div className="budget-body">
            <div className="budget-amounts">
              <div className="budget-spent">
                <span className="budget-label">Spent</span>
                <span className={`budget-value ${isOver ? 'over' : ''}`}>
                  ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="budget-remaining">
                <span className="budget-label">{isOver ? 'Over by' : 'Remaining'}</span>
                <span className={`budget-value ${isOver ? 'over' : 'under'}`}>
                  ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="budget-limit">
                <span className="budget-label">Budget</span>
                <span className="budget-value">
                  ${monthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="budget-bar-track">
              <div
                className={`budget-bar-fill ${isOver ? 'over' : usedPct >= 80 ? 'warning' : 'safe'}`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <div className="budget-bar-labels">
              <span>{usedPct.toFixed(0)}% used</span>
              <span>${monthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>

            {isOver && (
              <div className="budget-warning">
                You've exceeded your budget by ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        ) : (
          <div className="budget-empty-state">
            <p>Set a monthly spending limit to track your expenses against a target.</p>
            <button className="budget-set-btn" onClick={() => setShowModal(true)}>
              Set Budget
            </button>
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentBudget={monthlyBudget}
      />
    </>
  );
});

BudgetCard.displayName = 'BudgetCard';
