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

const getPacePercent = (start, end) => {
  const now = new Date();
  if (now < start) return 0;
  if (now > end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return (elapsed / total) * 100;
};

const fmt = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

const getStatusColor = (percentage, pace) => {
  if (percentage > pace + 20) return '#F44336';
  if (percentage > pace + 5) return '#FFC107';
  return '#4CAF50';
};

const BudgetProgressCard = () => {
  const { transactions, monthlyBudget } = useData();
  const [offset, setOffset] = useState(0);

  const { start, end } = getFortnightRange(offset);
  const pace = getPacePercent(start, end);
  const isCurrentPeriod = offset === 0;

  const fortnightBudget = monthlyBudget / 2;
  const spent = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const percentage = fortnightBudget > 0 ? (spent / fortnightBudget) * 100 : 0;

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-base font-semibold text-text-primary">Budget vs Actual</h3>
      </div>

      {/* Fortnight toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOffset(o => o - 1)}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-all"
        >
          <HiChevronLeft className="text-sm" />
        </button>
        <div className="text-center">
          <span className="text-xs font-medium text-text-secondary">
            {fmt(start)} – {fmt(end)}
          </span>
          {isCurrentPeriod && (
            <div className="text-[10px] text-text-secondary mt-0.5">
              {pace.toFixed(0)}% of period elapsed
            </div>
          )}
        </div>
        <button
          onClick={() => setOffset(o => o + 1)}
          disabled={offset >= 0}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiChevronRight className="text-sm" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2.5">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">💰</span>
            <span className="text-xs font-medium text-text-primary">Overall spend</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-text-primary">
              ${spent.toFixed(0)}
            </span>
            <span className="text-[10px] text-text-secondary ml-0.5">
              / ${fortnightBudget.toFixed(0)}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-border rounded overflow-hidden relative">
          <div
            className="h-full rounded transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getStatusColor(percentage, isCurrentPeriod ? pace : 100),
            }}
          />
          {/* Pace marker — where you should be today */}
          {isCurrentPeriod && pace > 0 && pace < 100 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white opacity-80"
              style={{ left: `${pace}%` }}
            />
          )}
        </div>
        <div className="text-[10px] text-text-secondary mt-0.5">
          {percentage.toFixed(0)}% used
          {isCurrentPeriod && percentage > pace + 5 && (
            <span className="ml-1 text-orange-400 font-medium">
              · ${((percentage - pace) / 100 * fortnightBudget).toFixed(0)} ahead of pace
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressCard;
