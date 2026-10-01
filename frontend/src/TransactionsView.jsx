import { useMemo, useRef, useState } from 'react';
import { useData } from './DataContext';
import { UNCATEGORIZED_LABEL } from './chartPalette';

const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const CsvUploadButton = () => {
  const { ingestTransactionsCsv } = useData();
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const { created, duplicates } = await ingestTransactionsCsv(file);
      setResult({ ok: true, created: created.length, duplicates: duplicates.length });
    } catch (err) {
      setResult({ ok: false, message: err.message });
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
      {result && (
        <span className={`text-xs ${result.ok ? 'text-text-secondary' : 'text-danger'}`}>
          {result.ok
            ? `Added ${result.created}${result.duplicates ? `, skipped ${result.duplicates} duplicate${result.duplicates === 1 ? '' : 's'}` : ''}`
            : result.message}
        </span>
      )}
    </div>
  );
};

const TransactionsView = () => {
  const { transactions, categories, loading, updateTransactionCategory, deleteTransaction } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...transactions]
      .filter((t) => {
        const name = t.category || UNCATEGORIZED_LABEL;
        if (categoryFilter !== 'all' && name !== categoryFilter) return false;
        if (q && !t.merchant.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, categoryFilter]);

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
        <CsvUploadButton />
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Search merchant or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
        />
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
