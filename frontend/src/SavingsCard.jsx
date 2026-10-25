import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { useData, monthLabelFor } from './DataContext';

const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(0)}`;

const axisTick = { fill: '#898781', fontSize: 11 };
const dollarTick = (v) => `${v < 0 ? '-' : ''}$${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1)}k` : Math.abs(v)}`;

const SavingsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { saved, spent, fixed, income, projected, isProjection } = payload[0].payload;
  if (isProjection) {
    return (
      <div className="bg-bg-card border border-border p-2.5 rounded-lg shadow-md">
        <div className="text-xs text-text-secondary mb-1">{label} (projected)</div>
        <div className={`text-sm font-semibold ${projected < 0 ? 'text-danger' : 'text-text-primary'}`}>
          {money(projected)} projected
        </div>
      </div>
    );
  }
  return (
    <div className="bg-bg-card border border-border p-2.5 rounded-lg shadow-md">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className={`text-sm font-semibold ${saved < 0 ? 'text-danger' : 'text-text-primary'}`}>
        {money(saved)} saved
      </div>
      <div className="text-xs text-text-secondary">
        {money(income)} income − {money(fixed)} fixed − {money(spent)} card spend
      </div>
    </div>
  );
};

const FREQ_LABEL = { weekly: 'week', fortnightly: 'fortnight', monthly: 'month' };

const AddRecurringForm = () => {
  const { addRecurring } = useData();
  const [kind, setKind] = useState('income');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('fortnightly');

  const inputClass = 'px-2 py-1 rounded border border-border bg-bg-primary text-text-primary text-xs';

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || Number.isNaN(value) || value <= 0) return;
    try {
      await addRecurring({ name: name.trim(), amount: value, frequency, kind });
      setName('');
      setAmount('');
    } catch (err) {
      console.error('Error adding recurring item:', err);
      toast.error('Failed to save');
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 mt-3">
      <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        type="text"
        placeholder={kind === 'income' ? 'e.g. Salary' : 'e.g. Rent'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`${inputClass} flex-1 min-w-[120px]`}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`${inputClass} w-24`}
      />
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
        <option value="weekly">Weekly</option>
        <option value="fortnightly">Fortnightly</option>
        <option value="monthly">Monthly</option>
      </select>
      <button
        type="submit"
        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors"
      >
        Add
      </button>
    </form>
  );
};

// Where zero falls (0 = top, 1 = bottom) within a vertical span, for a
// gradient that is green above zero and red below it.
const zeroOffset = (hi, lo) => (hi <= 0 ? 0 : lo >= 0 ? 1 : hi / (hi - lo));

const SavingsCard = () => {
  const { recurring, deleteRecurring, monthlyIncome, monthlyFixed, savings, projection, loading } = useData();
  const [open, setOpen] = useState(false);

  const { months, averageSaved } = savings;
  const hasIncome = monthlyIncome > 0;
  const values = [...months.map((m) => m.saved), ...projection.months.map((m) => m.projected)];
  const dMax = Math.max(...values);
  const dMin = Math.min(...values);
  // The area spans data and zero; the line spans the data only.
  const areaZero = zeroOffset(Math.max(dMax, 0), Math.min(dMin, 0));
  // Chart rows: real months, then the projected months. The last real month
  // also carries `projected` so the dotted line starts there.
  const chartData = months.map((m) => ({
    ...m, month: monthLabelFor(m.key), income: monthlyIncome, fixed: monthlyFixed,
  }));
  if (chartData.length) {
    chartData[chartData.length - 1].projected = chartData[chartData.length - 1].saved;
    projection.months.forEach((m) => {
      chartData.push({ month: monthLabelFor(m.key), projected: m.projected, isProjection: true });
    });
  }
  const lineZero = dMax === dMin ? (dMax < 0 ? 0 : 1) : zeroOffset(dMax, dMin);

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all mb-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Savings</h3>
          <div className="text-xs text-text-secondary mt-1">
            {hasIncome
              ? `${money(monthlyIncome)} income − ${money(monthlyFixed)} fixed costs per month, minus card spend`
              : 'Add your income and fixed costs (rent...) to see savings'}
          </div>
          {hasIncome && months.length > 0 && (
            <div className="text-xs text-text-secondary mt-1">
              Projected {projection.months[0] ? monthLabelFor(projection.months[0].key) : 'next month'}: <span className="font-semibold text-text-primary">{money(projection.projectedSavings)}</span>
              {` = ${money(projection.lastMonthSavings)} last month + ${money(monthlyIncome)} income − ${money(monthlyFixed)} fixed − ${money(projection.months[0]?.spend ?? 0)} ${projection.months[0]?.followsCurrentSpend ? 'spent so far this month' : 'category limits'}`}
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-1 text-xs text-text-secondary hover:text-primary-blue underline decoration-dotted"
          >
            {open ? 'Hide income & fixed costs' : 'Edit income & fixed costs'}
          </button>
        </div>

        {hasIncome && months.length > 0 && (
          <div className="text-right">
            <div className={`text-2xl font-semibold ${averageSaved < 0 ? 'text-danger' : 'text-text-primary'}`}>
              {money(averageSaved)}
            </div>
            <div className="text-xs text-text-secondary">
              average saved per month · {months.length} month{months.length === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          {recurring.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-1 text-sm">
              <span className="text-text-primary">
                {r.name}{' '}
                <span className="text-xs text-text-secondary">({r.kind})</span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <span className={r.kind === 'income' ? 'text-text-primary' : 'text-text-secondary'}>
                  {r.kind === 'income' ? '+' : '−'}${r.amount.toFixed(2)} / {FREQ_LABEL[r.frequency]}
                </span>
                <button
                  onClick={() => window.confirm(`Remove "${r.name}"?`) && deleteRecurring(r.id)}
                  className="text-xs text-text-secondary hover:text-danger"
                >
                  Remove
                </button>
              </span>
            </div>
          ))}
          <AddRecurringForm />
        </div>
      )}

      {!loading && hasIncome && months.length > 0 && (
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
            >
              <defs>
                <linearGradient id="savedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={areaZero} stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset={areaZero} stopColor="#FF5252" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="savedStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={lineZero} stopColor="#4CAF50" />
                  <stop offset={lineZero} stopColor="#FF5252" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={dollarTick} domain={[(min) => Math.min(0, min), (max) => Math.max(0, max)]} />
              <Tooltip content={<SavingsTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="#c3c2b7" />
              <ReferenceLine
                y={averageSaved}
                stroke="#5B6FED"
                strokeDasharray="4 4"
                label={{ value: `avg ${money(averageSaved)}`, position: 'insideTopRight', fill: '#5B6FED', fontSize: 11 }}
              />
              <Area type="monotone" dataKey="saved" baseValue={0} stroke="none" fill="url(#savedFill)" activeDot={false} />
              <Line
                type="monotone"
                dataKey="saved"
                stroke="url(#savedStroke)"
                strokeWidth={2}
                dot={({ key, cx, cy, payload }) => (
                  <circle key={key} cx={cx} cy={cy} r={3.5} fill={payload.saved < 0 ? '#FF5252' : '#4CAF50'} />
                )}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#5B6FED"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={({ key, cx, cy, payload }) => (payload.isProjection
                  ? <circle key={key} cx={cx} cy={cy} r={3.5} fill="#fff" stroke="#5B6FED" strokeWidth={2} />
                  : <g key={key} />)}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SavingsCard;
