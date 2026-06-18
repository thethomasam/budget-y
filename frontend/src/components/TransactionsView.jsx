import { useState, useRef } from 'react';
import { HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi';
import { useData } from '../context/DataContext';

const TransactionsView = () => {
  const { transactions, loading, deleteTransaction, refetch } = useData();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [filterFrom, setFilterFrom] = useState(() => localStorage.getItem('filter_from') || '');
  const [filterTo, setFilterTo] = useState(() => localStorage.getItem('filter_to') || '');
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('filter_category') || '');
  const [search, setSearch] = useState(() => localStorage.getItem('filter_search') || '');

  const setFilter = (key, setter) => (val) => {
    setter(val);
    if (val) localStorage.setItem(key, val);
    else localStorage.removeItem(key);
  };
  const [selected, setSelected] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setUploadStatus(null);
    try {
      const res = await fetch('/api/transactions/upload-csv', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { job_id, total } = await res.json();
      setUploadStatus({ total, rule_categorised: 0, llm_done: 0, llm_queued: 0, failed: 0, status: 'processing' });
      pollStatus(job_id);
    } catch {
      setUploadStatus({ error: true });
      setUploading(false);
    }
  };

  const pollStatus = (job_id) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/transactions/upload-csv/${job_id}`, {});
        const data = await res.json();
        setUploadStatus(data);
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(interval);
          setUploading(false);
          if (data.status === 'complete') refetch();
        }
      } catch {
        clearInterval(interval);
        setUploading(false);
      }
    }, 1500);
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

  const allCategories = [...new Set((transactions || []).map(t => t.category).filter(Boolean))].sort();

  const updateCategory = async (id, category) => {
    await fetch(`/api/categories/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    refetch();
  };

  const filtered = (transactions || []).filter(t => {
    if (filterFrom && t.date < filterFrom) return false;
    if (filterTo && t.date > filterTo) return false;
    if (filterCategory && t.category !== filterCategory) return false;
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
    await fetch('/api/transactions', { method: 'DELETE' });
    refetch();
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
    await Promise.all([...selected].map(id => fetch(`/api/transactions/${id}`, { method: 'DELETE' })));
    setSelected(new Set());
    refetch();
  };

  const bulkUpdateCategory = async () => {
    if (!bulkCategory) return;
    await fetch('/api/categories/transactions/bulk-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_ids: [...selected], category: bulkCategory }),
    });
    setSelected(new Set());
    setBulkCategory('');
    refetch();
  };

  const done = uploadStatus ? (uploadStatus.rule_categorised || 0) + (uploadStatus.llm_done || 0) : 0;
  const progress = uploadStatus?.total ? Math.round((done / uploadStatus.total) * 100) : 0;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Transactions</h2>
          <p className="text-sm text-text-secondary">Last 20 days of activity</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 transition-colors disabled:opacity-50"
          >
            <HiOutlineUpload className="text-base" />
            {uploading ? 'Uploading…' : 'Upload CSV'}
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
        <select
          value={filterCategory}
          onChange={e => setFilter('filter_category', setFilterCategory)(e.target.value)}
          className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
        >
          <option value="">All categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filterFrom || filterTo || filterCategory || search) && (
          <button
            onClick={() => {
              setFilterFrom(''); setFilterTo(''); setFilterCategory(''); setSearch('');
              ['filter_from', 'filter_to', 'filter_category', 'filter_search'].forEach(k => localStorage.removeItem(k));
            }}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-sm text-text-secondary ml-auto">{filtered.length} transactions</span>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-primary-blue/10 border border-primary-blue/20 rounded-2xl px-4 py-3">
          <span className="text-sm font-medium text-primary-blue">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkCategory}
              onChange={e => setBulkCategory(e.target.value)}
              className="bg-bg-card border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary-blue"
            >
              <option value="">Change category…</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={bulkUpdateCategory}
              disabled={!bulkCategory}
              className="px-3 py-1.5 rounded-xl text-sm font-medium bg-primary-blue text-white hover:bg-primary-blue/80 transition-colors disabled:opacity-40"
            >
              Apply
            </button>
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

      {/* Upload progress */}
      {uploadStatus && (
        <div className={`mb-5 p-4 rounded-2xl text-sm ${uploadStatus.error || uploadStatus.status === 'failed' ? 'bg-red-400/10 text-red-400' : uploadStatus.status === 'complete' ? 'bg-green-400/10 text-green-400' : 'bg-primary-blue/10 text-primary-blue'}`}>
          {uploadStatus.error ? 'Upload failed. Please try again.' :
           uploadStatus.status === 'complete' ? `Done — ${uploadStatus.total} transactions imported.` : (
            <div>
              <div className="mb-2">Processing {uploadStatus.total} transactions… {progress}%</div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-primary-blue h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
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
                        style={{ backgroundColor: transaction.color + '20' }}
                      >
                        {transaction.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-medium text-text-primary mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {transaction.merchant}
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={transaction.category || ''}
                            onChange={(e) => { e.stopPropagation(); updateCategory(transaction.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs px-2 py-0.5 rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-blue"
                            style={{ backgroundColor: transaction.color + '15', color: 'var(--color-text-secondary)' }}
                          >
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <span className="text-[11px] text-text-secondary">{transaction.card}</span>
                        </div>
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
