const TransactionsView = ({ transactions }) => {
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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="p-5">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          Transactions
        </h2>
        <p className="text-sm text-text-secondary">
          Last 20 days of activity
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              {formatDate(date)}
            </div>
            <div className="bg-bg-card rounded-2xl p-0 shadow-sm">
              {groupedTransactions[date].map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-bg-primary ${
                    index < groupedTransactions[date].length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                      style={{ backgroundColor: transaction.color + '20' }}
                    >
                      {transaction.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-text-primary mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {transaction.merchant}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span
                          className="text-xs text-text-secondary px-2 py-0.5 rounded"
                          style={{ backgroundColor: transaction.color + '15' }}
                        >
                          {transaction.category}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          {transaction.card}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className={`text-base font-semibold ${
                      transaction.amount > 0 ? 'text-success' : 'text-text-primary'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsView;
