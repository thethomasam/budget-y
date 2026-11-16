import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as api from './api';

export default function ApiKeysView() {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [created, setCreated] = useState(null);

  const load = () => api.listApiKeys().then(setKeys).catch((err) => toast.error(err.detail));

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      setCreated(await api.createApiKey(name.trim()));
      setName('');
      load();
    } catch (err) {
      toast.error(err.detail);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteApiKey(id);
      load();
    } catch (err) {
      toast.error(err.detail);
    }
  };

  const copy = () => navigator.clipboard.writeText(created.key).then(() => toast.success('Copied'));

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold text-text-primary">API Keys</h1>
      <p className="text-sm text-text-secondary mb-4">
        Send a key as <code>Authorization: Bearer &lt;key&gt;</code> to call the API from scripts.
      </p>

      <form onSubmit={create} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. laptop script)"
          maxLength={60}
          required
          className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-bg-card border border-border text-text-primary"
        />
        <button type="submit" className="px-3 py-1.5 rounded-lg text-sm bg-primary-blue text-white">
          Create API key
        </button>
      </form>

      {created && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-bg-card">
          <p className="text-sm text-text-primary mb-2">
            Copy your new key now — it won't be shown again.
          </p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 text-xs break-all text-text-primary">{created.key}</code>
            <button onClick={copy} className="text-xs text-primary-blue">Copy</button>
            <button onClick={() => setCreated(null)} className="text-xs text-text-secondary">Dismiss</button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-card divide-y divide-border">
        {keys.length === 0 && <p className="p-3 text-sm text-text-secondary">No API keys yet.</p>}
        {keys.map((k) => (
          <div key={k.id} className="p-3 flex items-center gap-3 text-sm">
            <span className="text-text-primary">{k.name}</span>
            <span className="text-xs text-text-secondary">
              {new Date(k.created_at).toLocaleDateString()}
            </span>
            <button onClick={() => remove(k.id)} className="ml-auto text-xs text-danger">Revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}
