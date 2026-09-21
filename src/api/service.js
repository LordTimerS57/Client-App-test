import { api as externalApi } from './index'
import { byDateDesc } from '../utils/dates'
import { reportCount, flattenMessages } from '../utils/messages'

function parseApiError(e) {
  const msg = e?.message || e?.error || String(e || '')
  if (msg.includes('502') || msg.toLowerCase().includes('bad gateway')) {
    return new Error('Erreur de connexion au serveur (502 Bad Gateway). Veuillez réessayer dans quelques instants.')
  }
  if (msg.includes('500') || msg.toLowerCase().includes('internal server error')) {
    return new Error('Erreur interne du serveur (500). Veuillez contacter l’administrateur si le problème persiste.')
  }
  if (msg.includes('503') || msg.toLowerCase().includes('service unavailable')) {
    return new Error('Le service est temporairement indisponible. Réessayez ultérieurement.')
  }
  if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('unauthorized')) {
    return new Error('Identifiants incorrects ou accès non autorisé.')
  }
  if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('réseau')) {
    return new Error('Problème de connexion réseau. Impossible de contacter le serveur.')
  }
  return new Error(msg || 'Une erreur est survenue lors du traitement.')
}

// index.js lève déjà une erreur si la réponse n'est pas OK : on la traduit simplement.
async function call(fn, ...args) {
  try {
    return await fn(...args)
  } catch (e) {
    throw parseApiError(e)
  }
}

const toList = (res, keys = []) => {
  if (Array.isArray(res)) return res
  for (const key of keys) if (Array.isArray(res?.[key])) return res[key]
  return []
}

export const api = {
  auth: {
    login: ({ email, motDePasse }) => call(externalApi.auth.login, { email, motDePasse }),
    register: data => call(externalApi.auth.register, data),
    async logout(user) {
      if (!user?.matricule) return
      try { await externalApi.auth.logout(user) } catch { /* la session locale est fermée quoi qu'il arrive */ }
    }
  },

  messages: {
    async list(filters = {}) {
      return toList(await call(externalApi.messages.list, filters), ['messages'])
    },
    create: data => call(externalApi.messages.create, data),
    update: (id, data) => call(externalApi.messages.update, id, data),
    remove: (id, matricule) => call(externalApi.messages.remove, id, matricule),
    report: (id, matricule) => call(externalApi.messages.report, id, matricule)
  },

  // Lecture seule pour l'espace de modération
  moderation: {
    async users() {
      return toList(await call(externalApi.users.list), ['utilisateurs', 'users'])
    },
    async comments() {
      const list = toList(await call(externalApi.messages.list, {}), ['messages'])
      return [...list].sort(byDateDesc)
    },
    async reports() {
      const comments = await api.moderation.comments()
      return flattenMessages(comments)
        .filter(m => reportCount(m) > 0)
        .sort((a, b) => reportCount(b) - reportCount(a) || byDateDesc(a, b))
    }
  },

  account: {
    updateProfile: args => call(externalApi.account.updateProfile, args),
    updateEmail: args => call(externalApi.account.updateEmail, args),
    requestPasswordChange: args => call(externalApi.account.requestPasswordChange, args),
    confirmPasswordChange: args => call(externalApi.account.confirmPasswordChange, args)
  }
}