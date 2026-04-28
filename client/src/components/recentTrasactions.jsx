import{ TrendingDown, TrendingUp } from 'lucide-react';

export const RecentTransactions = ({ transactions, onSeeAll }) => (
  <div className="recent-transactions">
    <div className="section-header">
      <h3>Recent Transactions</h3>
      <button className="see-all-btn" onClick={onSeeAll}>See All</button>
    </div>
    
    <div className="transactions-list">
      {transactions.map(transaction => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-icon">
            <div className={`icon-circle ${transaction.type.toLowerCase()}`}>
              {transaction.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          
          <div className="transaction-details">
            <div className="transaction-description">{transaction.description}</div>
            <div className="transaction-meta">
              <span className="category">{transaction.category}</span>
              <span className="date">{new Date(transaction.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className={`transaction-amount ${transaction.type.toLowerCase()}`}>
            {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  </div>
);