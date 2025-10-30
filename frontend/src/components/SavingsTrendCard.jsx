import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SavingsTrendCard = ({ monthlySavings, previousYearSavings }) => {
  // Combine current and previous year data
  const combinedData = monthlySavings.map((item, index) => ({
    month: item.month,
    thisYear: item.amount,
    lastYear: previousYearSavings[index]?.amount || 0
  }));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="text-xs text-text-secondary mb-2">
            {monthNames[label - 1]}
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-text-secondary">
                {entry.name === 'thisYear' ? 'This Year' : 'Last Year'}:
              </span>
              <span className="text-sm font-semibold text-text-primary">
                ${entry.value.toLocaleString()}
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
        <h3 className="text-lg font-semibold text-text-primary">Savings Trend</h3>
        <select className="bg-bg-primary text-text-secondary px-3 py-2 rounded-lg cursor-pointer text-sm font-medium outline-none border border-border">
          <option>This Year</option>
          <option>Last 12 Months</option>
          <option>All Time</option>
        </select>
      </div>
      <div>
        <div className="h-[200px] mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="thisYearSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lastYearSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#81C784" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#81C784" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7F8C8D', fontSize: 12 }}
                tickFormatter={(value) => monthNames[value - 1]}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7F8C8D', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="lastYear"
                stroke="#81C784"
                strokeWidth={2}
                fill="url(#lastYearSavingsGradient)"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="thisYear"
                stroke="#4CAF50"
                strokeWidth={3}
                fill="url(#thisYearSavingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-text-secondary">
                This Year: ${monthlySavings[monthlySavings.length - 1]?.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: '#81C784' }} />
              <span className="text-sm text-text-secondary">
                Last Year: ${previousYearSavings[previousYearSavings.length - 1]?.amount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsTrendCard;
