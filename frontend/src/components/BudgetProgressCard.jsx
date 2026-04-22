import { useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useData } from '../context/DataContext';

const getFortnightRange = (offset = 0) => {
  const now = new Date();
  const totalMonths = now.getFullYear() * 12 + now.getMonth();
  const currentHalf = now.getDate() <= 14 ? 0 : 1;
  const abs = totalMonths * 2 + currentHalf + offset;
  const targetMonth = Math.floor(abs / 2);
  const targetHalf = ((abs % 2) + 2) % 2;
  const targetYear = Math.floor(targetMonth / 12);
  const targetMonthIndex = ((targetMonth % 12) + 12) % 12;

  if (targetHalf === 0) {
    return {
      start: new Date(targetYear, targetMonthIndex, 1),
      end: new Date(targetYear, targetMonthIndex, 14, 23, 59, 59),
    };
  } else {
    return {
      start: new Date(targetYear, targetMonthIndex, 15),
      end: new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59),
    };
  }
};

const fmt = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

const getStatusColor = (percentage) => {
  if (percentage >= 90) return '#F44336';
  if (percentage >= 70) return '#FFC107';
  return '#4CAF50';
};

const BudgetProgressCard = () => {
  const { transactions, settings } = useData();
  const [offset, setOffset] = useState(0);

  const { start, end } = getFortnightRange(offset);

  const categories = (settings.budget_goals || []).map(goal => {
    const names = new Set([goal.name, ...(goal.aliases || [])]);
    const fortnightBudget = goal.budget / 2;
    const spent = transactions
      .filter(t => {
        const date = new Date(t.date);
        return names.has(t.category) && date >= start && date <= end;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const percentage = fortnightBudget > 0 ? (spent / fortnightBudget) * 100 : 0;
    return { name: goal.name, icon: goal.icon, budget: fortnightBudget, amount: spent, percentage };
  }).filter(cat => cat.amount > 0);

  if (!categories?.length) return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm h-full flex items-center justify-center">
      <div className="text-text-secondary text-sm">No budget data yet</div>
    </div>
  );

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-semibold text-text-primary">Budget vs Actual</h3>
      </div>

      {/* Fortnight toggle */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffset(o => o - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-all"
        >
          <HiChevronLeft className="text-sm" />
        </button>
        <span className="text-xs font-medium text-text-secondary">
          {fmt(start)} – {fmt(end)}
        </span>
        <button
          onClick={() => setOffset(o => o + 1)}
          disabled={offset >= 0}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiChevronRight className="text-sm" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2.5">
          {categories.map((category, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-xs font-medium text-text-primary">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-text-primary">
                    ${category.amount.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-text-secondary ml-0.5">
                    / ${category.budget.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-border rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(category.percentage, 100)}%`,
                    backgroundColor: getStatusColor(category.percentage),
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
