import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';

const SpendingTrendCard = () => {
  const { monthlyExpenses } = useData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="text-xs text-text-secondary mb-2">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-semibold text-text-primary">
                ${entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const total = monthlyExpenses[monthlyExpenses.length - 1]?.amount || 0;

  if (!monthlyExpenses.length) return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm flex items-center justify-center h-48 text-text-secondary text-sm">
      No spending data yet
    </div>
  );

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all self-start">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-text-primary">Spending Trend</h3>
      </div>
      <div className="h-[200px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyExpenses} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B6FED" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#5B6FED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#5B6FED"
              strokeWidth={3}
              fill="url(#spendingGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className="w-3 h-3 rounded-full bg-primary-blue" />
        <span className="text-sm text-text-secondary">
          Latest Month: ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default SpendingTrendCard;
