import { useState } from 'react';
import { useData } from '../context/DataContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKS_TO_SHOW = 16;

const getColor = (amount, max) => {
  if (!amount) return 'bg-bg-primary';
  const intensity = amount / max;
  if (intensity < 0.2) return 'bg-primary-blue/20';
  if (intensity < 0.4) return 'bg-primary-blue/40';
  if (intensity < 0.6) return 'bg-primary-blue/60';
  if (intensity < 0.8) return 'bg-primary-blue/80';
  return 'bg-primary-blue';
};

const SpendingHeatmap = () => {
  const { transactions } = useData();
  const [tooltip, setTooltip] = useState(null);

  // Sum spending per day
  const dailySpend = {};
  transactions.forEach(t => {
    if (t.amount > 0) {
      dailySpend[t.date] = (dailySpend[t.date] || 0) + t.amount;
    }
  });

  // Build grid: 7 rows (days) × WEEKS_TO_SHOW columns (weeks)
  const today = new Date();
  // Align to end of current week (Saturday)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - today.getDay()));

  const weeks = [];
  for (let w = WEEKS_TO_SHOW - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - w * 7 - (6 - d));
      const dateStr = date.toISOString().split('T')[0];
      const isFuture = date > today;
      week.push({ date: dateStr, amount: isFuture ? null : (dailySpend[dateStr] || 0), isFuture });
    }
    weeks.push(week);
  }

  const maxSpend = Math.max(...Object.values(dailySpend), 1);

  // Day-of-week averages for the summary row
  const dowTotals = Array(7).fill(0);
  const dowCounts = Array(7).fill(0);
  Object.entries(dailySpend).forEach(([date, amount]) => {
    const dow = new Date(date).getDay();
    dowTotals[dow] += amount;
    dowCounts[dow]++;
  });
  const dowAvg = dowTotals.map((t, i) => dowCounts[i] > 0 ? t / dowCounts[i] : 0);
  const maxAvg = Math.max(...dowAvg, 1);

  if (!transactions.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-4 shadow-sm flex items-center justify-center h-48 text-text-secondary text-sm">
        No spending data yet
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-text-primary">Spending Heatmap</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          <span>Less</span>
          {['bg-bg-primary', 'bg-primary-blue/20', 'bg-primary-blue/40', 'bg-primary-blue/60', 'bg-primary-blue/80', 'bg-primary-blue'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-border/30`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAYS.map(day => (
            <div key={day} className="h-4 flex items-center text-[10px] text-text-secondary w-6">{day}</div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-1 flex-1 overflow-hidden">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`h-4 rounded-sm cursor-pointer transition-opacity relative ${
                    cell.isFuture
                      ? 'bg-transparent'
                      : getColor(cell.amount, maxSpend)
                  }`}
                  onMouseEnter={(e) => {
                    if (!cell.isFuture) {
                      const rect = e.target.getBoundingClientRect();
                      setTooltip({ date: cell.date, amount: cell.amount, x: rect.left, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week average bar summary */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] text-text-secondary mb-2">Avg spend by day of week</p>
        <div className="flex gap-1">
          <div className="w-7" />
          {DAYS.map((day, i) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 32 }}>
                <div
                  className="w-full rounded-sm bg-primary-blue/60 transition-all"
                  style={{ height: `${(dowAvg[i] / maxAvg) * 32}px` }}
                />
              </div>
              <span className="text-[9px] text-text-secondary">{day.slice(0, 1)}</span>
              <span className="text-[9px] text-text-primary font-medium">
                ${dowAvg[i] >= 100 ? `${(dowAvg[i] / 1000).toFixed(1)}k` : dowAvg[i].toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 40 }}
        >
          <div className="text-text-secondary mb-0.5">
            {new Date(tooltip.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <div className="font-semibold text-text-primary">
            {tooltip.amount > 0 ? `$${tooltip.amount.toFixed(2)}` : 'No spending'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingHeatmap;
