import { api as externalApi } from './index'
import { mockStore, withoutPassword, mockUpdateUser, mockState, flattenMessages } from './mock'
import { byDateDesc } from '../utils/dates'
import { reportCount } from '../utils/messages'

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
  return new Error(msg || 'Une erreur survenue lors du traitement.')
}

async function callExternal(fn, ...args) {
  try {
    const res = await fn(...args)
    if (res?.error || (res?.status && res?.status >= 400)) {
      throw new Error(res?.message || res?.error || `Erreur serveur (${res?.status || 500})`)
    }
    return res
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
    async login({ email, motDePasse }) {
      if (externalApi?.auth?.login) {
        try {
          const res = await externalApi.auth.login({ email, motDePasse })
          if (res?.error || (res?.status && res?.status >= 400)) {
            throw new Error(res?.message || res?.error || `Erreur serveur (${res?.status || 500})`)
          }
          return res
        } catch (e) {
          throw parseApiError(e)
        }
      }
      const users = mockStore.getUsers()
      const user = users.find(u => u.email === email && u.motDePasse === motDePasse)
      if (user) return { utilisateur: user }
      if (email && motDePasse) {
        const demoUser = { matricule: '1024-HF', nom: 'Rakotosoa', prenom: 'Faly Hasy', email, role: 'ETUDIANT' }
        return { utilisateur: demoUser }
      }
      throw new Error('Identifiants incorrects')
    },
    async logout(user) {
      if (!externalApi?.auth?.logout || !user?.matricule) return
      try {
        await externalApi.auth.logout(user)
      } catch {
        /* la session locale est fermée quoi qu'il arrive */
      }
    },
    async register(data) {
      if (externalApi?.auth?.register) {
        try {
          const res = await externalApi.auth.register(data)
          if (res?.error || (res?.status && res?.status >= 400)) {
            throw new Error(res?.message || res?.error || `Erreur serveur (${res?.status || 500})`)
          }
          return res
        } catch (e) {
          throw parseApiError(e)
        }
      }
      const users = mockStore.getUsers()
      if (users.some(u => u.email === data.email)) {
        throw new Error('Un compte existe déjà avec cet email.')
      }
      const newUser = { ...data, id: Date.now().toString() }
      users.push(newUser)
      mockStore.saveUsers(users)
      return { utilisateur: newUser }
    }
  },
  messages: {
    async list({ q } = {}) {
      if (externalApi?.messages?.list) {
        try { return await externalApi.messages.list({ q }) } catch (e) { /* fallback */ }
      }
      let msgs = mockStore.getMessages()
      if (q) {
        const term = q.toLowerCase()
        msgs = msgs.filter(m => (m.contenu || '').toLowerCase().includes(term))
      }
      return msgs
    },

    async create(msgData) {
      if (externalApi?.messages?.create) {
        try { return await externalApi.messages.create(msgData) } catch (e) { /* fallback */ }
      }
      const msgs = mockStore.getMessages()
      const newMsg = {
        id: Date.now().toString(),
        contenu: msgData.contenu,
        dateDePublication: new Date().toISOString(),
        envoyeur: msgData.envoyeur || { prenom: 'Vous', role: 'Étudiant' },
        replies: []
      }
      msgs.unshift(newMsg)
      mockStore.saveMessages(msgs)
      return newMsg
    },

    async update(id, data) {
      if (externalApi?.messages?.update) return callExternal(externalApi.messages.update, id, data)
      const edit = list => list.forEach(m => {
        if (String(m.id) === String(id)) m.contenu = data.contenu
        edit(m.replies || [])
      })
      const msgs = mockStore.getMessages()
      edit(msgs)
      mockStore.saveMessages(msgs)
    },

    async remove(id, matricule) {
      if (externalApi?.messages?.remove) return callExternal(externalApi.messages.remove, id, matricule)
      const strip = list => list
        .filter(m => String(m.id) !== String(id))
        .map(m => ({ ...m, replies: strip(m.replies || []) }))
      mockStore.saveMessages(strip(mockStore.getMessages()))
    },

    async report(id, matricule) {
      if (externalApi?.messages?.report) return callExternal(externalApi.messages.report, id, matricule)
      const flag = list => list.forEach(m => {
        if (String(m.id) === String(id)) m.statut = 'SIGNALE'
        flag(m.replies || [])
      })
      const msgs = mockStore.getMessages()
      flag(msgs)
      mockStore.saveMessages(msgs)
    }
  },

  // Lecture seule pour l'espace de modération (les erreurs remontent, pas de repli silencieux)
  moderation: {
    async users() {
      if (externalApi?.users?.list) {
        const res = await callExternal(externalApi.users.list)
        return toList(res, ['utilisateurs', 'users']).map(withoutPassword)
      }
      return mockStore.getUsers().map(withoutPassword)
    },
    async comments() {
      const list = externalApi?.messages?.list
        ? toList(await callExternal(externalApi.messages.list, {}), ['messages'])
        : mockStore.getMessages()
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
    async updateProfile({ user, nom, prenom, currentPassword }) {
      if (externalApi?.account?.updateProfile) {
        return callExternal(externalApi.account.updateProfile, { user, nom, prenom, currentPassword })
      }
      return { utilisateur: mockUpdateUser(user, { nom, prenom }, { currentPassword }) }
    },
    async updateEmail({ user, email, currentPassword }) {
      if (externalApi?.account?.updateEmail) {
        return callExternal(externalApi.account.updateEmail, { user, email, currentPassword })
      }
      const normalized = email.trim().toLowerCase()
      const check = users => {
        const taken = users.some(u =>
          u.email?.toLowerCase() === normalized && u.email?.toLowerCase() !== user?.email?.toLowerCase()
        )
        if (taken) throw new Error('Email déjà utilisé')
      }
      return { utilisateur: mockUpdateUser(user, { email: normalized }, { currentPassword, check }) }
    },
    async requestPasswordChange({ user, newPassword }) {
      if (externalApi?.account?.requestPasswordChange) {
        return callExternal(externalApi.account.requestPasswordChange, { user, newPassword })
      }
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      }
      mockState.passwordChange = { code: String(Math.floor(100000 + Math.random() * 900000)), newPassword }
      console.info(`[démo] Code de confirmation : ${mockState.passwordChange.code}`)
      return { email: user?.email }
    },
    async confirmPasswordChange({ user, code }) {
      if (externalApi?.account?.confirmPasswordChange) {
        return callExternal(externalApi.account.confirmPasswordChange, { user, code })
      }
      if (!mockState.passwordChange || mockState.passwordChange.code !== code) throw new Error('Code incorrect')
      const { newPassword } = mockState.passwordChange
      mockState.passwordChange = null
      return { utilisateur: mockUpdateUser(user, { motDePasse: newPassword }, { verify: false }) }
    }
  }
}
