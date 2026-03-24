import { HiOutlineDotsHorizontal } from 'react-icons/hi';

const BudgetProgressCard = ({ categories }) => {
  const getStatusColor = (percentage) => {
    if (percentage >= 90) return '#F44336';
    if (percentage >= 70) return '#FFC107';
    return '#4CAF50';
  };

  if (!categories?.length) return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm h-full flex items-center justify-center">
      <div className="text-text-secondary text-sm">No budget data yet</div>
    </div>
  );

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-text-primary">Budget vs Actual</h3>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all text-text-secondary hover:bg-bg-primary">
          <HiOutlineDotsHorizontal className="text-sm" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2.5 mt-2">
          {categories.slice(0, 4).map((category, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-xs font-medium text-text-primary">
                    {category.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-text-primary">
                    ${category.amount.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-text-secondary ml-0.5">
                    / ${category.budget}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-border rounded overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(category.percentage, 100)}%`,
                    backgroundColor: getStatusColor(category.percentage)
                  }}
                />
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                {category.percentage.toFixed(1)}% used
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressCard;
