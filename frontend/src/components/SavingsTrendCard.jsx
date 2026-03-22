import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';

const SavingsTrendCard = () => {
  const { transactions } = useData();

  // Compute monthly savings (income - expenses) from transactions
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const savingsByMonth = {};

  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!savingsByMonth[key]) {
      savingsByMonth[key] = { month: monthNames[date.getMonth()], year: date.getFullYear(), amount: 0 };
    }
    savingsByMonth[key].amount += t.amount; // positive = income, negative = expense
  });

  const data = Object.values(savingsByMonth)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : monthNames.indexOf(a.month) - monthNames.indexOf(b.month))
    .map(m => ({ ...m, amount: Math.max(0, m.amount) }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="text-xs text-text-secondary mb-2">{label}</div>
          <span className="text-sm font-semibold text-text-primary">
            ${payload[0]?.value.toLocaleString()}
          </span>
        </div>
      );
    }
    return null;
  };

  const total = data[data.length - 1]?.amount || 0;

  if (!data.length) return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm flex items-center justify-center h-48 text-text-secondary text-sm">
      No savings data yet
    </div>
  );

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all self-start">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-text-primary">Savings Trend</h3>
      </div>
      <div className="h-[200px] mt-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#4CAF50"
              strokeWidth={3}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className="w-3 h-3 rounded-full bg-success" />
        <span className="text-sm text-text-secondary">
          Latest Month: ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default SavingsTrendCard;
