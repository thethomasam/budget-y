import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

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
      {sparklineData && (
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

const KPICards = ({ data }) => {
  return (
    <>
      <KPICard
        title="Current Balance"
        value={`$${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={`${data.balanceChange}% from last month`}
        changeType="positive"
        icon="💰"
        color="#5B6FED"
      />
      <KPICard
        title="Monthly Spending"
        value={`$${data.monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={`${((data.monthlySpending / data.spendingBudget) * 100).toFixed(1)}% of budget`}
        changeType={data.monthlySpending < data.spendingBudget * 0.8 ? 'positive' : 'negative'}
        icon="💸"
        color="#FF6B9D"
      />
      <KPICard
        title="Total Saved"
        value={`$${data.ytdSavings.toLocaleString()}`}
        change="Year to date"
        changeType="positive"
        icon="💎"
        color="#4CAF50"
      />
    </>
  );
};

export default KPICards;
