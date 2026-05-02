import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [monthlySavings, setMonthlySavings] = useState([]);
  const [monthlyCategorySpend, setMonthlyCategorySpend] = useState({ months: [], categories: [] });
  const [settings, setSettings] = useState({ user: { name: '' }, budget_goals: [], transaction_limit: 1000, monthly_budget: 3000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, categoryRes, monthlyRes] = await Promise.all([
        fetch('/api/transactions?limit=5000'),
        fetch('/api/analytics/category-breakdown'),
        fetch('/api/analytics/monthly-expenses')
      ]);

      if (!transactionsRes.ok || !categoryRes.ok || !monthlyRes.ok) {
        const errorDetails = {
          transactions: !transactionsRes.ok ? `${transactionsRes.status} ${transactionsRes.statusText}` : 'OK',
          category: !categoryRes.ok ? `${categoryRes.status} ${categoryRes.statusText}` : 'OK',
          monthly: !monthlyRes.ok ? `${monthlyRes.status} ${monthlyRes.statusText}` : 'OK',
        };
        console.error('API Error Details:', errorDetails);
        throw new Error(`Failed to fetch data from API: ${JSON.stringify(errorDetails)}`);
      }

      const monthlyCatData = await fetch('/api/analytics/monthly-category-spend')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

      const monthlySavingsData = await fetch('/api/analytics/monthly-savings')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

      // Settings is optional — use defaults if it fails
      const settingsData = await fetch('/api/settings')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

      const transactionsData = await transactionsRes.json();
      const categoryData = await categoryRes.json();
      const monthlyData = await monthlyRes.json();

      const colors = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722'];
      const categoryBreakdownWithColors = categoryData.categories.map((cat, index) => ({
        name: cat.category,
        value: cat.percentage,
        amount: cat.amount,
        color: colors[index % colors.length]
      }));

      if (settingsData) setSettings(settingsData);

      const goals = settingsData?.budget_goals || [];
      const goalColors = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722', '#26C6DA', '#AB47BC'];
      const goalMeta = {};
      goals.forEach((g, i) => {
        const meta = { color: goalColors[i % goalColors.length], icon: g.icon };
        [g.name, ...(g.aliases || [])].forEach(alias => { goalMeta[alias] = meta; });
      });
      const enriched = transactionsData.map(t => ({
        ...t,
        color: goalMeta[t.category]?.color || '#5B6FED',
        icon: goalMeta[t.category]?.icon || '💳',
      }));

      setTransactions(enriched);
      setCategoryBreakdown(categoryBreakdownWithColors);
      setMonthlyExpenses(monthlyData.monthly_expenses || []);
      if (monthlyCatData) setMonthlyCategorySpend(monthlyCatData);
      if (monthlySavingsData) setMonthlySavings(monthlySavingsData.monthly_savings || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  const deleteTransaction = async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTotalExpense = () => {
    return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getCurrentMonthExpense = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getRecentTransactions = (limit = 5) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  const getFortnightDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    if (day <= 14) {
      return { start: new Date(year, month, 1), end: new Date(year, month, 14, 23, 59, 59) };
    } else {
      return { start: new Date(year, month, 15), end: new Date(year, month + 1, 0, 23, 59, 59) };
    }
  };

  // Build budget progress from real transaction data + config budget goals (fortnight)
  const getBudgetProgress = () => {
    const { start, end } = getFortnightDates();
    return settings.budget_goals.map(goal => {
      const names = new Set([goal.name, ...(goal.aliases || [])]);
      const fortnightBudget = goal.budget / 2;
      const spent = transactions
        .filter(t => {
          const date = new Date(t.date);
          return names.has(t.category) && date >= start && date <= end;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentage = fortnightBudget > 0 ? (spent / fortnightBudget) * 100 : 0;
      return {
        name: goal.name,
        icon: goal.icon,
        budget: fortnightBudget,
        amount: spent,
        percentage,
      };
    });
  };

  const value = {
    transactions,
    categoryBreakdown,
    monthlyExpenses,
    monthlySavings,
    monthlyCategorySpend,
    settings,
    loading,
    error,
    refetch,
    deleteTransaction,
    totalExpense: getTotalExpense(),
    currentMonthExpense: getCurrentMonthExpense(),
    recentTransactions: getRecentTransactions(),
    budgetProgress: getBudgetProgress(),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
