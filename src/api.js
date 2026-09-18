const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.status === 204 ? null : response.json()
}

export const api = {
  users: {
    list: () => request('/users'),
    get: (matricule) => request(`/users/${encodeURIComponent(matricule)}`),
    create: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
    messages: (matricule) => request(`/users/${encodeURIComponent(matricule)}/messages`),
  },
  auth: {
    register: (user) => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  },
  messages: {
    list: () => request('/messages'),
    create: (message) => request('/messages', { method: 'POST', body: JSON.stringify(message) }),
    report: (id) => request(`/messages/${id}/signaler`, { method: 'PUT`'.slice(0, -1) }),
  },
}
