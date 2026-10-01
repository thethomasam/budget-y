import { useEffect, useState } from 'react';
import { useData } from './DataContext';
import { UNCATEGORIZED_LABEL } from './chartPalette';

const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const SimilarTransactionsPrompt = () => {
  const { similarPrompt, resolveSimilarPrompt, dismissSimilarPrompt } = useData();
  const [checked, setChecked] = useState(() => new Set());

  useEffect(() => {
    if (similarPrompt) setChecked(new Set(similarPrompt.candidates.map((t) => t.id)));
  }, [similarPrompt]);

  if (!similarPrompt) return null;
  const { category, sourceMerchant, candidates } = similarPrompt;
  const label = category || UNCATEGORIZED_LABEL;

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const close = () => dismissSimilarPrompt();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-bg-card rounded-2xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary">Update similar transactions?</h3>
          <p className="text-sm text-text-secondary mt-1">
            Found {candidates.length} other transaction{candidates.length === 1 ? '' : 's'} like "{sourceMerchant}".
            Check the ones that make sense to move to <span className="font-medium text-text-primary">{label}</span>.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {candidates.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-primary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked.has(t.id)}
                onChange={() => toggle(t.id)}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text-primary truncate">{t.merchant}</div>
                <div className="text-xs text-text-secondary">
                  {fmtDate(t.date)} · currently {t.category || UNCATEGORIZED_LABEL}
                </div>
              </div>
              <span className="text-sm font-medium text-text-primary shrink-0">${Math.abs(t.amount).toFixed(2)}</span>
            </label>
          ))}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between gap-2">
          <button onClick={close} className="text-sm text-text-secondary hover:text-text-primary">
            Skip
          </button>
          <button
            onClick={() => resolveSimilarPrompt([...checked])}
            disabled={checked.size === 0}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            Update {checked.size || ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarTransactionsPrompt;
