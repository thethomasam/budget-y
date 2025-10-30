import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SpendingTrendCard = ({ dailySpending, previousMonthSpending }) => {
  // Combine current and previous month data
  const combinedData = dailySpending.map((item, index) => ({
    date: item.date,
    thisMonth: item.amount,
    lastMonth: previousMonthSpending[index]?.amount || 0
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="text-xs text-text-secondary mb-2">
            Day {label}
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-text-secondary">
                {entry.name === 'thisMonth' ? 'This Month' : 'Last Month'}:
              </span>
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

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all self-start">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-text-primary">Spending Trend</h3>
        <select className="bg-bg-primary text-text-secondary px-3 py-2 rounded-lg cursor-pointer text-sm font-medium outline-none border border-border">
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>This Year</option>
        </select>
      </div>
      <div>
        <div className="h-[200px] mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="thisMonthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B6FED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5B6FED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lastMonthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B9D" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#FF6B9D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7F8C8D', fontSize: 12 }}
                interval={4}
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
                dataKey="lastMonth"
                stroke="#FF6B9D"
                strokeWidth={2}
                fill="url(#lastMonthGradient)"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="thisMonth"
                stroke="#5B6FED"
                strokeWidth={3}
                fill="url(#thisMonthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-blue" />
              <span className="text-sm text-text-secondary">
                This Month: ${dailySpending[dailySpending.length - 1]?.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-accent-pink" />
              <span className="text-sm text-text-secondary">
                Last Month: ${previousMonthSpending[previousMonthSpending.length - 1]?.amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingTrendCard;
