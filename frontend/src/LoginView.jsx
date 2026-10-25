import { useState } from 'react';
import { useAuth } from './AuthContext';

const LoginView = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-text-primary text-sm';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (mode === 'login' ? login : register)(username, password);
    } catch (err) {
      setError(err.detail || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-bg-card rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-text-primary mb-1">Budget</h1>
        <p className="text-sm text-text-secondary mb-4">
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </p>
        <label className="block text-xs text-text-secondary mb-1" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          minLength={2}
          maxLength={30}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
        {mode === 'register' && (
          <p className="text-xs text-text-secondary mt-1">Letters, numbers, dots, dashes or underscores.</p>
        )}
        <label className="block text-xs text-text-secondary mt-3 mb-1" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {mode === 'register' && <p className="text-xs text-text-secondary mt-1">At least 8 characters.</p>}
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full mt-4 px-3 py-2 rounded-lg text-sm font-medium bg-primary-blue text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full mt-3 text-xs text-text-secondary hover:text-primary-blue"
        >
          {mode === 'login' ? 'No account? Create one' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginView;
