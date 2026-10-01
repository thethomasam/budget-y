import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useData } from './DataContext';
import { UNCATEGORIZED_LABEL } from './chartPalette';

const axisTick = { fill: '#898781', fontSize: 11 };
const dollarTick = (v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;

const DayTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border p-2.5 rounded-lg shadow-md">
      <div className="text-xs text-text-secondary mb-1">Day {label}</div>
      <div className="text-sm font-semibold text-text-primary">${payload[0].value.toFixed(2)}</div>
      <div className="text-[11px] text-text-secondary mt-1">Click to see transactions</div>
    </div>
  );
};

const DayDetailPanel = ({ day, transactions, monthLabel, onClose }) => (
  <div className="mt-3 border-t border-border pt-3">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-text-primary">
        Day {day} · {monthLabel}
      </h4>
      <button onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary">
        Close
      </button>
    </div>
    {transactions.length === 0 ? (
      <div className="text-sm text-text-secondary">No transactions this day</div>
    ) : (
      <div className="max-h-48 overflow-y-auto">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
            <div className="min-w-0">
              <div className="text-sm text-text-primary truncate">{t.merchant}</div>
              <div className="text-xs text-text-secondary">{t.category || UNCATEGORIZED_LABEL}</div>
            </div>
            <span className="text-sm font-medium text-text-primary shrink-0">${Math.abs(t.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DailySpendCard = () => {
  const { dailySpend, monthTotal, monthLabel, loading } = useData();
  const [selectedDay, setSelectedDay] = useState(null);
  const daysElapsed = dailySpend.length;
  const avgPerDay = daysElapsed > 0 ? monthTotal / daysElapsed : 0;
  const selectedEntry = dailySpend.find((d) => d.day === selectedDay);

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-text-primary">Daily Spend</h3>
        <span className="text-xs text-text-secondary">{monthLabel}</span>
      </div>
      <div className="text-xs text-text-secondary mb-3">
        ${avgPerDay.toFixed(0)}/day average over {daysElapsed} day{daysElapsed === 1 ? '' : 's'}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
      ) : dailySpend.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">No spending data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySpend} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={dollarTick} />
              <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar
                dataKey="amount"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(entry) => setSelectedDay(entry.day === selectedDay ? null : entry.day)}
              >
                {dailySpend.map((d) => (
                  <Cell key={d.day} fill={d.day === selectedDay ? '#4A5FDB' : '#5B6FED'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedEntry && (
        <DayDetailPanel
          day={selectedEntry.day}
          transactions={selectedEntry.transactions}
          monthLabel={monthLabel}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
};

export default DailySpendCard;
