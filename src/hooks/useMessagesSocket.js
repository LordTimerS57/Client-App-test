import { useEffect, useRef } from 'react'
import { socketListeners } from '../api/socket'

// Écoute passive des événements de la socket partagée. Utilisé dans Comments, ModerationList, Activity.
export function useMessagesSocket(onEvent) {
  const handler = useRef(onEvent)
  handler.current = onEvent

  useEffect(() => {
    const listener = event => handler.current(event)
    socketListeners.add(listener)
    return () => socketListeners.delete(listener)
  }, [])
}
