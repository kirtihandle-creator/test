// Thin fetch wrapper around the Clinic Task Board JSON API (/api/v1).
const BASE = '/api/v1';

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),
  listPatients: (q = '') => request('GET', `/patients?q=${encodeURIComponent(q)}`),
  createPatient: (p) => request('POST', '/patients', p),
  updatePatient: (id, p) => request('PUT', `/patients/${id}`, p),
  deletePatient: (id) => request('DELETE', `/patients/${id}`),
  listTasks: () => request('GET', '/tasks'),
  createTask: (t) => request('POST', '/tasks', t),
  updateTask: (id, t) => request('PUT', `/tasks/${id}`, t),
  setTaskStatus: (id, status) => request('PATCH', `/tasks/${id}/status`, { status }),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),
  listAudit: () => request('GET', '/audit'),
};
