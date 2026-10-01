import { useState } from 'react';
import { useData } from './DataContext';
import { colorForCategory, buildCategoryColorMap, UNCATEGORIZED_LABEL } from './chartPalette';

const BarRow = ({ name, spent, budget, color, editable, onEditBudget }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(budget);

  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget - spent;
  const over = remaining < 0;
  const barColor = over ? '#EF5350' : pct > 85 ? '#FFC542' : color;

  const commit = () => {
    const amount = Number(draft);
    if (!Number.isNaN(amount) && amount >= 0) onEditBudget(amount);
    setEditing(false);
  };

  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-text-primary truncate">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-text-primary font-semibold">${spent.toFixed(0)}</span>
          <span className="text-text-secondary">/</span>
          {!editable ? (
            <span className="text-text-secondary">${budget.toFixed(0)}</span>
          ) : editing ? (
            <input
              autoFocus
              type="number"
              min="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              className="w-16 px-1 py-0.5 rounded border border-border text-text-primary text-xs"
            />
          ) : (
            <button
              onClick={() => { setDraft(budget); setEditing(true); }}
              className="text-text-secondary hover:text-primary-blue underline decoration-dotted"
            >
              ${budget.toFixed(0)}
            </button>
          )}
        </div>
      </div>
      <div className="w-full h-2 bg-bg-primary rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="mt-1 text-[11px] text-text-secondary">
        {over
          ? <span className="text-danger font-medium">${Math.abs(remaining).toFixed(0)} over budget</span>
          : <span>${remaining.toFixed(0)} left</span>}
      </div>
    </div>
  );
};

const CategoryBudgetCard = () => {
  const { categorySpend, monthTotal, monthLabel, loading, updateCategoryBudget } = useData();
  const colorMap = buildCategoryColorMap(categorySpend.map((c) => c.name));
  const totalBudget = categorySpend.reduce((sum, c) => sum + c.budget, 0);

  return (
    <div className="bg-bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-text-primary">Spend by Category</h3>
        <span className="text-xs text-text-secondary">{monthLabel}</span>
      </div>
      <div className="text-xs text-text-secondary mb-3">
        ${monthTotal.toFixed(0)} spent of ${totalBudget.toFixed(0)} budgeted
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
      ) : categorySpend.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-secondary text-sm">No spending data yet</div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          {categorySpend.map((c) => (
            <BarRow
              key={c.name}
              name={c.name}
              spent={c.spent}
              budget={c.budget}
              color={colorForCategory(colorMap, c.name)}
              editable={c.name !== UNCATEGORIZED_LABEL}
              onEditBudget={(amount) => updateCategoryBudget(c.name, amount)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryBudgetCard;
