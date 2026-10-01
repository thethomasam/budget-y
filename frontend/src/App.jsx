import { useState } from 'react';
import { DataProvider, useData, monthLabelFor } from './DataContext';
import CategoryBudgetCard from './CategoryBudgetCard';
import DailySpendCard from './DailySpendCard';
import MonthlyTrendCard from './MonthlyTrendCard';
import CategoryTrendCard from './CategoryTrendCard';
import TransactionsView from './TransactionsView';

function SummaryHeader() {
  const { monthTotal, monthLabel, error, selectedMonth, setSelectedMonth, availableMonths } = useData();

  return (
    <div className="mb-4 flex items-start justify-between flex-wrap gap-2">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Budget Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {monthLabel} · ${monthTotal.toFixed(0)} spent so far
        </p>
        {error && <p className="text-sm text-danger mt-1">Failed to load: {error}</p>}
      </div>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
      >
        {availableMonths.map((key) => (
          <option key={key} value={key}>{monthLabelFor(key)}</option>
        ))}
      </select>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <SummaryHeader />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBudgetCard />
        <DailySpendCard />
      </div>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <MonthlyTrendCard />
        <CategoryTrendCard />
      </div>
    </div>
  );
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'transactions', label: 'Transactions' },
];

function Nav({ activeView, onChange }) {
  return (
    <div className="border-b border-border bg-bg-card">
      <div className="max-w-5xl mx-auto px-4 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === tab.key
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <DataProvider>
      <div className="min-h-screen bg-bg-primary">
        <Nav activeView={activeView} onChange={setActiveView} />
        {activeView === 'dashboard' ? <Dashboard /> : <TransactionsView />}
      </div>
    </DataProvider>
  );
}

export default App;
