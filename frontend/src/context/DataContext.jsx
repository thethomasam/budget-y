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
  const [monthlyCategorySpend, setMonthlyCategorySpend] = useState({ months: [], categories: [] });
  const [settings, setSettings] = useState({ user: { name: '' }, budget_goals: [], transaction_limit: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, categoryRes, monthlyRes, monthlyCatRes] = await Promise.all([
        fetch('/api/transactions?limit=1000'),
        fetch('/api/analytics/category-breakdown'),
        fetch('/api/analytics/monthly-expenses'),
        fetch('/api/analytics/monthly-category-spend')
      ]);

      if (!transactionsRes.ok || !categoryRes.ok || !monthlyRes.ok || !monthlyCatRes.ok) {
        const errorDetails = {
          transactions: !transactionsRes.ok ? `${transactionsRes.status} ${transactionsRes.statusText}` : 'OK',
          category: !categoryRes.ok ? `${categoryRes.status} ${categoryRes.statusText}` : 'OK',
          monthly: !monthlyRes.ok ? `${monthlyRes.status} ${monthlyRes.statusText}` : 'OK',
          monthlyCat: !monthlyCatRes.ok ? `${monthlyCatRes.status} ${monthlyCatRes.statusText}` : 'OK'
        };
        console.error('API Error Details:', errorDetails);
        throw new Error(`Failed to fetch data from API: ${JSON.stringify(errorDetails)}`);
      }

      // Settings is optional — use defaults if it fails
      const settingsData = await fetch('/api/settings')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);

      const transactionsData = await transactionsRes.json();
      const categoryData = await categoryRes.json();
      const monthlyData = await monthlyRes.json();
      const monthlyCatData = await monthlyCatRes.json();

      const colors = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722'];
      const categoryBreakdownWithColors = categoryData.categories.map((cat, index) => ({
        name: cat.category,
        value: cat.percentage,
        amount: cat.amount,
        color: colors[index % colors.length]
      }));

      if (settingsData) setSettings(settingsData);
      setTransactions(transactionsData);
      setCategoryBreakdown(categoryBreakdownWithColors);
      setMonthlyExpenses(monthlyData.monthly_expenses || []);
      setMonthlyCategorySpend(monthlyCatData);
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
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(t => new Date(t.date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getRecentTransactions = (limit = 5) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  // Build budget progress from real transaction data + config budget goals
  const getBudgetProgress = () => {
    return settings.budget_goals.map(goal => {
      const names = new Set([goal.name, ...(goal.aliases || [])]);
      const spent = transactions
        .filter(t => names.has(t.category))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentage = goal.budget > 0 ? (spent / goal.budget) * 100 : 0;
      return {
        name: goal.name,
        icon: goal.icon,
        budget: goal.budget,
        amount: spent,
        percentage,
      };
    });
  };

  const value = {
    transactions,
    categoryBreakdown,
    monthlyExpenses,
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
