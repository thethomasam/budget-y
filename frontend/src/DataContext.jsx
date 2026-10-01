import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from './api';
import { UNCATEGORIZED_LABEL } from './chartPalette';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const monthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabelFor = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  // { category, sourceMerchant, candidates } | null -- rendered by
  // SimilarTransactionsPrompt at the app root, so it survives a tab switch.
  const [similarPrompt, setSimilarPrompt] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txns, cats, recurringItems] = await Promise.all([
        api.listTransactions(),
        api.listCategories(),
        api.listRecurring(),
      ]);
      setTransactions(txns);
      setCategories(cats);
      setRecurring(recurringItems);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateCategoryBudget = async (name, budget) => {
    await api.updateCategory(name, { budget });
    await fetchData();
  };

  const updateCategory = async (name, fields) => {
    await api.updateCategory(name, fields);
    await fetchData();
  };

  const addCategory = async (name, budget) => {
    await api.addCategory(name, budget);
    await fetchData();
  };

  const renameCategory = async (name, newName) => {
    await api.updateCategory(name, { name: newName });
    await fetchData();
  };

  const deleteCategory = async (name) => {
    await api.deleteCategory(name);
    await fetchData();
  };

  const updateTransactionCategory = async (id, category) => {
    const changed = transactions.find((t) => t.id === id);

    await api.updateTransactionCategory(id, category);
    await fetchData();
    if (changed) {
      const similar = (await api.findSimilarTransactions(id))
        .filter((t) => (t.category || null) !== category);
      if (similar.length > 0) {
        setSimilarPrompt({ category, sourceMerchant: changed.merchant, candidates: similar });
      }
    }
  };

  const resolveSimilarPrompt = async (selectedIds) => {
    if (!similarPrompt) return;
    const { category } = similarPrompt;
    setSimilarPrompt(null);
    if (selectedIds.length > 0) {
      await Promise.all(selectedIds.map((id) => api.updateTransactionCategory(id, category)));
      await fetchData();
    }
  };

  const dismissSimilarPrompt = () => setSimilarPrompt(null);

  const addRecurring = async (fields) => {
    const item = await api.addRecurring(fields);
    setRecurring((items) => [...items, item]);
  };

  const deleteRecurring = async (id) => {
    await api.deleteRecurring(id);
    setRecurring((items) => items.filter((i) => i.id !== id));
  };

  const addTransaction = async (fields) => {
    await api.addTransaction(fields);
    await fetchData();
  };

  const deleteTransaction = async (id) => {
    await api.deleteTransaction(id);
    await fetchData();
  };

  // Toasts are rendered by a single <Toaster /> at the app root, so progress
  // keeps showing even if the user navigates away from the Transactions tab
  // mid-upload -- the toast doesn't live inside the tab's component tree.
  const ingestTransactionsCsv = async (file) => {
    const toastId = toast.loading('Uploading CSV...');
    try {
      const result = await api.ingestTransactionsCsv(file, (processed, total) => {
        toast.loading(total > 0 ? `Processing ${processed}/${total}...` : 'Starting...', { id: toastId });
      });
      await fetchData();
      const { created, duplicates } = result;
      toast.success(
        `Added ${created.length}${duplicates.length ? `, skipped ${duplicates.length} duplicate${duplicates.length === 1 ? '' : 's'}` : ''}`,
        { id: toastId },
      );
      return result;
    } catch (err) {
      toast.error(err.message, { id: toastId });
      throw err;
    }
  };

  // Every month that has at least one transaction, newest first, plus the
  // current month so the dropdown always has somewhere to land.
  const availableMonths = useMemo(() => {
    const keys = new Set([monthKey(new Date()), ...transactions.map((t) => monthKey(t.date))]);
    return [...keys].sort().reverse();
  }, [transactions]);

  const now = new Date();
  const todayKey = monthKey(now);
  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const isCurrentMonth = selectedMonth === todayKey;

  const monthTransactions = transactions.filter((t) => monthKey(t.date) === selectedMonth);

  // Spend per category, for the selected month only.
  const categoryTotals = {};
  monthTransactions.forEach((t) => {
    const name = t.category || UNCATEGORIZED_LABEL;
    categoryTotals[name] = (categoryTotals[name] || 0) + Math.abs(t.amount);
  });
  const budgetByName = Object.fromEntries(categories.map((c) => [c.name, c.budget]));
  // Every known category, even ones with no spend this month, plus
  // Uncategorized when there are uncategorized transactions this month.
  const allNames = new Set([...categories.map((c) => c.name), ...Object.keys(categoryTotals)]);
  const categorySpend = [...allNames]
    .map((name) => ({ name, spent: categoryTotals[name] || 0, budget: budgetByName[name] || 0 }))
    .sort((a, b) => b.spent - a.spent);

  // Day-by-day spend for the selected month: up to today if it's the current
  // month, otherwise every day the month has, so the chart reads as a
  // continuous timeline either way.
  const daysInMonth = new Date(selYear, selMonthNum, 0).getDate();
  const daysToShow = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailySpend = Array.from({ length: daysToShow }, (_, i) => {
    const day = i + 1;
    const dayTransactions = monthTransactions.filter((t) => new Date(t.date).getDate() === day);
    const total = dayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { day, amount: total, transactions: dayTransactions };
  });

  const monthTotal = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Aggregated spend across every month that has transactions, oldest first,
  // with a running cumulative total for the trend line.
  const monthlyTrend = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      const key = monthKey(t.date);
      totals[key] = (totals[key] || 0) + Math.abs(t.amount);
    });
    let cumulative = 0;
    return Object.keys(totals)
      .sort()
      .map((key) => {
        cumulative += totals[key];
        return { month: monthLabelFor(key), total: totals[key], cumulative };
      });
  }, [transactions]);

  // Recurring items normalised to a per-month amount (52 weeks / 26 fortnights
  // a year).
  const { monthlyIncome, monthlyFixed } = useMemo(() => {
    const perMonth = { weekly: 52 / 12, fortnightly: 26 / 12, monthly: 1 };
    const sum = (kind) =>
      recurring.filter((r) => r.kind === kind).reduce((s, r) => s + r.amount * perMonth[r.frequency], 0);
    return { monthlyIncome: sum('income'), monthlyFixed: sum('expense') };
  }, [recurring]);

  // Savings = income - fixed costs (rent...) - card spend. The in-progress
  // current month is left out of the average (it's only partly spent) unless
  // it's the only month we have.
  const savings = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      const key = monthKey(t.date);
      totals[key] = (totals[key] || 0) + Math.abs(t.amount);
    });
    const current = monthKey(new Date());
    let keys = Object.keys(totals).sort();
    if (keys.length > 1) keys = keys.filter((k) => k !== current);
    const months = keys.map((key) => ({ key, spent: totals[key], saved: monthlyIncome - monthlyFixed - totals[key] }));
    const averageSaved = months.length ? months.reduce((s, m) => s + m.saved, 0) / months.length : 0;
    return { months, averageSaved };
  }, [transactions, monthlyIncome, monthlyFixed]);

  // Per-category spend across every month that has transactions, oldest first.
  const categoryMonthlyTrend = useMemo(() => {
    const byMonth = {};
    const totalsByCategory = {};
    transactions.forEach((t) => {
      const key = monthKey(t.date);
      const name = t.category || UNCATEGORIZED_LABEL;
      byMonth[key] = byMonth[key] || {};
      byMonth[key][name] = (byMonth[key][name] || 0) + Math.abs(t.amount);
      totalsByCategory[name] = (totalsByCategory[name] || 0) + Math.abs(t.amount);
    });
    const allCategories = Object.entries(totalsByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    const data = Object.keys(byMonth)
      .sort()
      .map((key) => {
        const entry = { month: monthLabelFor(key) };
        allCategories.forEach((name) => { entry[name] = byMonth[key][name] || 0; });
        return entry;
      });
    return { data, categories: allCategories };
  }, [transactions]);

  const value = {
    transactions,
    categories,
    loading,
    error,
    refetch: fetchData,
    updateCategoryBudget,
    updateCategory,
    addCategory,
    renameCategory,
    deleteCategory,
    updateTransactionCategory,
    similarPrompt,
    resolveSimilarPrompt,
    dismissSimilarPrompt,
    recurring,
    addRecurring,
    deleteRecurring,
    monthlyIncome,
    monthlyFixed,
    savings,
    addTransaction,
    deleteTransaction,
    ingestTransactionsCsv,
    categorySpend,
    dailySpend,
    monthlyTrend,
    categoryMonthlyTrend,
    monthTotal,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    monthLabel: monthLabelFor(selectedMonth),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
