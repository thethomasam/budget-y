import { useState } from 'react';
import toast from 'react-hot-toast';
import { useData, monthLabelFor } from './DataContext';

const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(0)}`;

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

const SavingsCard = () => {
  const { recurring, deleteRecurring, monthlyIncome, monthlyFixed, savings, loading } = useData();
  const [open, setOpen] = useState(false);

  const { months, averageSaved } = savings;
  const hasIncome = monthlyIncome > 0;

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
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
          {[...months].reverse().map((m) => (
            <span key={m.key}>
              {monthLabelFor(m.key)}:{' '}
              <span className={m.saved < 0 ? 'text-danger font-medium' : 'text-text-primary font-medium'}>
                {money(m.saved)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsCard;
