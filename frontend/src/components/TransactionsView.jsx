import { useState } from 'react';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import { useData } from '../context/DataContext';

const MERCHANT_COLORS = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722'];

const merchantColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return MERCHANT_COLORS[hash % MERCHANT_COLORS.length];
};

const AddTransactionForm = ({ onClose }) => {
  const { addTransaction } = useData();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [card, setCard] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addTransaction({ merchant, amount: parseFloat(amount), card });
      onClose();
    } catch {
      setError('Failed to add transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 flex flex-wrap items-end gap-3 bg-bg-card rounded-2xl p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">Merchant</label>
        <input
          type="text"
          required
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          className="bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">Amount</label>
        <input
          type="text"
          required
          placeholder="42.50"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue w-28"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-secondary">Card (last 4)</label>
        <input
          type="text"
          required
          maxLength={4}
          value={card}
          onChange={e => setCard(e.target.value)}
          className="bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue w-24"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-blue text-white hover:bg-primary-blue/80 transition-colors disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        Cancel
      </button>
      {error && <span className="text-sm text-red-400 w-full">{error}</span>}
    </form>
  );
};

const TransactionsView = () => {
  const { transactions, loading, deleteTransaction, deleteAllTransactions } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterFrom, setFilterFrom] = useState(() => localStorage.getItem('filter_from') || '');
  const [filterTo, setFilterTo] = useState(() => localStorage.getItem('filter_to') || '');
  const [search, setSearch] = useState(() => localStorage.getItem('filter_search') || '');
  const [selected, setSelected] = useState(new Set());

  const setFilter = (key, setter) => (val) => {
    setter(val);
    if (val) localStorage.setItem(key, val);
    else localStorage.removeItem(key);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filtered = (transactions || []).filter(t => {
    if (filterFrom && t.date < filterFrom) return false;
    if (filterTo && t.date > filterTo) return false;
    if (search && !t.merchant?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groupedTransactions = filtered.reduce((groups, t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
    return groups;
  }, {});
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  const handleDeleteAll = async () => {
    if (!confirm('Delete all transactions? This cannot be undone.')) return;
    await deleteAllTransactions();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t.id)));
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} transactions?`)) return;
    await Promise.all([...selected].map(id => deleteTransaction(id)));
    setSelected(new Set());
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Transactions</h2>
          <p className="text-sm text-text-secondary">{filtered.length} transactions</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 transition-colors"
          >
            <HiOutlinePlus className="text-base" />
            Add Transaction
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
          >
            <HiOutlineTrash className="text-base" />
            Delete All
          </button>
        </div>
      </div>

      {showAddForm && <AddTransactionForm onClose={() => setShowAddForm(false)} />}

      {/* Search + Filters */}
      <div className="mb-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search merchant…"
          value={search}
          onChange={e => setFilter('filter_search', setSearch)(e.target.value)}
          className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-blue w-48"
        />
        <input
          type="date"
          value={filterFrom}
          onChange={e => setFilter('filter_from', setFilterFrom)(e.target.value)}
          className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
        />
        <span className="text-text-secondary text-sm">to</span>
        <input
          type="date"
          value={filterTo}
          onChange={e => setFilter('filter_to', setFilterTo)(e.target.value)}
          className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
        />
        {(filterFrom || filterTo || search) && (
          <button
            onClick={() => {
              setFilterFrom(''); setFilterTo(''); setSearch('');
              ['filter_from', 'filter_to', 'filter_search'].forEach(k => localStorage.removeItem(k));
            }}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-primary-blue/10 border border-primary-blue/20 rounded-2xl px-4 py-3">
          <span className="text-sm font-medium text-primary-blue">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={bulkDelete}
              className="px-3 py-1.5 rounded-xl text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading transactions...</div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="flex items-center justify-center h-64 text-text-secondary">No transactions found</div>
      )}

      {/* Select all row */}
      {filtered.length > 0 && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded accent-primary-blue cursor-pointer"
          />
          <span className="text-xs text-text-secondary">Select all</span>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex flex-col gap-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
              {formatDate(date)}
            </div>
            <div className="bg-bg-card rounded-2xl p-0 shadow-sm">
              {groupedTransactions[date].map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`flex items-center gap-3 p-4 transition-colors hover:bg-bg-primary ${
                    selected.has(transaction.id) ? 'bg-primary-blue/5' : ''
                  } ${index < groupedTransactions[date].length - 1 ? 'border-b border-border' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(transaction.id)}
                    onChange={() => toggleSelect(transaction.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-primary-blue cursor-pointer flex-shrink-0"
                  />
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                        style={{ backgroundColor: merchantColor(transaction.merchant) + '20' }}
                      >
                        💳
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium text-text-primary mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {transaction.merchant}
                        </div>
                        <span className="text-[11px] text-text-secondary">{transaction.card}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-base font-semibold text-primary-blue">
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTransaction(transaction.id); }}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsView;
