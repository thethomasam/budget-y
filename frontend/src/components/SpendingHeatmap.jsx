import { useState } from 'react';
import { useData } from '../context/DataContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKS_TO_SHOW = 20;

// Explicit colour stops — much sharper than opacity classes
const COLORS = ['#1e1e2e', '#1e3a5f', '#1a5fb4', '#1c71d8', '#3584e4', '#62a0ea', '#99c1f1'];

const getColor = (amount, max) => {
  if (!amount) return '#1e1e2e';
  const intensity = Math.log1p(amount) / Math.log1p(max); // log scale for better contrast
  const idx = Math.min(Math.floor(intensity * (COLORS.length - 1)) + 1, COLORS.length - 1);
  return COLORS[idx];
};

const SpendingHeatmap = () => {
  const { transactions } = useData();
  const [tooltip, setTooltip] = useState(null);

  const dailySpend = {};
  transactions.forEach(t => {
    if (t.amount > 0) dailySpend[t.date] = (dailySpend[t.date] || 0) + t.amount;
  });

  const today = new Date();
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

  // Month labels — show when month changes across weeks
  const monthLabels = weeks.map((week, wi) => {
    const firstDay = new Date(week[0].date);
    const prevWeekFirst = wi > 0 ? new Date(weeks[wi - 1][0].date) : null;
    if (!prevWeekFirst || firstDay.getMonth() !== prevWeekFirst.getMonth()) {
      return firstDay.toLocaleDateString('en-AU', { month: 'short' });
    }
    return '';
  });

  // Day-of-week averages
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
          {COLORS.map((c, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: c, border: '1px solid rgba(255,255,255,0.08)' }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {weeks.map((_, wi) => (
          <div key={wi} className="flex-1 text-[9px] text-text-secondary font-medium">
            {monthLabels[wi]}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1.5">
          {DAYS.map(day => (
            <div key={day} className="h-5 flex items-center text-[10px] text-text-secondary w-6">{day}</div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-0.5 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5 flex-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className="h-5 rounded cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: cell.isFuture ? 'transparent' : getColor(cell.amount, maxSpend),
                    border: cell.isFuture ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    if (!cell.isFuture) {
                      const rect = e.currentTarget.getBoundingClientRect();
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

      {/* Day-of-week average bars */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[10px] text-text-secondary mb-2">Average spend by day</p>
        <div className="flex gap-0.5 ml-8">
          {DAYS.map((day, i) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 36 }}>
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${Math.max((dowAvg[i] / maxAvg) * 36, dowAvg[i] > 0 ? 3 : 0)}px`,
                    backgroundColor: COLORS[Math.min(Math.floor((dowAvg[i] / maxAvg) * (COLORS.length - 1)) + 1, COLORS.length - 1)],
                  }}
                />
              </div>
              <span className="text-[9px] text-text-secondary">{day[0]}</span>
              <span className="text-[9px] text-text-primary font-medium">
                ${dowAvg[i] >= 1000 ? `${(dowAvg[i] / 1000).toFixed(1)}k` : dowAvg[i].toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 48 }}
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
