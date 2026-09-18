const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const text = await response.text(); let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!response.ok) throw new Error(data?.message || `${response.status} ${response.statusText}`)
  return data
}

export const api = {
  users: { list: () => request('/users'), get: (matricule) => request(`/users/${encodeURIComponent(matricule)}`), messages: (matricule) => request(`/users/${encodeURIComponent(matricule)}/messages`) },
  auth: { register: (user) => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }), login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }) },
  messages: {
    list: (filters = {}) => { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null)); return request(`/messages?${query}`) },
    create: (message) => request('/messages', { method: 'POST', body: JSON.stringify(message) }),
    report: (id) => request(`/messages/${id}/signaler`, { method: 'PUT' }),
  },
}
