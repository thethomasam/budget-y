export const sampleData = {
  // Primary KPIs
  balance: 4509.43,
  balanceChange: 8.5, // percentage change from last month
  monthlyIncome: 5000,
  monthlySpending: 789.57,
  spendingBudget: 3500,
  savingsRate: 84.2, // percentage of income saved
  ytdSavings: 28450,

  // Monthly cumulative savings for this year
  monthlySavings: [
    { month: 1, amount: 5200 },
    { month: 2, amount: 8900 },
    { month: 3, amount: 12600 },
    { month: 4, amount: 15800 },
    { month: 5, amount: 18950 },
    { month: 6, amount: 21500 },
    { month: 7, amount: 23200 },
    { month: 8, amount: 25100 },
    { month: 9, amount: 26800 },
    { month: 10, amount: 28450 },
    { month: 11, amount: 28450 },
    { month: 12, amount: 28450 }
  ],

  // Previous year cumulative savings for comparison
  previousYearSavings: [
    { month: 1, amount: 4800 },
    { month: 2, amount: 8200 },
    { month: 3, amount: 11500 },
    { month: 4, amount: 14200 },
    { month: 5, amount: 17100 },
    { month: 6, amount: 19800 },
    { month: 7, amount: 21900 },
    { month: 8, amount: 23600 },
    { month: 9, amount: 25200 },
    { month: 10, amount: 27100 },
    { month: 11, amount: 29300 },
    { month: 12, amount: 31500 }
  ],

  // All transactions (last 20 days)
  allTransactions: [
    { id: 1, merchant: 'Shiels Jewellers', amount: -450.00, date: '2024-10-28', category: 'Shopping & Retail', card: 'Visa ****4532', icon: '💍', color: '#FFC107' },
    { id: 2, merchant: 'Hummus Hustle', amount: -28.50, date: '2024-10-28', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 3, merchant: 'Shell Gas Station', amount: -65.00, date: '2024-10-27', category: 'Auto & Fuel', card: 'Visa ****4532', icon: '⛽', color: '#FF9800' },
    { id: 4, merchant: 'Woolworths', amount: -125.80, date: '2024-10-26', category: 'Groceries', card: 'Visa ****4532', icon: '🛒', color: '#4CAF50' },
    { id: 5, merchant: 'Netflix', amount: -22.99, date: '2024-10-25', category: 'Entertainment', card: 'Visa ****4532', icon: '🎬', color: '#9C27B0' },
    { id: 6, merchant: 'Coles Supermarket', amount: -87.45, date: '2024-10-24', category: 'Groceries', card: 'Visa ****4532', icon: '🛒', color: '#4CAF50' },
    { id: 7, merchant: 'Uber Eats', amount: -35.90, date: '2024-10-23', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 8, merchant: 'Chemist Warehouse', amount: -42.50, date: '2024-10-22', category: 'Healthcare', card: 'Visa ****4532', icon: '🏥', color: '#4CAF50' },
    { id: 9, merchant: 'JB Hi-Fi', amount: -299.00, date: '2024-10-21', category: 'Shopping & Retail', card: 'Visa ****4532', icon: '🛍️', color: '#FFC107' },
    { id: 10, merchant: 'McDonald\'s', amount: -18.75, date: '2024-10-20', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 11, merchant: 'BP Petrol', amount: -72.30, date: '2024-10-19', category: 'Auto & Fuel', card: 'Visa ****4532', icon: '⛽', color: '#FF9800' },
    { id: 12, merchant: 'Aldi', amount: -63.20, date: '2024-10-18', category: 'Groceries', card: 'Visa ****4532', icon: '🛒', color: '#4CAF50' },
    { id: 13, merchant: 'Steam Games', amount: -59.99, date: '2024-10-17', category: 'Entertainment', card: 'Visa ****4532', icon: '🎬', color: '#9C27B0' },
    { id: 14, merchant: 'Subway', amount: -12.50, date: '2024-10-16', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 15, merchant: 'Kmart', amount: -89.00, date: '2024-10-15', category: 'Shopping & Retail', card: 'Visa ****4532', icon: '🛍️', color: '#FFC107' },
    { id: 16, merchant: 'Starbucks', amount: -8.50, date: '2024-10-14', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 17, merchant: 'IGA Supermarket', amount: -45.80, date: '2024-10-13', category: 'Groceries', card: 'Visa ****4532', icon: '🛒', color: '#4CAF50' },
    { id: 18, merchant: 'Spotify Premium', amount: -14.99, date: '2024-10-12', category: 'Entertainment', card: 'Visa ****4532', icon: '🎬', color: '#9C27B0' },
    { id: 19, merchant: 'Domino\'s Pizza', amount: -32.95, date: '2024-10-11', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 20, merchant: 'Officeworks', amount: -127.50, date: '2024-10-10', category: 'Shopping & Retail', card: 'Visa ****4532', icon: '🛍️', color: '#FFC107' },
    { id: 21, merchant: 'Shell Gas Station', amount: -68.40, date: '2024-10-09', category: 'Auto & Fuel', card: 'Visa ****4532', icon: '⛽', color: '#FF9800' },
    { id: 22, merchant: 'Salary Deposit', amount: 5000.00, date: '2024-10-01', category: 'Income', card: 'Direct Deposit', icon: '💰', color: '#4CAF50' }
  ],

  // Recent transactions (for dashboard)
  recentTransactions: [
    { id: 1, merchant: 'Shiels Jewellers', amount: -450.00, date: '2024-10-28', category: 'Shopping & Retail', card: 'Visa ****4532', icon: '💍', color: '#FFC107' },
    { id: 2, merchant: 'Hummus Hustle', amount: -28.50, date: '2024-10-28', category: 'Dining & Food', card: 'Mastercard ****8901', icon: '🍽️', color: '#FF6B9D' },
    { id: 3, merchant: 'Shell Gas Station', amount: -65.00, date: '2024-10-27', category: 'Auto & Fuel', card: 'Visa ****4532', icon: '⛽', color: '#FF9800' },
    { id: 4, merchant: 'Woolworths', amount: -125.80, date: '2024-10-26', category: 'Groceries', card: 'Visa ****4532', icon: '🛒', color: '#4CAF50' },
    { id: 5, merchant: 'Netflix', amount: -22.99, date: '2024-10-25', category: 'Entertainment', card: 'Visa ****4532', icon: '🎬', color: '#9C27B0' },
    { id: 6, merchant: 'Salary Deposit', amount: 5000.00, date: '2024-10-01', category: 'Income', card: 'Direct Deposit', icon: '💰', color: '#4CAF50' }
  ],

  // Expense categories with budget tracking
  expenseCategories: [
    { name: 'Groceries', amount: 250, color: '#4CAF50', icon: '🛒', budget: 300, percentage: 83.3 },
    { name: 'Dining & Food', amount: 140, color: '#FF6B9D', icon: '🍽️', budget: 200, percentage: 70 },
    { name: 'Shopping & Retail', amount: 30, color: '#FFC107', icon: '🛍️', budget: 100, percentage: 30 },
    { name: 'Auto & Fuel', amount: 20, color: '#FF9800', icon: '⛽', budget: 100, percentage: 20 },
    { name: 'Entertainment', amount: 23, color: '#9C27B0', icon: '🎬', budget: 150, percentage: 15.3 },
    { name: 'Bills & Utilities', amount: 0, color: '#2196F3', icon: '💡', budget: 500, percentage: 0 },
    { name: 'Other', amount: 326.57, color: '#607D8B', icon: '📦', budget: 500, percentage: 65.3 }
  ],

  // Daily spending for the current month
  dailySpending: [
    { date: '1', amount: 0 },
    { date: '2', amount: 0 },
    { date: '3', amount: 0 },
    { date: '4', amount: 0 },
    { date: '5', amount: 0 },
    { date: '6', amount: 0 },
    { date: '7', amount: 0 },
    { date: '8', amount: 0 },
    { date: '9', amount: 0 },
    { date: '10', amount: 0 },
    { date: '11', amount: 0 },
    { date: '12', amount: 0 },
    { date: '13', amount: 0 },
    { date: '14', amount: 0 },
    { date: '15', amount: 0 },
    { date: '16', amount: 0 },
    { date: '17', amount: 0 },
    { date: '18', amount: 0 },
    { date: '19', amount: 0 },
    { date: '20', amount: 0 },
    { date: '21', amount: 0 },
    { date: '22', amount: 0 },
    { date: '23', amount: 0 },
    { date: '24', amount: 0 },
    { date: '25', amount: 22.99 },
    { date: '26', amount: 148.79 },
    { date: '27', amount: 213.79 },
    { date: '28', amount: 692.29 },
    { date: '29', amount: 789.57 },
    { date: '30', amount: 789.57 }
  ],

  // Previous month daily spending for comparison
  previousMonthSpending: [
    { date: '1', amount: 45 },
    { date: '2', amount: 112 },
    { date: '3', amount: 178 },
    { date: '4', amount: 234 },
    { date: '5', amount: 312 },
    { date: '6', amount: 389 },
    { date: '7', amount: 467 },
    { date: '8', amount: 523 },
    { date: '9', amount: 612 },
    { date: '10', amount: 689 },
    { date: '11', amount: 756 },
    { date: '12', amount: 834 },
    { date: '13', amount: 912 },
    { date: '14', amount: 989 },
    { date: '15', amount: 1067 },
    { date: '16', amount: 1134 },
    { date: '17', amount: 1223 },
    { date: '18', amount: 1301 },
    { date: '19', amount: 1378 },
    { date: '20', amount: 1456 },
    { date: '21', amount: 1534 },
    { date: '22', amount: 1612 },
    { date: '23', amount: 1689 },
    { date: '24', amount: 1767 },
    { date: '25', amount: 1845 },
    { date: '26', amount: 1923 },
    { date: '27', amount: 2001 },
    { date: '28', amount: 2078 },
    { date: '29', amount: 2156 },
    { date: '30', amount: 2234 }
  ],

  // Monthly expense trends (current vs last month)
  monthlyExpenses: {
    thisMonth: [
      { date: '1', value: 120 },
      { date: '3', value: 180 },
      { date: '5', value: 250 },
      { date: '7', value: 420 },
      { date: '9', value: 580 },
      { date: '11', value: 750 },
      { date: '13', value: 920 },
      { date: '15', value: 1150 },
      { date: '17', value: 1380 },
      { date: '19', value: 1620 },
      { date: '21', value: 1890 },
      { date: '23', value: 2140 },
      { date: '25', value: 2450 },
      { date: '27', value: 2780 },
      { date: '29', value: 3245 }
    ],
    lastMonth: [
      { date: '1', value: 150 },
      { date: '3', value: 210 },
      { date: '5', value: 320 },
      { date: '7', value: 480 },
      { date: '9', value: 670 },
      { date: '11', value: 850 },
      { date: '13', value: 1020 },
      { date: '15', value: 1280 },
      { date: '17', value: 1550 },
      { date: '19', value: 1820 },
      { date: '21', value: 2100 },
      { date: '23', value: 2380 },
      { date: '25', value: 2680 },
      { date: '27', value: 2950 },
      { date: '29', value: 3420 }
    ]
  },

  // Top spending categories (for bubble chart)
  topSpending: [
    { name: 'Food & Dining', value: 850, color: '#FF6B9D' },
    { name: 'Shopping', value: 620, color: '#FFC107' },
    { name: 'Bills', value: 550, color: '#5B6FED' }
  ],

  // Category breakdown for pie chart
  categoryBreakdown: [
    { name: 'Food & Dining', value: 26.2, amount: 850, color: '#FF6B9D' },
    { name: 'Shopping', value: 19.1, amount: 620, color: '#FFC107' },
    { name: 'Bills', value: 16.9, amount: 550, color: '#FF9800' },
    { name: 'Transportation', value: 13.9, amount: 450, color: '#5B6FED' },
    { name: 'Entertainment', value: 11.7, amount: 380, color: '#9C27B0' },
    { name: 'Healthcare', value: 6.0, amount: 195, color: '#4CAF50' },
    { name: 'Other', value: 6.2, amount: 200, color: '#607D8B' }
  ],

  // Budget goals per category
  budgetGoals: [
    {
      id: 1,
      name: 'Food & Dining',
      description: 'Monthly Budget',
      spent: 850,
      budget: 1000,
      percentage: 85,
      color: '#FF6B9D'
    },
    {
      id: 2,
      name: 'Transportation',
      description: 'Monthly Budget',
      spent: 450,
      budget: 600,
      percentage: 75,
      color: '#5B6FED'
    }
  ],

  // Yearly comparison data
  yearlyExpenses: [
    { month: 'Jan', value: 3200 },
    { month: 'Feb', value: 2850 },
    { month: 'Mar', value: 3420 },
    { month: 'Apr', value: 3100 },
    { month: 'May', value: 3650 },
    { month: 'Jun', value: 3280 },
    { month: 'Jul', value: 3890 },
    { month: 'Aug', value: 3550 },
    { month: 'Sep', value: 3720 },
    { month: 'Oct', value: 3245 },
    { month: 'Nov', value: 0 },
    { month: 'Dec', value: 0 }
  ]
};
