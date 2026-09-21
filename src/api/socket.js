import { API_URL } from './index'

// URL de la WebSocket, déduite de VITE_API_URL (/api en dev, URL complète en production).
// Le matricule est transmis en query param pour que le backend puisse lier la session WS
// à l'utilisateur connecté (et la fermer proprement au logout).
export function messagesSocketUrl(matricule) {
  const base = import.meta.env.VITE_WS_URL || (() => {
    const url = new URL(API_URL, window.location.href)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = url.pathname.replace(/\/api\/?$/, '') + '/ws/messages'
    return url.toString()
  })()
  if (!matricule) return base
  const url = new URL(base, window.location.href)
  url.searchParams.set('matricule', matricule)
  return url.toString()
}

// Pub/sub interne : un seul WebSocket pour toute l'app, plusieurs composants peuvent écouter.
// Partagé par useSocketConnection (émet) et useMessagesSocket (écoute) : une seule instance.
export const socketListeners = new Set()
export function emitSocketEvent(event) {
  socketListeners.forEach(listener => listener(event))
}
