import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useData } from '../context/DataContext';

const COLORS = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="bg-bg-card border border-bg-primary rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        p.value > 0 && (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
              <span className="text-text-secondary">{p.dataKey}</span>
            </div>
            <span className="text-text-primary font-medium">${p.value.toFixed(0)}</span>
          </div>
        )
      ))}
      <div className="border-t border-bg-primary mt-2 pt-2 flex justify-between">
        <span className="text-text-secondary">Total</span>
        <span className="text-text-primary font-semibold">${total.toFixed(0)}</span>
      </div>
    </div>
  );
};

const RANGE_OPTIONS = [3, 6, 12];

const CategoryMonthlySpendCard = () => {
  const { monthlyCategorySpend, loading } = useData();
  const { months = [], categories = [] } = monthlyCategorySpend;
  const [visibleMonths, setVisibleMonths] = useState(6);

  if (loading || !categories.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-3 shadow-sm h-full flex items-center justify-center">
        <div className="text-text-secondary text-sm">No spending data yet</div>
      </div>
    );
  }

  const slicedMonths = months.slice(-visibleMonths);

  // Recharts wants data as array of { month, Cat1: val, Cat2: val, ... }
  const chartData = slicedMonths.map((month, i) => {
    const globalIdx = months.length - slicedMonths.length + i;
    const entry = { month };
    categories.forEach((cat) => {
      entry[cat.name] = cat.monthly[globalIdx] || 0;
    });
    return entry;
  });

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Monthly Spend by Merchant</h3>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setVisibleMonths(n)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${visibleMonths === n ? 'bg-primary-blue text-white' : 'text-text-secondary hover:bg-bg-primary'}`}
            >
              {n}M
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            {categories.map((cat, i) => (
              <Bar
                key={cat.name}
                dataKey={cat.name}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryMonthlySpendCard;
