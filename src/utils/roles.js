export const normalizeRole = role =>
  String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

export const isStaffRole = role => /^(ADMIN|PROF)/.test(normalizeRole(role))

export const roleLabel = role => {
  const r = normalizeRole(role)
  return r.startsWith('ADMIN') ? 'Administrateur' : r.startsWith('PROF') ? 'Professeur' : 'Étudiant'
}

export const roleKey = role => {
  const r = normalizeRole(role)
  return r.startsWith('ADMIN') ? 'admin' : r.startsWith('PROF') ? 'prof' : 'etudiant'
}

export const ROLE_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'etudiant', label: 'Étudiants' },
  { key: 'prof', label: 'Professeurs' },
  { key: 'admin', label: 'Administrateurs' }
]

// Compte administrateur : e-mail défini dans .env (VITE_ADMIN_EMAIL) ou rôle 'ADMIN' renvoyé par le backend.
// ⚠ Simple aiguillage d'interface : les droits réels doivent aussi être contrôlés côté serveur.
export const ADMIN_EMAIL = (import.meta.env?.VITE_ADMIN_EMAIL || 'admin@ne-laiko.com').trim().toLowerCase()

export const isAdmin = user =>
  !!user && (String(user.role || '').toUpperCase() === 'ADMIN' || (user.email || '').trim().toLowerCase() === ADMIN_EMAIL)