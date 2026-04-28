import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { TIME_RANGES } from '../utils/dateRanges';

const getRangeLabel = (timeRange) => {
  const match = TIME_RANGES.find((r) => r.value === timeRange);
  return match ? match.label : 'This Month';
};

export const Header = ({ totalBalance, monthlyIncome, monthlyExpenses, timeRange }) => {
  const label = getRangeLabel(timeRange);

  return (
    <div className="header">
      <div className="balance-cards">
        <div className="balance-card main-balance">
          <div className="card-icon">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <h3>Total Balance</h3>
            <div className={`balance-amount ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
              {totalBalance < 0 ? '-' : ''}${Math.abs(totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="balance-card income-card">
          <div className="card-icon income">
            <TrendingUp size={20} />
          </div>
          <div className="card-content">
            <h4>{label} Income</h4>
            <div className="amount">+${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="balance-card expense-card">
          <div className="card-icon expense">
            <TrendingDown size={20} />
          </div>
          <div className="card-content">
            <h4>{label} Expenses</h4>
            <div className="amount">-${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
};