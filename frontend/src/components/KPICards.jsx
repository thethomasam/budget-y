import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useData } from '../context/DataContext';

const KPICard = ({ title, value, change, changeType, sparklineData, icon, color = '#5B6FED' }) => {
  const isPositive = changeType === 'positive';
  const TrendIcon = isPositive ? FiTrendingUp : FiTrendingDown;

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all self-start flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="text-xl p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: color + '15' }}
        >
          {icon}
        </div>
        <p className="text-xs text-text-secondary font-medium">{title}</p>
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-1.5">
        {value}
      </h2>
      {change && (
        <div className="flex items-center gap-1">
          <TrendIcon
            className={`text-xs ${isPositive ? 'text-success' : 'text-danger'}`}
          />
          <span
            className={`text-[11px] font-medium ${isPositive ? 'text-success' : 'text-danger'}`}
          >
            {change}
          </span>
        </div>
      )}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-10 mt-1.5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const KPICards = () => {
  const { transactions, currentMonthExpense, monthlyExpenses, settings } = useData();

  const monthlyBudget = settings.monthly_budget || 3000;
  const remaining = monthlyBudget - currentMonthExpense;
  const budgetUsedPct = monthlyBudget > 0 ? ((currentMonthExpense / monthlyBudget) * 100).toFixed(1) : 0;

  const avgMonthly = monthlyExpenses.length
    ? monthlyExpenses.reduce((sum, m) => sum + m.amount, 0) / monthlyExpenses.length
    : 0;
  const lastMonth = monthlyExpenses[monthlyExpenses.length - 2]?.amount || 0;
  const avgDiff = avgMonthly > 0 ? (((currentMonthExpense - avgMonthly) / avgMonthly) * 100).toFixed(1) : 0;

  return (
    <>
      <KPICard
        title="Monthly Balance"
        value={`$${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={remaining >= 0 ? `${budgetUsedPct}% of $${monthlyBudget.toLocaleString()} used` : `$${Math.abs(remaining).toFixed(2)} over budget`}
        changeType={remaining >= 0 ? 'positive' : 'negative'}
        icon="💰"
        color="#5B6FED"
      />
      <KPICard
        title="Monthly Spending"
        value={`$${currentMonthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={`${budgetUsedPct}% of monthly budget`}
        changeType={budgetUsedPct < 80 ? 'positive' : 'negative'}
        icon="💸"
        color="#FF6B9D"
      />
      <KPICard
        title="Avg Monthly Spend"
        value={`$${avgMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={avgDiff > 0 ? `${avgDiff}% above average this month` : `${Math.abs(avgDiff)}% below average this month`}
        changeType={avgDiff > 0 ? 'negative' : 'positive'}
        icon="📊"
        color="#FFC542"
      />
    </>
  );
};

export default KPICards;
