import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { useData } from '../context/DataContext';

const RecentTransactionsCard = () => {
  const { recentTransactions: transactions, loading } = useData();

  if (transactions.length === 0) {
    return (
      <div className="bg-bg-card rounded-2xl p-3 shadow-sm h-full flex items-center justify-center">
        <div className="text-text-secondary">No spending data yet</div>
      </div>
    );
  }
  else if (loading || !transactions) {
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm h-full flex items-center justify-center">
      <div className="text-text-secondary">No spending data yet</div>
    </div>
  } 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-text-primary">Recent Transactions</h3>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all text-text-secondary hover:bg-bg-primary">
          <HiOutlineDotsHorizontal className="text-sm" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {transactions.slice(0, 4).map((transaction, index) => (
            <div
              key={transaction.id}
              className={`flex items-center justify-between py-2 cursor-pointer transition-colors hover:bg-bg-primary ${
                index < 3 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: (transaction.color || '#5B6FED') + '20' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-primary mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                    {transaction.merchant}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] text-text-secondary">
                      {transaction.category}
                    </span>
                    <span className="text-[8px] text-text-secondary">•</span>
                    <span className="text-[10px] text-text-secondary">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-xs font-semibold mb-0.5 text-primary-blue">
                  ${Math.abs(transaction.amount).toFixed(2)}
                </div>
                <div className="text-[9px] text-text-secondary">
                  {transaction.card}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <button className="bg-transparent border-none text-primary-blue text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg transition-colors hover:bg-bg-primary">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactionsCard;
