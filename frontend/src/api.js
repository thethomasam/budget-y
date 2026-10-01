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

export const updateCategory = (name, fields) =>
  request(`/categories/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

export const updateTransactionCategory = (id, category) =>
  request(`/transaction/${id}/category`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });

export const deleteTransaction = (id) =>
  request(`/transaction/${id}`, { method: 'DELETE' });

export const ingestTransactionsCsv = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('/transaction/csv', { method: 'POST', body: formData });
};
