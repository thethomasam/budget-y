import { useState } from 'react';
import { DataProvider } from './context/DataContext';
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
import { AiFillHome } from 'react-icons/ai';
import { BiWallet } from 'react-icons/bi';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <DataProvider>
      <div className="flex min-h-screen">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 sm:ml-[70px] p-4 px-4 sm:px-5 max-h-screen overflow-y-auto pb-20 sm:pb-4">
          <Header />
          {activeView === 'dashboard' ? (
            <div className="flex flex-col gap-4">
              {/* Row 1: KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICards data={sampleData} />
              </div>

              {/* Row 2: Category Breakdown + Budget vs Actual + Recent Transactions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                <CategoryBreakdownCard />
                <BudgetProgressCard categories={sampleData.expenseCategories} />
                <RecentTransactionsCard />
              </div>

              {/* Row 3: Spending Trend + Savings Trend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <TransactionsView />
          ) : null}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-[100] flex justify-around items-center py-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center gap-1 px-6 py-1 rounded-lg transition-all ${
              activeView === 'dashboard' ? 'text-primary-blue' : 'text-text-secondary'
            }`}
          >
            <AiFillHome className="text-2xl" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveView('transactions')}
            className={`flex flex-col items-center gap-1 px-6 py-1 rounded-lg transition-all ${
              activeView === 'transactions' ? 'text-primary-blue' : 'text-text-secondary'
            }`}
          >
            <BiWallet className="text-2xl" />
            <span className="text-[10px] font-medium">Transactions</span>
          </button>
        </nav>
      </div>
    </DataProvider>
  );
}

export default App;
