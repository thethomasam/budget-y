const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${options?.method || 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

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

export const deleteTransaction = (id) =>
  request(`/transaction/${id}`, { method: 'DELETE' });

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
