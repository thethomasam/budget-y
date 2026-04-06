import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';

const SavingsTrendCard = () => {
  const { monthlySavings } = useData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0]?.value;
      return (
        <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
          <div className="text-xs text-text-secondary mb-2">{label}</div>
          <span className={`text-sm font-semibold ${val >= 0 ? 'text-success' : 'text-danger'}`}>
            {val >= 0 ? '+' : ''}${val.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
          </span>
        </div>
      );
    }
    return null;
  };

  const total = monthlySavings[monthlySavings.length - 1]?.amount ?? 0;

  if (!monthlySavings.length) return (
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
          <AreaChart data={monthlySavings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7F8C8D', fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7F8C8D', fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#4CAF50" strokeWidth={3} fill="url(#savingsGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className={`w-3 h-3 rounded-full ${total >= 0 ? 'bg-success' : 'bg-danger'}`} />
        <span className="text-sm text-text-secondary">
          Latest Month:{' '}
          <span className={total >= 0 ? 'text-success font-medium' : 'text-danger font-medium'}>
            {total >= 0 ? '+' : ''}${total.toLocaleString('en-AU', { minimumFractionDigits: 0 })}
          </span>
        </span>
      </div>
    </div>
  );
};

export default SavingsTrendCard;
