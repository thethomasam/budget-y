import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useData, monthKey, monthLabelFor } from './DataContext';
import { UNCATEGORIZED_LABEL } from './chartPalette';

const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const CsvUploadButton = () => {
  const { ingestTransactionsCsv } = useData();
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      // Progress and the final result/error are shown via the global toast
      // (see DataContext.ingestTransactionsCsv), so they stay visible even
      // if the user switches tabs mid-upload.
      await ingestTransactionsCsv(file);
    } catch {
      // Already surfaced via toast.
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </button>
      <input ref={fileInput} type="file" accept=".csv" onChange={handleFile} hidden />
    </div>
  );
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AddTransactionForm = ({ onClose }) => {
  const { categories, addTransaction } = useData();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState('');
  const [card, setCard] = useState('');
  const [saving, setSaving] = useState(false);

  const inputClass = 'px-3 py-1.5 rounded-lg text-sm bg-bg-primary border border-border text-text-primary';

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!merchant.trim() || Number.isNaN(value) || value <= 0) return;

    setSaving(true);
    try {
      await addTransaction({
        merchant: merchant.trim(),
        amount: value,
        date,
        card: card.trim(),
        category: category || null,
      });
      toast.success('Transaction added');
      onClose();
    } catch (err) {
      console.error('Error adding transaction:', err);
      toast.error('Failed to add transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-bg-card rounded-2xl shadow-sm p-4 mb-3 flex flex-wrap items-end gap-2">
      <input
        autoFocus
        type="text"
        placeholder="Merchant"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        className={`${inputClass} flex-1 min-w-[160px]`}
      />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`${inputClass} w-28`}
      />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value || todayStr())} className={inputClass} />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
        <option value="">Auto-categorize</option>
        {categories.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="Card (last 4)"
        value={card}
        onChange={(e) => setCard(e.target.value.replace(/\D/g, ''))}
        className={`${inputClass} w-28`}
      />
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button type="button" onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary py-2">
        Cancel
      </button>
    </form>
  );
};

const TransactionsView = () => {
  const { transactions, categories, loading, availableMonths, updateTransactionCategory, deleteTransaction } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...transactions]
      .filter((t) => {
        const name = t.category || UNCATEGORIZED_LABEL;
        if (categoryFilter !== 'all' && name !== categoryFilter) return false;
        if (monthFilter !== 'all' && monthKey(t.date) !== monthFilter) return false;
        if (q && !t.merchant.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, categoryFilter, monthFilter]);

  const total = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-4 flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Transactions</h1>
          <p className="text-sm text-text-secondary">
            {filtered.length} transaction{filtered.length === 1 ? '' : 's'} · ${total.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-bg-card border border-border text-text-primary hover:border-primary-blue transition-colors"
          >
            Add transaction
          </button>
          <CsvUploadButton />
        </div>
      </div>

      {adding && <AddTransactionForm onClose={() => setAdding(false)} />}

      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Search merchant or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
        />
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
        >
          <option value="all">All months</option>
          {availableMonths.map((key) => (
            <option key={key} value={key}>{monthLabelFor(key)}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
          <option value={UNCATEGORIZED_LABEL}>{UNCATEGORIZED_LABEL}</option>
        </select>
      </div>

      <div className="bg-bg-card rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-secondary text-sm">No transactions found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Merchant</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Card</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg-primary/40">
                  <td className="px-4 py-2 text-text-secondary whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-4 py-2 text-text-primary">
                    <div className="font-medium">{t.merchant}</div>
                    {t.description && t.description !== t.merchant && (
                      <div className="text-xs text-text-secondary">{t.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={t.category || ''}
                      onChange={(e) => updateTransactionCategory(t.id, e.target.value || null)}
                      className="px-2 py-1 rounded border border-border bg-bg-primary text-text-primary text-xs"
                    >
                      <option value="">{UNCATEGORIZED_LABEL}</option>
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-text-secondary">•••• {t.card}</td>
                  <td className="px-4 py-2 text-right font-medium text-text-primary whitespace-nowrap">
                    ${Math.abs(t.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete transaction "${t.merchant}" for $${Math.abs(t.amount).toFixed(2)}?`)) {
                          deleteTransaction(t.id);
                        }
                      }}
                      className="text-xs text-text-secondary hover:text-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionsView;
