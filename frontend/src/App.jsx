import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPICards from './components/KPICards';
import CategoryBreakdownCard from './components/PaymentsCard';
import BudgetProgressCard from './components/BudgetProgressCard';
import SpendingTrendCard from './components/SaleCard';
import SavingsTrendCard from './components/SavingsTrendCard';
import RecentTransactionsCard from './components/RecentTransactionsCard';
import TransactionsView from './components/TransactionsView';
import { sampleData } from './data/sampleData';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 ml-[70px] p-4 px-5 max-h-screen overflow-y-auto">
        <Header />
        {activeView === 'dashboard' ? (
          <div className="flex flex-col gap-4">
            {/* Row 1: 3 KPI Cards in a flex row */}
            <div className="grid grid-cols-3 gap-4">
              <KPICards data={sampleData} />
            </div>

            {/* Row 2: Category Breakdown + Budget vs Actual + Recent Transactions */}
            <div className="grid grid-cols-3 gap-4 items-stretch">
              <CategoryBreakdownCard categoryBreakdown={sampleData.categoryBreakdown} />
              <BudgetProgressCard categories={sampleData.expenseCategories} />
              <RecentTransactionsCard transactions={sampleData.recentTransactions} />
            </div>

            {/* Row 3: Spending Trend + Savings Trend */}
            <div className="grid grid-cols-2 gap-4">
              <SpendingTrendCard
                dailySpending={sampleData.dailySpending}
                previousMonthSpending={sampleData.previousMonthSpending}
              />
              <SavingsTrendCard
                monthlySavings={sampleData.monthlySavings}
                previousYearSavings={sampleData.previousYearSavings}
              />
            </div>
          </div>
        ) : activeView === 'transactions' ? (
          <TransactionsView transactions={sampleData.allTransactions} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
