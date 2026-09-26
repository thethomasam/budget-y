import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

const MONTHLY_BUDGET = 3000;
const TOP_MERCHANTS = 6;

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const monthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

// Derive month-over-month totals purely from the raw transaction list.
const computeMonthlyExpenses = (transactions) => {
  const totals = {};
  transactions.forEach(t => {
    const key = monthKey(t.date);
    totals[key] = (totals[key] || 0) + Math.abs(t.amount);
  });
  return Object.keys(totals).sort().map(key => ({ month: monthLabel(key), amount: totals[key] }));
};

const computeMonthlyMerchantSpend = (transactions) => {
  const monthKeys = [...new Set(transactions.map(t => monthKey(t.date)))].sort();
  const categoryOf = (t) => t.category || t.merchant;

  const categoryTotals = {};
  transactions.forEach(t => {
    categoryTotals[categoryOf(t)] = (categoryTotals[categoryOf(t)] || 0) + Math.abs(t.amount);
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_MERCHANTS)
    .map(([name]) => name);

  const categories = topCategories.map(name => ({
    name,
    monthly: monthKeys.map(key =>
      transactions
        .filter(t => categoryOf(t) === name && monthKey(t.date) === key)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    ),
  }));

  return { months: monthKeys.map(monthLabel), categories };
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [monthlyMerchantSpend, setMonthlyMerchantSpend] = useState({ months: [], categories: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/transaction');
      if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
      const data = await res.json();

      setTransactions(data);
      setMonthlyExpenses(computeMonthlyExpenses(data));
      setMonthlyMerchantSpend(computeMonthlyMerchantSpend(data));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const addTransaction = async ({ amount, merchant, card }) => {
    const res = await fetch('/api/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, merchant, card }),
    });
    if (!res.ok) throw new Error('Failed to add transaction');
    await fetchData();
  };

  const deleteTransaction = async (id) => {
    await fetch(`/api/transaction/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const deleteAllTransactions = async () => {
    await fetch('/api/transaction', { method: 'DELETE' });
    fetchData();
  };

  const updateTransactionCategory = async (id, category) => {
    const res = await fetch(`/api/transaction/${id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error('Failed to update category');
    await fetchData();
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      setCategories(await res.json());
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const now = new Date();
  const totalExpense = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const currentMonthExpense = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const value = {
    transactions,
    monthlyExpenses,
    monthlyMerchantSpend,
    monthlyBudget: MONTHLY_BUDGET,
    categories,
    loading,
    error,
    refetch: fetchData,
    addTransaction,
    deleteTransaction,
    deleteAllTransactions,
    updateTransactionCategory,
    totalExpense,
    currentMonthExpense,
    recentTransactions,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
