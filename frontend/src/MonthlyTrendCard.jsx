import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useData } from './DataContext';

const axisTick = { fill: '#898781', fontSize: 11 };
const dollarTick = (v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { total, cumulative } = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border p-2.5 rounded-lg shadow-md">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className="text-sm font-semibold text-text-primary">${cumulative.toFixed(2)} total so far</div>
      <div className="text-xs text-text-secondary">${total.toFixed(2)} that month</div>
    </div>
  );
};

const MonthlyTrendCard = () => {
  const { monthlyTrend, loading } = useData();
  const latest = monthlyTrend[monthlyTrend.length - 1];

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-text-primary">Aggregated Spend Over Time</h3>
      </div>
      <div className="text-xs text-text-secondary mb-3">
        {latest ? `$${latest.cumulative.toFixed(0)} spent so far across ${monthlyTrend.length} month${monthlyTrend.length === 1 ? '' : 's'}` : ''}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
      ) : monthlyTrend.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">No spending data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={dollarTick} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#5B6FED"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MonthlyTrendCard;
