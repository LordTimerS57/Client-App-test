import { useEffect } from 'react'
import { messagesSocketUrl, emitSocketEvent } from '../api/socket'

// Ouvre/ferme la connexion WS réelle, branchée sur le cycle de vie de la session utilisateur.
// Appelé une seule fois, dans App(), avec user?.matricule.
export function useSocketConnection(matricule) {
  useEffect(() => {
    if (!matricule) return   // pas connecté : aucune session WS à ouvrir

    let ws = null
    let timer = null
    let closed = false
    let delay = 1000

    const connect = () => {
      try { ws = new WebSocket(messagesSocketUrl(matricule)) } catch { return }
      ws.onopen = () => { delay = 1000; emitSocketEvent({ type: 'OPEN' }) }
      ws.onmessage = e => { try { emitSocketEvent(JSON.parse(e.data)) } catch { /* message ignoré */ } }
      ws.onerror = () => ws.close()
      ws.onclose = () => {
        if (closed) return
        timer = setTimeout(connect, delay)
        delay = Math.min(delay * 2, 15000)
      }
    }

    connect()
    return () => { closed = true; clearTimeout(timer); ws?.close() }
  }, [matricule]) // login (matricule apparaît) ouvre la session, logout (matricule devient undefined) la ferme
}
