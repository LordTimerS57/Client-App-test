export const BASE = '/Ne-laiko'

export const ROUTES = {
  home: `${BASE}/`,
  login: `${BASE}/login`,
  register: `${BASE}/register`,
  study: `${BASE}/study`,
  comments: `${BASE}/study/comments`,
  moderation: `${BASE}/moderation`,
  'moderation-users': `${BASE}/moderation/users`,
  'moderation-comments': `${BASE}/moderation/comments`,
  'moderation-reports': `${BASE}/moderation/reports`,
  'edit-profile': `${BASE}/account/profile`,
  'edit-email': `${BASE}/account/email`,
  'edit-password': `${BASE}/account/password`,
  activity: `${BASE}/activity`,
}

export const EDIT_SCREENS = ['edit-profile', 'edit-email', 'edit-password']
export const MODERATION_SCREENS = ['moderation', 'moderation-users', 'moderation-comments', 'moderation-reports', 'activity']
export const ADMIN_SCREENS = ['home', 'login', 'register', ...EDIT_SCREENS, ...MODERATION_SCREENS]

// Table inversée chemin -> écran, construite une seule fois à partir de ROUTES.
// Les chemins sont comparés sans BASE et sans « / » final ('/login', '/study/comments'…).
const strip = path => (path.startsWith(BASE) ? path.slice(BASE.length) : path).replace(/\/$/, '') || '/'
const SCREEN_BY_PATH = Object.fromEntries(
  Object.entries(ROUTES).map(([screen, path]) => [strip(path), screen])
)

export function pathToScreen(path = window.location.pathname) {
  return SCREEN_BY_PATH[strip(path)] ?? 'home'
}