const BASE = '/api';
const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.username';

const readStored = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export const getToken = () => readStored(TOKEN_KEY);
export const getUsername = () => readStored(USER_KEY);

export const setSession = (token, username) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, username);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch { /* ignore */ }
};

// Called when the server rejects our token (expired or signed out elsewhere).
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => { onUnauthorized = handler; };

async function request(path, options = {}) {
  const token = getToken();
  const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
    const body = await res.text().catch(() => '');
    let detail = body;
    try { detail = JSON.parse(body).detail || body; } catch { /* not JSON */ }
    const error = new Error(`${options.method || 'GET'} ${path} failed: ${res.status} ${body}`);
    error.detail = typeof detail === 'string' ? detail : 'Request failed';
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

const postJson = (path, fields) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

export const login = (username, password) => postJson('/auth/login', { username, password });

export const register = (username, password) => postJson('/auth/register', { username, password });

export const logout = () => request('/auth/logout', { method: 'POST' });

export const listTransactions = () => request('/transaction');

export const listCategories = () => request('/categories');

export const addCategory = (name, budget = 0) =>
  request('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, budget }),
  });

export const updateCategory = (name, fields) =>
  request(`/categories/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

export const deleteCategory = (name) =>
  request(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });

export const updateTransactionCategory = (id, category) =>
  request(`/transaction/${id}/category`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });

export const addTransaction = (fields) =>
  request('/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

export const listRecurring = () => request('/recurring');

export const addRecurring = (fields) =>
  request('/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

export const deleteRecurring = (id) => request(`/recurring/${id}`, { method: 'DELETE' });

export const deleteTransaction =(id) =>
  request(`/transaction/${id}`, { method: 'DELETE' });

export const findSimilarTransactions = (id) => request(`/transaction/${id}/similar`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const ingestTransactionsCsv = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const { job_id } = await request('/transaction/csv', { method: 'POST', body: formData });

  while (true) {
    const job = await request(`/transaction/csv/${job_id}`);
    onProgress?.(job.processed || 0, job.total || 0);
    if (job.status === 'done') return job.result;
    if (job.status === 'error') throw new Error(job.error);
    await sleep(250);
  }
};
