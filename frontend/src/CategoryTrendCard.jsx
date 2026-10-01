import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useData } from './DataContext';
import { buildCategoryColorMap, colorForCategory } from './chartPalette';

const axisTick = { fill: '#898781', fontSize: 11 };
const dollarTick = (v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;
const legendStyle = { fontSize: 11, paddingTop: 8, color: 'var(--color-text-secondary, #6E7191)' };

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-bg-card border border-border p-3 rounded-lg shadow-md">
      <div className="text-xs text-text-secondary mb-2">{label}</div>
      {sorted.map((p) => (
        p.value > 0 && (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-text-secondary text-xs">{p.dataKey}</span>
            </div>
            <span className="text-text-primary text-xs font-medium">${p.value.toFixed(2)}</span>
          </div>
        )
      ))}
    </div>
  );
};

const CategoryTrendCard = () => {
  const { categoryMonthlyTrend, loading } = useData();
  const { data, categories } = categoryMonthlyTrend;
  const colorMap = buildCategoryColorMap(categories);

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-text-primary">Category Spend Trend</h3>
      </div>
      <div className="text-xs text-text-secondary mb-3">
        {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}, month by month
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">No spending data yet</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={dollarTick} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
              {categories.map((name) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colorForCategory(colorMap, name)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CategoryTrendCard;
