import { useState } from 'react';
import { useData } from './DataContext';
import { colorForCategory, buildCategoryColorMap } from './chartPalette';

const BudgetInput = ({ value, onCommit }) => {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const amount = Number(draft);
    if (!Number.isNaN(amount) && amount >= 0) onCommit(amount);
    else setDraft(value);
  };

  return (
    <input
      type="number"
      min="0"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      className="w-24 px-2 py-1 rounded border border-border bg-bg-primary text-text-primary text-sm text-right"
    />
  );
};

const NameLabel = ({ name, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraft(name);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
          if (e.key === 'Escape') { setDraft(name); setEditing(false); }
        }}
        className="px-1.5 py-0.5 rounded border border-border bg-bg-primary text-text-primary text-sm min-w-0"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(name); setEditing(true); }}
      className="text-sm font-medium text-text-primary truncate hover:text-primary-blue text-left"
    >
      {name}
    </button>
  );
};

const AddCategoryRow = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, Number(budget) || 0);
    setName('');
    setBudget('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 pt-3">
      <input
        type="text"
        placeholder="New category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
      />
      <input
        type="number"
        min="0"
        placeholder="Budget"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        className="w-28 px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
      />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors"
      >
        Add
      </button>
    </form>
  );
};

const CategoryLimitsView = () => {
  const { categories, loading, updateCategoryBudget, addCategory, renameCategory, deleteCategory } = useData();
  const colorMap = buildCategoryColorMap(categories.map((c) => c.name));
  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-text-primary">Category Limits</h1>
        <p className="text-sm text-text-secondary">
          {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · ${totalBudget.toFixed(0)} budgeted per month
        </p>
      </div>

      <div className="bg-bg-card rounded-2xl shadow-sm p-4">
        {loading ? (
          <div className="h-32 flex items-center justify-center text-text-secondary text-sm">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-text-secondary text-sm">No categories yet</div>
        ) : (
          <div>
            {categories.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorForCategory(colorMap, c.name) }} />
                  <NameLabel name={c.name} onRename={(newName) => renameCategory(c.name, newName)} />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <BudgetInput value={c.budget} onCommit={(amount) => updateCategoryBudget(c.name, amount)} />
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete category "${c.name}"? Its transactions will become uncategorized.`)) {
                        deleteCategory(c.name);
                      }
                    }}
                    className="text-xs text-text-secondary hover:text-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddCategoryRow onAdd={addCategory} />
      </div>
    </div>
  );
};

export default CategoryLimitsView;
