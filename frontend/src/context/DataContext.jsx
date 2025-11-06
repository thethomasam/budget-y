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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [transactionsRes, categoryRes, monthlyRes] = await Promise.all([
        fetch('/api/transactions?limit=1000'),
        fetch('/api/analytics/category-breakdown'),
        fetch('/api/analytics/monthly-expenses')
      ]);

      // Log responses for debugging
      console.log('API Responses:', {
        transactions: transactionsRes.status,
        category: categoryRes.status,
        monthly: monthlyRes.status
      });

      if (!transactionsRes.ok || !categoryRes.ok || !monthlyRes.ok) {
        const errorDetails = {
          transactions: !transactionsRes.ok ? `${transactionsRes.status} ${transactionsRes.statusText}` : 'OK',
          category: !categoryRes.ok ? `${categoryRes.status} ${categoryRes.statusText}` : 'OK',
          monthly: !monthlyRes.ok ? `${monthlyRes.status} ${monthlyRes.statusText}` : 'OK'
        };
        console.error('API Error Details:', errorDetails);
        throw new Error(`Failed to fetch data from API: ${JSON.stringify(errorDetails)}`);
      }

      const transactionsData = await transactionsRes.json();
      const categoryData = await categoryRes.json();
      const monthlyData = await monthlyRes.json();

      // Map category data to include colors for charts
      const colors = ['#5B6FED', '#FF6B9D', '#FFC542', '#00D4AA', '#9B7EFF', '#FF8A65', '#4CAF50', '#FF5722'];
      const categoryBreakdownWithColors = categoryData.categories.map((cat, index) => ({
        name: cat.category,
        value: cat.percentage,
        amount: cat.amount,
        color: colors[index % colors.length]
      }));

      setTransactions(transactionsData);
      setCategoryBreakdown(categoryBreakdownWithColors);
      setMonthlyExpenses(monthlyData.monthly_expenses || []);
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

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate derived data
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
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  };

  const value = {
    // Raw data
    transactions,
    categoryBreakdown,
    monthlyExpenses,

    // State
    loading,
    error,

    // Actions
    refetch,

    // Computed data
    totalExpense: getTotalExpense(),
    currentMonthExpense: getCurrentMonthExpense(),
    recentTransactions: getRecentTransactions(),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
