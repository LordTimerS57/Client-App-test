const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const text = await response.text(); let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!response.ok) throw new Error(data?.message || `${response.status} ${response.statusText}`)
  return data
}

const accountPath = (user, suffix = '') => {
  if (!user?.matricule) throw new Error('Compte introuvable : matricule manquant.')
  return `/users/${encodeURIComponent(user.matricule)}${suffix}`
}

export const api = {
  users: { 
    list: () => request('/users'), 
    get: (matricule) => request(`/users/${encodeURIComponent(matricule)}`), 
    messages: (matricule) => request(`/users/${encodeURIComponent(matricule)}/messages`) 
  },
  auth: {
    register: (user) => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    logout: (user) => request('/auth/logout', { method: 'POST', body: JSON.stringify({ matricule: user.matricule }) }),
  },
  messages: {
    list: (filters = {}) => { const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null)); return request(`/messages?${query}`) },
    get: (id) => request(`/messages/${id}`),
    getReponses: (id) => request(`/messages/${id}/reponses`), // Récupère les réponses directes (les fils) d'un message donné
    create: (message) => request('/messages', { method: 'POST', body: JSON.stringify(message) }),
    report: (id) => request(`/messages/${id}/signaler`, { method: 'PUT' }),
  },
  account: {
    updateProfile: ({ user, nom, prenom, currentPassword }) => request(accountPath(user, '/profile'), { method: 'PUT', body: JSON.stringify({ nom, prenom, currentPassword }) }),
    updateEmail: ({ user, email, currentPassword }) => request(accountPath(user, '/email'), { method: 'PUT', body: JSON.stringify({ email, currentPassword }) }),
    requestPasswordChange: ({ user, newPassword }) => request(accountPath(user, '/password/request'), { method: 'POST', body: JSON.stringify({ newPassword }) }),
    confirmPasswordChange: ({ user, code }) => request(accountPath(user, '/password/confirm'), { method: 'POST', body: JSON.stringify({ code }) }),
  },
}