import { useState } from 'react';
import { HiPencil } from 'react-icons/hi';
import { useData } from './DataContext';
import { colorForCategory, buildCategoryColorMap } from './chartPalette';

const CategoryRow = ({ category, color, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [budget, setBudget] = useState(category.budget);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(category.name);
    setBudget(category.budget);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const trimmedName = name.trim();
    const amount = Number(budget);
    if (!trimmedName || Number.isNaN(amount) || amount < 0) return;

    const fields = {};
    if (trimmedName !== category.name) fields.name = trimmedName;
    if (amount !== category.budget) fields.budget = amount;
    if (Object.keys(fields).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onUpdate(fields);
      setEditing(false);
    } catch (err) {
      console.error('Error saving category:', err);
      window.alert(err.message.includes('409') ? 'A category with that name already exists.' : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-border last:border-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="flex-1 min-w-0 px-2 py-1 rounded border border-border bg-bg-primary text-text-primary text-sm"
        />
        <input
          type="number"
          min="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="w-24 px-2 py-1 rounded border border-border bg-bg-primary text-text-primary text-sm text-right"
        />
        <button
          onClick={save}
          disabled={saving}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={cancel} className="text-xs text-text-secondary hover:text-text-primary">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-text-primary truncate">{category.name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-text-primary">${category.budget.toFixed(0)}</span>
        <button onClick={startEdit} className="text-text-secondary hover:text-primary-blue" aria-label="Edit">
          <HiPencil size={14} />
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete category "${category.name}"? Its transactions will become uncategorized.`)) {
              onDelete();
            }
          }}
          className="text-xs text-text-secondary hover:text-danger"
        >
          Delete
        </button>
      </div>
    </div>
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
  const { categories, loading, updateCategory, addCategory, deleteCategory } = useData();
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
              <CategoryRow
                key={c.name}
                category={c}
                color={colorForCategory(colorMap, c.name)}
                onUpdate={(fields) => updateCategory(c.name, fields)}
                onDelete={() => deleteCategory(c.name)}
              />
            ))}
          </div>
        )}

        <AddCategoryRow onAdd={addCategory} />
      </div>
    </div>
  );
};

export default CategoryLimitsView;
